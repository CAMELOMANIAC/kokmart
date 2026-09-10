import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { MartStore } from '@kokmart/shared';
import {
  pillListContainer,
  storePill,
  storePillActive,
  storePillCheck,
  storePillName,
  storePillDistance,
  emptyMessage,
} from './StorePillList.css';
import { getBrandBadgeClass, getBranchName } from './storeBadgeUtils';

interface StorePillListProps {
  stores: MartStore[];
  isLoading?: boolean;
  isStoreSelected: (id: string) => boolean;
  toggleStoreSelection: (store: MartStore) => void;
}

export const StorePillList: React.FC<StorePillListProps> = ({
  stores,
  isLoading,
  isStoreSelected,
  toggleStoreSelection,
}) => {
  return (
    <div className={pillListContainer}>
      {stores.length === 0 ? (
        <div className={emptyMessage}>
          {isLoading ? '마트 정보를 검색 중입니다...' : '조건에 일치하는 마트가 없습니다.'}
        </div>
      ) : (
        stores.map((store) => {
          const isSelected = isStoreSelected(store.id);

          return (
            <motion.div
              key={store.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => toggleStoreSelection(store)}
              className={`${storePill} ${isSelected ? storePillActive : ''}`}
            >
              <span className={getBrandBadgeClass(store.brand)}>
                {store.brand}
              </span>
              <span className={storePillName}>
                {getBranchName(store)}
              </span>
              {store.distanceKm && (
                <span className={storePillDistance}>
                  {store.distanceKm}km
                </span>
              )}
              {isSelected && (
                <Check size={14} className={storePillCheck} strokeWidth={2.5} />
              )}
            </motion.div>
          );
        })
      )}
    </div>
  );
};
