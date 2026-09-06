import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const container = style({
  padding: vars.space.md
});

export const dashboardCard = style({
  backgroundColor: vars.colors.secondary,
  color: '#FFFFFF',
  borderRadius: vars.radii.lg,
  padding: '22px',
  marginBottom: '20px',
  boxShadow: '0 12px 32px rgba(17, 24, 39, 0.2)'
});

export const dashboardSubTitle = style({
  fontSize: '13px',
  color: '#9CA3AF',
  marginBottom: '4px',
  fontWeight: 500
});

export const comparisonRow = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: '12px'
});

export const singleMartLabel = style({
  fontSize: '12px',
  color: '#D1D5DB'
});

export const singleMartPrice = style({
  fontSize: '18px',
  fontWeight: 700,
  textDecoration: 'line-through',
  color: '#9CA3AF'
});

export const splitMartLabel = style({
  fontSize: '12px',
  color: vars.colors.accentGreen,
  fontWeight: 700
});

export const splitMartPrice = style({
  fontSize: '22px',
  fontWeight: 800,
  color: vars.colors.accentGreen
});

export const savingsRow = style({
  marginTop: '16px',
  paddingTop: '14px',
  borderTop: '1px solid #374151',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
});

export const savingsLabel = style({
  fontSize: '13px',
  color: vars.colors.bgLight
});

export const savingsValue = style({
  fontSize: '17px',
  fontWeight: 800,
  color: vars.colors.primary
});

export const sectionHeader = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  margin: '0 4px 12px 4px'
});

export const sectionTitle = style({
  fontSize: '15px',
  fontWeight: 700,
  margin: 0,
  color: vars.colors.textMain
});

export const clearButton = style({
  border: 'none',
  background: 'none',
  color: '#9CA3AF',
  fontSize: '13px',
  cursor: 'pointer',
  fontWeight: 600
});

export const emptyState = style({
  textAlign: 'center',
  padding: '40px 0',
  color: '#9CA3AF',
  fontSize: '14px'
});

export const cartList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
});

export const cartItemCard = style({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '16px 18px',
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.03)'
});

export const productName = style({
  fontSize: '15px',
  fontWeight: 700,
  color: vars.colors.secondary
});

export const productDetail = style({
  fontSize: '12px',
  color: vars.colors.textSub,
  marginTop: '3px'
});

export const deleteButton = style({
  border: 'none',
  background: 'none',
  color: '#EF4444',
  cursor: 'pointer',
  padding: '4px'
});
