import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { useToastStore } from '../store/useToastStore';
import { toastContainer, toastContent, toastIcon } from './Toast.css';

export const Toast: React.FC = () => {
  const { message, hideToast } = useToastStore();

  return (
    <div className={toastContainer}>
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.95 }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={toastContent}
            onClick={hideToast}
          >
            <div className={toastIcon}>
              <Sparkles size={15} color="#FF5E00" />
            </div>
            <span>{message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
