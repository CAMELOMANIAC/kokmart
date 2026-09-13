import React from 'react';
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
    <div
      className={pillListContainer}
      onPointerDown={(e) => {
        // 알약 목록 스크롤 시 부모 바텀시트의 drag="y"로 터치가 빼앗겨 스크롤이 먹통되는 현상 방지
        e.stopPropagation();
      }}
      onContextMenu={(e) => {
        // 롱탭 시 모바일 브라우저 컨텍스트 메뉴 차단
        e.preventDefault();
      }}
    >
      {stores.length === 0 ? (
        <div className={emptyMessage}>
          {isLoading ? '마트 정보를 검색 중입니다...' : '조건에 일치하는 마트가 없습니다.'}
        </div>
      ) : (
        stores.map((store) => {
          const isSelected = isStoreSelected(store.id);

          return (
            <div
              key={store.id}
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
            </div>
          );
        })
      )}
    </div>
  );
};
