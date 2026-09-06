import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const pageWrapper = style({
  position: 'relative',
  width: '100%',
  height: '100vh',
  maxHeight: '100vh',
  overflow: 'hidden'
});

export const floatingTopBar = style({
  position: 'absolute',
  top: '16px',
  left: '16px',
  right: '72px', // 우측 나침반 버튼 공간 확보
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '10px 16px',
  backgroundColor: 'rgba(255, 255, 255, 0.90)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  zIndex: 30
});

export const brandTitle = style({
  fontSize: '18px',
  fontWeight: 800,
  color: vars.colors.primary,
  letterSpacing: '-0.5px'
});

export const locationTag = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4B5563',
  backgroundColor: '#F3F4F6',
  padding: '4px 10px',
  borderRadius: '12px'
});
