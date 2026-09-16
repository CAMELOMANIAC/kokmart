import { SmartTip } from './tip.js';

export interface BoundingBox {
  id: string;
  ymin: number; // 0 ~ 1000 정규화 좌표
  xmin: number;
  ymax: number;
  xmax: number;
  labelHint?: string;
}

export interface FlyerSourceInfo {
  martId: string;
  martName: '이마트' | '홈플러스' | '롯데마트' | string;
  branchName?: string;
  flyerTitle: string;
  validPeriod: {
    startDate: string;
    endDate: string;
  };
  imageUrls: string[];
  sourceUrl?: string;
  fetchedAt: string;
}

export interface ParsedProduct {
  id?: string;
  productName: string;
  salePrice: number;
  effectiveUnitPrice: number;
  unitMeasure: string;
  isPerishable: boolean;
  martName?: '이마트' | '홈플러스' | '롯데마트';
  smartTip: SmartTip;
}

export interface DetectBoxesResponse {
  success: boolean;
  martName?: string;
  totalBoxes: number;
  boxes: BoundingBox[];
  message?: string;
}

export interface ParseCroppedProductResponse {
  success: boolean;
  product: ParsedProduct;
  message?: string;
}

export interface FlyerParsingResponse {
  success: boolean;
  gridCount: number;
  products: ParsedProduct[];
  parsedAt: string;
}
