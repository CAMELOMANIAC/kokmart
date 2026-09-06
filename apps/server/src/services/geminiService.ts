import { GoogleGenAI, Type } from '@google/genai';
import sharp from 'sharp';
import { ParsedProduct } from '@kokmart/shared';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

/**
 * 대형 전단지 이미지를 4~6분할 타일 그리드로 크롭
 */
export async function cropFlyerGrid(imageBuffer: Buffer, gridCols = 2, gridRows = 2): Promise<Buffer[]> {
  const metadata = await sharp(imageBuffer).metadata();
  const width = metadata.width || 1000;
  const height = metadata.height || 1500;

  const tileWidth = Math.floor(width / gridCols);
  const tileHeight = Math.floor(height / gridRows);

  const croppedTiles: Buffer[] = [];

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      const x = c * tileWidth;
      const y = r * tileHeight;
      const extractWidth = (c === gridCols - 1) ? width - x : tileWidth;
      const extractHeight = (r === gridRows - 1) ? height - y : tileHeight;

      const tileBuffer = await sharp(imageBuffer)
        .extract({ left: x, top: y, width: extractWidth, height: extractHeight })
        .toBuffer();
      
      croppedTiles.push(tileBuffer);
    }
  }

  return croppedTiles;
}

/**
 * Gemini 1.5 Flash Vision API를 사용하여 전단 조각 파싱 및 3대 팁 분류
 */
export async function parseTileWithGemini(tileBuffer: Buffer): Promise<ParsedProduct[]> {
  if (!apiKey) {
    // API 키 미설정 시 mock fallback 반환
    return getMockParsedProducts();
  }

  const base64Image = tileBuffer.toString('base64');

  const prompt = `
당신은 대한민국 대형마트(이마트, 홈플러스, 롯데마트) 전단지 데이터 분석 전문가입니다.
전단 이미지 내 상품 목록, 할인가, 단위당(100g 또는 100ml 또는 개당) 단가, 신선식품 여부를 추출하십시오.
그리고 아래 마트 우선(Mart-First) 추천 원칙에 따라 smartTip을 생성하십시오.

[smartTip 분류 규칙]
1. 신선식품(정육, 과일, 채소 등) 및 소량 필수품 -> tipType: "MART_RECOMMEND", badgeText: "마트 현장 추천", tipMessage: "오늘 저녁 소량 신선 구매는 오프라인 마트가 최적이에요.", coupangKeyword: null
2. 1+1 행사, 초특가 미끼상품 -> tipType: "MART_BEST", badgeText: "마트 필구 특가", tipMessage: "전단지 최저가 행사 상품입니다. 현장 구매 필수!", coupangKeyword: null
3. 보관이 긴 공산품/생필품 중 쿠팡 대용량이 35% 이상 압도적으로 싸거나 오프라인 운반이 무거운 경우만 -> tipType: "COUPANG_BULK", badgeText: "대용량 알뜰 팁", tipMessage: "오래 쓰는 생필품은 쿠팡 대용량이 단가 기준 저렴해요.", coupangKeyword: "상품명 대용량"
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image
          }
        },
        { text: prompt }
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              productName: { type: Type.STRING },
              salePrice: { type: Type.NUMBER },
              effectiveUnitPrice: { type: Type.NUMBER },
              unitMeasure: { type: Type.STRING },
              isPerishable: { type: Type.BOOLEAN },
              smartTip: {
                type: Type.OBJECT,
                properties: {
                  tipType: { type: Type.STRING },
                  badgeText: { type: Type.STRING },
                  tipMessage: { type: Type.STRING },
                  coupangKeyword: { type: Type.STRING, nullable: true }
                },
                required: ['tipType', 'badgeText', 'tipMessage']
              }
            },
            required: ['productName', 'salePrice', 'effectiveUnitPrice', 'unitMeasure', 'isPerishable', 'smartTip']
          }
        }
      }
    });

    const parsedJson = JSON.parse(response.text || '[]');
    return parsedJson as ParsedProduct[];
  } catch (error) {
    console.error('Gemini parsing error:', error);
    return getMockParsedProducts();
  }
}

function getMockParsedProducts(): ParsedProduct[] {
  return [
    {
      id: 'p-1',
      productName: '한돈 삼겹살 (100g)',
      salePrice: 1980,
      effectiveUnitPrice: 1980,
      unitMeasure: '100g',
      isPerishable: true,
      martName: '이마트',
      smartTip: {
        tipType: 'MART_BEST',
        badgeText: '전단 핫특가',
        tipMessage: '주말 특별할인! 현장 방문 필구 상품입니다.',
        coupangKeyword: null
      }
    },
    {
      id: 'p-2',
      productName: '다우니 섬유유연제 1L',
      salePrice: 7900,
      effectiveUnitPrice: 790,
      unitMeasure: '100ml',
      isPerishable: false,
      martName: '홈플러스',
      smartTip: {
        tipType: 'COUPANG_BULK',
        badgeText: '대용량 알뜰 팁',
        tipMessage: '오래 쓰는 세제류는 쿠팡 4L 대용량이 100ml당 40% 저렴해요.',
        coupangKeyword: '다우니 섬유유연제 4L'
      }
    }
  ];
}
