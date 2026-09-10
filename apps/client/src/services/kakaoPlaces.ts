import { MartBrand, MartStore, calculateDistanceKm, mockMartStores } from '@kokmart/shared';
import type { KakaoPlaceResult } from '../types/kakao';

/**
 * 장소명에서 대형마트 3사 브랜드를 식별합니다.
 */
export function detectMartBrand(placeName: string): MartBrand | null {
  if (placeName.includes('이마트') || placeName.includes('트레이더스')) return '이마트';
  if (placeName.includes('홈플러스')) return '홈플러스';
  if (placeName.includes('롯데마트') || placeName.includes('롯데슈퍼')) return '롯데마트';
  return null;
}

/**
 * 카카오 장소 검색 결과를 Kokmart의 MartStore 도메인 모델로 변환합니다.
 */
export function convertKakaoPlaceToMartStore(
  place: KakaoPlaceResult,
  myLocation?: { lat: number; lng: number }
): MartStore | null {
  const brand = detectMartBrand(place.place_name);
  if (!brand) return null; // 3대 마트 필터링

  const lat = parseFloat(place.y);
  const lng = parseFloat(place.x);

  let distanceKm: number | undefined = undefined;
  if (myLocation) {
    distanceKm = calculateDistanceKm(myLocation.lat, myLocation.lng, lat, lng);
  } else if (place.distance) {
    distanceKm = Math.round(parseFloat(place.distance) / 100) / 10;
  }

  return {
    id: `kakao-${place.id}`,
    name: place.place_name,
    brand,
    lat,
    lng,
    address: place.road_address_name || place.address_name,
    phone: place.phone || '전화번호 미등록',
    businessHours: '10:00 ~ 23:00',
    isHolidayToday: false,
    activeDealCount: 15, // 마트별 특가 정보는 향후 백엔드 연결
    distanceKm
  };
}

/**
 * 내 위치 중심 반경 내 대형마트(카테고리 MT1) 목록을 검색합니다.
 */
export async function searchNearbyMarts(
  center: { lat: number; lng: number },
  radiusMeters: number = 6000
): Promise<MartStore[]> {
  const kakao = typeof window !== 'undefined' ? window.kakao : undefined;

  if (!kakao?.maps?.services?.Places) {
    // SDK 또는 Services 라이브러리 미지원 시 Mock 데이터 폴백
    return mockMartStores
      .map((store) => ({
        ...store,
        distanceKm: calculateDistanceKm(center.lat, center.lng, store.lat, store.lng)
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  const places = new kakao.maps.services.Places();
  const kakaoMaps = kakao.maps;

  return new Promise((resolve) => {
    places.categorySearch(
      'MT1', // 대형마트 카테고리 코드
      (data, status) => {
        if (status === 'OK' && data && data.length > 0) {
          const marts = data
            .map((item) => convertKakaoPlaceToMartStore(item, center))
            .filter((store): store is MartStore => store !== null)
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

          if (marts.length > 0) {
            resolve(marts);
            return;
          }
        }

        // 결과 없거나 에러 시 fallback 데이터 사용
        resolve(
          mockMartStores
            .map((store) => ({
              ...store,
              distanceKm: calculateDistanceKm(center.lat, center.lng, store.lat, store.lng)
            }))
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0))
        );
      },
      {
        location: new kakaoMaps.LatLng(center.lat, center.lng),
        radius: radiusMeters,
        size: 15
      }
    );
  });
}

/**
 * 키워드로 마트를 검색합니다 (예: '이마트', '서초동 마트', '홈플러스').
 */
export async function searchMartsByKeyword(
  keyword: string,
  center: { lat: number; lng: number }
): Promise<MartStore[]> {
  if (!keyword.trim()) {
    return searchNearbyMarts(center);
  }

  const kakao = typeof window !== 'undefined' ? window.kakao : undefined;

  if (!kakao?.maps?.services?.Places) {
    const q = keyword.toLowerCase();
    return mockMartStores
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.brand.includes(q)
      )
      .map((store) => ({
        ...store,
        distanceKm: calculateDistanceKm(center.lat, center.lng, store.lat, store.lng)
      }))
      .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
  }

  const places = new kakao.maps.services.Places();
  const kakaoMaps = kakao.maps;

  return new Promise((resolve) => {
    places.keywordSearch(
      keyword,
      (data, status) => {
        if (status === 'OK' && data && data.length > 0) {
          const marts = data
            .map((item) => convertKakaoPlaceToMartStore(item, center))
            .filter((store): store is MartStore => store !== null)
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

          if (marts.length > 0) {
            resolve(marts);
            return;
          }

          // 3사 브랜드가 직접 매칭되지 않아도 대형마트 카테고리면 포함
          const genericMarts = data
            .filter((item) => item.category_group_code === 'MT1' || item.place_name.includes('마트'))
            .map((item) => {
              const brand = detectMartBrand(item.place_name) ?? '이마트';
              const lat = parseFloat(item.y);
              const lng = parseFloat(item.x);
              return {
                id: `kakao-${item.id}`,
                name: item.place_name,
                brand,
                lat,
                lng,
                address: item.road_address_name || item.address_name,
                phone: item.phone || '전화번호 미등록',
                businessHours: '10:00 ~ 23:00',
                isHolidayToday: false,
                activeDealCount: 10,
                distanceKm: calculateDistanceKm(center.lat, center.lng, lat, lng)
              };
            })
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));

          resolve(genericMarts);
        } else {
          // 키워드 결과 없을 때 mock 데이터 필터
          const q = keyword.toLowerCase();
          const filtered = mockMartStores
            .filter(
              (s) =>
                s.name.toLowerCase().includes(q) ||
                s.address.toLowerCase().includes(q) ||
                s.brand.includes(q)
            )
            .map((store) => ({
              ...store,
              distanceKm: calculateDistanceKm(center.lat, center.lng, store.lat, store.lng)
            }))
            .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
          resolve(filtered);
        }
      },
      {
        location: new kakaoMaps.LatLng(center.lat, center.lng),
        radius: 15000,
        size: 15
      }
    );
  });
}
