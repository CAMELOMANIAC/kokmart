import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

// 플로팅 바텀 아일랜드 (Floating Bottom Dock)
export const navContainer = style({
  position: 'fixed',
  bottom: '16px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: 'calc(100% - 32px)',
  maxWidth: '430px',
  height: '66px',
  backgroundColor: 'rgba(255, 255, 255, 0.85)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '36px',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  padding: '0 8px',
  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.12), 0 4px 12px rgba(0, 0, 0, 0.04)',
  zIndex: 100
});

export const navItem = style({
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  fontSize: '11px',
  fontWeight: 600,
  color: vars.colors.textSub,
  padding: '8px 14px',
  borderRadius: '24px',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  cursor: 'pointer',
  zIndex: 2
});

export const navItemActive = style({
  color: vars.colors.primary,
  fontWeight: 700
});

// 활성화 탭 플로팅 배경 버블 인디케이터
export const activeIndicator = style({
  position: 'absolute',
  inset: 0,
  backgroundColor: 'rgba(255, 94, 0, 0.12)',
  borderRadius: '24px',
  zIndex: -1
});
