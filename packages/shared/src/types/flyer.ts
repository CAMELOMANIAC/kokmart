import { SmartTip } from './tip.js';

export type TipProcessingStatus = 'pending' | 'processing' | 'complete' | 'retry' | 'failed';
export type TipSource = 'fallback' | 'groq_grounded';

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
  pageIndex?: number;
  productName: string;
  salePrice: number;
  effectiveUnitPrice: number;
  unitMeasure: string;
  isPerishable: boolean;
  martName?: '이마트' | '홈플러스' | '롯데마트' | string;
  smartTip?: SmartTip;
  tipStatus?: TipProcessingStatus;
  tipSource?: TipSource;
  boundingBox?: BoundingBox;
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

export interface FlyerRecord {
  id: string;
  martName: string;
  branchName: string;
  isMaster: boolean;
  title: string;
  validStartDate?: string;
  validEndDate?: string;
  imageUrls: string[];
  pageCount: number;
  createdAt: string;
  updatedAt?: string;
}

export interface FlyerDetailResponse {
  success: boolean;
  isCached?: boolean;
  martName: string;
  branchName?: string;
  flyer?: FlyerRecord;
  imageUrls?: string[];
  totalPages: number;
  totalProducts: number;
  products: ParsedProduct[];
  tipProcessing?: boolean;
  parsedAt: string;
  error?: string;
}
