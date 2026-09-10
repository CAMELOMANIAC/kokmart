import { MartBrand, MartCategoryType, MartStore, calculateDistanceKm, mockMartStores } from '@kokmart/shared';
import type { KakaoPlaceResult } from '../types/kakao';

export interface DetectedMartInfo {
  brand: MartBrand;
  storeType: MartCategoryType;
  displayName: string;
  branchName: string;
}

/**
 * 장소명에서 브랜드, 매장 유형(대형마트 vs SSM 등), 축약 표시명을 정밀 파싱합니다.
 */
export function parseMartInfo(placeName: string): DetectedMartInfo | null {
  // 1. 특정 브랜드 및 SSM/창고형 매장을 우선 검사 (순서 중요)
  if (/(이마트\s*트레이더스|트레이더스\s*홀세일\s*클럽|트레이더스)/.test(placeName)) {
    const branchName = placeName.replace(/이마트\s*트레이더스|트레이더스\s*홀세일\s*클럽|트레이더스/g, '').trim();
    return {
      brand: '트레이더스',
      storeType: 'warehouse',
      displayName: branchName ? `트레이더스 ${branchName}` : '트레이더스',
      branchName
    };
  }

  if (/(이마트\s*에브리데이|이마트에브리데이|에브리데이)/.test(placeName)) {
    const branchName = placeName.replace(/이마트\s*에브리데이|이마트에브리데이|에브리데이/g, '').trim();
    return {
      brand: '에브리데이',
      storeType: 'ssm',
      displayName: branchName ? `에브리데이 ${branchName}` : '에브리데이',
      branchName
    };
  }

  if (/(홈플러스\s*익스프레스|홈플러스익스프레스|익스프레스)/.test(placeName)) {
    const branchName = placeName.replace(/홈플러스\s*익스프레스|홈플러스익스프레스|익스프레스/g, '').trim();
    return {
      brand: '익스프레스',
      storeType: 'ssm',
      displayName: branchName ? `익스프레스 ${branchName}` : '익스프레스',
      branchName
    };
  }

  if (/(롯데슈퍼|롯데프레시|롯데마켓999)/.test(placeName)) {
    const branchName = placeName.replace(/롯데슈퍼|롯데프레시|롯데마켓999/g, '').trim();
    return {
      brand: '롯데슈퍼',
      storeType: 'ssm',
      displayName: branchName ? `롯데슈퍼 ${branchName}` : '롯데슈퍼',
      branchName
    };
  }

  if (/(GS더프레시|GS더프레쉬|GS수퍼마켓|GS슈퍼마켓|GS슈퍼)/i.test(placeName)) {
    const branchName = placeName.replace(/GS더프레시|GS더프레쉬|GS수퍼마켓|GS슈퍼마켓|GS슈퍼/gi, '').trim();
    return {
      brand: 'GS더프레시',
      storeType: 'ssm',
      displayName: branchName ? `GS더프레시 ${branchName}` : 'GS더프레시',
      branchName
    };
  }

  if (/킴스클럽/.test(placeName)) {
    const branchName = placeName.replace(/킴스클럽/g, '').trim();
    return {
      brand: '킴스클럽',
      storeType: 'ssm',
      displayName: branchName ? `킴스클럽 ${branchName}` : '킴스클럽',
      branchName
    };
  }

  if (/노브랜드/.test(placeName)) {
    const branchName = placeName.replace(/노브랜드/g, '').trim();
    return {
      brand: '노브랜드',
      storeType: 'ssm',
      displayName: branchName ? `노브랜드 ${branchName}` : '노브랜드',
      branchName
    };
  }

  if (/(농협하나로마트|하나로마트|하나로클럽)/.test(placeName)) {
    const branchName = placeName.replace(/농협하나로마트|하나로마트|하나로클럽/g, '').trim();
    return {
      brand: '하나로마트',
      storeType: 'hypermarket',
      displayName: branchName ? `하나로마트 ${branchName}` : '하나로마트',
      branchName
    };
  }

  // 2. 대형마트 3사 순수 브랜드 검사
  if (/이마트/.test(placeName)) {
    const branchName = placeName.replace(/이마트/g, '').trim();
    return {
      brand: '이마트',
      storeType: 'hypermarket',
      displayName: branchName ? `이마트 ${branchName}` : '이마트',
      branchName
    };
  }

  if (/홈플러스/.test(placeName)) {
    const branchName = placeName.replace(/홈플러스/g, '').trim();
    return {
      brand: '홈플러스',
      storeType: 'hypermarket',
      displayName: branchName ? `홈플러스 ${branchName}` : '홈플러스',
      branchName
    };
  }

  if (/롯데마트/.test(placeName)) {
    const branchName = placeName.replace(/롯데마트/g, '').trim();
    return {
      brand: '롯데마트',
      storeType: 'hypermarket',
      displayName: branchName ? `롯데마트 ${branchName}` : '롯데마트',
      branchName
    };
  }

  return null;
}

/**
 * 장소명에서 마트 브랜드를 식별합니다.
 */
export function detectMartBrand(placeName: string): MartBrand | null {
  return parseMartInfo(placeName)?.brand ?? null;
}

/**
 * 카카오 장소 검색 결과를 Kokmart의 MartStore 도메인 모델로 변환합니다.
 */
export function convertKakaoPlaceToMartStore(
  place: KakaoPlaceResult,
  myLocation?: { lat: number; lng: number }
): MartStore | null {
  const info = parseMartInfo(place.place_name);
  if (!info && place.category_group_code !== 'MT1' && !place.place_name.includes('마트')) {
    return null;
  }

  const brand: MartBrand = info?.brand ?? '기타마트';
  const storeType: MartCategoryType = info?.storeType ?? 'ssm';
  const displayName = info?.displayName ?? place.place_name;

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
    displayName,
    brand,
    storeType,
    lat,
    lng,
    address: place.road_address_name || place.address_name,
    phone: place.phone || '전화번호 미등록',
    businessHours: '10:00 ~ 23:00',
    isHolidayToday: false,
    activeDealCount: 15,
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
              const info = parseMartInfo(item.place_name);
              const brand: MartBrand = info?.brand ?? '기타마트';
              const storeType: MartCategoryType = info?.storeType ?? 'ssm';
              const lat = parseFloat(item.y);
              const lng = parseFloat(item.x);
              return {
                id: `kakao-${item.id}`,
                name: item.place_name,
                displayName: info?.displayName ?? item.place_name,
                brand,
                storeType,
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
