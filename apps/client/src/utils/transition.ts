export type TransitionDirection = 'forward' | 'back';

export const TAB_ORDER: Record<string, number> = {
  '/': 0,
  '/dding': 1,
  '/ddib': 2,
  '/bbum': 3
};

let transitionTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * View Transitions API의 방향(좌/우 슬라이드)을 설정합니다.
 * 애니메이션 종료 후 dataset.transition 속성을 자동 정리합니다.
 */
export const setViewTransitionDirection = (direction: TransitionDirection) => {
  if (typeof document === 'undefined') return;

  if (transitionTimer) {
    clearTimeout(transitionTimer);
  }

  document.documentElement.dataset.transition = direction;

  transitionTimer = setTimeout(() => {
    delete document.documentElement.dataset.transition;
    transitionTimer = null;
  }, 400);
};

/**
 * 이전 경로와 대상 경로의 탭 순서를 비교하여 슬라이드 방향을 산출합니다.
 */
export const getTabDirection = (fromPath: string, toPath: string): TransitionDirection => {
  const fromIndex = TAB_ORDER[fromPath] ?? 0;
  const toIndex = TAB_ORDER[toPath] ?? 0;
  return toIndex >= fromIndex ? 'forward' : 'back';
};
