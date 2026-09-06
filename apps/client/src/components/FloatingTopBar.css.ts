import { style } from '@vanilla-extract/css';
import { vars } from '../styles/theme.css';

// 1. 콕홈 전용: 우측 나침반(내 위치) 버튼 공간(68px)을 제외한 절대 위치 플로팅 바
export const topBarHome = style({
  position: 'absolute',
  top: '16px',
  left: '16px',
  right: '68px',
  minHeight: '44px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 14px',
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  zIndex: 30,
  boxSizing: 'border-box',
  transition: 'border-radius 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease'
});

// 2. 띵/띱/뿜 전용: 페이지 전체 너비를 가득 채우는 스티키 플로팅 바
export const topBarFull = style({
  position: 'sticky',
  top: '16px',
  width: '100%',
  minHeight: '44px',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: '0 14px',
  backgroundColor: 'rgba(255, 255, 255, 0.94)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  borderRadius: '24px',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
  zIndex: 30,
  marginBottom: '16px',
  boxSizing: 'border-box',
  transition: 'border-radius 0.2s ease, box-shadow 0.2s ease, padding 0.2s ease'
});

// 확장 상태 스타일 (아래로 펼쳐진 카드 형태)
export const topBarExpanded = style({
  borderRadius: '20px',
  padding: '10px 14px 12px 14px',
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.14)'
});

// 헤더 행 (축소 시 44px 높이, 확장 시 32px 높이)
export const topBarHeaderRow = style({
  width: '100%',
  height: '44px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '8px'
});

export const topBarHeaderRowExpanded = style({
  height: '32px'
});

// 브랜드 로고 (콕홈 전용 - 콕마트 주황색)
export const brandTitleHome = style({
  fontSize: '17px',
  fontWeight: 800,
  color: vars.colors.primary,
  letterSpacing: '-0.5px',
  flexShrink: 0
});

// 페이지 타이틀 (띵/띱/뿜 전용 - 진한 검은색 글씨 + GNB 아이콘)
export const pageTitle = style({
  fontSize: '16px',
  fontWeight: 800,
  color: '#111827',
  letterSpacing: '-0.5px',
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: '6px'
});

// 위치 태그 (선택된 마트가 없을 때 표시)
export const locationTag = style({
  display: 'flex',
  alignItems: 'center',
  gap: '4px',
  fontSize: '12px',
  fontWeight: 700,
  color: '#4B5563',
  backgroundColor: '#F3F4F6',
  padding: '4px 10px',
  borderRadius: '12px',
  flexShrink: 0
});

// 알약 칩 스크롤 래퍼 (오버플로우 감지용 flex 컨테이너)
export const chipsWrapper = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  minWidth: 0,
  flex: 1,
  justifyContent: 'flex-end'
});

// 상단 플로팅 바 내부 선택된 알약 칩 가로 스크롤 영역
export const selectedChipsScroll = style({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  overflowX: 'auto',
  scrollbarWidth: 'none',
  '::-webkit-scrollbar': {
    display: 'none'
  },
  minWidth: 0
});

// 선택된 마트 알약 칩
export const topBarPill = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: '4px',
  padding: '3px 6px 3px 10px',
  borderRadius: '9999px',
  backgroundColor: '#FFF7ED',
  border: '1px solid #FED7AA',
  fontSize: '11px',
  fontWeight: 700,
  color: '#C2410C',
  whiteSpace: 'nowrap',
  flexShrink: 0,
  boxShadow: '0 2px 6px rgba(255, 94, 0, 0.08)'
});

// 알약 칩 내부 X 제거 버튼
export const removePillButton = style({
  border: 'none',
  background: 'none',
  padding: '2px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  borderRadius: '50%',
  color: '#9A3412',
  ':hover': {
    backgroundColor: '#FDBA74'
  }
});

// 가로 스크롤 발생 시 노출되는 확장 버튼
export const expandToggleButton = style({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '1px solid #E5E7EB',
  backgroundColor: '#F3F4F6',
  color: '#4B5563',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
  transition: 'all 0.15s ease',
  ':hover': {
    backgroundColor: '#E5E7EB',
    color: '#111827'
  }
});

// 확장 상태 접기 버튼
export const expandToggleButtonActive = style({
  width: '24px',
  height: '24px',
  borderRadius: '50%',
  border: '1px solid #FED7AA',
  backgroundColor: '#FFF7ED',
  color: vars.colors.primary,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
  padding: 0,
  transition: 'all 0.15s ease'
});

// 확장 헤더 우측 액션 영역
export const expandedHeaderActions = style({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  flexShrink: 0
});

// 선택 개수 뱃지
export const storeCountBadge = style({
  fontSize: '11px',
  fontWeight: 700,
  color: vars.colors.primary,
  backgroundColor: '#FFF7ED',
  padding: '2px 8px',
  borderRadius: '9999px',
  border: '1px solid #FED7AA',
  whiteSpace: 'nowrap'
});

// 전체 해제 버튼
export const clearAllButton = style({
  background: 'none',
  border: 'none',
  fontSize: '11px',
  fontWeight: 600,
  color: '#9CA3AF',
  cursor: 'pointer',
  padding: '2px 4px',
  whiteSpace: 'nowrap',
  ':hover': {
    color: '#EF4444'
  }
});

// 확장 시 펼쳐지는 알약 칩 멀티라인 영역
export const expandedChipsGrid = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  paddingTop: '8px',
  marginTop: '6px',
  borderTop: '1px solid #F3F4F6',
  maxHeight: '160px',
  overflowY: 'auto'
});
