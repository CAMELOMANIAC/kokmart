import { style } from '@vanilla-extract/css';

export const pageWrapper = style({
  position: 'relative',
  width: '100%',
  height: '100%',  // 부모 mapContainerStyle(100dvh)을 그대로 채움
  overflow: 'hidden',
});

// iOS black-translucent 상태표시줄 아이콘 가독성을 위한 상단 소프트 비네팅 (지도는 그대로 비침)
export const topStatusVignette = style({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  height: 'calc(44px + env(safe-area-inset-top, 0px))',
  background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0) 100%)',
  pointerEvents: 'none',
  zIndex: 25,
});
