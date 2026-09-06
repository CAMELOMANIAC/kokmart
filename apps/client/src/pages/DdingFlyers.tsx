import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Upload } from 'lucide-react';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useScrollDirection } from '../hooks/useScrollDirection';
import * as s from './DdingFlyers.css';

export const DdingFlyers: React.FC = () => {
  // window 스크롤 감지 → useUIStore.isScrollingDown 업데이트 → GNB 자동 축소/펼침
  useScrollDirection();

  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState('');

  const handleSimulateParse = async () => {
    setIsParsing(true);
    setParseMessage('전단지 이미지 4분할 그리드 크롭 파싱 중...');
    
    try {
      const res = await fetch('/api/flyers/parse', { method: 'POST' });
      const data = await res.json();
      setParseMessage(`✅ Gemini 파싱 성공! ${data.products.length}개 상품 파싱 완료.`);
    } catch {
      setParseMessage('❌ 파싱 테스트 에러 발생');
    } finally {
      setIsParsing(false);
    }
  };

  const getBrandBadgeClass = (brand: string) => {
    if (brand === '이마트') return s.brandBadge.emart;
    if (brand === '홈플러스') return s.brandBadge.homeplus;
    if (brand === '롯데마트') return s.brandBadge.lotte;
    return s.brandBadge.default;
  };

  return (
    <div className={s.container}>
      {/* 상단 공통 플로팅 바 (GNB Zap 아이콘 추가) */}
      <FloatingTopBar
        title="띵! 한 핫딜"
        icon={<Zap size={18} color="#FF5E00" />}
      />

      {/* 플로팅 안내 카드 */}
      <div className={s.noticeCard}>
        <div className={s.noticeTitle}>
          📢 매주 목요일 전단 발행 알림
        </div>
        <div className={s.noticeDesc}>
          이마트·홈플러스·롯데마트의 최신 종이 전단지가 4~6분할 AI 파싱으로 자동 업데이트됩니다.
        </div>
      </div>

      {/* AI 파싱 파이프라인 시뮬레이션 플로팅 카드 */}
      <div className={s.ocrCard}>
        <h4 className={s.ocrTitle}>
          전단지 OCR 파싱 테스트 (Gemini Grid Crop Engine)
        </h4>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleSimulateParse}
          disabled={isParsing}
          className={s.ocrButton}
        >
          <Upload size={16} />
          <span>{isParsing ? '파싱 실행 중...' : '4분할 전단 파싱 테스트 실행'}</span>
        </motion.button>

        {parseMessage && (
          <div className={s.ocrMessage}>
            {parseMessage}
          </div>
        )}
      </div>

      {/* 실시간 전단 핫딜 상품 리스트 (자연스러운 스크롤 피드) */}
      <h3 className={s.sectionTitle}>
        🔥 이번 주 전단 파격 핫딜
      </h3>

      <div className={s.dealList}>
        {[
          {
            id: 'd1',
            brand: '이마트',
            martName: '이마트 역삼점',
            productName: '국내산 1등급 삼겹살 (100g)',
            originalPrice: 2480,
            salePrice: 1480,
            discountRate: '40%',
            unitPrice: '100g당 1,480원',
            badge: '🔥 초특가'
          },
          {
            id: 'd2',
            brand: '홈플러스',
            martName: '홈플러스 강남점',
            productName: '당당 두마리 옛날통닭 (1+1)',
            originalPrice: 13990,
            salePrice: 6990,
            discountRate: '50%',
            unitPrice: '1마리당 3,495원',
            badge: '⚡ 1+1 핫딜'
          },
          {
            id: 'd3',
            brand: '롯데마트',
            martName: '롯데마트 서초점',
            productName: '제주 GAP 하우스 감귤 (1.5kg/박스)',
            originalPrice: 14900,
            salePrice: 9900,
            discountRate: '33%',
            unitPrice: '100g당 660원',
            badge: '🍊 산지직송'
          },
          {
            id: 'd4',
            brand: '이마트',
            martName: '이마트 역삼점',
            productName: 'CJ 비비고 왕교자 (1.4kg 패밀리팩)',
            originalPrice: 12980,
            salePrice: 8480,
            discountRate: '35%',
            unitPrice: '100g당 605원',
            badge: '🥟 냉동 1등'
          },
          {
            id: 'd5',
            brand: '홈플러스',
            martName: '홈플러스 강남점',
            productName: '무항생제 신선 대란 (30구)',
            originalPrice: 8990,
            salePrice: 5990,
            discountRate: '33%',
            unitPrice: '1알당 200원',
            badge: '🍳 장바구니 필수'
          }
        ].map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -2 }}
            className={s.dealItemCard}
          >
            <div>
              <div className={s.brandHeader}>
                <span className={getBrandBadgeClass(item.brand)}>
                  {item.martName}
                </span>
                <span className={s.dealBadge}>
                  {item.badge}
                </span>
              </div>
              <div className={s.productName}>
                {item.productName}
              </div>
              <div className={s.unitPrice}>
                {item.unitPrice}
              </div>
            </div>

            <div className={s.priceArea}>
              <div className={s.originalPrice}>
                {item.originalPrice.toLocaleString()}원
              </div>
              <div className={s.salePriceRow}>
                <span className={s.discountRate}>
                  {item.discountRate}
                </span>
                <span className={s.salePrice}>
                  {item.salePrice.toLocaleString()}원
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
