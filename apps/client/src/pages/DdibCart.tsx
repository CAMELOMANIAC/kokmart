import React from 'react';
import { useCartStore } from '../store/useCartStore';
import { Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useScrollDirection } from '../hooks/useScrollDirection';

export const DdibCart: React.FC = () => {
  // window 스크롤 감지 → useUIStore.isScrollingDown 업데이트 → GNB 자동 축소/펼침
  useScrollDirection();

  const { cart, removeFromCart, clearCart, calculateSplitSavings } = useCartStore();
  const { singleMartTotal, splitTotal, savings } = calculateSplitSavings();

  return (
    <div style={{ padding: '16px' }}>
      {/* 상단 공통 플로팅 바 (GNB Bookmark 아이콘 추가) */}
      <FloatingTopBar
        title="띱! 끼리 비교"
        icon={<Bookmark size={18} color="#FF5E00" />}
      />

      {/* 절약액 비교 플로팅 대시보드 박스 */}
      <div style={{
        backgroundColor: '#111827',
        color: '#FFF',
        borderRadius: '24px',
        padding: '22px',
        marginBottom: '20px',
        boxShadow: '0 12px 32px rgba(17, 24, 39, 0.2)'
      }}>
        <div style={{ fontSize: '13px', color: '#9CA3AF', marginBottom: '4px', fontWeight: 500 }}>
          단일 마트 몰아담기 vs 최적 분할 비교
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
          <div>
            <div style={{ fontSize: '12px', color: '#D1D5DB' }}>단일 마트 구매시</div>
            <div style={{ fontSize: '18px', fontWeight: 700, textDecoration: 'line-through', color: '#9CA3AF' }}>
              {singleMartTotal.toLocaleString()}원
            </div>
          </div>

          <ArrowRight size={20} color="#FF5E00" />

          <div>
            <div style={{ fontSize: '12px', color: '#10B981', fontWeight: 700 }}>최적 분할 구매시</div>
            <div style={{ fontSize: '22px', fontWeight: 800, color: '#10B981' }}>
              {splitTotal.toLocaleString()}원
            </div>
          </div>
        </div>

        {savings > 0 && (
          <div style={{
            marginTop: '16px',
            paddingTop: '14px',
            borderTop: '1px solid #374151',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: '13px', color: '#F3F4F6' }}>🎉 예상 절약액:</span>
            <span style={{ fontSize: '17px', fontWeight: 800, color: '#FF5E00' }}>
              총 {savings.toLocaleString()}원 절약!
            </span>
          </div>
        )}
      </div>

      {/* 담은 띱 위시리스트 헤더 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 12px 4px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#374151' }}>
          장바구니 띱 목록 ({cart.length}개)
        </h3>
        {cart.length > 0 && (
          <button
            onClick={clearCart}
            style={{ border: 'none', background: 'none', color: '#9CA3AF', fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}
          >
            전체 비우기
          </button>
        )}
      </div>

      {cart.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: '#9CA3AF', fontSize: '14px' }}>
          [🎯 콕] 탭에서 원하는 최저가 상품을 띱 담아보세요!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {cart.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ y: -2 }}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '16px 18px',
                backgroundColor: '#FFF',
                borderRadius: '20px',
                border: '1px solid rgba(255, 255, 255, 0.8)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.03)'
              }}
            >
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>{item.product.productName}</div>
                <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                  {item.product.salePrice.toLocaleString()}원 × {item.quantity}개 ({item.product.martName})
                </div>
              </div>

              <button
                onClick={() => removeFromCart(item.product.id || item.product.productName)}
                style={{ border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
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
