import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

// 플로팅 헤더 (Glassmorphism Floating Header)
export const header = style({
  position: 'sticky',
  top: '12px',
  margin: '12px 16px 0 16px',
  padding: '14px 20px',
  backgroundColor: 'rgba(255, 255, 255, 0.82)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.7)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
  zIndex: 20
});

export const logoText = style({
  fontSize: '22px',
  fontWeight: 800,
  color: vars.colors.primary,
  letterSpacing: '-0.5px'
});

// 플로팅 마트 필터 칩 컨테이너
export const martFilterContainer = style({
  display: 'flex',
  gap: vars.space.sm,
  padding: '16px 16px 8px 16px',
  overflowX: 'auto'
});

export const martChip = style({
  padding: '8px 16px',
  borderRadius: vars.radii.full,
  fontSize: '13px',
  fontWeight: 600,
  border: '1px solid rgba(255, 255, 255, 0.8)',
  backgroundColor: 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(8px)',
  color: vars.colors.textSub,
  cursor: 'pointer',
  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
});

export const martChipActive = style({
  backgroundColor: vars.colors.primary,
  color: vars.colors.surface,
  borderColor: vars.colors.primary,
  boxShadow: '0 6px 16px rgba(255, 94, 0, 0.25)',
  transform: 'translateY(-1px)'
});

export const cardList = style({
  padding: '8px 16px 16px 16px',
  display: 'flex',
  flexDirection: 'column',
  gap: vars.space.md
});

// 플로팅 카드 (Floating Card)
export const productCard = style({
  backgroundColor: vars.colors.surface,
  borderRadius: '24px',
  padding: '20px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05), 0 2px 8px rgba(0, 0, 0, 0.02)',
  transition: 'all 0.3s ease'
});

export const tipBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: '12px',
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
