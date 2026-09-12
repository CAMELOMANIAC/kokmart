import { describe, it, expect, vi } from 'vitest';

vi.mock('./storeBadge.css', () => ({
  brandBadgeEmart: 'badge-emart',
  brandBadgeEveryday: 'badge-everyday',
  brandBadgeTraders: 'badge-traders',
  brandBadgeHomeplus: 'badge-homeplus',
  brandBadgeExpress: 'badge-express',
  brandBadgeLottemart: 'badge-lottemart',
  brandBadgeLottesuper: 'badge-lottesuper',
  brandBadgeGsTheFresh: 'badge-gsthefresh',
  brandBadgeKimsClub: 'badge-kimsclub',
  brandBadgeDefault: 'badge-default',
  brandDotEmart: 'dot-emart',
  brandDotEveryday: 'dot-everyday',
  brandDotTraders: 'dot-traders',
  brandDotHomeplus: 'dot-homeplus',
  brandDotExpress: 'dot-express',
  brandDotLottemart: 'dot-lottemart',
  brandDotLottesuper: 'dot-lottesuper',
  brandDotGsTheFresh: 'dot-gsthefresh',
  brandDotKimsClub: 'dot-kimsclub',
  brandDotDefault: 'dot-default',
}));

import {
  ALL_FILTER_BRANDS,
  getBrandBadgeClass,
  getBrandDotClass,
  getBranchName
} from './storeBadgeUtils';
import type { MartStore } from '@kokmart/shared';

describe('storeBadgeUtils - Brand Badges & Branch Name Formatters', () => {
  it('ALL_FILTER_BRANDS에 주요 브랜드가 포함되어 있어야 한다', () => {
    expect(ALL_FILTER_BRANDS).toContain('이마트');
    expect(ALL_FILTER_BRANDS).toContain('홈플러스');
    expect(ALL_FILTER_BRANDS).toContain('롯데마트');
    expect(ALL_FILTER_BRANDS).toContain('GS더프레시');
  });

  it('getBrandBadgeClass - 브랜드별 적절한 CSS 클래스명을 반환해야 한다', () => {
    expect(getBrandBadgeClass('이마트')).toBe('badge-emart');
    expect(getBrandBadgeClass('홈플러스')).toBe('badge-homeplus');
    expect(getBrandBadgeClass('롯데마트')).toBe('badge-lottemart');
    expect(getBrandBadgeClass('에브리데이')).toBe('badge-everyday');
    expect(getBrandBadgeClass('익스프레스')).toBe('badge-express');
    expect(getBrandBadgeClass('롯데슈퍼')).toBe('badge-lottesuper');
    expect(getBrandBadgeClass('GS더프레시')).toBe('badge-gsthefresh');
    expect(getBrandBadgeClass('킴스클럽')).toBe('badge-kimsclub');
    expect(getBrandBadgeClass('트레이더스')).toBe('badge-traders');
    expect(getBrandBadgeClass('알수없는브랜드')).toBe('badge-default');
  });

  it('getBrandDotClass - 브랜드별 적절한 점(Dot) CSS 클래스명을 반환해야 한다', () => {
    expect(getBrandDotClass('이마트')).toBe('dot-emart');
    expect(getBrandDotClass('홈플러스')).toBe('dot-homeplus');
    expect(getBrandDotClass('롯데마트')).toBe('dot-lottemart');
    expect(getBrandDotClass('기타')).toBe('dot-default');
  });

  it('getBranchName - 브랜드명을 제거하고 지점명만 정밀 정제해야 한다', () => {
    const createStore = (name: string): MartStore => ({
      id: 'test-1',
      name,
      brand: '이마트',
      lat: 37.5,
      lng: 127.0,
      address: '서울시',
      phone: '02-0000-0000',
      businessHours: '10:00~22:00',
      isHolidayToday: false,
      activeDealCount: 10
    });

    expect(getBranchName(createStore('이마트 역삼점'))).toBe('역삼점');
    expect(getBranchName(createStore('이마트 에브리데이 대치점'))).toBe('대치점');
    expect(getBranchName(createStore('홈플러스 익스프레스 서초점'))).toBe('서초점');
    expect(getBranchName(createStore('GS더프레시 개포점'))).toBe('개포점');
    expect(getBranchName(createStore('트레이더스 홀세일 클럽 구성점'))).toBe('구성점');
    expect(getBranchName(createStore('롯데슈퍼 송파점'))).toBe('송파점');
  });

  it('getBranchName - 브랜드명 제거 후 빈 문자열이 될 경우 원래 이름을 유지해야 한다', () => {
    const store: MartStore = {
      id: 'test-2',
      name: '이마트',
      brand: '이마트',
      lat: 37.5,
      lng: 127.0,
      address: '서울시',
      phone: '02-0000-0000',
      businessHours: '10:00~22:00',
      isHolidayToday: false,
      activeDealCount: 10
    };

    expect(getBranchName(store)).toBe('이마트');
  });
});
