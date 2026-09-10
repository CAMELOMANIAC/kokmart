import { useState, useEffect } from 'react';

export interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

/**
 * 모바일 브라우저 및 PWA standalone 모드에서
 * 기기 노치/다이내믹 아일랜드(top) 및 홈 인디케이터(bottom) 안전영역 px를 정밀 측정하는 훅
 */
export const useSafeAreaInsets = (): SafeAreaInsets => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  });

  useEffect(() => {
    const updateInsets = () => {
      const div = document.createElement('div');
      div.style.position = 'fixed';
      div.style.top = '0';
      div.style.left = '0';
      div.style.width = '0';
      div.style.height = '0';
      div.style.paddingTop = 'env(safe-area-inset-top, 0px)';
      div.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
      div.style.paddingLeft = 'env(safe-area-inset-left, 0px)';
      div.style.paddingRight = 'env(safe-area-inset-right, 0px)';
      div.style.visibility = 'hidden';
      div.style.pointerEvents = 'none';
      document.body.appendChild(div);

      const computed = window.getComputedStyle(div);
      const top = parseFloat(computed.paddingTop) || 0;
      const bottom = parseFloat(computed.paddingBottom) || 0;
      const left = parseFloat(computed.paddingLeft) || 0;
      const right = parseFloat(computed.paddingRight) || 0;

      document.body.removeChild(div);

      setInsets((prev) => {
        if (
          prev.top === top &&
          prev.bottom === bottom &&
          prev.left === left &&
          prev.right === right
        ) {
          return prev;
        }
        return { top, bottom, left, right };
      });
    };

    updateInsets();
    window.addEventListener('resize', updateInsets);
    window.addEventListener('orientationchange', updateInsets);

    return () => {
      window.removeEventListener('resize', updateInsets);
      window.removeEventListener('orientationchange', updateInsets);
    };
  }, []);

  return insets;
};
