import { useEffect, useRef } from 'react';
import { useUIStore } from '../store/useUIStore';

interface UseScrollDirectionOptions {
  /**
   * 스크롤 감지할 element ref.
   * 미전달 시 window를 기준으로 감지 (띵/띱/뿜 탭용).
   */
  ref?: React.RefObject<HTMLElement | null>;
  /**
   * 스크롤 방향 판단 최소 이동 픽셀 (노이즈 필터링).
   * @default 8
   */
  threshold?: number;
  /**
   * 상단에서 이 픽셀 이내이면 항상 펼침 상태로 복원.
   * @default 30
   */
  topThreshold?: number;
}

/**
 * iOS 스타일 GNB 스크롤 연동 훅.
 *
 * - 스크롤 ↓ → isScrollingDown = true  (GNB 축소, 방향 유지되는 한 유지)
 * - 스크롤 ↑ → isScrollingDown = false (GNB 즉시 펼침, 방향 전환 순간)
 * - 최상단 도달 → isScrollingDown = false (항상 펼침)
 * - unmount(탭 전환) → isScrollingDown = false 자동 리셋
 *
 * 멈출 때 자동으로 펼치지 않음 — 스크롤 방향 전환만이 상태를 바꿈.
 */
export function useScrollDirection({
  ref,
  threshold = 8,
  topThreshold = 30,
}: UseScrollDirectionOptions = {}) {
  const setScrollingDown = useUIStore((s) => s.setScrollingDown);
  const lastScrollPos = useRef(0);

  useEffect(() => {
    const getScrollPos = () =>
      ref?.current ? ref.current.scrollTop : window.scrollY;

    // 초기 위치 기록
    lastScrollPos.current = getScrollPos();

    const handleScroll = () => {
      const current = getScrollPos();
      const delta = current - lastScrollPos.current;

      // 최소 threshold 이상 이동했을 때만 판단 (노이즈 필터)
      if (Math.abs(delta) < threshold) return;

      if (current <= topThreshold) {
        // 최상단 → 항상 펼침
        setScrollingDown(false);
      } else if (delta > 0) {
        // 스크롤 ↓ → 축소
        setScrollingDown(true);
      } else {
        // 스크롤 ↑ → 즉시 펼침
        setScrollingDown(false);
      }

      lastScrollPos.current = current;
    };

    const target = ref?.current ?? window;
    target.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      target.removeEventListener('scroll', handleScroll);
      // 탭 전환(unmount) 시 상태 리셋 → 새 탭에서 GNB 펼침 보장
      setScrollingDown(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, threshold, topThreshold, setScrollingDown]);
}
