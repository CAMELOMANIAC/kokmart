import { GoogleGenAI, Type } from '@google/genai';
import sharp from 'sharp';
import { ParsedProduct, parseFlyerTsv } from '@kokmart/shared';

const DEFAULT_VISION_MODEL = 'gemini-3.5-flash-lite';

function getVisionAiClient(): GoogleGenAI {
  const apiKey = (process.env.GEMINI_VISION_API_KEY || '').trim();
  if (!apiKey) {
    throw new Error('GEMINI_VISION_API_KEY가 환경 변수에 설정되어 있지 않습니다.');
  }
  return new GoogleGenAI({ apiKey });
}

function getVisionModel(): string {
  return (process.env.GEMINI_VISION_MODEL || DEFAULT_VISION_MODEL).trim();
}

export interface VisionRefinedProduct {
  product: ParsedProduct;
  onlineComparable: boolean;
  reason: string;
}

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
 * Gemini 3.5 Flash-Lite를 사용하여 전단 조각 파싱 및 3대 팁 분류
 */
export async function parseTileWithGemini(tileBuffer: Buffer): Promise<ParsedProduct[]> {
  const ai = getVisionAiClient();

  if (!tileBuffer || tileBuffer.length === 0) {
    throw new Error('파싱할 타일 이미지 버퍼가 비어 있습니다.');
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

  const response = await ai.models.generateContent({
    model: getVisionModel(),
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
}

/**
 * 1단계: 전단 전체 이미지에서 상품별 Bounding Box 좌표(0~1000 정규화) 검출
 */
export async function detectBoundingBoxesWithGemini(
  imageBuffer: Buffer,
  martName = '마트'
): Promise<Array<{ id: string; ymin: number; xmin: number; ymax: number; xmax: number; labelHint: string }>> {
  const ai = getVisionAiClient();

  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Bounding Box를 검출할 전단 이미지 데이터가 없습니다.');
  }

  const base64Image = imageBuffer.toString('base64');
  const prompt = `
당신은 대형마트(${martName}) 전단지 레이아웃 분석 및 상품 객체 검출(Object Detection) 전문가입니다.
이미지 내의 '각 개별 할인 상품 카드/구역'의 경계 사각형(Bounding Box)을 찾아내십시오.
각 좌표는 0부터 1000 사이의 정수 값(정규화 좌표)으로 표현되어야 합니다:
- ymin: 사각형의 상단 가장자리 (0 ~ 1000)
- xmin: 사각형의 좌측 가장자리 (0 ~ 1000)
- ymax: 사각형의 하단 가장자리 (0 ~ 1000)
- xmax: 사각형의 우측 가장자리 (0 ~ 1000)
- labelHint: 해당 구역의 주요 상품명 또는 텍스트 요약 (예: '국내산 삼겹살', '샤인머스캣')

규칙:
1. 전단지 타이틀 배너나 마트 로고 단독 영역은 제외하고, 가격/할인이 적힌 실제 개별 상품 영역들을 검출하세요.
2. 겹치지 않게 상품별로 명확히 분리하세요.
`;

  const response = await ai.models.generateContent({
    model: getVisionModel(),
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
            ymin: { type: Type.INTEGER },
            xmin: { type: Type.INTEGER },
            ymax: { type: Type.INTEGER },
            xmax: { type: Type.INTEGER },
            labelHint: { type: Type.STRING }
          },
          required: ['ymin', 'xmin', 'ymax', 'xmax', 'labelHint']
        }
      }
    }
  });

  const parsed = JSON.parse(response.text || '[]') as Array<{
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
    labelHint: string;
  }>;

  return parsed.map((item, index) => ({
    id: `box-${index + 1}`,
    ymin: Math.max(0, Math.min(1000, item.ymin)),
    xmin: Math.max(0, Math.min(1000, item.xmin)),
    ymax: Math.max(0, Math.min(1000, item.ymax)),
    xmax: Math.max(0, Math.min(1000, item.xmax)),
    labelHint: item.labelHint || `상품 ${index + 1}`
  }));
}

/**
 * 2단계: 웹워커에서 충분한 여백을 주고 크롭한 개별 상품 이미지 블롭을 분석하여 정형화된 JSON 추출
 */
