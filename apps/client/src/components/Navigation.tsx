import React from 'react';
import { motion } from 'framer-motion';
import { navContainer, navItem, navItemActive, activeIndicator } from './Navigation.css';
import { Target, Zap, Bookmark, Users } from 'lucide-react';

interface NavigationProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: 'kok', label: '🎯 콕', icon: Target },
  { id: 'dding', label: '⚡ 띵', icon: Zap },
  { id: 'ddib', label: '🏷️ 띱', icon: Bookmark },
  { id: 'bbum', label: '🍕 뿜', icon: Users }
];

export const Navigation: React.FC<NavigationProps> = ({ currentTab, onTabChange }) => {
  return (
    <nav className={navContainer}>
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
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}
            <motion.div whileTap={{ scale: 0.92 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
              <span style={{ marginTop: '2px', position: 'relative', zIndex: 2 }}>{tab.label}</span>
            </motion.div>
          </button>
        );
      })}
    </nav>
  );
};
