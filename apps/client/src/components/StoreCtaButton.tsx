import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight } from 'lucide-react';
import type { MartStore } from '@kokmart/shared';
import {
  ctaButton,
  ctaContentLeft,
  ctaIcon,
  ctaTextWrapper,
  ctaAnimatedContent,
  ctaBadgeCount,
} from './StoreCtaButton.css';

interface StoreCtaButtonProps {
  selectedStores: MartStore[];
  onClick: () => void;
}

export const StoreCtaButton: React.FC<StoreCtaButtonProps> = ({
  selectedStores,
  onClick,
}) => {
  if (selectedStores.length === 0) return null;

  const count = selectedStores.length;
  const firstStore = selectedStores[0];
  const firstName = firstStore?.displayName || firstStore?.name || '마트';

  const ctaText =
    count === 1
      ? `${firstName} 전단 보기`
      : `${firstName} 외 ${count - 1}곳 전단 비교하기`;

  return (
    <motion.button
      layout
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={ctaButton}
      transition={{
        layout: { type: 'spring', stiffness: 500, damping: 35 },
      }}
    >
      <div className={ctaContentLeft}>
        <Zap size={16} fill="#FFFFFF" color="#FFFFFF" className={ctaIcon} />

        <motion.div layout className={ctaTextWrapper}>
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={ctaText}
              initial={{ opacity: 0, y: -14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }}
              transition={{
                duration: 0.22,
                ease: [0.22, 1, 0.36, 1],
              }}
              className={ctaAnimatedContent}
            >
              <span>{ctaText}</span>
              {count > 1 && <span className={ctaBadgeCount}>{count}</span>}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </div>

      <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} className={ctaIcon} />
    </motion.button>
  );
};
