import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const header = style({
  padding: `${vars.space.md} ${vars.space.md}`,
  backgroundColor: vars.colors.surface,
  borderBottom: `1px solid ${vars.colors.border}`,
  position: 'sticky',
  top: 0,
  zIndex: 10
});

export const logoText = style({
  fontSize: '22px',
  fontWeight: 800,
  color: vars.colors.primary,
  letterSpacing: '-0.5px'
});

export const martFilterContainer = style({
  display: 'flex',
  gap: vars.space.sm,
  padding: `${vars.space.sm} ${vars.space.md}`,
  backgroundColor: vars.colors.bgLight
});

export const martChip = style({
  padding: '6px 14px',
  borderRadius: vars.radii.full,
  fontSize: '13px',
  fontWeight: 600,
  border: `1px solid ${vars.colors.border}`,
  backgroundColor: vars.colors.surface,
  cursor: 'pointer',
  transition: 'all 0.2s ease'
});

export const martChipActive = style({
  backgroundColor: vars.colors.primary,
  color: vars.colors.surface,
  borderColor: vars.colors.primary
});

export const cardList = style({
  padding: vars.space.md,
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md
});

export const productCard = style({
  backgroundColor: vars.colors.surface,
  borderRadius: vars.radii.lg,
  padding: vars.space.md,
  border: `1px solid ${vars.colors.border}`,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
});

export const tipBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 8px',
  borderRadius: vars.radii.sm,
  fontSize: '12px',
  fontWeight: 700,
  marginBottom: vars.space.xs
});

export const tipMartBest = style({
  backgroundColor: '#FEF3C7',
  color: '#D97706'
});

export const tipCoupangBulk = style({
  backgroundColor: '#EFF6FF',
  color: '#2563EB'
});
