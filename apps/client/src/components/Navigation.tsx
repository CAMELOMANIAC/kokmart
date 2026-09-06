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
            style={{ background: 'none', border: 'none' }}
          >
            {isActive && (
              <motion.div
                layoutId="floatingTabIndicator"
                className={activeIndicator}
                transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              />
            )}
            <motion.div
              whileTap={{ scale: 0.85 }}
              animate={{ scale: isActive ? 1.12 : 1, y: isActive ? -1 : 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            </motion.div>
            <span style={{ marginTop: '2px', position: 'relative', zIndex: 2 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
