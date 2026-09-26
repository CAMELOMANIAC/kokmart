import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ParsedProduct } from '@kokmart/shared';

const { mockCreateInteraction } = vi.hoisted(() => ({
  mockCreateInteraction: vi.fn(),
}));

vi.mock('@google/genai', () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    interactions: { create: mockCreateInteraction },
  })),
}));

vi.hoisted(() => {
  process.env.GEMINI_TIP_API_KEY = 'mock_paid_tip_key';
  process.env.GEMINI_TIP_MODEL = 'gemini-3.8-flash';
});

import { generateGeminiTipBatch } from './geminiTipBatchService.js';

describe('generateGeminiTipBatch', () => {
  const product: ParsedProduct = {
    id: 'product-1',
    productName: '피자 파티세트',
    salePrice: 7_980,
    effectiveUnitPrice: 7_980,
    unitMeasure: '1세트',
    isPerishable: false,
    martName: '이마트',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('검색 호출과 TSV 출처 URL이 있으면 citation annotation 없이도 팁을 생성한다', async () => {
    mockCreateInteraction.mockResolvedValueOnce({
      output_text: [
        'id\t온라인총가격\t마트단위로환산한온라인단위가격\t판매처\t검색결과상품명\t구매특성\t근거요약\t출처URL',
        'product-1\t26900\t26900\t쿠팡\t피자 파티세트 1세트\tPRICE\t동일 규격 가격 확인\t[상품](https://example.com/product)',
        'product-1\t6900\t6900\t행사몰\t피자 파티세트 1세트\tPRICE\t현재 공개 행사가\thttps://example.com/sale\t여럿이 나눠 먹는 간편한 식사로 활용하기 좋아요.',
      ].join('\n'),
      steps: [
        {
          type: 'google_search_call',
          arguments: { queries: ['피자 파티세트 온라인 가격'] },
        },
        {
          type: 'model_output',
          content: [
            {
              type: 'text',
              text: '검색 결과',
              annotations: [],
            },
          ],
        },
      ],
    });

    const result = await generateGeminiTipBatch([product]);

    expect(mockCreateInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        model: 'gemini-3.8-flash',
        tools: [{ type: 'google_search' }],
        generation_config: expect.objectContaining({
          thinking_level: 'low',
          max_output_tokens: 4096,
        }),
        input: expect.stringContaining('출처URL\t구매조언'),
      })
    );
    expect(result.groundingSources).toBe(1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.tipStatus).toBe('complete');
    expect(result.products[0]?.smartTip?.tipType).toBe('COUPANG_TIP');
    expect(result.products[0]?.smartTip?.tipMessage).toContain('행사몰');
    expect(result.products[0]?.smartTip?.tipMessage).toContain('여럿이 나눠 먹는 간편한 식사');
  });

  it('검색은 실행됐지만 결과 행이 없으면 예외 대신 비전 재검증 대상으로 반환한다', async () => {
    mockCreateInteraction.mockResolvedValueOnce({
      output_text: 'id\t온라인총가격\t마트단위로환산한온라인단위가격\t판매처\t검색결과상품명\t구매특성\t근거요약\t출처URL',
      steps: [
        {
          type: 'google_search_call',
          arguments: { queries: ['피자 파티세트 온라인 가격'] },
        },
      ],
    });

    const result = await generateGeminiTipBatch([product]);

    expect(result.products).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.product.id).toBe('product-1');
  });

  it('TSV 구매 조언은 안전한 문장만 사용하고 가격 판단 표현은 폴백한다', async () => {
    mockCreateInteraction.mockResolvedValueOnce({
      output_text: [
        'id\t온라인총가격\t마트단위로환산한온라인단위가격\t판매처\t검색결과상품명\t구매특성\t근거요약\t출처URL\t구매조언',
        'product-1\t6900\t6900\t행사몰\t피자 파티세트 1세트\tSTANDARD\t현재 공개 행사가\thttps://example.com/sale\t마트가 더 저렴하니 추천해요',
      ].join('\n'),
      steps: [{ type: 'google_search_call', arguments: { queries: ['피자 파티세트 행사'] } }],
    });

    const result = await generateGeminiTipBatch([product]);

    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.smartTip?.tipMessage).toContain('행사몰');
    expect(result.products[0]?.smartTip?.tipMessage).toContain('온라인 주문이 유리');
    expect(result.products[0]?.smartTip?.tipMessage).not.toContain('마트가 더 저렴하니 추천');
  });

  it('가격 비교가 없어도 NONE 행의 AI 구매조언으로 완료한다', async () => {
    mockCreateInteraction.mockResolvedValueOnce({
      output_text: [
        'id\t비교등급\t비교상품총가격\t마트기준환산단가\t판매처\t비교상품명\t상품특성\t가격조건\t비교근거\t출처URL\t구매조언',
        'product-1\tNONE\t0\t0\t-\t-\tREADY_TO_EAT\t-\t매장 자체 구성 상품\t-\t여럿이 바로 나눠 먹기 편한 구성이에요.',
      ].join('\n'),
      steps: [{ type: 'google_search_call', arguments: { queries: ['피자 파티세트'] } }],
    });

    const result = await generateGeminiTipBatch([product]);

    expect(result.rejected).toHaveLength(0);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.tipSource).toBe('gemini_advice');
    expect(result.products[0]?.smartTip?.tipMessage).toContain('여럿이 바로 나눠 먹기 편한 구성');
  });

  it('CLOSE 냉동 상품은 동급 가격과 보관성을 함께 반영한다', async () => {
    mockCreateInteraction.mockResolvedValueOnce({
      output_text: [
        'id\t비교등급\t비교상품총가격\t마트기준환산단가\t판매처\t비교상품명\t상품특성\t가격조건\t비교근거\t출처URL\t구매조언',
        'product-1\tCLOSE\t6000\t6000\t온라인몰\t동급 냉동 피자세트\tFROZEN\t공개 판매가\t같은 용도의 냉동 간편식\thttps://example.com/frozen\t냉동실에 두고 필요한 때 조리하기 편해요.',
      ].join('\n'),
      steps: [{ type: 'google_search_call', arguments: { queries: ['냉동 피자세트'] } }],
    });

    const result = await generateGeminiTipBatch([product]);

    expect(result.rejected).toHaveLength(0);
    expect(result.products[0]?.smartTip?.tipType).toBe('COUPANG_TIP');
    expect(result.products[0]?.smartTip?.tipMessage).toContain('동급 비교상품(온라인몰)');
    expect(result.products[0]?.smartTip?.tipMessage).toContain('냉동실에 두고 필요한 때 조리하기 편해요.');
  });
});
