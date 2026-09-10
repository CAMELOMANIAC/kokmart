import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

export const ctaButton = style({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "0 16px",
  height: "40px",
  width: "auto",
  backgroundColor: vars.colors.primary,
  color: "#FFFFFF",
  borderRadius: "9999px",
  border: "none",
  boxShadow: "0 4px 16px rgba(255, 94, 0, 0.30), 0 2px 6px rgba(0, 0, 0, 0.08)",
  cursor: "pointer",
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
  gap: "7px",
});

export const ctaIcon = style({
  flexShrink: 0,
});

export const ctaTextWrapper = style({
  position: "relative",
  overflow: "hidden",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  height: "22px",
});

export const ctaAnimatedContent = style({
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "13px",
  fontWeight: 700,
  whiteSpace: "nowrap",
});

export const ctaBadgeCount = style({
  backgroundColor: "#FFFFFF",
  color: vars.colors.primary,
  fontSize: "11px",
  fontWeight: 800,
  borderRadius: "9999px",
  padding: "1px 7px",
  lineHeight: "16px",
});
