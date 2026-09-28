import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ChevronRight, Clock } from 'lucide-react';
import type { MartStore } from '@kokmart/shared';
import {
  ctaButton,
  ctaContentLeft,
  ctaIcon,
  ctaTextWrapper,
  ctaAnimatedContent,
  ctaBadgeCount,
} from './StoreCtaButton.css';
import { isFlyerSupportedBrand } from '../utils/martSupport';
import { useToastStore } from '../store/useToastStore';

interface StoreCtaButtonProps {
  selectedStores: MartStore[];
  onClick: () => void;
}

export const getCtaButtonInfo = (
  selectedStores: MartStore[]
): { text: string; count: number; isAllUnsupported: boolean } | null => {
  if (selectedStores.length === 0) return null;

  const count = selectedStores.length;
  const supportedStores = selectedStores.filter((s) => isFlyerSupportedBrand(s.brand));
  const isAllUnsupported = supportedStores.length === 0;

  const repStore = supportedStores.length > 0 ? supportedStores[0] : selectedStores[0];
  const repName = repStore?.displayName || repStore?.name || '마트';

  let text = '';
  if (isAllUnsupported) {
    text = count === 1 ? `${repName} 전단 준비중` : `${repName} 외 ${count - 1}곳 전단 준비중`;
  } else {
    text = count === 1 ? `${repName} 전단 보기` : `${repName} 외 ${count - 1}곳 전단 비교하기`;
  }

  return { text, count, isAllUnsupported };
};

export const StoreCtaButton: React.FC<StoreCtaButtonProps> = ({
  selectedStores,
  onClick,
}) => {
  const showToast = useToastStore((state) => state.showToast);
  const ctaInfo = getCtaButtonInfo(selectedStores);
  if (!ctaInfo) return null;

  const { text: ctaText, count, isAllUnsupported } = ctaInfo;

  const handleClick = () => {
    if (isAllUnsupported) {
      showToast('선택하신 매장은 전단 서비스 준비 중입니다. 대형 3사(이마트, 홈플러스, 롯데마트)를 선택해 주세요! 🚀');
      return;
    }
    onClick();
  };

  return (
    <motion.button
      layout
      transition={{
        layout: {
          duration: 0.28,
          ease: [0.25, 1, 0.5, 1],
        },
      }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      className={ctaButton}
    >
      <div className={ctaContentLeft}>
        {isAllUnsupported ? (
          <Clock size={16} color="#FFFFFF" className={ctaIcon} />
        ) : (
          <Zap size={16} fill="#FFFFFF" color="#FFFFFF" className={ctaIcon} />
        )}

        <div className={ctaTextWrapper}>
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
        </div>
      </div>

      <ChevronRight size={16} color="#FFFFFF" strokeWidth={2.5} className={ctaIcon} />
    </motion.button>
  );
};
