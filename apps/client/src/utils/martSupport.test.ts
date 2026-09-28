import { describe, it, expect } from 'vitest';
import {
  FLYER_SUPPORTED_BRANDS,
  isFlyerSupportedBrand,
  UNSUPPORTED_MART_FLYER_MESSAGE,
} from './martSupport';

describe('martSupport utility', () => {
  describe('FLYER_SUPPORTED_BRANDS', () => {
    it('대형 3사 마트 브랜드 목록을 정확히 포함해야 한다', () => {
      expect(FLYER_SUPPORTED_BRANDS).toEqual(['이마트', '홈플러스', '롯데마트']);
      expect(FLYER_SUPPORTED_BRANDS).toHaveLength(3);
    });
  });

  describe('isFlyerSupportedBrand', () => {
    it('전단 서비스 지원 브랜드(이마트, 홈플러스, 롯데마트)에 대해 true를 반환해야 한다', () => {
      expect(isFlyerSupportedBrand('이마트')).toBe(true);
      expect(isFlyerSupportedBrand('홈플러스')).toBe(true);
      expect(isFlyerSupportedBrand('롯데마트')).toBe(true);
    });

    it('미지원 브랜드나 임의의 문자열에 대해 false를 반환해야 한다', () => {
      expect(isFlyerSupportedBrand('GS더프레시')).toBe(false);
      expect(isFlyerSupportedBrand('노브랜드')).toBe(false);
      expect(isFlyerSupportedBrand('에브리데이')).toBe(false);
      expect(isFlyerSupportedBrand('익스프레스')).toBe(false);
      expect(isFlyerSupportedBrand('롯데슈퍼')).toBe(false);
      expect(isFlyerSupportedBrand('킴스클럽')).toBe(false);
      expect(isFlyerSupportedBrand('알수없는마트')).toBe(false);
      expect(isFlyerSupportedBrand('')).toBe(false);
    });
  });

  describe('UNSUPPORTED_MART_FLYER_MESSAGE', () => {
    it('미지원 마트 안내 메시지 상수가 정의되어 있어야 한다', () => {
      expect(UNSUPPORTED_MART_FLYER_MESSAGE).toBe('해당 마트 전단 서비스는 추후 업데이트 예정입니다 🚀');
    });
  });
});
