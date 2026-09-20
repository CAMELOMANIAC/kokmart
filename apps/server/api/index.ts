import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

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
import { generateSmartTipsWithGemma } from '../src/services/gemmaTipService.js';
import { getLatestFlyerSource } from '../src/services/flyerSourceService.js';
import { cropBoundingBoxesWithPadding } from '../src/services/cropSimulationService.js';
import {
  FlyerParsingResponse,
  ParsedProduct,
  DetectBoxesResponse,
  ParseCroppedProductResponse,
  BoundingBox
} from '@kokmart/shared';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// 헬스체크 엔드포인트
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Kokmart API Server', timestamp: new Date().toISOString() });
});

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

// 기존 호환성 유지: 마트 3사 최저가 비교 큐레이션 API
app.get('/api/products/compare', (req: Request, res: Response) => {
  const mockProducts: ParsedProduct[] = [
    {
      id: 'prod-1',
      productName: '국내산 냉장 삼겹살 100g',
      salePrice: 1980,
      effectiveUnitPrice: 1980,
      unitMeasure: '100g',
      isPerishable: true,
      martName: '이마트',
      smartTip: {
        tipType: 'MART_BEST',
        badgeText: '마트 최저가',
        tipMessage: '신선식품은 오늘 저녁 집 앞 마트에서 바로 특가 구매하세요!',
        coupangKeyword: null
      }
    },
    {
      id: 'prod-2',
      productName: '샤인머스캣 1.5kg (box)',
      salePrice: 12900,
      effectiveUnitPrice: 860,
      unitMeasure: '100g',
      isPerishable: true,
      martName: '롯데마트',
      smartTip: {
        tipType: 'MART_RECOMMEND',
        badgeText: '신선 강추',
        tipMessage: '당도 보장 1인 가구 소량 구매 추천!',
        coupangKeyword: null
      }
    }
  ];

  res.json({ success: true, count: mockProducts.length, products: mockProducts });
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

    // 1단계: Gemini 3.5 Flash-Lite 고속 비전 TSV 파싱
    const rawProducts = await parseMasterFlyerWithGemini(pageBuffers, martName);

    // 2단계: Gemma 4 26B + Google Search Grounding 스마트 팁 생성
    const productsWithTips = await generateSmartTipsWithGemma(rawProducts);

    res.json({
      success: true,
      martName,
      totalPages: pageBuffers.length,
      totalProducts: productsWithTips.length,
      products: productsWithTips,
      parsedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '마스터 전단 파싱 실패';
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
        const newProductsWithTips = await generateSmartTipsWithGemma(newPageProducts);

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

    res.json({
      success: true,
      martName,
      branchName,
      totalPages,
      identicalPages,
      replacedPages,
      totalProducts: allFinalProducts.length,
      products: allFinalProducts,
      syncedAt: new Date().toISOString()
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : '지점 전단 동기화 실패';
    res.status(500).json({ success: false, error: errorMessage });
  }
});

export default app;
