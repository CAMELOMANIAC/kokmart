import { style } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

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

export const storeCardActive = style({
  borderColor: vars.colors.primary,
  backgroundColor: "#FFFBF7",
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

export const cardCheckIcon = style({
  flexShrink: 0,
  color: vars.colors.primary,
});

export const emptyMessage = style({
  textAlign: "center",
  width: "100%",
  padding: "24px 0",
  color: vars.colors.textSub,
  fontSize: "13px",
});
