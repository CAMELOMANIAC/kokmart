export type TipType = 'MART_RECOMMEND' | 'MART_BEST' | 'COUPANG_BULK' | 'COUPANG_TIP';

export interface SmartTip {
  tipType: TipType;
  badgeText: string;
  tipMessage: string;
  coupangKeyword: string | null;
}
