import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const toastContainer = style({
  position: 'fixed',
  bottom: 'calc(78px + env(safe-area-inset-bottom, 0px))',
  left: 0,
  right: 0,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 9999,
  pointerEvents: 'none',
  padding: '0 20px',
});

export const toastContent = style({
  pointerEvents: 'auto',
  maxWidth: '420px',
  width: 'fit-content',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  backgroundColor: 'rgba(17, 24, 39, 0.92)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  color: '#FFFFFF',
  padding: '10px 18px',
  borderRadius: vars.radii.full,
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.22)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  fontSize: '13px',
  fontWeight: 600,
  letterSpacing: '-0.2px',
  lineHeight: '1.4',
  cursor: 'pointer',
  userSelect: 'none',
  WebkitUserSelect: 'none',
  textAlign: 'center',
});

export const toastIcon = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