export async function parseSingleCroppedProductWithGemini(
  croppedBuffer: Buffer,
  martName = '이마트'
): Promise<ParsedProduct> {
  const ai = getVisionAiClient();

  if (!croppedBuffer || croppedBuffer.length === 0) {
    throw new Error('파싱할 크롭 상품 이미지 버퍼가 비어 있습니다.');
  }

  const base64Image = croppedBuffer.toString('base64');
  const prompt = `
당신은 대한민국 대형마트(${martName}) 전단지 상품 상세 분석 전문가입니다.
제공된 이미지는 전단지에서 특정 상품 1개를 여백을 포함하여 크롭한 고화질 이미지입니다.
이미지에서 상품명, 할인가(최종 판매가), 단위당(100g 또는 100ml 또는 개당) 단가, 신선식품 여부를 정확하게 파싱하고,
마트 우선(Mart-First) 원칙에 따른 smartTip을 생성하십시오.

[smartTip 분류 규칙]
1. 신선식품(정육, 채소, 과일, 생선 등) -> tipType: "MART_RECOMMEND", badgeText: "신선 장보기", tipMessage: "오늘 저녁 신선식품은 마트 현장 구매가 가장 신선해요.", coupangKeyword: null
2. 1+1 행사, 파격 미끼상품 -> tipType: "MART_BEST", badgeText: "전단 특가", tipMessage: "전단지 최저가 행사 상품입니다. 품절 전 마트 필구!", coupangKeyword: null
3. 대용량 공산품/생필품(휴지, 세제, 생수 등) 중 쿠팡 대용량이 유리한 경우 -> tipType: "COUPANG_BULK", badgeText: "대용량 알뜰 팁", tipMessage: "부피가 크고 오래 쓰는 공산품은 쿠팡 로켓배송 대용량이 경제적이에요.", coupangKeyword: "해당상품명 대용량"
`;

  try {
    const response = await ai.models.generateContent({
      model: getVisionModel(),
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
    });

    const parsedJson = JSON.parse(response.text || '{}') as ParsedProduct;
    parsedJson.id = `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    parsedJson.martName = (martName === '이마트' || martName === '홈플러스' || martName === '롯데마트') ? martName : '이마트';
    return parsedJson;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini 크롭 상품 파싱 실패: ${errorMsg}`);
  }
}

/**
 * 주간 마스터 전단 이미지 묶음(최대 4~5장)을 고해상도 그대로 Gemini 3.5 Flash-Lite에 전달하여 TSV 포맷으로 일괄 파싱
 */
