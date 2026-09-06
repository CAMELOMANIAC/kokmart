import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const navContainer = style({
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: '480px',
  height: '64px',
  backgroundColor: vars.colors.surface,
  borderTop: `1px solid ${vars.colors.border}`,
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
  zIndex: 100
});

export const navItem = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textDecoration: 'none',
  fontSize: '11px',
  fontWeight: 600,
  color: vars.colors.textSub,
  padding: '6px 12px',
  borderRadius: vars.radii.md,
  transition: 'color 0.2s ease',
  cursor: 'pointer'
});

export const navItemActive = style({
  color: vars.colors.primary
});
