import { style, keyframes } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

const pulse = keyframes({
  '0%': { opacity: 0.6 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.6 },
});

export const container = style({
  width: '84px',
  height: '84px',
  minWidth: '84px',
  minHeight: '84px',
  borderRadius: vars.radii.md,
  overflow: 'hidden',
  backgroundColor: '#F9FAFB',
  border: '1px solid #F3F4F6',
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
});

export const canvas = style({
  width: '100%',
  height: '100%',
  display: 'block',
  borderRadius: vars.radii.md,
});

export const skeleton = style({
  position: 'absolute',
  inset: 0,
  backgroundColor: '#E5E7EB',
  animation: `${pulse} 1.5s ease-in-out infinite`,
});

export const placeholder = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '4px',
  color: vars.colors.textSub,
  fontSize: '10px',
  fontWeight: 600,
  padding: '6px',
  textAlign: 'center',
});

export const placeholderIcon = style({
  color: '#9CA3AF',
});
