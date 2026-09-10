export type MartCategoryType = 'hypermarket' | 'ssm' | 'warehouse';

export type MartBrand =
  | '이마트'
  | '홈플러스'
  | '롯데마트'
  | '에브리데이'
  | '익스프레스'
  | '롯데슈퍼'
  | '트레이더스'
  | 'GS더프레시'
  | '킴스클럽'
  | '노브랜드'
  | '하나로마트'
  | '기타마트';

export interface MartStore {
  id: string;
  name: string;
  brand: MartBrand;
  storeType?: MartCategoryType;
  displayName?: string;
  lat: number;
  lng: number;
  address: string;
  phone: string;
  businessHours: string;
  isHolidayToday: boolean;
  activeDealCount: number;
  distanceKm?: number;
}

/**
 * 하버사인 공식을 이용한 두 좌표 간 직선 거리(km) 계산
 */
export function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // 지구 반지름 (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}
