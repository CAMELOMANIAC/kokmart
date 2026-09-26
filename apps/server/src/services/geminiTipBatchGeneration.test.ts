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

  it('Interactions API에서 검색 호출과 URL 인용을 검증해 팁을 생성한다', async () => {
    mockCreateInteraction.mockResolvedValueOnce({
      output_text: [
        'id\t온라인총가격\t마트단위로환산한온라인단위가격\t판매처\t검색결과상품명\t구매특성\t근거요약\t출처URL',
        'product-1\t26900\t26900\t쿠팡\t피자 파티세트 1세트\tPRICE\t동일 규격 가격 확인\thttps://example.com/product',
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
              annotations: [
                { type: 'url_citation', url: 'https://example.com/product' },
              ],
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
      })
    );
    expect(result.groundingSources).toBe(1);
    expect(result.products).toHaveLength(1);
    expect(result.products[0]?.tipStatus).toBe('complete');
  });
});
