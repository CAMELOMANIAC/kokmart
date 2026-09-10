import { style } from "@vanilla-extract/css";

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
  boxShadow: "0 -10px 40px rgba(0, 0, 0, 0.12)",
  zIndex: 60,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
  userSelect: "none",
  touchAction: "none",
});

export const dragHandleArea = style({
  width: "100%",
  padding: "12px 0 8px 0",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  cursor: "grab",
  touchAction: "none",
  ":active": {
    cursor: "grabbing",
  },
});

export const dragHandleBar = style({
  width: "44px",
  height: "5px",
  backgroundColor: "#CBD5E1",
  borderRadius: "9999px",
});

export const pillViewWrapper = style({
  display: "flex",
  flexDirection: "column",
  width: "100%",
  paddingBottom: "env(safe-area-inset-bottom, 0px)",
});

// 축소 상태 바텀시트 내부 인라인 CTA 래퍼 (가운데 정렬, 알약과의 적정 여백 확보)
export const collapsedCtaWrapper = style({
  display: "flex",
  justifyContent: "center",
  padding: "6px 16px 0 16px",
  width: "100%",
  boxSizing: "border-box",
});

// 전체화면 확장 상태 하단 고정 CTA 래퍼 (GNB 바로 윗선에 고정)
export const fullscreenCtaWrapper = style({
  position: "fixed",
  bottom: "calc(92px + env(safe-area-inset-bottom, 0px))",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 90,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  boxSizing: "border-box",
  pointerEvents: "auto",
});
