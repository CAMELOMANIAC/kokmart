import express, { Request, Response } from 'express';
import cors from 'cors';
import multer from 'multer';
import { cropFlyerGrid, parseTileWithGemini } from '../src/services/geminiService.js';
import { FlyerParsingResponse, ParsedProduct } from '@kokmart/shared';

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

// 헬스체크 엔드포인트
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Kokmart API Server', timestamp: new Date().toISOString() });
});

// 마트 3사 최저가 비교 큐레이션 API
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
    },
    {
      id: 'prod-3',
      productName: '크리넥스 3겹 휴지 30롤',
      salePrice: 19900,
      effectiveUnitPrice: 663,
      unitMeasure: '롤',
      isPerishable: false,
      martName: '홈플러스',
      smartTip: {
        tipType: 'COUPANG_BULK',
        badgeText: '대용량 알뜰 팁',
        tipMessage: '부피가 큰 휴지는 쿠팡 대용량 로켓배송이 무겁지 않고 35% 싸요.',
        coupangKeyword: '크리넥스 3겹 휴지 대용량'
      }
    }
  ];

  res.json({ success: true, count: mockProducts.length, products: mockProducts });
});

// 전단지 4~6분할 이미지 파싱 API
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
      // 업로드 이미지 없는 경우 샘플 반환
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

export default app;
