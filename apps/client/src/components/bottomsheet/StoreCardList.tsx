import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Clock, MapPin, ChevronRight, Zap, CheckCircle2, Circle } from 'lucide-react';
import type { MartStore } from '@kokmart/shared';
import { useScrollDirection } from '../../hooks/useScrollDirection';
import {
  cardListContainer,
  storeCard,
  storeCardActive,
  cardHeader,
  cardTitleRow,
  cardTitle,
  cardDistanceRow,
  cardDistance,
  cardInfoSection,
  cardInfoRow,
  cardFooter,
  cardDealBadge,
  cardDealButton,
  cardCheckIcon,
  emptyMessage,
} from './StoreCardList.css';
import { getBrandBadgeClass } from './storeBadgeUtils';

interface StoreCardListProps {
  stores: MartStore[];
  isLoading?: boolean;
  isStoreSelected: (id: string) => boolean;
  toggleStoreSelection: (store: MartStore) => void;
  onGoToFlyerTab: () => void;
}

export const StoreCardList: React.FC<StoreCardListProps> = ({
  stores,
  isLoading,
  isStoreSelected,
  toggleStoreSelection,
  onGoToFlyerTab,
}) => {
  const cardListRef = useRef<HTMLDivElement>(null);

  // 전체화면 카드리스트 스크롤 방향 감지 → isScrollingDown 업데이트
  useScrollDirection({ ref: cardListRef });

  return (
    <motion.div
      ref={cardListRef}
      key="card-view"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className={cardListContainer}
    >
      {stores.length === 0 ? (
        <div className={emptyMessage}>
          {isLoading ? '마트 정보를 검색 중입니다...' : '조건에 일치하는 마트 지점이 없습니다.'}
        </div>
      ) : (
        stores.map((store) => {
          const isSelected = isStoreSelected(store.id);

          return (
            <motion.div
              key={store.id}
              layout
              className={`${storeCard} ${isSelected ? storeCardActive : ''}`}
              onClick={() => toggleStoreSelection(store)}
            >
              <div className={cardHeader}>
                <div className={cardTitleRow}>
                  <span className={getBrandBadgeClass(store.brand)}>
                    {store.brand}
                  </span>
                  <h4 className={cardTitle}>
                    {store.displayName || store.name}
                  </h4>
                </div>

                <div className={cardDistanceRow}>
                  {store.distanceKm && (
                    <span className={cardDistance}>
                      {store.distanceKm} km
                    </span>
                  )}
                  {isSelected ? (
                    <CheckCircle2 size={20} className={cardCheckIcon} />
                  ) : (
                    <Circle size={20} color="#D1D5DB" />
                  )}
                </div>
              </div>

              <div className={cardInfoSection}>
                <div className={cardInfoRow}>
                  <Clock size={13} color="#9CA3AF" />
                  <span>오늘 영업: {store.businessHours}</span>
                </div>
                <div className={cardInfoRow}>
                  <MapPin size={13} color="#9CA3AF" />
                  <span>{store.address}</span>
                </div>
              </div>

              {/* 하단 특가 정보 요약 및 전단 핫딜 연동 버튼 */}
              <div className={cardFooter}>
                <div className={cardDealBadge}>
                  <Zap size={14} color="#10B981" />
                  <span>진행 중인 전단 특가 {store.activeDealCount}개</span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoToFlyerTab();
                  }}
                  className={cardDealButton}
                >
                  <span>전단 보기</span>
                  <ChevronRight size={13} />
                </motion.button>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};
