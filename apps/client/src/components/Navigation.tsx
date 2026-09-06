import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { navContainer, navItem, navItemActive, activeIndicator } from './Navigation.css';
import { Target, Zap, Bookmark, Users } from 'lucide-react';
import { useScrollDirection } from '../hooks/useScrollDirection';

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
  const { isCollapsed } = useScrollDirection(18); // 미세 떨림 방지 스크롤 임계치
  const [isHovered, setIsHovered] = useState(false);

  // 마우스 호버 시에는 축소를 일시 해제하여 편리하게 탭 선택 가능
  const collapsed = isCollapsed && !isHovered;

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
        stiffness: 220, // 380 -> 220 으로 부드럽게 감속
        damping: 26,    // 튀지 않는 안정적인 감쇠
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
                      ease: [0.25, 1, 0.5, 1] // 부드러운 감속 큐빅 베지어
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
