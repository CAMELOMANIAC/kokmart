import { useState, useEffect } from 'react';

export function useScrollDirection(threshold = 10) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const updateScrollDir = () => {
      const scrollY = window.scrollY;

      // 최상단 근처에 있으면 무조건 펼침 상태 유지
      if (scrollY < 40) {
        setIsCollapsed(false);
        ticking = false;
        lastScrollY = scrollY;
        return;
      }

      if (Math.abs(scrollY - lastScrollY) < threshold) {
        ticking = false;
        return;
      }

      // 아래로 스크롤하면 축소, 위로 스크롤하면 펼침
      if (scrollY > lastScrollY) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }

      lastScrollY = scrollY > 0 ? scrollY : 0;
      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollDir);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { isCollapsed, setIsCollapsed };
}
