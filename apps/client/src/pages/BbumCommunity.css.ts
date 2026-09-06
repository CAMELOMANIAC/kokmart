import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const container = style({
  padding: vars.space.md
});

export const bannerCard = style({
  padding: '14px 18px',
  backgroundColor: '#ECFDF5',
  borderRadius: '20px',
  border: '1px solid #A7F3D0',
  marginBottom: '16px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px'
});

export const bannerText = style({
  fontSize: '13px',
  color: '#065F46',
  lineHeight: '1.4'
});

export const writeButton = style({
  backgroundColor: '#059669',
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '16px',
  padding: '8px 12px',
  fontSize: '12px',
  fontWeight: 700,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  flexShrink: 0,
  boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
});

export const postList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '14px'
});

export const postCard = style({
  backgroundColor: '#FFFFFF',
  borderRadius: vars.radii.lg,
  padding: '20px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)'
});

export const postHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

const badgeBase = style({
  fontSize: '11px',
  fontWeight: 700,
  padding: '4px 10px',
  borderRadius: '12px'
});

export const statusBadge = styleVariants({
  completed: [
    badgeBase,
    {
      color: '#9CA3AF',
      backgroundColor: vars.colors.bgLight
    }
  ],
  inProgress: [
    badgeBase,
    {
      color: vars.colors.accentGreen,
      backgroundColor: '#D1FAE5'
    }
  ]
});

export const locationText = style({
  fontSize: '12px',
  color: vars.colors.textSub,
  fontWeight: 500
});

export const postTitle = style({
  fontSize: '16px',
  fontWeight: 700,
  marginTop: '10px',
  color: vars.colors.secondary
});

export const postFooter = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '14px'
});

export const priceText = style({
  fontSize: '15px',
  fontWeight: 800,
  color: vars.colors.primary
});

export const chatButton = style({
  backgroundColor: vars.colors.secondary,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '12px',
  padding: '8px 14px',
  fontSize: '12px',
  fontWeight: 600,
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  cursor: 'pointer',
  boxShadow: '0 4px 12px rgba(17, 24, 39, 0.15)'
});
