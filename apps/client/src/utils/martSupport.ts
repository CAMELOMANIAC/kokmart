import type { MartBrand } from '@kokmart/shared';

/**
 * 전단지 비전 파싱 및 AI 스마트 팁이 지원되는 마트 브랜드 목록 (대형 3사)
 */
export const FLYER_SUPPORTED_BRANDS: readonly MartBrand[] = [
  '이마트',
  '홈플러스',
  '롯데마트',
] as const;

/**
 * 전단 서비스 지원 여부 확인 헬퍼
 */
export const isFlyerSupportedBrand = (brand: MartBrand | string): boolean => {
  return FLYER_SUPPORTED_BRANDS.includes(brand as MartBrand);
};

export const UNSUPPORTED_MART_FLYER_MESSAGE = '해당 마트 전단 서비스는 추후 업데이트 예정입니다 🚀';
