import { SmartTip } from './tip.js';

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

export interface FlyerParsingResponse {
  success: boolean;
  gridCount: number;
  products: ParsedProduct[];
  parsedAt: string;
}
