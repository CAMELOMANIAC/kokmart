import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { timingSafeEqual } from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/server/.env') });
dotenv.config();

import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import sharp from 'sharp';
import {
  cropFlyerGrid,
  parseTileWithGemini,
  detectBoundingBoxesWithGemini,
  parseSingleCroppedProductWithGemini,
  parseMasterFlyerWithGemini,
  parseSinglePageWithGemini
} from '../src/services/geminiService.js';
import { compareFlyerPages } from '../src/services/pageDiffService.js';
import { generateDefaultTip } from '../src/services/smartTipService.js';
import { runSmartTipWorker } from '../src/services/smartTipWorkerService.js';
import { getLatestFlyerSource } from '../src/services/flyerSourceService.js';
import { cropBoundingBoxesWithPadding } from '../src/services/cropSimulationService.js';
import {
  saveFlyerToSupabase,
  getLatestFlyerFromSupabase,
  isSupabaseConfigured
} from '../src/services/supabaseService.js';
import {
  checkIdenticalFlyer,
  setCachedFlyer,
  getMemoryCachedFlyer
} from '../src/services/flyerCacheService.js';
import {
  FlyerParsingResponse,
  ParsedProduct,
  DetectBoxesResponse,
  ParseCroppedProductResponse,
  BoundingBox,
  FlyerDetailResponse
} from '@kokmart/shared';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

function hasValidWorkerSecret(req: Request): boolean {
  const secret = process.env.TIP_WORKER_SECRET || process.env.CRON_SECRET || '';
  const authorization = req.get('authorization') || '';
  const expected = `Bearer ${secret}`;
  if (!secret || authorization.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(authorization), Buffer.from(expected));
}

// 헬스체크 엔드포인트
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Kokmart API Server', timestamp: new Date().toISOString() });
});

async function handleSmartTipWorker(req: Request, res: Response): Promise<void> {
  if (!hasValidWorkerSecret(req)) {
    res.status(401).json({ success: false, error: 'Invalid worker authorization.' });
    return;
  }

  try {
    const result = await runSmartTipWorker();
    const processedAt = new Date().toISOString();
    if (result.error) {
      res.status(503).json({ success: false, ...result, processedAt });
      return;
    }
    res.json({ success: true, ...result, processedAt });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[Smart Tip Worker Error]:', errorMessage);
    res.status(500).json({ success: false, error: errorMessage });
  }
}

app.post('/api/internal/tip-worker', handleSmartTipWorker);
app.get('/api/internal/tip-worker', handleSmartTipWorker);

/**
 * 1. 사용자가 특정 마트 최신 전단 정보 요청 (1순위: 공식 전단 CDN/웹 기반 엔드포인트)
 * GET /api/flyers/source?martId=store-emart-yeoksam
 */
