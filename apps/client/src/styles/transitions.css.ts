import { globalStyle, keyframes } from '@vanilla-extract/css';

// 1. Forward (우측 탭으로 이동): 기존 화면은 왼쪽으로 부드럽게 밀려나며 페이드, 새 화면은 우측에서 슬라이드 진입
const slideOutLeft = keyframes({
  from: {
    transform: 'translateX(0)',
    opacity: 1,
  },
  to: {
    transform: 'translateX(-30%)',
    opacity: 0.3,
  },
});

const slideInRight = keyframes({
  from: {
    transform: 'translateX(100%)',
    opacity: 1,
  },
  to: {
    transform: 'translateX(0)',
    opacity: 1,
  },
});

// 2. Back (좌측 탭으로 이동): 기존 화면이 우측으로 슬라이드 아웃되며 빠져나가고, 새 화면이 왼쪽에서 나타남
const slideOutRight = keyframes({
  from: {
    transform: 'translateX(0)',
    opacity: 1,
  },
  to: {
    transform: 'translateX(100%)',
    opacity: 1,
  },
});

const slideInLeft = keyframes({
  from: {
    transform: 'translateX(-30%)',
    opacity: 0.3,
  },
  to: {
    transform: 'translateX(0)',
    opacity: 1,
  },
});

// 3. Fallback 기본 페이드 애니메이션
const fadeOut = keyframes({
  from: { opacity: 1 },
  to: { opacity: 0 },
});

const fadeIn = keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

// 기본 전환 (방향 미지정 시)
globalStyle('::view-transition-old(root)', {
  animation: `${fadeOut} 0.18s cubic-bezier(0.4, 0, 1, 1) both`,
});

globalStyle('::view-transition-new(root)', {
  animation: `${fadeIn} 0.22s cubic-bezier(0, 0, 0.2, 1) both`,
});

// Forward: 우측 방향 전환 (슬라이드 인: 우측 → 중앙)
globalStyle(':root[data-transition="forward"]::view-transition-old(root)', {
  animation: `${slideOutLeft} 0.26s cubic-bezier(0.25, 1, 0.5, 1) both`,
});

globalStyle(':root[data-transition="forward"]::view-transition-new(root)', {
  animation: `${slideInRight} 0.26s cubic-bezier(0.25, 1, 0.5, 1) both`,
});

// Back: 좌측 방향 전환 (슬라이드 아웃: 중앙 → 우측)
globalStyle(':root[data-transition="back"]::view-transition-old(root)', {
  animation: `${slideOutRight} 0.26s cubic-bezier(0.25, 1, 0.5, 1) both`,
  zIndex: 1,
});

globalStyle(':root[data-transition="back"]::view-transition-new(root)', {
  animation: `${slideInLeft} 0.26s cubic-bezier(0.25, 1, 0.5, 1) both`,
});

// 하단 GNB 네비게이션은 페이지 좌우 슬라이드와 분리하여 화면 하단에 고정
globalStyle('nav', {
  viewTransitionName: 'gnb-nav',
});

globalStyle('::view-transition-group(gnb-nav)', {
  animation: 'none',
});
