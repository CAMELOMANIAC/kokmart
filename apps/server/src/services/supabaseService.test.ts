import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isSupabaseConfigured,
  getSupabaseClient,
  saveFlyerToSupabase,
  getLatestFlyerFromSupabase,
} from './supabaseService.js';

const mockFrom = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

describe('supabaseService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isSupabaseConfigured', () => {
    it('SUPABASE_URL과 KEY 환경변수가 모두 유효할 경우 true를 반환해야 한다', () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_ANON_KEY = 'test-anon-key';
      expect(isSupabaseConfigured()).toBe(true);
    });

    it('환경변수가 비어있거나 없으면 false를 반환해야 한다', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(isSupabaseConfigured()).toBe(false);
    });
  });

  describe('getSupabaseClient', () => {
    it('Supabase 미설정 시 null을 반환해야 한다', () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      expect(getSupabaseClient()).toBeNull();
    });
  });

  describe('saveFlyerToSupabase', () => {
    it('Supabase 미설정 시 null을 반환해야 한다', async () => {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_ANON_KEY;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      const result = await saveFlyerToSupabase({
        martName: '이마트',
        imageUrls: ['https://example.com/flyer1.jpg'],
        products: [],
      });

      expect(result).toBeNull();
    });

    it('전단지 및 상품 정보가 정상적으로 DB에 저장되어야 한다', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const flyerData = {
        id: 'flyer-123',
        mart_name: '이마트',
        branch_name: '공통',
        is_master: true,
        title: '이마트 주간 전단',
        valid_start_date: '2026-03-01',
        valid_end_date: '2026-03-07',
        image_urls: ['https://example.com/flyer1.jpg'],
        page_count: 1,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: flyerData, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsertFlyers = vi.fn().mockReturnValue({ select: mockSelect });

      const mockInsertProducts = vi.fn().mockResolvedValue({ error: null });

      mockFrom.mockImplementation((table: string) => {
        if (table === 'flyers') {
          return { insert: mockInsertFlyers };
        }
        if (table === 'flyer_products') {
          return { insert: mockInsertProducts };
        }
        return {};
      });

      const sampleProducts = [
        {
          id: 'prod-1',
          pageIndex: 1,
          productName: '삼겹살 100g',
          salePrice: 2500,
          effectiveUnitPrice: 2500,
          unitMeasure: '100g',
          isPerishable: true,
          martName: '이마트',
          smartTip: {
            tipType: 'MART_BEST' as const,
            badgeText: '특가',
            tipMessage: '최저가',
            coupangKeyword: null,
          },
        },
      ];

      const result = await saveFlyerToSupabase({
        martName: '이마트',
        imageUrls: ['https://example.com/flyer1.jpg'],
        products: sampleProducts,
      });

      expect(result).not.toBeNull();
      expect(result?.flyer.id).toBe('flyer-123');
      expect(result?.products).toHaveLength(1);
      expect(mockFrom).toHaveBeenCalledWith('flyers');
      expect(mockFrom).toHaveBeenCalledWith('flyer_products');
    });

    it('flyers 저장 중 에러 발생 시 예외를 던져야 한다', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsertFlyers = vi.fn().mockReturnValue({ select: mockSelect });

      mockFrom.mockReturnValue({ insert: mockInsertFlyers });

      await expect(
        saveFlyerToSupabase({
          martName: '이마트',
          imageUrls: ['https://example.com/flyer1.jpg'],
          products: [],
        })
      ).rejects.toThrow('Supabase 전단 메타데이터 저장 실패: Insert failed');
    });
  });

  describe('getLatestFlyerFromSupabase', () => {
    it('지점 전단지가 존재할 경우 해당 전단지와 상품 목록을 반환해야 한다', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const flyerData = {
        id: 'flyer-branch-1',
        mart_name: '홈플러스',
        branch_name: '강남점',
        is_master: false,
        title: '홈플러스 강남점 전단',
        image_urls: ['https://example.com/hp1.jpg'],
        page_count: 1,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      };

      const productsData = [
        {
          id: 'prod-10',
          page_index: 1,
          product_name: '계란 30구',
          sale_price: 6990,
          effective_unit_price: 233,
          unit_measure: '1구',
          is_perishable: true,
          mart_name: '홈플러스',
          tip_type: 'MART_RECOMMEND',
          badge_text: '추천',
          tip_message: '신선해요',
          coupang_keyword: null,
        },
      ];

      mockFrom.mockImplementation((table: string) => {
        if (table === 'flyers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockResolvedValue({ data: flyerData, error: null }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'flyer_products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: productsData, error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await getLatestFlyerFromSupabase('홈플러스', '강남점');

      expect(result).not.toBeNull();
      expect(result?.flyer.branchName).toBe('강남점');
      expect(result?.products).toHaveLength(1);
      expect(result?.products[0]?.productName).toBe('계란 30구');
    });

    it('지점 전단지가 없으면 마스터 전단(공통)으로 Fallback 조회해야 한다', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      const masterFlyerData = {
        id: 'flyer-master-1',
        mart_name: '홈플러스',
        branch_name: '공통',
        is_master: true,
        title: '홈플러스 마스터 전단',
        image_urls: ['https://example.com/master.jpg'],
        page_count: 1,
        created_at: '2026-03-01T00:00:00.000Z',
        updated_at: '2026-03-01T00:00:00.000Z',
      };

      let flyerCallCount = 0;

      mockFrom.mockImplementation((table: string) => {
        if (table === 'flyers') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    limit: vi.fn().mockReturnValue({
                      maybeSingle: vi.fn().mockImplementation(() => {
                        flyerCallCount++;
                        if (flyerCallCount === 1) {
                          return Promise.resolve({ data: null, error: null });
                        }
                        return Promise.resolve({ data: masterFlyerData, error: null });
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'flyer_products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        return {};
      });

      const result = await getLatestFlyerFromSupabase('홈플러스', '역삼점');

      expect(result).not.toBeNull();
      expect(result?.flyer.branchName).toBe('공통');
    });

    it('전단지 조회 에러 시 null을 반환해야 한다', async () => {
      process.env.SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await getLatestFlyerFromSupabase('이마트');
      expect(result).toBeNull();
    });
  });
});
