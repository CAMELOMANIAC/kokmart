import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

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
  zIndex: 10,
  pointerEvents: 'none'
});

export const fallbackMyLocationPin = style({
  transform: 'translate(-50%, -50%)',
});

export const storeMarker = style({
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  padding: '4px 10px 4px 5px',
  borderRadius: '9999px',
  color: '#FFFFFF',
  fontWeight: 700,
  fontSize: '12px',
  boxShadow: '0 8px 20px rgba(0,0,0,0.18)',
  cursor: 'pointer',
  zIndex: 12,
  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
});

export const fallbackStoreMarker = style({
  transform: 'translate(-50%, -50%)',
});

export const markerFaviconWrapper = style({
  width: '18px',
  height: '18px',
  borderRadius: '50%',
  backgroundColor: '#FFFFFF',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  flexShrink: 0,
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)'
});

export const markerFavicon = style({
  width: '14px',
  height: '14px',
  objectFit: 'contain',
  borderRadius: '50%',
  display: 'block'
});

export const markerFaviconFallback = style({
  fontSize: '10px',
  fontWeight: 800,
  color: vars.colors.textMain,
  lineHeight: 1
});

export const emartMarker = style({
  backgroundColor: vars.colors.brandEmart, // 이마트 공식 옐로우
  color: '#FFFFFF'
});

export const homeplusMarker = style({
  backgroundColor: vars.colors.brandHomeplus, // 홈플러스 공식 레드
  color: '#FFFFFF'
});

export const lottemartMarker = style({
  backgroundColor: vars.colors.brandLottemart, // 롯데마트 공식 롯데 레드
  color: '#FFFFFF'
});

export const markerSelected = style({
  transform: 'scale(1.14)',
  boxShadow: '0 0 0 2.5px #FFFFFF, 0 12px 28px rgba(0, 0, 0, 0.28)'
});

export const fallbackStoreMarkerSelected = style({
  transform: 'translate(-50%, -50%) scale(1.14)',
});

// 카카오맵 뷰포트 컬링 영역을 넉넉히 확보하기 위한 오버스캔(Overscan Buffer) 설정
export const kakaoMapContainer = style({
  position: 'absolute',
  top: '-120px',
  left: '-120px',
  width: 'calc(100% + 240px)',
  height: 'calc(100% + 240px)'
});

export const recenterContainer = style({
  position: 'absolute',
  top: '16px',
  right: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  zIndex: 30
});

export const recenterButton = style({
  width: '44px',
  height: '44px',
  borderRadius: '50%',
  backgroundColor: 'rgba(255, 255, 255, 0.92)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  padding: 0,
  boxSizing: 'border-box'
});

export const pulseWave = style({
  position: 'absolute',
  inset: -8,
  borderRadius: '50%',
  backgroundColor: '#3B82F6',
  opacity: 0.4
});

export const fallbackSvg = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  opacity: 0.28
});

