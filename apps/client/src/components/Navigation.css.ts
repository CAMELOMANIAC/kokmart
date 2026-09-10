import { style } from "@vanilla-extract/css";
import { vars } from "../styles/theme.css";

// 플로팅 바텀 알약 아일랜드 (Floating Bottom Pill Dock)
export const navContainer = style({
  position: "fixed",
  bottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
  left: "50%",
  transform: "translateX(-50%)",
  width: "calc(100% - 50px)",
  maxWidth: "440px",
  height: "64px",
  backgroundColor: "rgba(255, 255, 255, 0.90)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: "9999px",
  border: "1px solid rgba(255, 255, 255, 0.8)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "6px", // 상하좌우 6px 완전 동일한 여백 (Concentric Padding)
  boxShadow: "0 12px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)",
  zIndex: 100,
});

export const navItem = style({
  position: "relative",
  flex: 1,
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  fontSize: "12px",
  fontWeight: 600,
  color: vars.colors.textSub,
  padding: 0,
  border: "none",
  background: "none",
  borderRadius: "9999px",
  transition: "color 0.2s ease",
  cursor: "pointer",
  zIndex: 2,
});

export const navItemActive = style({
  color: vars.colors.primary,
  fontWeight: 700,
});

export const iconWrapper = style({
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
});

export const labelSpan = style({
  position: "relative",
  zIndex: 2,
  fontSize: "11px",
  whiteSpace: "nowrap",
  overflow: "hidden",
});

// GNB 외곽과 상하좌우 6px 정교한 동심원 알약 여백을 형성하는 액티브 인디케이터
export const activeIndicator = style({
  position: "absolute",
  inset: 0,
  backgroundColor: "rgba(255, 94, 0, 0.12)",
  borderRadius: "9999px",
  zIndex: -1,
});

export const iconInnerContainer = style({
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
});

export const tabBadge = style({
  position: "absolute",
  top: "-5px",
  right: "-9px",
  backgroundColor: vars.colors.primary,
  color: "#FFFFFF",
  fontSize: "10px",
  fontWeight: 800,
  minWidth: "15px",
  height: "15px",
  borderRadius: "9999px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "0 3px",
  boxShadow: "0 2px 6px rgba(255, 94, 0, 0.4)",
  lineHeight: "1",
  zIndex: 3,
  border: "1.5px solid #FFFFFF",
  boxSizing: "border-box",
});