export async function parseMasterFlyerWithGemini(
  pageBuffers: Buffer[],
  martName = '대형마트'
): Promise<ParsedProduct[]> {
  if (!pageBuffers || pageBuffers.length === 0) {
    throw new Error('파싱할 전단지 이미지 목록이 비어 있습니다.');
  }

  for (let i = 0; i < pageBuffers.length; i++) {
    const buf = pageBuffers[i];
    if (!buf || buf.length === 0) {
      throw new Error(`페이지 ${i + 1}의 이미지 버퍼가 비어 있습니다.`);
    }
  }

  const ai = getVisionAiClient();
  const model = getVisionModel();
  const startTime = Date.now();

  console.log(`[Gemini Vision] 🚀 Calling model '${model}' with ${pageBuffers.length} flyer images...`);

  // 각 페이지 이미지를 base64 inlineData 파트로 구성
  const imageParts = pageBuffers.map((buffer) => ({
    inlineData: {
      mimeType: 'image/jpeg',
      data: buffer.toString('base64'),
    },
  }));

  const prompt = `
당신은 대한민국 대형마트(${martName}) 전단지 데이터 분석 전문가입니다.
제공된 ${pageBuffers.length}장의 전단지 이미지에 있는 모든 행사 상품을 추출하십시오.
각 이미지는 순서대로 1페이지, 2페이지, ..., ${pageBuffers.length}페이지에 해당합니다.

출력은 토큰 절약과 백엔드 파싱을 위해 반드시 아래 TSV(Tab-Separated Values) 형식으로만 출력하십시오.
마크다운 코드블록이나 불필요한 설명 없이 탭으로 구분된 텍스트만 출력하십시오.

[출력 TSV 헤더 형식]
페이지번호\t상품명\t할인가\t단위당가격\t단위\t신선식품여부(Y/N)\tymin\txmin\tymax\txmax

[작성 규칙]
1. 헤더 다음 행부터 전단지에 있는 모든 상품을 한 행씩 순서대로 작성하십시오. 절대 헤더만 출력하고 멈추지 마십시오.
2. 페이지번호: 이미지가 속한 페이지 번호 (1부터 시작하는 정수).
3. 상품명: 전단지에 표기된 구체적인 브랜드 및 상품명(용량/수량 포함).
4. 할인가: 실제 소비자가 구매하는 행사가격 (숫자만 입력, 쉼표나 '원' 제외).
5. 단위당가격: 100g, 100ml 또는 1개당 단가 (전단지에 표기된 단가, 숫자만 입력). 표기가 없으면 할인가와 동일하게 입력.
6. 단위: 단가의 기준 단위 (예: 100g, 100ml, 1개, 1봉, 1박스).
7. 신선식품여부: 정육, 수산, 채소, 과일, 계란 등 신선식품은 Y, 공산품/생필품/가공식품은 N.
8. 전수 추출 필수: 메인 대표 상품뿐만 아니라 하단, 측면, 작은 박스에 표기된 소형 상품(채소, 양념, 가공식품, 생필품 등)까지 단 1개도 누락하지 말고 100% 빠짐없이 전수 추출하십시오. 중간에 임의로 생략하거나 요약하지 마십시오.
9. ymin, xmin, ymax, xmax: [★가장 중요: 상품 실물 사진/비주얼 중심 좌표]
   - 가격표, 상품명 글씨, 행사 문구/스티커 등 '텍스트 구역'은 제외하십시오.
   - 해당 상품의 '실제 음식, 과일, 채소, 정육, 제품 본체 사진이나 포장 패키지 비주얼(사진/그림)'만을 타이트하게 감싸는 0부터 1000 사이의 정규화 정수 좌표를 구하십시오. 썸네일에 글씨 대신 실제 상품 사진이 돋보여야 합니다.
10. 서로 다른 상품 카드나 가격표를 한 행에 합치지 마십시오. 인접한 상품은 반드시 개별 행으로 분리하십시오.
11. 하나의 가격표가 슬래시(/)로 구분된 여러 선택 상품에 공통 적용되면, 이미지에서 이름을 읽을 수 있는 각 상품을 별도 행으로 출력하고 같은 행사가를 적용하십시오.
12. 브랜드, 상품명, 맛/종류, 용량/수량은 이미지에 실제로 보이는 문자열만 사용하십시오. 흐리거나 가려진 내용은 추측하거나 보완하지 마십시오.
13. 비슷한 한글을 문맥으로 바꾸지 말고 이미지 표기를 그대로 확인하십시오. 특히 샤브/사브, 세트/세리처럼 한 글자 차이를 확대해 재확인하십시오.
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            ...imageParts,
            { text: prompt },
          ],
        },
      ],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    const parsedProducts = parseFlyerTsv(responseText, 1);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `[Gemini Vision] ⏱️ Completed in ${elapsedSec}s (extracted ${parsedProducts.length} products, ${responseText.length} chars).`
    );

    if (parsedProducts.length === 0) {
      console.warn(`[Gemini Vision Warning] 0 products parsed! Raw response (${responseText.length} chars):`, responseText);
    }

    return parsedProducts.map((p, index) => ({
      ...p,
      id: `master-p${p.pageIndex || 1}-${Date.now()}-${index}`,
      martName: (martName === '이마트' || martName === '홈플러스' || martName === '롯데마트') ? martName : undefined,
    }));
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`[Gemini Vision Error] Failed after ${elapsedSec}s:`, errorMsg);
    throw new Error(`Gemini 마스터 전단 파싱 실패: ${errorMsg}`);
  }
}

/**
 * 변동이 감지된 특정 전단 단일 페이지만 Gemini 3.5 Flash-Lite로 통째로 재파싱 (Page-level Replacement)
 */
export async function parseSinglePageWithGemini(
  pageBuffer: Buffer,
  pageIndex = 1,
  martName = '대형마트'
): Promise<ParsedProduct[]> {
  if (!pageBuffer || pageBuffer.length === 0) {
    throw new Error('파싱할 페이지 이미지 데이터가 비어 있습니다.');
  }

  const ai = getVisionAiClient();
  const model = getVisionModel();
  const base64Image = pageBuffer.toString('base64');

  const prompt = `
당신은 대한민국 대형마트(${martName}) 전단지 데이터 분석 전문가입니다.
제공된 전단지 이미지(페이지 ${pageIndex}) 내의 모든 행사 상품을 추출하십시오.

출력은 반드시 아래 TSV(Tab-Separated Values) 형식으로만 출력하십시오.
마크다운 코드블록이나 불필요한 설명 없이 순수 TSV 텍스트만 출력하십시오.

[출력 TSV 헤더 형식]
페이지번호\t상품명\t할인가\t단위당가격\t단위\t신선식품여부(Y/N)\tymin\txmin\tymax\txmax

[작성 규칙]
1. 헤더 다음 행부터 페이지에 있는 모든 상품을 한 행씩 순서대로 작성하십시오. 절대 헤더만 출력하고 멈추지 마십시오.
2. 페이지번호: ${pageIndex}
3. 상품명: 구체적인 상품명 및 규격
4. 할인가: 숫자만 입력
5. 단위당가격: 100g/100ml/개당 단가 (숫자만)
6. 단위: 기준 단위 (100g, 100ml, 개 등)
7. 신선식품여부: 신선식품(정육/수산/채소/과일/계란)은 Y, 그 외 가공/공산품은 N
8. 전수 추출 필수: 메인 대표 상품뿐만 아니라 하단, 측면, 작은 박스에 표기된 소형 상품(채소, 양념, 가공식품, 생필품 등)까지 단 1개도 누락하지 말고 빠짐없이 전수 추출하십시오. 임의 생략이나 요약 금지.
9. ymin, xmin, ymax, xmax: [★가장 중요: 상품 실물 사진/비주얼 중심 좌표]
   - 가격표, 상품명 글씨, 행사 문구/스티커 등 '텍스트 구역'은 제외하십시오.
   - 해당 상품의 '실제 음식, 과일, 채소, 정육, 제품 본체 사진이나 포장 패키지 비주얼(사진/그림)'만을 타이트하게 감싸는 0부터 1000 사이의 정규화 정수 좌표를 구하십시오. 썸네일에 글씨 대신 실제 상품 사진이 돋보여야 합니다.
10. 서로 다른 상품 카드나 가격표를 한 행에 합치지 마십시오. 인접한 상품은 반드시 개별 행으로 분리하십시오.
11. 하나의 가격표가 슬래시(/)로 구분된 여러 선택 상품에 공통 적용되면, 이미지에서 이름을 읽을 수 있는 각 상품을 별도 행으로 출력하고 같은 행사가를 적용하십시오.
12. 브랜드, 상품명, 맛/종류, 용량/수량은 이미지에 실제로 보이는 문자열만 사용하고 추측하지 마십시오.
13. 비슷한 한글 한 글자 차이를 확대해 재확인하고 이미지 표기를 정확히 보존하십시오.
`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image,
              },
            },
            { text: prompt },
          ],
        },
      ],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.1,
      },
    });

    const responseText = response.text || '';
    const parsedProducts = parseFlyerTsv(responseText, pageIndex);

    if (parsedProducts.length === 0) {
      console.warn(`[Gemini Vision Warning] 0 products parsed for page ${pageIndex}! Raw response (${responseText.length} chars):`, responseText);
    }

    return parsedProducts.map((p, index) => ({
      ...p,
      id: `page${pageIndex}-${Date.now()}-${index}`,
      martName: (martName === '이마트' || martName === '홈플러스' || martName === '롯데마트') ? martName : undefined,
    }));
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini 단일 페이지 재파싱 실패: ${errorMsg}`);
  }
}

