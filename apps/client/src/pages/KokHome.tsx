import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useCartStore } from '../store/useCartStore';
import {
  header,
  logoText,
  martFilterContainer,
  martChip,
  martChipActive,
  cardList,
  productCard,
  tipBadge,
  tipMartBest,
  tipCoupangBulk
} from './KokHome.css';
import { ParsedProduct } from '@kokmart/shared';
import { ShoppingBag, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';

export const KokHome: React.FC = () => {
  const { selectedMarts, toggleMart, addToCart } = useCartStore();

  const { data, isLoading } = useQuery<{ success: boolean; products: ParsedProduct[] }>({
    queryKey: ['compareProducts'],
    queryFn: async () => {
      const res = await fetch('/api/products/compare');
      return res.json();
    }
  });

  const products = data?.products || [];

  return (
    <div>
      {/* 플로팅 헤더 */}
      <header className={header}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className={logoText}>Kokmart 🎯</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: '#6B7280', fontWeight: 600 }}>
            <MapPin size={15} color="#FF5E00" />
            <span>강남구 역삼지점</span>
          </div>
        </div>
      </header>

      {/* 플로팅 마트 3사 ON/OFF 토글 칩 */}
      <div className={martFilterContainer}>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => toggleMart('emart')}
          className={`${martChip} ${selectedMarts.emart ? martChipActive : ''}`}
        >
          이마트 ON
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => toggleMart('homeplus')}
          className={`${martChip} ${selectedMarts.homeplus ? martChipActive : ''}`}
        >
          홈플러스 ON
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={() => toggleMart('lottemart')}
          className={`${martChip} ${selectedMarts.lottemart ? martChipActive : ''}`}
        >
          롯데마트 ON
        </motion.button>
      </div>

      <div className={cardList}>
        <h3 style={{ margin: '8px 4px 4px 4px', fontSize: '15px', fontWeight: 700, color: '#374151' }}>
          주변 마트 단위당 최저가 큐레이션
        </h3>

        {isLoading ? (
          <div style={{ textAlign: 'center', padding: '32px', color: '#9CA3AF' }}>최저가 파싱 중...</div>
        ) : (
          products.map((item, idx) => (
            <motion.div
              key={item.id || idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -3 }}
              className={productCard}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <span className={`${tipBadge} ${item.smartTip.tipType === 'COUPANG_BULK' ? tipCoupangBulk : tipMartBest}`}>
                  {item.smartTip.badgeText}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#FF5E00' }}>
                  [{item.martName}]
                </span>
              </div>

              <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>
                {item.productName}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '14px' }}>
                <div>
                  <span style={{ fontSize: '20px', fontWeight: 800, color: '#111827' }}>
                    {item.salePrice.toLocaleString()}원
                  </span>
                  <span style={{ fontSize: '12px', color: '#6B7280', marginLeft: '6px' }}>
                    ({item.unitMeasure}당 {item.effectiveUnitPrice}원)
                  </span>
                </div>

                <motion.button
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  onClick={() => addToCart(item)}
                  style={{
                    backgroundColor: '#FF5E00',
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 4px 12px rgba(255, 94, 0, 0.25)'
                  }}
                >
                  <ShoppingBag size={14} />
                  <span>띱 담기</span>
                </motion.button>
              </div>

              {/* Mart-First 플로팅 스마트 팁 박스 */}
              <div style={{
                marginTop: '14px',
                padding: '12px 14px',
                borderRadius: '16px',
                backgroundColor: item.smartTip.tipType === 'COUPANG_BULK' ? '#F0F9FF' : '#FEFCE8',
                fontSize: '12px',
                lineHeight: '1.4',
                color: item.smartTip.tipType === 'COUPANG_BULK' ? '#1E40AF' : '#854D0E',
                border: item.smartTip.tipType === 'COUPANG_BULK' ? '1px solid #DBEAFE' : '1px solid #FEF08A'
              }}>
                💡 <strong>알뜰 팁:</strong> {item.smartTip.tipMessage}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
