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
  cardDealBadgePending,
  cardDealButton,
  cardDealButtonDisabled,
  cardCheckIcon,
  emptyMessage,
} from './StoreCardList.css';
import { getBrandBadgeClass } from './storeBadgeUtils';
import { isFlyerSupportedBrand, UNSUPPORTED_MART_FLYER_MESSAGE } from '../../utils/martSupport';
import { useToastStore } from '../../store/useToastStore';

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
  const showToast = useToastStore((state) => state.showToast);

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
      onPointerDown={(e) => {
        // 전체화면 카드 목록 스크롤 시 부모 바텀시트 drag="y"로 터치가 빼앗기지 않도록 방지
        e.stopPropagation();
      }}
      onContextMenu={(e) => {
        e.preventDefault();
      }}
    >
      {stores.length === 0 ? (
        <div className={emptyMessage}>
          {isLoading ? '마트 정보를 검색 중입니다...' : '조건에 일치하는 마트 지점이 없습니다.'}
        </div>
      ) : (
        stores.map((store) => {
          const isSelected = isStoreSelected(store.id);
          const isSupported = isFlyerSupportedBrand(store.brand);

          return (
            <motion.div
              key={store.id}
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
                {isSupported ? (
                  <div className={cardDealBadge}>
                    <Zap size={14} color="#10B981" />
                    <span>진행 중인 전단 특가 {store.activeDealCount}개</span>
                  </div>
                ) : (
                  <div className={cardDealBadgePending}>
                    <Clock size={14} color="#9CA3AF" />
                    <span>전단 서비스 준비 중</span>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isSupported) {
                      onGoToFlyerTab();
                    } else {
                      showToast(`${store.displayName || store.name}의 ${UNSUPPORTED_MART_FLYER_MESSAGE}`);
                    }
                  }}
                  className={isSupported ? cardDealButton : cardDealButtonDisabled}
                  title={isSupported ? '전단 보기' : '준비중'}
                >
                  {isSupported ? (
                    <>
                      <span>전단 보기</span>
                      <ChevronRight size={13} />
                    </>
                  ) : (
                    <span>준비중</span>
                  )}
                </motion.button>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};
