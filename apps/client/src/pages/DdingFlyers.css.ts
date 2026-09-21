import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const container = style({
  padding: `${vars.space.md} ${vars.space.md} calc(100px + env(safe-area-inset-bottom, 0px)) ${vars.space.md}`,
  maxWidth: '680px',
  margin: '0 auto',
});

export const noticeCard = style({
  padding: '16px 18px',
  backgroundColor: '#FFF7ED',
  borderRadius: '20px',
  border: '1px solid #FFEDD5',
  boxShadow: '0 4px 14px rgba(255, 94, 0, 0.05)',
  marginBottom: '16px',
});

export const noticeTitle = style({
  fontWeight: 700,
  color: '#C2410C',
  marginBottom: '4px',
  fontSize: '14px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

export const noticeDesc = style({
  fontSize: '13px',
  color: '#9A3412',
  lineHeight: '1.45',
});

/* 컨트롤 / 파싱 패널 */
export const controlCard = style({
  padding: '20px',
  backgroundColor: '#FFFFFF',
  borderRadius: '24px',
  border: '1px solid rgba(229, 231, 235, 0.8)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
  marginBottom: '20px',
});

export const controlTitle = style({
  margin: '0 0 14px 0',
  fontSize: '16px',
  fontWeight: 700,
  color: vars.colors.textMain,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const modelBadge = style({
  fontSize: '11px',
  fontWeight: 700,
  padding: '3px 8px',
  backgroundColor: '#F3E8FF',
  color: '#7C3AED',
  borderRadius: '8px',
});

export const brandSelectorRow = style({
  display: 'flex',
  gap: '8px',
  marginBottom: '14px',
});

export const brandChip = styleVariants({
  selectedEmart: {
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: vars.colors.brandEmart,
    color: '#000000',
    transition: 'transform 0.15s ease',
  },
  selectedHomeplus: {
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: vars.colors.brandHomeplus,
    color: '#FFFFFF',
    transition: 'transform 0.15s ease',
  },
  selectedLotte: {
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 700,
    border: 'none',
    cursor: 'pointer',
    backgroundColor: vars.colors.brandLottemart,
    color: '#FFFFFF',
    transition: 'transform 0.15s ease',
  },
  unselected: {
    padding: '8px 14px',
    borderRadius: '12px',
    fontSize: '13px',
    fontWeight: 600,
    border: '1px solid #E5E7EB',
    cursor: 'pointer',
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
    transition: 'transform 0.15s ease',
  },
});

export const inputField = style({
  width: '100%',
  padding: '12px 14px',
  borderRadius: '12px',
  border: '1px solid #D1D5DB',
  fontSize: '13px',
  boxSizing: 'border-box',
  marginBottom: '10px',
  outline: 'none',
  selectors: {
    '&:focus': {
      borderColor: vars.colors.primary,
      boxShadow: '0 0 0 2px rgba(255, 94, 0, 0.15)',
    },
  },
});

export const sampleButtonRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '14px',
});

export const sampleTextButton = style({
  background: 'none',
  border: 'none',
  fontSize: '12px',
  color: vars.colors.primary,
  fontWeight: 600,
  cursor: 'pointer',
  padding: 0,
  textDecoration: 'underline',
});

export const actionButtonGroup = style({
  display: 'flex',
  gap: '8px',
});

export const submitButton = style({
  flex: 1,
  padding: '14px',
  backgroundColor: vars.colors.secondary,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '14px',
  fontWeight: 700,
  fontSize: '14px',
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 4px 14px rgba(17, 24, 39, 0.15)',
  selectors: {
    '&:disabled': {
      backgroundColor: '#9CA3AF',
      cursor: 'not-allowed',
    },
  },
});

/* 상태 및 로딩 메시지 */
export const statusBanner = style({
  marginTop: '14px',
  padding: '12px 14px',
  borderRadius: '12px',
  fontSize: '13px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

export const statusBannerSuccess = style([
  statusBanner,
  {
    backgroundColor: '#ECFDF5',
    color: '#047857',
    border: '1px solid #A7F3D0',
  },
]);

export const statusBannerError = style([
  statusBanner,
  {
    backgroundColor: '#FEF2F2',
    color: '#B91C1C',
    border: '1px solid #FECACA',
  },
]);

export const statusBannerLoading = style([
  statusBanner,
  {
    backgroundColor: '#EFF6FF',
    color: '#1D4ED8',
    border: '1px solid #BFDBFE',
  },
]);

/* 필터 탭 */
export const filterRow = style({
  display: 'flex',
  gap: '8px',
  margin: '22px 0 14px 0',
  overflowX: 'auto',
  paddingBottom: '4px',
});

export const filterChip = styleVariants({
  active: {
    padding: '7px 14px',
    backgroundColor: vars.colors.secondary,
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  inactive: {
    padding: '7px 14px',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    border: 'none',
    borderRadius: '20px',
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
});

/* 상품 피드 리스트 */
export const productList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
});

export const productCard = style({
  padding: '18px',
  backgroundColor: '#FFFFFF',
  borderRadius: '22px',
  border: '1px solid #F3F4F6',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
});

export const cardTopRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

export const badgeGroup = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

const brandBadgeBase = style({
  fontSize: '11px',
  fontWeight: 700,
  padding: '3px 7px',
  borderRadius: '6px',
});

export const brandBadge = styleVariants({
  emart: [brandBadgeBase, { backgroundColor: vars.colors.brandEmartBg, color: vars.colors.brandEmartText }],
  homeplus: [brandBadgeBase, { backgroundColor: vars.colors.brandHomeplusBg, color: vars.colors.brandHomeplusText }],
  lotte: [brandBadgeBase, { backgroundColor: vars.colors.brandLottemartBg, color: vars.colors.brandLottemartText }],
  default: [brandBadgeBase, { backgroundColor: '#F3F4F6', color: '#4B5563' }],
});

export const pageNumberBadge = style({
  fontSize: '11px',
  color: '#6B7280',
  backgroundColor: '#F3F4F6',
  padding: '2px 6px',
  borderRadius: '6px',
  fontWeight: 600,
});

/* 4대 스마트 팁 뱃지 스타일 */
const tipBadgeBase = style({
  fontSize: '11px',
  fontWeight: 800,
  padding: '3px 8px',
  borderRadius: '8px',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
});

export const tipBadge = styleVariants({
  MART_BEST: [
    tipBadgeBase,
    {
      backgroundColor: '#FEE2E2',
      color: '#DC2626',
      border: '1px solid #FECACA',
    },
  ],
  MART_RECOMMEND: [
    tipBadgeBase,
    {
      backgroundColor: '#ECFDF5',
      color: '#059669',
      border: '1px solid #A7F3D0',
    },
  ],
  COUPANG_TIP: [
    tipBadgeBase,
    {
      backgroundColor: '#EFF6FF',
      color: '#2563EB',
      border: '1px solid #BFDBFE',
    },
  ],
  COUPANG_BULK: [
    tipBadgeBase,
    {
      backgroundColor: '#F5F3FF',
      color: '#7C3AED',
      border: '1px solid #DDD6FE',
    },
  ],
});

export const productTitleRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  gap: '10px',
});

export const productName = style({
  fontSize: '16px',
  fontWeight: 700,
  color: vars.colors.secondary,
  lineHeight: '1.35',
});

export const priceContainer = style({
  textAlign: 'right',
  whiteSpace: 'nowrap',
});

export const unitPriceText = style({
  fontSize: '12px',
  color: vars.colors.textSub,
  fontWeight: 500,
});

export const salePriceText = style({
  fontSize: '18px',
  fontWeight: 800,
  color: vars.colors.secondary,
  marginTop: '2px',
});

/* 스마트 팁 박스 */
export const smartTipBox = styleVariants({
  MART_BEST: {
    padding: '10px 12px',
    backgroundColor: '#FFF5F5',
    borderRadius: '12px',
    border: '1px solid #FED7D7',
    fontSize: '12px',
    color: '#9B1C1C',
    lineHeight: '1.45',
  },
  MART_RECOMMEND: {
    padding: '10px 12px',
    backgroundColor: '#F0FDF4',
    borderRadius: '12px',
    border: '1px solid #DCFCE7',
    fontSize: '12px',
    color: '#166534',
    lineHeight: '1.45',
  },
  COUPANG_TIP: {
    padding: '10px 12px',
    backgroundColor: '#F0F9FF',
    borderRadius: '12px',
    border: '1px solid #E0F2FE',
    fontSize: '12px',
    color: '#075985',
    lineHeight: '1.45',
  },
  COUPANG_BULK: {
    padding: '10px 12px',
    backgroundColor: '#FAF5FF',
    borderRadius: '12px',
    border: '1px solid #F3E8FF',
    fontSize: '12px',
    color: '#581C87',
    lineHeight: '1.45',
  },
});

/* 카드 하단 액션 버튼 그룹 */
export const cardActionRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingTop: '8px',
  borderTop: '1px solid #F3F4F6',
});

export const coupangSearchButton = style({
  background: 'none',
  border: 'none',
  padding: '6px 10px',
  borderRadius: '8px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#2563EB',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  backgroundColor: '#EFF6FF',
  transition: 'background-color 0.15s ease',
  selectors: {
    '&:hover': {
      backgroundColor: '#DBEAFE',
    },
  },
});

export const cartAddButton = style({
  padding: '7px 14px',
  backgroundColor: vars.colors.primary,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '10px',
  fontSize: '13px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  boxShadow: '0 2px 8px rgba(255, 94, 0, 0.25)',
  transition: 'background-color 0.15s ease',
  selectors: {
    '&:hover': {
      backgroundColor: vars.colors.primaryHover,
    },
  },
});

export const emptyState = style({
  padding: '40px 20px',
  textAlign: 'center',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  border: '1px dashed #D1D5DB',
  color: '#6B7280',
});

export const emptyTitle = style({
  fontSize: '15px',
  fontWeight: 700,
  marginBottom: '6px',
  color: vars.colors.textMain,
});

export const emptyDesc = style({
  fontSize: '13px',
  lineHeight: '1.4',
});
