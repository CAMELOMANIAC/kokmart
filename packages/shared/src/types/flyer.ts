import { SmartTip } from './tip.js';

export type TipProcessingStatus = 'pending' | 'processing' | 'complete' | 'retry' | 'failed';
export type TipSource = 'fallback' | 'groq_grounded' | 'gemini_grounded' | 'gemini_advice' | 'gemini_vision';
export type TipProcessor = 'groq_realtime' | 'gemini_batch';

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
  /** 전단에 표시된 포장 규격 원문(예: 1280g, 500ml×2, 8입) */
  packageSpec?: string;
  salePrice: number;
  /** 100g, 100ml 또는 1개 기준 환산가. 환산 불가 시 0이며 DB에는 NULL로 저장합니다. */
  effectiveUnitPrice: number;
  /** 환산단가의 기준. 100g, 100ml, 1개 또는 빈 문자열만 사용합니다. */
  unitMeasure: string;
  isPerishable: boolean;
  martName?: '이마트' | '홈플러스' | '롯데마트' | string;
  smartTip?: SmartTip;
  tipStatus?: TipProcessingStatus;
  tipSource?: TipSource;
  tipProcessor?: TipProcessor;
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
