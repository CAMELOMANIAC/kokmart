import { style } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

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
  maxHeight: "92px",
  overflowY: "auto",
  WebkitOverflowScrolling: "touch",
  boxSizing: "border-box",
  scrollbarWidth: "none",
  "::-webkit-scrollbar": {
    display: "none",
  },
});

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
  transform: "translateY(-1px)",
  borderColor: vars.colors.primary,
  backgroundColor: vars.colors.primaryBg,
  boxShadow: "0 4px 12px rgba(255, 94, 0, 0.18)",
});

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
