import { style } from "@vanilla-extract/css";
import { vars } from "../../styles/theme.css";

// 브랜드 컬러 도트 (필터 칩용)
export const brandDotBase = style({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  display: "inline-block",
  flexShrink: 0,
});

export const brandDotEmart = style([brandDotBase, { backgroundColor: vars.colors.brandEmart }]);
export const brandDotEveryday = style([brandDotBase, { backgroundColor: vars.colors.brandEveryday }]);
export const brandDotTraders = style([brandDotBase, { backgroundColor: vars.colors.brandTraders }]);
export const brandDotHomeplus = style([brandDotBase, { backgroundColor: vars.colors.brandHomeplus }]);
export const brandDotExpress = style([brandDotBase, { backgroundColor: vars.colors.brandExpress }]);
export const brandDotLottemart = style([brandDotBase, { backgroundColor: vars.colors.brandLottemart }]);
export const brandDotLottesuper = style([brandDotBase, { backgroundColor: vars.colors.brandLottesuper }]);
export const brandDotGsTheFresh = style([brandDotBase, { backgroundColor: vars.colors.brandGsTheFresh }]);
export const brandDotKimsClub = style([brandDotBase, { backgroundColor: vars.colors.brandKimsClub }]);
export const brandDotDefault = style([brandDotBase, { backgroundColor: vars.colors.brandDefault }]);

// 마트 브랜드 태그 뱃지 (스토어 알약 & 카드 공용)
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
