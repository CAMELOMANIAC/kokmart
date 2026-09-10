import { createGlobalTheme, globalStyle, style } from '@vanilla-extract/css';

export const vars = createGlobalTheme(':root', {
  colors: {
    primary: '#FF5E00',       // 마트콕 주황
    primaryHover: '#E05300',
    primaryBg: '#FFF7ED',     // 마트콕 연한 주황 배경 (선택/활성 상태)
    secondary: '#111827',     // 다크 차콜
    accentGreen: '#10B981',   // 최저가 뱃지
    accentBlue: '#3B82F6',    // 쿠팡 대용량 팁
    bgLight: '#F3F4F6',       // 은은한 모던 그레이
    surface: '#FFFFFF',
    textMain: '#1F2937',
    textSub: '#6B7280',
    border: '#E5E7EB',

    // 대형마트 3사 및 SSM/중형마트 공식 컬러 (CSS 변수)
    brandEmart: '#FFB800',        // 이마트 공식 옐로우
    brandEmartBg: '#FEF3C7',      // 이마트 뱃지 배경
    brandEmartText: '#B45309',    // 이마트 뱃지 텍스트

    brandEveryday: '#F97316',     // 에브리데이 오렌지
    brandEverydayBg: '#FFEDD5',   // 에브리데이 뱃지 배경
    brandEverydayText: '#C2410C', // 에브리데이 뱃지 텍스트

    brandTraders: '#00A862',      // 트레이더스 그린
    brandTradersBg: '#D1FAE5',    // 트레이더스 뱃지 배경
    brandTradersText: '#065F46',  // 트레이더스 뱃지 텍스트

    brandHomeplus: '#E60024',     // 홈플러스 공식 레드
    brandHomeplusBg: '#FEE2E2',   // 홈플러스 뱃지 배경
    brandHomeplusText: '#E60024', // 홈플러스 뱃지 텍스트

    brandExpress: '#003876',      // 익스프레스 네이비
    brandExpressBg: '#E0F2FE',    // 익스프레스 뱃지 배경
    brandExpressText: '#0369A1',  // 익스프레스 뱃지 텍스트

    brandLottemart: '#DA291C',    // 롯데마트 공식 롯데 레드 (Pantone 485C)
    brandLottemartBg: '#FFE4E6',  // 롯데마트 뱃지 배경
    brandLottemartText: '#DA291C', // 롯데마트 뱃지 텍스트

    brandLottesuper: '#059669',   // 롯데슈퍼 그린
    brandLottesuperBg: '#ECFDF5', // 롯데슈퍼 뱃지 배경
    brandLottesuperText: '#047857', // 롯데슈퍼 뱃지 텍스트

    brandGsTheFresh: '#008272',   // GS더프레시 틸/그린
    brandGsTheFreshBg: '#E6FFFA', // GS더프레시 뱃지 배경
    brandGsTheFreshText: '#008272', // GS더프레시 뱃지 텍스트

    brandKimsClub: '#6B21A8',     // 킴스클럽 퍼플
    brandKimsClubBg: '#F3E8FF',   // 킴스클럽 뱃지 배경
    brandKimsClubText: '#6B21A8', // 킴스클럽 뱃지 텍스트

    brandDefault: '#4B5563',      // 기타/일반 마트
    brandDefaultBg: '#F3F4F6',    // 기타 마트 배경
    brandDefaultText: '#374151'   // 기타 마트 텍스트
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  radii: {
    sm: '8px',
    md: '14px',
    lg: '24px',
    full: '9999px'
  }
});

globalStyle('body', {
  margin: 0,
  padding: 0,
  fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  backgroundColor: '#E5E7EB',
  color: vars.colors.textMain,
  WebkitFontSmoothing: 'antialiased',
  userSelect: 'none',
  overflowX: 'hidden'
});

export const containerStyle = style({
  maxWidth: '480px',
  margin: '0 auto',
  minHeight: '100vh',
  backgroundColor: vars.colors.bgLight,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 0 40px rgba(0, 0, 0, 0.08)',
  position: 'relative',
  paddingBottom: '100px'
});

// 지도 콕 홈 전용 (스크롤 오버플로우 100% 방지)
export const mapContainerStyle = style({
  maxWidth: '480px',
  margin: '0 auto',
  height: '100vh',
  maxHeight: '100vh',
  overflow: 'hidden',
  position: 'relative',
  paddingBottom: 0,
  boxShadow: '0 0 40px rgba(0, 0, 0, 0.08)'
});

export const mainContent = style({
  height: 'auto'
});

export const mainContentMap = style({
  height: '100%'
});
