import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useScrollDirection } from '../hooks/useScrollDirection';
import * as s from './DdibCart.css';

export const DdibCart: React.FC = () => {
  // window 스크롤 감지 → useUIStore.isScrollingDown 업데이트 → GNB 자동 축소/펼침
  useScrollDirection();

  const { cart, removeFromCart, clearCart, calculateSplitSavings } = useCartStore();
  const { singleMartTotal, splitTotal, savings } = calculateSplitSavings();

  return (
    <div className={s.container}>
      {/* 상단 공통 플로팅 바 (GNB Bookmark 아이콘 추가) */}
      <FloatingTopBar
        title="띱! 끼리 비교"
        icon={<Bookmark size={18} color="#FF5E00" />}
      />

      {/* 절약액 비교 플로팅 대시보드 박스 */}
      <div className={s.dashboardCard}>
        <div className={s.dashboardSubTitle}>
          단일 마트 몰아담기 vs 최적 분할 비교
        </div>

        <div className={s.comparisonRow}>
          <div>
            <div className={s.singleMartLabel}>단일 마트 구매시</div>
            <div className={s.singleMartPrice}>
              {singleMartTotal.toLocaleString()}원
            </div>
          </div>

          <ArrowRight size={20} color="#FF5E00" />

          <div>
            <div className={s.splitMartLabel}>최적 분할 구매시</div>
            <div className={s.splitMartPrice}>
              {splitTotal.toLocaleString()}원
            </div>
          </div>
        </div>

        {savings > 0 && (
          <div className={s.savingsRow}>
            <span className={s.savingsLabel}>🎉 예상 절약액:</span>
            <span className={s.savingsValue}>
              총 {savings.toLocaleString()}원 절약!
            </span>
          </div>
        )}
      </div>

      {/* 담은 띱 위시리스트 헤더 */}
      <div className={s.sectionHeader}>
        <h3 className={s.sectionTitle}>
          장바구니 띱 목록 ({cart.length}개)
        </h3>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            className={s.clearButton}
          >
            전체 비우기
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div className={s.emptyState}>
          [🎯 콕] 탭에서 원하는 최저가 상품을 띱 담아보세요!
        </div>
      ) : (
        <div className={s.cartList}>
          {cart.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -2 }}
              className={s.cartItemCard}
            >
              <div>
                <div className={s.productName}>{item.product.productName}</div>
                <div className={s.productDetail}>
                  {item.product.salePrice.toLocaleString()}원 × {item.quantity}개 ({item.product.martName})
                </div>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id || item.product.productName)}
                className={s.deleteButton}
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
