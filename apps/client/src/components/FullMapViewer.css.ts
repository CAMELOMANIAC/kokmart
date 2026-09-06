import { style } from '@vanilla-extract/css';

export const mapContainer = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  backgroundColor: '#E5E7EB'
});

export const mapCanvas = style({
  width: '100%',
  height: '100%',
  position: 'relative'
});

export const myLocationPin = style({
  position: 'absolute',
  width: '18px',
  height: '18px',
  backgroundColor: '#3B82F6',
  borderRadius: '50%',
  border: '3px solid #FFFFFF',
  boxShadow: '0 0 16px rgba(59, 130, 246, 0.6), 0 2px 6px rgba(0,0,0,0.2)',
  transform: 'translate(-50%, -50%)',
  zIndex: 10,
  pointerEvents: 'none'
});

export const storeMarker = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '5px',
  padding: '6px 12px',
  borderRadius: '9999px',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '12px',
  boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
  cursor: 'pointer',
  transform: 'translate(-50%, -100%)',
  zIndex: 12,
  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
});

export const emartMarker = style({
  backgroundColor: '#F59E0B' // 이마트 옐로우골드
});

export const homeplusMarker = style({
  backgroundColor: '#EF4444' // 홈플러스 레드
});

export const lottemartMarker = style({
  backgroundColor: '#DC2626' // 롯데마트 레드
});

export const markerSelected = style({
  transform: 'translate(-50%, -115%) scale(1.12)',
  border: '2px solid #FFFFFF',
  boxShadow: '0 12px 28px rgba(0,0,0,0.28)'
});
