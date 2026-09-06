import { createGlobalTheme, globalStyle, style } from '@vanilla-extract/css';

export const vars = createGlobalTheme(':root', {
  colors: {
    primary: '#FF5E00',       // 콕마트 주황
    primaryHover: '#E05300',
    secondary: '#111827',     // 다크 차콜
    accentGreen: '#10B981',   // 최저가 뱃지
    accentBlue: '#3B82F6',    // 쿠팡 대용량 팁
    bgLight: '#F9FAFB',
    surface: '#FFFFFF',
    textMain: '#1F2937',
    textSub: '#6B7280',
    border: '#E5E7EB'
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  radii: {
    sm: '6px',
    md: '12px',
    lg: '20px',
    full: '9999px'
  }
});

globalStyle('body', {
  margin: 0,
  padding: 0,
  fontFamily: '"Pretendard", -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif',
  backgroundColor: vars.colors.bgLight,
  color: vars.colors.textMain,
  WebkitFontSmoothing: 'antialiased',
  userSelect: 'none'
});

export const containerStyle = style({
  maxWidth: '480px',
  margin: '0 auto',
  minHeight: '100vh',
  backgroundColor: vars.colors.surface,
  display: 'flex',
  flexDirection: 'column',
  boxShadow: '0 0 20px rgba(0, 0, 0, 0.05)',
  position: 'relative',
  paddingBottom: '80px'
});
