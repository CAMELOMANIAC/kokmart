import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

export const loadingSpinner = style({
  animation: `${spin} 0.8s linear infinite`,
  flexShrink: 0,
});

export const sheetContainer = style({
  position: "fixed",
  bottom: 0,
  left: 0,
  right: 0,
  margin: "0 auto",
  width: "100%",
  maxWidth: "480px",
  height: "100vh",
  backgroundColor: "rgba(255, 255, 255, 0.96)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderTopLeftRadius: "28px",
  borderTopRightRadius: "28px",
  borderTop: "1px solid rgba(255, 255, 255, 0.8)",
  boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.12)",
  zIndex: 80,
  display: "flex",
  flexDirection: "column",
  touchAction: "none",
});

export const dragHandleArea = style({
  width: "100%",
  padding: "12px 0 8px 0",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  cursor: "grab",
  userSelect: "none",
});

export const dragHandleBar = style({
  width: "44px",
  height: "5px",
  backgroundColor: "#CBD5E1",
  borderRadius: "9999px",
});

export const sheetHeader = style({
  padding: "0 16px 10px 16px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  borderBottom: "1px solid #F3F4F6",
});

export const headerTopRow = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  width: "100%",
});

export const searchBarWrapper = style({
  flex: 1,
  display: "flex",
  alignItems: "center",
  gap: "10px",
  backgroundColor: "#F3F4F6",
  borderRadius: "9999px",
  padding: "10px 16px",
  border: "1px solid transparent",
  transition: "all 0.2s ease",
  ":focus-within": {
    backgroundColor: "#FFFFFF",
    borderColor: vars.colors.primary,
    boxShadow: "0 4px 16px rgba(255, 94, 0, 0.12)",
  },
});

export const searchInput = style({
  flex: 1,
  border: "none",
  background: "none",
  fontSize: "14px",
  fontWeight: 600,
  color: vars.colors.textMain,
  outline: "none",
  "::placeholder": {
    color: "#9CA3AF",
    fontWeight: 500,
  },
});

export const filterButton = style({
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  border: "1px solid #E5E7EB",
  backgroundColor: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  transition: "all 0.2s ease",
  flexShrink: 0,
});

export const filterButtonActive = style({
  backgroundColor: "#FF5E00",
  borderColor: "#FF5E00",
  color: "#FFFFFF",
  boxShadow: "0 4px 12px rgba(255, 94, 0, 0.25)",
});

export const filterPanel = style({
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  padding: "8px 4px 4px 4px",
});

export const filterCategoryRow = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  flexWrap: "wrap",
});

export const filterBrandRowScrollable = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
  overflowX: "auto",
  width: "100%",
  padding: "2px 2px 6px 2px",
  scrollbarWidth: "none",
  "::-webkit-scrollbar": {
    display: "none",
  },
  WebkitOverflowScrolling: "touch",
});

export const filterChip = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 12px",
  borderRadius: "9999px",
  border: "1px solid #E5E7EB",
  backgroundColor: "#FFFFFF",
  fontSize: "12px",
  fontWeight: 600,
  color: vars.colors.textSub,
  cursor: "pointer",
  transition: "all 0.2s ease",
  userSelect: "none",
  flexShrink: 0,
});

export const filterChipActive = style({
  backgroundColor: "#111827",
  color: "#FFFFFF",
  borderColor: "#111827",
});

export const filterChipBrandActive = style({
  backgroundColor: "#FFF7ED",
  color: "#EA580C",
  borderColor: "#FDBA74",
});

export const brandDotBase = style({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  display: "inline-block",
  flexShrink: 0,
});

export const brandDotEmart = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandEmart,
  },
]);

export const brandDotEveryday = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandEveryday,
  },
]);

export const brandDotTraders = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandTraders,
  },
]);

export const brandDotHomeplus = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandHomeplus,
  },
]);

export const brandDotExpress = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandExpress,
  },
]);

export const brandDotLottemart = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandLottemart,
  },
]);

export const brandDotLottesuper = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandLottesuper,
  },
]);

export const brandDotGsTheFresh = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandGsTheFresh,
  },
]);

export const brandDotKimsClub = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandKimsClub,
  },
]);

export const brandDotDefault = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandDefault,
  },
]);

// 마트 브랜드 태그 뱃지 (스토어 필 & 카드 공용)
export const brandBadgeBase = style({
  padding: "2px 6px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 800,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  letterSpacing: "-0.2px",
  flexShrink: 0,
});

export const brandBadgeEmart = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandEmartBg,
    color: vars.colors.brandEmartText,
  },
]);

export const brandBadgeEveryday = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandEverydayBg,
    color: vars.colors.brandEverydayText,
  },
]);

export const brandBadgeTraders = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandTradersBg,
    color: vars.colors.brandTradersText,
  },
]);

export const brandBadgeHomeplus = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandHomeplusBg,
    color: vars.colors.brandHomeplusText,
  },
]);

export const brandBadgeExpress = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandExpressBg,
    color: vars.colors.brandExpressText,
  },
]);

export const brandBadgeLottemart = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandLottemartBg,
    color: vars.colors.brandLottemartText,
  },
]);

export const brandBadgeLottesuper = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandLottesuperBg,
    color: vars.colors.brandLottesuperText,
  },
]);

export const brandBadgeGsTheFresh = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandGsTheFreshBg,
    color: vars.colors.brandGsTheFreshText,
  },
]);

export const brandBadgeKimsClub = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandKimsClubBg,
    color: vars.colors.brandKimsClubText,
  },
]);

export const brandBadgeDefault = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandDefaultBg,
    color: vars.colors.brandDefaultText,
  },
]);

