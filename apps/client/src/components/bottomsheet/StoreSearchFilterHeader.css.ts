import { style, keyframes } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

const spin = keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

export const loadingSpinner = style({
  animation: `${spin} 0.8s linear infinite`,
  flexShrink: 0,
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

export const searchClearButton = style({
  border: "none",
  background: "none",
  padding: 0,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
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

export const filterPanelWrapper = style({
  overflow: "hidden",
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
