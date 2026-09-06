import { useState, useEffect } from 'react';

export function useScrollDirection(threshold = 10) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;

    const onScroll = () => {
      const scrollY = window.scrollY;
      if (Math.abs(scrollY - lastScrollY) < threshold) return;
      setIsCollapsed(scrollY > lastScrollY && scrollY > 30);
      lastScrollY = scrollY;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return { isCollapsed, setIsCollapsed };
}
