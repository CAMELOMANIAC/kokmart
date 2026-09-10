export interface KakaoLatLng {
  getLat(): number;
  getLng(): number;
}

export interface KakaoMapOptions {
  center: KakaoLatLng;
  level: number;
}

export interface KakaoMap {
  setCenter(latlng: KakaoLatLng): void;
  getCenter(): KakaoLatLng;
  panTo(latlng: KakaoLatLng): void;
  getLevel(): number;
  setLevel(level: number): void;
  relayout(): void;
}

export interface KakaoCustomOverlayOptions {
  position: KakaoLatLng;
  content: HTMLElement | string;
  yAnchor?: number;
  xAnchor?: number;
  zIndex?: number;
}

export interface KakaoCustomOverlay {
  setMap(map: KakaoMap | null): void;
  setPosition(position: KakaoLatLng): void;
}

export interface KakaoPlaceResult {
  id: string;
  place_name: string;
  category_name: string;
  category_group_code: string;
  category_group_name: string;
  phone: string;
  address_name: string;
  road_address_name: string;
  x: string; // lng
  y: string; // lat
  place_url: string;
  distance: string; // meter 단위 거리
}

export type KakaoStatus = 'OK' | 'ZERO_RESULT' | 'ERROR';

export interface KakaoPagination {
  totalCount: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  current: number;
  gotoFirst(): void;
  gotoLast(): void;
  nextPage(): void;
  prevPage(): void;
  gotoPage(page: number): void;
}

export interface KakaoPlacesCategoryOptions {
  location?: KakaoLatLng;
  radius?: number;
  x?: number;
  y?: number;
  sort?: unknown;
  useMapBounds?: boolean;
  page?: number;
  size?: number;
}

export interface KakaoPlacesKeywordOptions {
  location?: KakaoLatLng;
  radius?: number;
  x?: number;
  y?: number;
  sort?: unknown;
  useMapBounds?: boolean;
  category_group_code?: string;
  page?: number;
  size?: number;
}

export interface KakaoPlaces {
  categorySearch(
    categoryCode: string,
    callback: (result: KakaoPlaceResult[], status: KakaoStatus, pagination: KakaoPagination) => void,
    options?: KakaoPlacesCategoryOptions
  ): void;
  keywordSearch(
    keyword: string,
    callback: (result: KakaoPlaceResult[], status: KakaoStatus, pagination: KakaoPagination) => void,
    options?: KakaoPlacesKeywordOptions
  ): void;
}

export interface KakaoServices {
  Places: new () => KakaoPlaces;
  Status: {
    OK: 'OK';
    ZERO_RESULT: 'ZERO_RESULT';
    ERROR: 'ERROR';
  };
}

export interface KakaoMaps {
  LatLng: new (lat: number, lng: number) => KakaoLatLng;
  Map: new (container: HTMLElement, options: KakaoMapOptions) => KakaoMap;
  CustomOverlay: new (options: KakaoCustomOverlayOptions) => KakaoCustomOverlay;
  load(callback: () => void): void;
  services?: KakaoServices;
}

export interface KakaoNamespace {
  maps: KakaoMaps;
}

declare global {
  interface Window {
    kakao?: KakaoNamespace;
  }
}
