import type { MartStore, MartBrand } from '@kokmart/shared';
import {
  brandBadgeEmart,
  brandBadgeEveryday,
  brandBadgeTraders,
  brandBadgeHomeplus,
  brandBadgeExpress,
  brandBadgeLottemart,
  brandBadgeLottesuper,
  brandBadgeGsTheFresh,
  brandBadgeKimsClub,
  brandBadgeDefault,
  brandDotEmart,
  brandDotEveryday,
  brandDotTraders,
  brandDotHomeplus,
  brandDotExpress,
  brandDotLottemart,
  brandDotLottesuper,
  brandDotGsTheFresh,
  brandDotKimsClub,
  brandDotDefault,
} from './storeBadge.css';

export const ALL_FILTER_BRANDS: MartBrand[] = [
  '이마트',
  '홈플러스',
  '롯데마트',
  '에브리데이',
  '익스프레스',
  '롯데슈퍼',
  'GS더프레시',
  '킴스클럽',
  '트레이더스',
];

export const getBrandBadgeClass = (brand: MartBrand | string): string => {
  switch (brand) {
    case '이마트':
      return brandBadgeEmart;
    case '에브리데이':
      return brandBadgeEveryday;
    case '트레이더스':
      return brandBadgeTraders;
    case '홈플러스':
      return brandBadgeHomeplus;
    case '익스프레스':
      return brandBadgeExpress;
    case '롯데마트':
      return brandBadgeLottemart;
    case '롯데슈퍼':
      return brandBadgeLottesuper;
    case 'GS더프레시':
      return brandBadgeGsTheFresh;
    case '킴스클럽':
      return brandBadgeKimsClub;
    default:
      return brandBadgeDefault;
  }
};

export const getBrandDotClass = (brand: MartBrand | string): string => {
  switch (brand) {
    case '이마트':
      return brandDotEmart;
    case '에브리데이':
      return brandDotEveryday;
    case '트레이더스':
      return brandDotTraders;
    case '홈플러스':
      return brandDotHomeplus;
    case '익스프레스':
      return brandDotExpress;
    case '롯데마트':
      return brandDotLottemart;
    case '롯데슈퍼':
      return brandDotLottesuper;
    case 'GS더프레시':
      return brandDotGsTheFresh;
    case '킴스클럽':
      return brandDotKimsClub;
    default:
      return brandDotDefault;
  }
};

export const getBranchName = (store: MartStore): string => {
  let name = store.name;
  name = name.replace(/이마트\s*에브리데이|이마트에브리데이/g, '');
  name = name.replace(/홈플러스\s*익스프레스|홈플러스익스프레스/g, '');
  name = name.replace(/트레이더스\s*홀세일\s*클럽|이마트\s*트레이더스/g, '');
  name = name.replace(/롯데슈퍼|롯데프레시|롯데마켓999/g, '');
  name = name.replace(/GS더프레시|GS더프레쉬|GS수퍼마켓|GS슈퍼마켓|GS슈퍼/gi, '');
  name = name.replace(/이마트|홈플러스|롯데마트|킴스클럽|노브랜드|하나로마트/g, '');
  const trimmed = name.trim();
  return trimmed || store.name;
};
