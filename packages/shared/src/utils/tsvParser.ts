import { ParsedProduct } from '../types/flyer.js';

/**
 * 숫자 문자열 정제 함수 (쉼표, '원', 공백 제거 후 숫자 변환)
 */
function cleanNumber(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/,/g, '').replace(/원/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * 신선식품 여부 boolean 변환
 */
function parseIsPerishable(val: string): boolean {
  if (!val) return false;
  const normalized = val.trim().toLowerCase();
  return (
    normalized === 'y' ||
    normalized === 'yes' ||
    normalized === 'true' ||
    normalized === '1' ||
    normalized === '예' ||
    normalized === '신선'
  );
}

/**
 * 마크다운 코드 블록 제거
 */
function stripMarkdownFences(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\r?\n/, '');
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.replace(/\r?\n```$/, '');
  }
  return cleaned.trim();
}

/**
 * 헤더 행 여부 확인
 */
function isHeaderLine(line: string): boolean {
  const lower = line.toLowerCase();
  return (
    lower.includes('상품명') ||
    lower.includes('할인가') ||
    lower.includes('단위') ||
    lower.includes('product') ||
    lower.includes('price') ||
    lower.includes('페이지') ||
    lower.includes('page')
  );
}

/**
 * Gemini TSV 출력 텍스트를 ParsedProduct 배열로 안전하게 변환
 *
 * 지원 포맷:
 * 1) 10개 컬럼: 페이지번호\t상품명\t할인가\t단위당가격\t단위\t신선식품여부(Y/N)\tymin\txmin\tymax\txmax
 * 2) 9개 컬럼: 상품명\t할인가\t단위당가격\t단위\t신선식품여부(Y/N)\tymin\txmin\tymax\txmax
 * 3) 6개 컬럼: 페이지번호\t상품명\t할인가\t단위당가격\t단위\t신선식품여부(Y/N)
 * 4) 5개 컬럼: 상품명\t할인가\t단위당가격\t단위\t신선식품여부(Y/N)
 */
export function parseFlyerTsv(rawText: string, defaultPageIndex = 1): ParsedProduct[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const cleanedText = stripMarkdownFences(rawText);
  const lines = cleanedText.split(/\r?\n/);
  const products: ParsedProduct[] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]?.trim();
    if (!rawLine || rawLine.startsWith('#')) {
      continue;
    }

    if (i === 0 && isHeaderLine(rawLine)) {
      continue;
    }

    // 탭 구분자 분리 (탭 누락 시 | 또는 2칸 이상 연속 공백으로 유연하게 분리)
    let cols = rawLine.split('\t').map(c => c.trim());
    if (cols.length < 5 && rawLine.includes('|')) {
      cols = rawLine.split('|').map(c => c.trim()).filter(Boolean);
    }
    if (cols.length < 5) {
      cols = rawLine.split(/\s{2,}/).map(c => c.trim());
    }

    if (cols.length < 5) {
      continue;
    }

    let pageIndex = defaultPageIndex;
    let productName = '';
    let salePriceStr = '';
    let unitPriceStr = '';
    let unitMeasure = '';
    let isPerishableStr = '';
    let yminStr = '';
    let xminStr = '';
    let ymaxStr = '';
    let xmaxStr = '';

    if (cols.length >= 10) {
      // [페이지번호, 상품명, 할인가, 단위당가격, 단위, 신선식품여부, ymin, xmin, ymax, xmax]
      const parsedPage = parseInt(cols[0] || '1', 10);
      pageIndex = isNaN(parsedPage) ? defaultPageIndex : parsedPage;
      productName = cols[1] || '';
      salePriceStr = cols[2] || '0';
      unitPriceStr = cols[3] || '0';
      unitMeasure = cols[4] || '';
      isPerishableStr = cols[5] || 'N';
      yminStr = cols[6] || '';
      xminStr = cols[7] || '';
      ymaxStr = cols[8] || '';
      xmaxStr = cols[9] || '';
    } else if (cols.length === 9) {
      // [상품명, 할인가, 단위당가격, 단위, 신선식품여부, ymin, xmin, ymax, xmax]
      productName = cols[0] || '';
      salePriceStr = cols[1] || '0';
      unitPriceStr = cols[2] || '0';
      unitMeasure = cols[3] || '';
      isPerishableStr = cols[4] || 'N';
      yminStr = cols[5] || '';
      xminStr = cols[6] || '';
      ymaxStr = cols[7] || '';
      xmaxStr = cols[8] || '';
    } else if (cols.length >= 6) {
      // [페이지번호, 상품명, 할인가, 단위당가격, 단위, 신선식품여부]
      const parsedPage = parseInt(cols[0] || '1', 10);
      pageIndex = isNaN(parsedPage) ? defaultPageIndex : parsedPage;
      productName = cols[1] || '';
      salePriceStr = cols[2] || '0';
      unitPriceStr = cols[3] || '0';
      unitMeasure = cols[4] || '';
      isPerishableStr = cols[5] || 'N';
    } else {
      // [상품명, 할인가, 단위당가격, 단위, 신선식품여부]
      productName = cols[0] || '';
      salePriceStr = cols[1] || '0';
      unitPriceStr = cols[2] || '0';
      unitMeasure = cols[3] || '';
      isPerishableStr = cols[4] || 'N';
    }

    if (!productName) {
      continue;
    }

    const salePrice = cleanNumber(salePriceStr);
    let effectiveUnitPrice = cleanNumber(unitPriceStr);
    if (effectiveUnitPrice === 0 && salePrice > 0) {
      effectiveUnitPrice = salePrice;
    }

    let boundingBox: ParsedProduct['boundingBox'];
    if (yminStr && xminStr && ymaxStr && xmaxStr) {
      const ymin = Math.max(0, Math.min(1000, cleanNumber(yminStr)));
      const xmin = Math.max(0, Math.min(1000, cleanNumber(xminStr)));
      const ymax = Math.max(0, Math.min(1000, cleanNumber(ymaxStr)));
      const xmax = Math.max(0, Math.min(1000, cleanNumber(xmaxStr)));

      if (ymax > ymin && xmax > xmin) {
        boundingBox = {
          id: `box-${pageIndex}-${i}`,
          ymin,
          xmin,
          ymax,
          xmax,
          labelHint: productName,
        };
      }
    }

    products.push({
      pageIndex,
      productName,
      salePrice,
      effectiveUnitPrice,
      unitMeasure: unitMeasure || '개',
      isPerishable: parseIsPerishable(isPerishableStr),
      ...(boundingBox ? { boundingBox } : {}),
    });
  }

  return products;
}