app.get('/api/flyers/source', async (req: Request, res: Response) => {
  try {
    const martId = (req.query.martId as string) || (req.query.brand as string) || '이마트';
    const flyerSource = await getLatestFlyerSource(martId);
    res.json({ success: true, flyer: flyerSource });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '전단 소스 조회 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * 2 & 3. 수파베이스에 업로드된 전단 이미지 URL 또는 직접 멀티파트 이미지를 전달받아
 * 백엔드에서 Gemini API를 호출하여 개별 상품 Bounding Box 좌표([ymin, xmin, ymax, xmax]) 목록을 반환
 * POST /api/flyers/detect-boxes
 * Body (JSON): { imageUrl?: string, martName?: string }
 * or Multipart Form: flyer: File, martName?: string
 */
app.post('/api/flyers/detect-boxes', upload.single('flyer'), async (req: Request, res: Response) => {
  try {
    const martName = (req.body?.martName as string) || '이마트';
    const imageUrl = req.body?.imageUrl as string | undefined;

    let imageBuffer: Buffer = Buffer.from('');

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (imageUrl) {
      // Supabase Storage 이미지 URL 등 외부 URL 직접 fetch
      const imageRes = await fetch(imageUrl);
      if (!imageRes.ok) {
        throw new Error(`이미지 다운로드 실패: ${imageRes.statusText}`);
      }
      const arrayBuffer = await imageRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    }

    const boxes = await detectBoundingBoxesWithGemini(imageBuffer, martName);

    const response: DetectBoxesResponse = {
      success: true,
      martName,
      totalBoxes: boxes.length,
      boxes,
      message: '성공적으로 상품 Bounding Box 좌표를 검출했습니다.'
    };

    res.json(response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Bounding Box 검출 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * 4. [테스트/편의용 시뮬레이션 엔드포인트]
 * 사용자 기기 웹워커가 수행하는 '충분한 여백을 준 뒤 Bounding Box 크롭' 작업을 서버에서 테스트할 수 있는 엔드포인트
 * POST /api/flyers/simulate-worker-crop
 * Body (JSON): { imageUrl?: string, boxes: BoundingBox[], paddingPercent?: number }
 */
app.post('/api/flyers/simulate-worker-crop', upload.single('flyer'), async (req: Request, res: Response) => {
  try {
    let imageBuffer: Buffer = Buffer.from('');
    const imageUrl = req.body?.imageUrl as string | undefined;

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (imageUrl) {
      const imageRes = await fetch(imageUrl);
      const arrayBuffer = await imageRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuffer);
    } else {
      // 이미지 미제공 시 테스트용 기본 1000x1000 캔버스 생성
      imageBuffer = await sharp({
        create: {
          width: 1000,
          height: 1000,
          channels: 3,
          background: { r: 240, g: 240, b: 240 }
        }
      }).jpeg().toBuffer();
    }

    let boxes: BoundingBox[] = [];
    if (typeof req.body?.boxes === 'string') {
      boxes = JSON.parse(req.body.boxes);
    } else if (Array.isArray(req.body?.boxes)) {
      boxes = req.body.boxes;
    }

    const paddingPercent = req.body?.paddingPercent ? Number(req.body.paddingPercent) : 5;

    const croppedItems = await cropBoundingBoxesWithPadding(imageBuffer, boxes, { paddingPercent });

    // 응답 시 각 크롭 조각을 base64 문자열로 반환하여 REST Client에서 바로 확인 및 5번 API에 재사용 가능
    const results = croppedItems.map(item => ({
      boxId: item.boxId,
      labelHint: item.labelHint,
      imageBase64: `data:image/jpeg;base64,${item.buffer.toString('base64')}`
    }));

    res.json({
      success: true,
      totalCropped: results.length,
      paddingPercent,
      crops: results
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '크롭 시뮬레이션 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * 5. 사용자 기기 웹워커에서 크롭된 단일/배치 상품 이미지 블롭(Blob)을 받아
 * 백엔드에서 Gemini API를 호출하여 상품명, 가격, 단위가격, SmartTip 등 정형화된 JSON 반환
 * POST /api/flyers/parse-product
 * Multipart Form: croppedProduct: File, martName?: string
 * or JSON Body: { imageBase64: string, martName?: string }
 */
app.post('/api/flyers/parse-product', upload.single('croppedProduct'), async (req: Request, res: Response) => {
  try {
    const martName = (req.body?.martName as string) || '이마트';
    let imageBuffer: Buffer = Buffer.from('');

    if (req.file) {
      imageBuffer = req.file.buffer;
    } else if (req.body?.imageBase64) {
      const base64Data = (req.body.imageBase64 as string).replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    const product = await parseSingleCroppedProductWithGemini(imageBuffer, martName);

    const response: ParseCroppedProductResponse = {
      success: true,
      product,
      message: '크롭 이미지 기반 상품 정형화 JSON 파싱 성공'
    };

    res.json(response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '크롭 상품 파싱 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

// 기존 엔드포인트 호환: 마트 상품 비교 API (모킹 데이터 제거됨)
app.get('/api/products/compare', (req: Request, res: Response) => {
  res.json({ success: true, count: 0, products: [] });
});

// 기존 호환성 유지: 타일 그리드 방식 파싱 엔드포인트
app.post('/api/flyers/parse', upload.single('flyer'), async (req: Request, res: Response) => {
  try {
    let tiles: Buffer[] = [];
    if (req.file) {
      tiles = await cropFlyerGrid(req.file.buffer, 2, 2);
    }
    let allProducts: ParsedProduct[] = [];
    if (tiles.length > 0) {
      const tileResults = await Promise.all(tiles.map(tile => parseTileWithGemini(tile)));
      allProducts = tileResults.flat();
    } else {
      allProducts = await parseTileWithGemini(Buffer.from(''));
    }

    const response: FlyerParsingResponse = {
      success: true,
      gridCount: tiles.length || 1,
      products: allProducts,
      parsedAt: new Date().toISOString()
    };
    res.json(response);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Parsing failed';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * Helper: 이미지 URL로부터 Buffer를 안전하게 다운로드
 */
async function fetchImageBuffer(url: string): Promise<Buffer> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`이미지 다운로드 실패 (${url}): ${res.statusText}`);
  }
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * 5. 마스터 전단 1차 파싱 엔드포인트
 * POST /api/flyers/parse-master
 * Body (JSON): { imageUrls?: string[], martName?: string }
 * or Multipart: pages (File[], 최대 5장)
 */
/**
 * 4.5. 최신 캐시된 전단지 및 상품 목록 즉시 조회 (0.05초 소요)
 * GET /api/flyers/latest?martName=이마트&branchName=공통
 */
app.get('/api/flyers/latest', async (req: Request, res: Response) => {
  try {
    const martName = (req.query.martName as string) || '이마트';
    const branchName = (req.query.branchName as string) || '공통';

    // 1. worker가 갱신한 최신 팁을 반영하기 위해 Supabase를 최종 기준으로 사용합니다.
    if (isSupabaseConfigured()) {
      const dbResult = await getLatestFlyerFromSupabase(martName, branchName);
      if (dbResult) {
        // 메모리 캐시 갱신
        setCachedFlyer(martName, branchName, [], dbResult.flyer.imageUrls, dbResult.products, dbResult.flyer.id);

        const response: FlyerDetailResponse = {
          success: true,
          isCached: true,
          martName,
          branchName,
          flyer: dbResult.flyer,
          imageUrls: dbResult.flyer.imageUrls || [],
          totalPages: dbResult.flyer.pageCount,
          totalProducts: dbResult.products.length,
          products: dbResult.products,
          parsedAt: dbResult.flyer.createdAt,
        };
        res.json(response);
        return;
      }
    }

    // 2. Supabase 미설정 또는 DB 조회 실패 시에만 인메모리 캐시를 사용합니다.
    const memCached = getMemoryCachedFlyer(martName, branchName);
    if (memCached) {
      const response: FlyerDetailResponse = {
        success: true,
        isCached: true,
        martName,
        branchName,
        imageUrls: memCached.imageUrls || [],
        flyer: {
          id: memCached.flyerId || 'cached',
          martName,
          branchName,
          isMaster: true,
          title: `${martName} 주간 전단`,
          imageUrls: memCached.imageUrls || [],
          pageCount: memCached.imageUrls?.length || 1,
          createdAt: memCached.parsedAt,
        },
        totalPages: memCached.imageUrls?.length || 1,
        totalProducts: memCached.products.length,
        products: memCached.products,
        parsedAt: memCached.parsedAt,
      };
      res.json(response);
      return;
    }

    res.status(404).json({
      success: false,
      error: `'${martName} (${branchName})'의 저장된 최신 전단지가 없습니다. 상단에서 전단지를 먼저 분석해 주세요.`
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '최신 전단 조회 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * 5. 마스터 전단 1차 파싱 엔드포인트
 * POST /api/flyers/parse-master
 * Body (JSON): { imageUrls?: string[], martName?: string }
 * or Multipart: pages (File[], 최대 5장)
 */
app.post('/api/flyers/parse-master', upload.array('pages', 5), async (req: Request, res: Response) => {
  try {
    const martName = (req.body?.martName as string) || '이마트';
    const imageUrls = req.body?.imageUrls as string[] | undefined;

    let pageBuffers: Buffer[] = [];

    const files = req.files as Express.Multer.File[] | undefined;
    if (files && files.length > 0) {
      pageBuffers = files.map(file => file.buffer);
    } else if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
      pageBuffers = await Promise.all(imageUrls.map(url => fetchImageBuffer(url)));
    }

    if (pageBuffers.length === 0) {
      res.status(400).json({
        success: false,
        error: '전단지 이미지 파일(pages) 또는 imageUrls 목록을 제공해야 합니다.'
      });
      return;
    }

    // 0단계: sharp 픽셀 차분으로 기존 마스터 전단과 100% 동일한지 사전 검사 (0초/0토큰 회피)
    const identicalCache = await checkIdenticalFlyer(martName, '공통', pageBuffers);
    if (identicalCache) {
      const dbResult = isSupabaseConfigured()
        ? await getLatestFlyerFromSupabase(martName, '공통')
        : null;
      const cachedProducts = dbResult?.products || identicalCache.products;
      console.log(`[API /api/flyers/parse-master] ⚡ Returning identical cached flyer in 0.01s (0 AI tokens)`);
      res.json({
        success: true,
        isCached: true,
        martName,
        imageUrls: imageUrls || [],
        totalPages: pageBuffers.length,
        totalProducts: cachedProducts.length,
        products: cachedProducts,
        parsedAt: identicalCache.parsedAt
      });
      return;
    }

    const requestStartTime = Date.now();
    console.log(`\n======================================================`);
    console.log(`[API /api/flyers/parse-master] 📥 Processing '${martName}' (${pageBuffers.length} flyer page images)...`);

    // 1단계: Gemini 3.5 Flash-Lite 고속 비전 TSV 파싱
    const geminiStartTime = Date.now();
    const rawProducts = await parseMasterFlyerWithGemini(pageBuffers, martName);
    const geminiDuration = ((Date.now() - geminiStartTime) / 1000).toFixed(2);

    // 2단계: DB 사용 시 팁 없이 pending으로 저장하고 Groq worker 큐로 넘깁니다.
    // DB를 사용할 수 없을 때만 화면용 fallback을 생성합니다.
    const queueEnabled = isSupabaseConfigured();
    const queuedProducts: ParsedProduct[] = rawProducts.map((product) => ({
      ...product,
      smartTip: queueEnabled ? undefined : generateDefaultTip(product),
      tipStatus: queueEnabled ? 'pending' : 'failed',
      tipSource: queueEnabled ? undefined : 'fallback',
    }));

    // 응답 전에 저장을 완료해야 서버리스 종료로 큐 작업이 유실되지 않습니다.
    const saved = queueEnabled
      ? await saveFlyerToSupabase({
          martName,
          branchName: '공통',
          isMaster: true,
          title: `${martName} 주간 전단`,
          imageUrls: imageUrls || [],
          products: queuedProducts,
        })
      : null;

    const totalDuration = ((Date.now() - requestStartTime) / 1000).toFixed(2);
    console.log(`[API /api/flyers/parse-master] 📊 Summary Report:`);
    console.log(`  - 1단계 Gemini Vision OCR : ${geminiDuration}s (${rawProducts.length}개 상품 추출)`);
    console.log(`  - 2단계 DB 팁 작업 등록    : ${queuedProducts.length}개 ${queueEnabled ? 'pending' : 'fallback'}`);
    console.log(`  - 🏁 전체 총 소요 시간     : ${totalDuration}s`);
    console.log(`======================================================\n`);

    // 3단계: 이미지 차분용 캐시만 갱신합니다. 최신 팁 조회는 DB가 우선입니다.
    setCachedFlyer(martName, '공통', pageBuffers, imageUrls || [], queuedProducts, saved?.flyer.id);

    res.json({
      success: true,
      martName,
      imageUrls: imageUrls || [],
      totalPages: pageBuffers.length,
      totalProducts: queuedProducts.length,
      products: queuedProducts,
      tipProcessing: queueEnabled,
      parsedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '마스터 전단 파싱 실패';
    console.error(`[API /api/flyers/parse-master] ❌ Error:`, errorMessage);
    res.status(500).json({ success: false, error: errorMessage });
  }
});

/**
 * 6. 지점 전단 페이지 차분 & 동기화 엔드포인트 (Page-Diff & Single-Page Replacement)
 * POST /api/flyers/sync-branch
 * Body (JSON): {
 *   martName?: string,
 *   branchName: string,
 *   masterProducts: ParsedProduct[],
 *   masterPageUrls: string[],
 *   branchPageUrls: string[]
 * }
 */
app.post('/api/flyers/sync-branch', async (req: Request, res: Response) => {
  try {
    const martName = (req.body?.martName as string) || '이마트';
    const branchName = (req.body?.branchName as string) || '지점';
    const masterProducts = (req.body?.masterProducts as ParsedProduct[]) || [];
    const masterPageUrls = (req.body?.masterPageUrls as string[]) || [];
    const branchPageUrls = (req.body?.branchPageUrls as string[]) || [];

    if (masterPageUrls.length === 0 || branchPageUrls.length === 0) {
      res.status(400).json({
        success: false,
        error: 'masterPageUrls 및 branchPageUrls가 필요합니다.'
      });
      return;
    }

    const totalPages = Math.min(masterPageUrls.length, branchPageUrls.length);
    const identicalPages: number[] = [];
    const replacedPages: number[] = [];
    const finalProductsByPage = new Map<number, ParsedProduct[]>();

    // 기존 마스터 상품들을 페이지별로 분류
    for (let p = 1; p <= totalPages; p++) {
      finalProductsByPage.set(
        p,
        masterProducts.filter(item => (item.pageIndex || 1) === p)
      );
    }

    // 페이지별 1:1 차분 비교 및 변동 페이지 통교체
    for (let p = 1; p <= totalPages; p++) {
      const masterUrl = masterPageUrls[p - 1];
      const branchUrl = branchPageUrls[p - 1];

      if (!masterUrl || !branchUrl) continue;

      const [masterBuffer, branchBuffer] = await Promise.all([
        fetchImageBuffer(masterUrl),
        fetchImageBuffer(branchUrl)
      ]);

      const diffResult = await compareFlyerPages(masterBuffer, branchBuffer);

      if (diffResult.isIdentical) {
        // 일치도 99% 이상: 마스터 DB 상품 유지 (Gemini 호출 0회)
        identicalPages.push(p);
      } else {
        // 변동 감지: 해당 페이지만 통째로 재파싱 (유령 상품 0%)
        replacedPages.push(p);

        const newPageProducts = await parseSinglePageWithGemini(branchBuffer, p, martName);
        const newProductsWithTips: ParsedProduct[] = newPageProducts.map((product) => ({
          ...product,
          smartTip: isSupabaseConfigured() ? undefined : generateDefaultTip(product),
          tipStatus: isSupabaseConfigured() ? 'pending' : 'failed',
          tipSource: isSupabaseConfigured() ? undefined : 'fallback',
        }));

        // 해당 페이지 전체 교체
        finalProductsByPage.set(p, newProductsWithTips);
      }
    }

    // 최종 상품 목록 병합
    const allFinalProducts: ParsedProduct[] = [];
    for (let p = 1; p <= totalPages; p++) {
      const pageItems = finalProductsByPage.get(p) || [];
      allFinalProducts.push(...pageItems);
    }

    // 지점 전단도 먼저 저장하고, 새로 파싱한 상품의 팁은 동일 worker 큐에서 처리합니다.
    if (isSupabaseConfigured()) {
      await saveFlyerToSupabase({
        martName,
        branchName,
        isMaster: false,
        title: `${martName} ${branchName} 전단`,
        imageUrls: branchPageUrls,
        products: allFinalProducts,
      });
    }

    res.json({
      success: true,
      martName,
      branchName,
      totalPages,
      identicalPages,
      replacedPages,
      totalProducts: allFinalProducts.length,
      products: allFinalProducts,
      tipProcessing: isSupabaseConfigured() && allFinalProducts.some((product) =>
        product.tipStatus === 'pending' || product.tipStatus === 'retry'
      ),
      syncedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '지점 전단 동기화 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

export default app;
