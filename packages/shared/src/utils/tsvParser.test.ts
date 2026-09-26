import { describe, it, expect } from 'vitest';
import { calculateNormalizedUnitPrice, parseFlyerTsv } from './tsvParser.js';

describe('parseFlyerTsv', () => {
  it('should parse 6-column TSV with markdown code fence and header', () => {
    const rawTsv = `\`\`\`tsv
페이지번호\t상품명\t할인가\t단위당가격\t단위\t신선식품여부
1\t국내산 삼겹살 100g\t1,980원\t1,980원\t100g\tY
1\t다우니 섬유유연제 1L\t7,900원\t790원\t100ml\tN
2\t제주 하우스감귤 1.5kg\t12,900\t860\t100g\tyes
\`\`\``;

    const products = parseFlyerTsv(rawTsv);

    expect(products).toHaveLength(3);
    expect(products[0]).toEqual({
      pageIndex: 1,
      productName: '국내산 삼겹살 100g',
      salePrice: 1980,
      effectiveUnitPrice: 1980,
      unitMeasure: '100g',
      isPerishable: true,
    });
    expect(products[1]).toEqual({
      pageIndex: 1,
      productName: '다우니 섬유유연제 1L',
      salePrice: 7900,
      effectiveUnitPrice: 790,
      unitMeasure: '100ml',
      isPerishable: false,
    });
    expect(products[2]).toEqual({
      pageIndex: 2,
      productName: '제주 하우스감귤 1.5kg',
      salePrice: 12900,
      effectiveUnitPrice: 860,
      unitMeasure: '100g',
      isPerishable: true,
    });
  });

  it('should parse 5-column TSV without pageIndex using defaultPageIndex', () => {
    const rawTsv = `상품명\t할인가\t단위당가격\t단위\t신선식품여부
한우 1+ 등급 등심\t8,900\t8,900\t100g\tY
신라면 5개입\t3,980\t796\t1개\tN`;

    const products = parseFlyerTsv(rawTsv, 3);

    expect(products).toHaveLength(2);
    expect(products[0]?.pageIndex).toBe(3);
    expect(products[0]?.productName).toBe('한우 1+ 등급 등심');
    expect(products[0]?.isPerishable).toBe(true);

    expect(products[1]?.pageIndex).toBe(3);
    expect(products[1]?.productName).toBe('신라면 5개입');
    expect(products[1]?.isPerishable).toBe(false);
  });

  it('should parse number correctly removing commas and currency text', () => {
    const rawTsv = `1\t포도 1kg\t15,000 원\t1,500 원\t100g\tY`;
    const products = parseFlyerTsv(rawTsv);

    expect(products[0]?.salePrice).toBe(15000);
    expect(products[0]?.effectiveUnitPrice).toBe(1500);
  });

  it('환산할 수 없는 포장 단위를 판매가로 복사하지 않는다', () => {
    const rawTsv = `1\t사과 1봉\t9,900\t0\t1봉\tY`;
    const products = parseFlyerTsv(rawTsv);

    expect(products[0]?.salePrice).toBe(9900);
    expect(products[0]?.effectiveUnitPrice).toBe(0);
    expect(products[0]?.unitMeasure).toBe('');
  });

  it('신규 포맷의 포장 규격으로 100g 환산단가를 계산한다', () => {
    const rawTsv = `페이지번호\t상품명\t포장규격\t할인가\t신선식품여부(Y/N)\tymin\txmin\tymax\txmax
1\t피코크 하얀짬뽕\t1280g\t6980\tN\t10\t20\t300\t400`;
    const products = parseFlyerTsv(rawTsv);

    expect(products[0]).toMatchObject({
      productName: '피코크 하얀짬뽕',
      packageSpec: '1280g',
      salePrice: 6980,
      effectiveUnitPrice: 545,
      unitMeasure: '100g',
    });
  });

  it('묶음 규격을 총용량으로 환산한다', () => {
    expect(calculateNormalizedUnitPrice(4980, '2L×6병')).toEqual({
      effectiveUnitPrice: 42,
      unitMeasure: '100ml',
    });
    expect(calculateNormalizedUnitPrice(3980, '8입')).toEqual({
      effectiveUnitPrice: 498,
      unitMeasure: '1개',
    });
    expect(calculateNormalizedUnitPrice(6980, '1.28kg(640g×2)')).toEqual({
      effectiveUnitPrice: 545,
      unitMeasure: '100g',
    });
  });

  it('should parse various perishable boolean representations correctly', () => {
    const rawTsv = `
1\t상품A\t1000\t1000\t개\ty
1\t상품B\t1000\t1000\t개\tyes
1\t상품C\t1000\t1000\t개\ttrue
1\t상품D\t1000\t1000\t개\t1
1\t상품E\t1000\t1000\t개\t예
1\t상품F\t1000\t1000\t개\t신선
1\t상품G\t1000\t1000\t개\tn
`;
    const products = parseFlyerTsv(rawTsv);

    expect(products).toHaveLength(7);
    expect(products[0]?.isPerishable).toBe(true);
    expect(products[1]?.isPerishable).toBe(true);
    expect(products[2]?.isPerishable).toBe(true);
    expect(products[3]?.isPerishable).toBe(true);
    expect(products[4]?.isPerishable).toBe(true);
    expect(products[5]?.isPerishable).toBe(true);
    expect(products[6]?.isPerishable).toBe(false);
  });

  it('should handle empty or whitespace-only input gracefully', () => {
    expect(parseFlyerTsv('')).toEqual([]);
    expect(parseFlyerTsv('   \n\n  ')).toEqual([]);
  });

  it('should ignore comment lines and malformed short lines', () => {
    const rawTsv = `# This is a comment
1\t국내산 삼겹살\t2000\t2000\t100g\tY
잘못된 줄 하나
1\t신라면\t4000\t800\t개\tN`;

    const products = parseFlyerTsv(rawTsv);
    expect(products).toHaveLength(2);
    expect(products[0]?.productName).toBe('국내산 삼겹살');
    expect(products[1]?.productName).toBe('신라면');
  });
});
