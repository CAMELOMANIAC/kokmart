import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navContainer, navItem, navItemActive, activeIndicator } from './Navigation.css';
import { Target, Zap, Bookmark, Users } from 'lucide-react';
import { useUIStore } from '../store/useUIStore';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

// 4개 탭 모두 3글자로 수평 밸런스 통일
const tabs = [
  { id: 'kok', label: '지도 콕', icon: Target },
  { id: 'dding', label: '전단 띵', icon: Zap },
  { id: 'ddib', label: '카트 띱', icon: Bookmark },
  { id: 'bbum', label: '반반 뿜', icon: Users }
];

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  const { isBottomSheetFullscreen } = useUIStore();
  const [isHovered, setIsHovered] = useState(false);

  // 1. 콕홈(지도): 바텀시트가 전체화면으로 확장되면 축소, 기본 상태에서는 펼침
  // 2. 다른 페이지(띵/띱/뿜): 페이지 이동 시 본문 화면 가림을 방지하기 위해 기본으로 GNB 축소
  // 3. 마우스 호버 시 자연스럽게 펼침
  const isAutoCollapsed = currentTab === 'kok' ? isBottomSheetFullscreen : true;
  const collapsed = isAutoCollapsed && !isHovered;

  return (
    <motion.nav
      className={navContainer}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        const isActive = currentTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`${navItem} ${isActive ? navItemActive : ''}`}
            style={{ background: 'none', border: 'none', width: '100%', height: '100%' }}
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Icon size={collapsed ? 18 : 19} strokeWidth={isActive ? 2.4 : 1.8} />

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
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      fontSize: '11px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden'
                    }}
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
