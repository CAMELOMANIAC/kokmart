import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  navContainer,
  navItem,
  navItemActive,
  activeIndicator,
  iconWrapper,
  iconInnerContainer,
  tabBadge,
  labelSpan
} from './Navigation.css';
import { Target, Zap, Bookmark, Users } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';
import { useSelectedStoreStore } from '../store/useSelectedStoreStore';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { getTabDirection, setViewTransitionDirection } from '../utils/transition';

interface NavigationProps {
  currentTab?: string;
  onTabChange?: (tab: string) => void;
}

// 4개 탭 모두 3글자로 수평 밸런스 통일
const tabs = [
  { id: 'kok', path: '/', label: '지도 콕', icon: Target },
  { id: 'dding', path: '/dding', label: '전단 띵', icon: Zap },
  { id: 'ddib', path: '/ddib', label: '카트 띱', icon: Bookmark },
  { id: 'bbum', path: '/bbum', label: '반반 뿜', icon: Users }
] as const;

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isBottomSheetFullscreen, isScrollingDown } = useUIStore();
  const { selectedStores } = useSelectedStoreStore();

  /**
   * 축소 조건 (OR):
   *   1. 스크롤 ↓ 방향 감지 중 (모든 탭)
   *   2. 바텀시트가 전체화면으로 확장된 경우 (콕 탭)
   *
   * 터치 디바이스에서 sticky hover 버그(탭 후 mouseleave 미발화로 GNB 고착)를
   * 방지하기 위해 hover 기능을 제거했습니다.
   */
  const collapsed = isScrollingDown || isBottomSheetFullscreen;

  const handleTabClick = (tab: (typeof tabs)[number]) => {
    if (onTabChange) {
      onTabChange(tab.id);
    }
    if (location.pathname !== tab.path) {
      const direction = getTabDirection(location.pathname, tab.path);
      setViewTransitionDirection(direction);
      navigate({ to: tab.path, viewTransition: true });
    }
  };

  return (
    <motion.nav
      className={navContainer}
      animate={{
        maxWidth: collapsed ? '220px' : '440px',
        height: collapsed ? '50px' : '64px',
        bottom: collapsed ? '20px' : '16px'
      }}
      transition={{
        type: 'spring',
        stiffness: 220,
        damping: 26,
        mass: 0.8
      }}
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab ? currentTab === tab.id : location.pathname === tab.path;

        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`${navItem} ${isActive ? navItemActive : ''}`}
          >
            {isActive && (
              <motion.div
                layoutId="floatingTabIndicator"
                className={activeIndicator}
                transition={{ type: 'spring', stiffness: 350, damping: 30 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.92 }}
              className={iconWrapper}
            >
              <div className={iconInnerContainer}>
                <Icon size={collapsed ? 18 : 19} strokeWidth={isActive ? 2.4 : 1.8} />
                {tab.id === 'dding' && selectedStores.length > 0 && (
                  <span className={tabBadge}>{selectedStores.length}</span>
                )}
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 5 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    transition={{
                      duration: 0.28,
                      ease: [0.25, 1, 0.5, 1]
                    }}
                    className={labelSpan}
                  >
                    {tab.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.div>
          </button>
        );
      })}
    </motion.nav>
  );
};
