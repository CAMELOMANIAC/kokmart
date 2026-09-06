import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

export const sheetContainer = style({
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  margin: '0 auto',
  width: '100%',
  maxWidth: '480px',
  height: '100vh', // 화면 전체 확장 가능
  backgroundColor: 'rgba(255, 255, 255, 0.96)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderTopLeftRadius: '28px',
  borderTopRightRadius: '28px',
  borderTop: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.12)',
  zIndex: 80,
  display: 'flex',
  flexDirection: 'column',
  touchAction: 'none'
});

export const dragHandleArea = style({
  width: '100%',
  padding: '14px 0 10px 0',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  cursor: 'grab',
  userSelect: 'none'
});

export const dragHandleBar = style({
  width: '44px',
  height: '5px',
  backgroundColor: '#CBD5E1',
  borderRadius: '9999px'
});

export const sheetHeader = style({
  padding: '0 20px 12px 20px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  borderBottom: '1px solid #F3F4F6'
});

export const sheetContent = style({
  padding: '16px 20px 110px 20px', // GNB 고려 하단 패딩
  overflowY: 'auto',
  flex: 1,
  WebkitOverflowScrolling: 'touch'
});

export const storeCard = style({
  backgroundColor: '#FFFFFF',
  borderRadius: '20px',
  padding: '16px',
  marginBottom: '12px',
  border: '1px solid #F3F4F6',
  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
  transition: 'all 0.2s ease',
  cursor: 'pointer'
});

export const storeCardActive = style({
  borderColor: vars.colors.primary,
  backgroundColor: '#FFFBF8',
  boxShadow: '0 6px 20px rgba(255, 94, 0, 0.12)'
});
