import { style, styleVariants } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const container = style({
  padding: vars.space.md
});

export const noticeCard = style({
  padding: '18px',
  backgroundColor: '#FFF7ED',
  borderRadius: '20px',
  border: '1px solid #FFEDD5',
  boxShadow: '0 6px 18px rgba(255, 94, 0, 0.06)',
  marginBottom: '16px'
});

export const noticeTitle = style({
  fontWeight: 700,
  color: '#C2410C',
  marginBottom: '4px',
  fontSize: '14px'
});

export const noticeDesc = style({
  fontSize: '13px',
  color: '#9A3412',
  lineHeight: '1.4'
});

export const ocrCard = style({
  padding: '20px',
  backgroundColor: '#FFFFFF',
  borderRadius: vars.radii.lg,
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
});

export const ocrTitle = style({
  margin: '0 0 12px 0',
  fontSize: '15px',
  fontWeight: 700,
  color: vars.colors.textMain
});

export const ocrButton = style({
  width: '100%',
  padding: '14px',
  backgroundColor: vars.colors.secondary,
  color: '#FFFFFF',
  border: 'none',
  borderRadius: '16px',
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '8px',
  boxShadow: '0 6px 20px rgba(17, 24, 39, 0.15)',
  transition: 'background-color 0.2s ease',
  selectors: {
    '&:disabled': {
      backgroundColor: '#9CA3AF',
      cursor: 'not-allowed'
    }
  }
});

export const ocrMessage = style({
  marginTop: '14px',
  fontSize: '13px',
  fontWeight: 600,
  color: '#059669'
});

export const sectionTitle = style({
  fontSize: '15px',
  fontWeight: 700,
  margin: '20px 4px 12px 4px',
  color: '#374151'
});

export const dealList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
});

export const dealItemCard = style({
  padding: '16px 18px',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

export const brandHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  marginBottom: '4px'
});

const brandBadgeBase = style({
  fontSize: '11px',
  fontWeight: 700,
  padding: '2px 6px',
  borderRadius: '6px'
});

export const brandBadge = styleVariants({
  emart: [brandBadgeBase, { backgroundColor: '#FEF3C7', color: '#B45309' }],
  homeplus: [brandBadgeBase, { backgroundColor: '#FEE2E2', color: '#B91C1C' }],
  lotte: [brandBadgeBase, { backgroundColor: '#FEE2E2', color: '#B91C1C' }],
  default: [brandBadgeBase, { backgroundColor: '#F3F4F6', color: '#4B5563' }]
});

export const dealBadge = style({
  fontSize: '11px',
  fontWeight: 700,
  color: vars.colors.primary
});

export const productName = style({
  fontSize: '15px',
  fontWeight: 700,
  color: vars.colors.secondary
});

export const unitPrice = style({
  fontSize: '12px',
  color: vars.colors.textSub,
  marginTop: '3px'
});

export const priceArea = style({
  textAlign: 'right'
});

export const originalPrice = style({
  fontSize: '12px',
  color: '#9CA3AF',
  textDecoration: 'line-through'
});

export const salePriceRow = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  justifyContent: 'flex-end'
});

export const discountRate = style({
  fontSize: '14px',
  fontWeight: 800,
  color: '#EF4444'
});

export const salePrice = style({
  fontSize: '17px',
  fontWeight: 800,
  color: vars.colors.secondary
});