export const pillViewWrapper = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
});

// 축소 상태: 알약 2줄만 보이고 쾌적하게 Y축 스크롤 (두 번째 줄 알약 잘림 방지 92px)
export const pillListContainer = style({
  padding: "8px 16px 6px 16px",
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  maxHeight: "92px", // 알약 2줄(각 34px + gap 8px + 상하여백 14px = 90px) 완벽 노출
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  boxSizing: "border-box",
  scrollbarWidth: "none",
  "::-webkit-scrollbar": {
    display: "none",
  },
});

// 축소 상태 바텀시트 내부 인라인 CTA 래퍼 (가운데 정렬, 알약과의 적정 여백 확보)
export const collapsedCtaWrapper = style({
  display: "flex",
  justifyContent: "center",
  padding: "12px 16px 0 16px",
  width: "100%",
  boxSizing: "border-box",
});

// 축소 상태: 알약 칩
export const storePill = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  padding: "7px 12px",
  height: "34px",
  borderRadius: "9999px",
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.04)",
  cursor: "pointer",
  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
  boxSizing: "border-box",
});

// 통일된 알약 활성(선택) 스타일 - 마트콕 프라이머리 주황
export const storePillActive = style({
  transform: "translateY(-1px)",
  borderColor: vars.colors.primary,
  backgroundColor: vars.colors.primaryBg,
  boxShadow: "0 4px 12px rgba(255, 94, 0, 0.18)",
});

// 알약 칩 및 카드 내부 체크 아이콘 컬러 - 프라이머리 주황
export const storePillCheck = style({
  flexShrink: 0,
  color: vars.colors.primary,
});

export const storePillName = style({
  fontSize: "13px",
  fontWeight: 700,
  color: vars.colors.textMain,
});

export const storePillDistance = style({
  fontSize: "12px",
  fontWeight: 700,
  color: vars.colors.primary,
});

export const emptyMessage = style({
  textAlign: "center",
  width: "100%",
  padding: "24px 0",
  color: vars.colors.textSub,
  fontSize: "13px",
});

// 확장 상태: 상세 카드 리스트 컨테이너
export const cardListContainer = style({
  padding: "16px 20px 140px 20px",
  overflowY: "auto",
  flex: 1,
  WebkitOverflowScrolling: "touch",
});

export const storeCard = style({
  backgroundColor: "#FFFFFF",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "12px",
  border: "1px solid #F3F4F6",
  boxShadow: "0 4px 16px rgba(0, 0, 0, 0.03)",
  transition: "all 0.2s ease",
  cursor: "pointer",
});

// 통일된 카드 활성(선택) 스타일 - 마트콕 프라이머리 주황
export const storeCardActive = style({
  borderColor: vars.colors.primary,
  backgroundColor: '#FFFBF7',
  boxShadow: '0 6px 20px rgba(255, 94, 0, 0.12)',
});

export const cardHeader = style({
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
});

export const cardTitleRow = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const cardTitle = style({
  margin: 0,
  fontSize: "16px",
  fontWeight: 800,
  color: vars.colors.textMain,
});

export const cardDistanceRow = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
});

export const cardDistance = style({
  fontSize: "13px",
  fontWeight: 800,
  color: vars.colors.primary,
});

export const cardInfoSection = style({
  marginTop: "10px",
  display: "flex",
  flexDirection: "column",
  gap: "4px",
  fontSize: "12px",
  color: vars.colors.textSub,
});

export const cardInfoRow = style({
  display: "flex",
  alignItems: "center",
  gap: "6px",
});

export const cardFooter = style({
  marginTop: "12px",
  paddingTop: "10px",
  borderTop: `1px solid ${vars.colors.bgLight}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
});

export const cardDealBadge = style({
  display: "flex",
  alignItems: "center",
  gap: "4px",
  fontSize: "12px",
  fontWeight: 700,
  color: vars.colors.accentGreen,
});

export const cardDealButton = style({
  border: "none",
  backgroundColor: vars.colors.secondary,
  color: "#FFFFFF",
  padding: "6px 12px",
  borderRadius: "12px",
  fontSize: "12px",
  fontWeight: 700,
  display: "flex",
  alignItems: "center",
  gap: "4px",
  cursor: "pointer",
});

export const searchClearButton = style({
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
});

export const filterPanelWrapper = style({
  overflow: "hidden",
});

// 전체화면 확장 상태 하단 고정 CTA 래퍼 (GNB 바로 윗선에 고정)
export const fullscreenCtaWrapper = style({
  position: "fixed",
  bottom: "76px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  pointerEvents: "auto",
});

export const ctaButton = style({
  width: "auto",
  maxWidth: "calc(100% - 16px)",
  height: "40px",
  backgroundColor: vars.colors.primary,
  color: "#FFFFFF",
  borderRadius: "9999px",
  border: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "0 16px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 4px 16px rgba(255, 94, 0, 0.30), 0 2px 6px rgba(0, 0, 0, 0.08)",
  transition: "all 0.15s ease",
  userSelect: "none",
  boxSizing: "border-box",
  ":hover": {
    backgroundColor: vars.colors.primaryHover,
  },
  ":active": {
    transform: "scale(0.98)",
    backgroundColor: vars.colors.primaryHover,
  },
});

export const ctaContentLeft = style({
  display: "flex",
  alignItems: "center",
  gap: "8px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
});

export const ctaBadgeCount = style({
  backgroundColor: "#FFFFFF",
  color: vars.colors.primary,
  fontSize: "11px",
  fontWeight: 800,
  borderRadius: "9999px",
  padding: "1px 7px",
  marginLeft: "4px",
  lineHeight: "16px",
});
