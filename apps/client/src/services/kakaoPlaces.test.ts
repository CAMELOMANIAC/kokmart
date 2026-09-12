import { describe, it, expect } from 'vitest';
import {
  parseMartInfo,
  detectMartBrand,
  convertKakaoPlaceToMartStore,
  searchNearbyMarts,
  searchMartsByKeyword
} from './kakaoPlaces';
import type { KakaoPlaceResult } from '../types/kakao';

describe('kakaoPlaces - 카카오 장소 서비스 파싱 및 변환 테스트', () => {
  it('parseMartInfo - 대형마트 3사 및 SSM/창고형 매장명을 정밀 파싱해야 한다', () => {
    // 1) 창고형
    const traders = parseMartInfo('이마트 트레이더스 구성점');
    expect(traders).toEqual({
      brand: '트레이더스',
      storeType: 'warehouse',
      displayName: '트레이더스 구성점',
      branchName: '구성점'
    });

    // 2) SSM
    const ssmEveryday = parseMartInfo('이마트 에브리데이 대치점');
    expect(ssmEveryday).toEqual({
      brand: '에브리데이',
      storeType: 'ssm',
      displayName: '에브리데이 대치점',
      branchName: '대치점'
    });

    const ssmExpress = parseMartInfo('홈플러스 익스프레스 역삼점');
    expect(ssmExpress).toEqual({
      brand: '익스프레스',
      storeType: 'ssm',
      displayName: '익스프레스 역삼점',
      branchName: '역삼점'
    });

    const ssmLotte = parseMartInfo('롯데슈퍼 반포점');
    expect(ssmLotte).toEqual({
      brand: '롯데슈퍼',
      storeType: 'ssm',
      displayName: '롯데슈퍼 반포점',
      branchName: '반포점'
    });

    const ssmGs = parseMartInfo('GS더프레시 개포점');
    expect(ssmGs).toEqual({
      brand: 'GS더프레시',
      storeType: 'ssm',
      displayName: 'GS더프레시 개포점',
      branchName: '개포점'
    });

    // 3) 대형마트 3사
    const emart = parseMartInfo('이마트 역삼점');
    expect(emart).toEqual({
      brand: '이마트',
      storeType: 'hypermarket',
      displayName: '이마트 역삼점',
      branchName: '역삼점'
    });

    const homeplus = parseMartInfo('홈플러스 강서점');
    expect(homeplus).toEqual({
      brand: '홈플러스',
      storeType: 'hypermarket',
      displayName: '홈플러스 강서점',
      branchName: '강서점'
    });

    const lottemart = parseMartInfo('롯데마트 잠실점');
    expect(lottemart).toEqual({
      brand: '롯데마트',
      storeType: 'hypermarket',
      displayName: '롯데마트 잠실점',
      branchName: '잠실점'
    });

    // 4) 지원되지 않는 일반 상점
    expect(parseMartInfo('파리바게뜨 강남점')).toBeNull();
  });

  it('detectMartBrand - 장소명에서 브랜드만 올바르게 추출해야 한다', () => {
    expect(detectMartBrand('이마트 서초점')).toBe('이마트');
    expect(detectMartBrand('홈플러스 익스프레스')).toBe('익스프레스');
    expect(detectMartBrand('unknown store')).toBeNull();
  });

  it('convertKakaoPlaceToMartStore - 카카오 검색 결과를 MartStore 도메인 모델로 변환해야 한다', () => {
    const rawKakaoPlace: KakaoPlaceResult = {
      id: '123456',
      place_name: '이마트 역삼점',
      category_name: '가정,생활 > 대형마트 > 이마트',
      category_group_code: 'MT1',
      category_group_name: '대형마트',
      phone: '02-380-1234',
      address_name: '서울 강남구 역삼동 755',
      road_address_name: '서울 강남구 역삼로 310',
      x: '127.0475',
      y: '37.4994',
      place_url: 'http://place.map.kakao.com/123456',
      distance: '300'
    };

    const myLocation = { lat: 37.498, lng: 127.027 };
    const store = convertKakaoPlaceToMartStore(rawKakaoPlace, myLocation);

    expect(store).not.toBeNull();
    if (store) {
      expect(store.id).toBe('kakao-123456');
      expect(store.name).toBe('이마트 역삼점');
      expect(store.brand).toBe('이마트');
      expect(store.storeType).toBe('hypermarket');
      expect(store.lat).toBe(37.4994);
      expect(store.lng).toBe(127.0475);
      expect(store.address).toBe('서울 강남구 역삼로 310');
      expect(store.phone).toBe('02-380-1234');
      expect(typeof store.distanceKm).toBe('number');
    }
  });

  it('searchNearbyMarts - 카카오 SDK 미로드 시 Fallback mock 목록을 거리순으로 반환해야 한다', async () => {
    const myLocation = { lat: 37.498, lng: 127.027 };
    const stores = await searchNearbyMarts(myLocation);

    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBeGreaterThan(0);
    expect(stores[0].distanceKm).toBeLessThanOrEqual(stores[stores.length - 1].distanceKm ?? Infinity);
  });

  it('searchMartsByKeyword - 키워드 필터링 및 Fallback을 지원해야 한다', async () => {
    const myLocation = { lat: 37.498, lng: 127.027 };
    const stores = await searchMartsByKeyword('이마트', myLocation);

    expect(Array.isArray(stores)).toBe(true);
    expect(stores.length).toBeGreaterThan(0);
    stores.forEach((s) => {
      const match = s.name.includes('이마트') || s.address.includes('이마트') || s.brand.includes('이마트');
      expect(match).toBe(true);
    });
  });
});