/**
 * 검색 근거가 없던 상품만 원본 페이지에서 다시 확인합니다.
 * bounding box는 상품 사진 중심 좌표이므로 전체 페이지와 좌표를 함께 전달해 주변 가격표/상품명을 연결합니다.
 */
export async function refineProductsFromFlyerWithGemini(
  pageBuffer: Buffer,
  products: ParsedProduct[]
): Promise<VisionRefinedProduct[]> {
  if (!pageBuffer || pageBuffer.length === 0) {
    throw new Error('재검증할 전단 페이지 이미지가 비어 있습니다.');
  }
  if (products.length === 0) return [];

  const ai = getVisionAiClient();
  const model = getVisionModel();
  const rows = products.map((product) => {
    const box = product.boundingBox;
    return [
      product.id,
      product.productName,
      Math.round(product.salePrice),
      Math.round(product.effectiveUnitPrice),
      product.unitMeasure,
      box ? `${box.ymin},${box.xmin},${box.ymax},${box.xmax}` : '좌표없음',
    ].join('\t');
  }).join('\n');

  const prompt = `
당신은 한국 마트 전단의 OCR 교정자입니다. 아래 입력 상품은 온라인 동일상품 검색에 실패했습니다.
전체 전단 이미지에서 각 상품의 좌표가 가리키는 '상품 사진'을 찾고, 그 사진과 가장 가까운 상품명·규격·가격표만 다시 읽으십시오.

[입력]
id\t현재상품명\t현재행사가\t현재단위가격\t현재단위\t상품사진좌표(ymin,xmin,ymax,xmax; 0~1000)
${rows}

[필수 규칙]
- 입력 id마다 정확히 하나의 결과를 반환하고 id를 변경하지 마십시오.
- 좌표 주변의 다른 상품 카드, 옆 열, 위아래 가격표를 섞지 마십시오.
- 이미지에서 분명히 보이는 브랜드·상품명·맛/종류·용량/수량만 기록하고 추측하지 마십시오.
- 현재 값이 정확하면 그대로 유지하십시오. 가격은 이미지에서 확실히 읽을 때만 교정하십시오.
- 슬래시로 여러 선택 상품이 묶인 행사, 마트 즉석조리/회/초밥/자체 구성, 규격이 불명확한 신선식품은 onlineComparable=false로 표시하십시오.
- 브랜드와 정확한 용량/수량이 확인되는 포장 공산품처럼 온라인에서 동일 규격을 찾을 수 있을 때만 onlineComparable=true로 표시하십시오.
- reason은 판정 근거를 40자 이내의 객관적인 한국어로 작성하십시오.
`;

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: 'user',
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: pageBuffer.toString('base64') } },
          { text: prompt },
        ],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            productName: { type: Type.STRING },
            salePrice: { type: Type.NUMBER },
            effectiveUnitPrice: { type: Type.NUMBER },
            unitMeasure: { type: Type.STRING },
            isPerishable: { type: Type.BOOLEAN },
            onlineComparable: { type: Type.BOOLEAN },
            reason: { type: Type.STRING },
          },
          required: [
            'id',
            'productName',
            'salePrice',
            'effectiveUnitPrice',
            'unitMeasure',
            'isPerishable',
            'onlineComparable',
            'reason',
          ],
        },
      },
      maxOutputTokens: 4096,
      temperature: 0.1,
    },
  });

  const raw = JSON.parse(response.text || '[]') as Array<{
    id: string;
    productName: string;
    salePrice: number;
    effectiveUnitPrice: number;
    unitMeasure: string;
    isPerishable: boolean;
    onlineComparable: boolean;
    reason: string;
  }>;
  const originalById = new Map(products.map((product) => [product.id, product]));
  const seen = new Set<string>();
  const refined: VisionRefinedProduct[] = [];

  for (const item of raw) {
    const original = originalById.get(item.id);
    if (!original || !item.id || seen.has(item.id)) continue;
    if (!item.productName?.trim() || !item.unitMeasure?.trim()) continue;
    if (!Number.isFinite(item.salePrice) || item.salePrice <= 0) continue;
    if (!Number.isFinite(item.effectiveUnitPrice) || item.effectiveUnitPrice <= 0) continue;
    seen.add(item.id);
    refined.push({
      product: {
        ...original,
        productName: item.productName.trim(),
        salePrice: Math.round(item.salePrice),
        effectiveUnitPrice: Math.round(item.effectiveUnitPrice),
        unitMeasure: item.unitMeasure.trim(),
        isPerishable: item.isPerishable,
      },
      onlineComparable: item.onlineComparable,
      reason: item.reason.replace(/[\t\r\n]+/g, ' ').trim().slice(0, 80),
    });
  }

  return refined;
}
