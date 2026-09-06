import React, { useState, useRef, useEffect } from "react";
import { useSelectedStoreStore } from "../store/useSelectedStoreStore";
import {
  topBarHome,
  topBarFull,
  topBarExpanded,
  topBarHeaderRow,
  topBarHeaderRowExpanded,
  brandTitleHome,
  pageTitle,
  locationTag,
  chipsWrapper,
  selectedChipsScroll,
  topBarPill,
  removePillButton,
  expandToggleButton,
  expandToggleButtonActive,
  expandedHeaderActions,
  storeCountBadge,
  clearAllButton,
  expandedChipsGrid,
} from "./FloatingTopBar.css";
import { MapPin, X, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FloatingTopBarProps {
  title?: string;
  icon?: React.ReactNode;
  isHome?: boolean;
}

export const FloatingTopBar: React.FC<FloatingTopBarProps> = ({ title, icon, isHome = false }) => {
  const { selectedStores, removeStoreSelection, clearStoreSelection } = useSelectedStoreStore();
  const hasSelectedStores = selectedStores.length > 0;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // 가로 스크롤 오버플로우 감지
  const checkOverflow = () => {
    if (scrollContainerRef.current) {
      const { scrollWidth, clientWidth } = scrollContainerRef.current;
      // 1px 이상의 여유 차이가 있으면 가로 스크롤 발생으로 판단
      setIsOverflowing(scrollWidth > clientWidth + 1);
    }
  };

  useEffect(() => {
    checkOverflow();
    const el = scrollContainerRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(el);

    return () => observer.disconnect();
  }, [selectedStores.length, isExpanded]);

  // 선택된 마트가 모두 제거되면 자동으로 접힘
  useEffect(() => {
    if (selectedStores.length === 0) {
      setIsExpanded(false);
    }
  }, [selectedStores.length]);

  return (
    <motion.div
      layout="position"
      transition={{ duration: 0.2 }}
      className={`${isHome ? topBarHome : topBarFull} ${isExpanded ? topBarExpanded : ""}`}
    >
      {/* 헤더 행: 타이틀 + 우측 영역 */}
      <div className={`${topBarHeaderRow} ${isExpanded ? topBarHeaderRowExpanded : ""}`}>
        {/* 좌측 타이틀: 콕홈은 마트콕 로고(주황색), 타 페이지는 GNB 아이콘 + 지정 문구(검은색) */}
        {isHome ? (
          <div className={brandTitleHome}>{title || "MartKok 🎯"}</div>
        ) : (
          <div className={pageTitle}>
            {icon}
            <span>{title}</span>
          </div>
        )}

        {/* 우측 영역 */}
        {!isExpanded ? (
          <AnimatePresence mode="wait">
            {!hasSelectedStores ? (
              /* 마트 미선택 시 기본 위치 태그 */
              <motion.div
                key="location-tag"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.15 }}
                className={locationTag}
              >
                <MapPin size={13} color="#FF5E00" />
                <span>역삼동 주변 마트</span>
              </motion.div>
            ) : (
              /* 마트 선택 시 알약 스크롤 래퍼 */
              <motion.div
                key="selected-chips-area"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.15 }}
                className={chipsWrapper}
              >
                <div ref={scrollContainerRef} className={selectedChipsScroll}>
                  {selectedStores.map((store) => (
                    <div key={store.id} className={topBarPill}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStoreSelection(store.id);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {store.name.replace(store.brand, "").trim() || store.name}
                      </span>
                      <button
                        className={removePillButton}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeStoreSelection(store.id);
                        }}
                        title="선택 해제"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* 가로 스크롤 발생 시 나타나는 확장 버튼 */}
                {isOverflowing && (
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsExpanded(true)}
                    className={expandToggleButton}
                    title="선택된 지점 모두 펼쳐보기"
                  >
                    <ChevronDown size={14} />
                  </motion.button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          /* 확장 시 우측 액션: 지점 수 뱃지 + 전체 해제 + 접기 버튼 */
          <div className={expandedHeaderActions}>
            <span className={storeCountBadge}>선택 {selectedStores.length}개</span>
            {selectedStores.length > 1 && (
              <button onClick={() => clearStoreSelection()} className={clearAllButton}>
                전체 해제
              </button>
            )}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsExpanded(false)}
              className={expandToggleButtonActive}
              title="접기"
            >
              <ChevronUp size={14} />
            </motion.button>
          </div>
        )}
      </div>

      {/* 확장 시 펼쳐지는 알약 칩 전체 멀티라인 영역 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className={expandedChipsGrid}
          >
            {selectedStores.map((store) => (
              <div key={store.id} className={topBarPill}>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStoreSelection(store.id);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {store.name.replace(store.brand, "").trim() || store.name}
                </span>
                <button
                  className={removePillButton}
                  onClick={(e) => {
                    e.stopPropagation();
                    removeStoreSelection(store.id);
                  }}
                  title="선택 해제"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
