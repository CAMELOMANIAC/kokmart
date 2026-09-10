import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

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
  alignItems: "center",
  gap: "8px",
  flexWrap: "wrap",
  padding: "8px 4px 4px 4px",
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

export const brandDotHomeplus = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandHomeplus,
  },
]);

export const brandDotLottemart = style([
  brandDotBase,
  {
    backgroundColor: vars.colors.brandLottemart,
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

export const brandBadgeHomeplus = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandHomeplusBg,
    color: vars.colors.brandHomeplusText,
  },
]);

export const brandBadgeLottemart = style([
  brandBadgeBase,
  {
    backgroundColor: vars.colors.brandLottemartBg,
    color: vars.colors.brandLottemartText,
  },
]);

// 축소 상태: 알약 2줄만 보이고 Y축 스크롤, GNB 높이(96px) 하단 여백 보장
export const pillListContainer = style({
  padding: "12px 16px 96px 16px", // GNB에 가려지지 않도록 96px 하단 패딩
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  maxHeight: "184px", // 알약 2줄 (76px) + 상단 패딩(12px) + GNB 하단 여백(96px)
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
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

export const storePillActive = style({
  borderColor: vars.colors.primary,
  backgroundColor: "#FFF7ED",
  boxShadow: "0 4px 12px rgba(255, 94, 0, 0.18)",
  transform: "translateY(-1px)",
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
  padding: "16px 20px 110px 20px",
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

export const storeCardActive = style({
  borderColor: vars.colors.primary,
  backgroundColor: "#FFFBF8",
  boxShadow: "0 6px 20px rgba(255, 94, 0, 0.12)",
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
