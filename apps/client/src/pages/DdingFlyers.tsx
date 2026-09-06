import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Upload } from 'lucide-react';
import { FloatingTopBar } from '../components/FloatingTopBar';

export const DdingFlyers: React.FC = () => {
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

  return (
    <div style={{ padding: '16px' }}>
      {/* 상단 공통 플로팅 바 (GNB Zap 아이콘 추가) */}
      <FloatingTopBar
        title="띵! 한 핫딜"
        icon={<Zap size={18} color="#FF5E00" />}
      />

      {/* 플로팅 안내 카드 */}
      <div style={{
        padding: '18px',
        backgroundColor: '#FFF7ED',
        borderRadius: '20px',
        border: '1px solid #FFEDD5',
        boxShadow: '0 6px 18px rgba(255, 94, 0, 0.06)',
        marginBottom: '16px'
      }}>
        <div style={{ fontWeight: 700, color: '#C2410C', marginBottom: '4px', fontSize: '14px' }}>
          📢 매주 목요일 전단 발행 알림
        </div>
        <div style={{ fontSize: '13px', color: '#9A3412', lineHeight: '1.4' }}>
          이마트·홈플러스·롯데마트의 최신 종이 전단지가 4~6분할 AI 파싱으로 자동 업데이트됩니다.
        </div>
      </div>

      {/* AI 파싱 파이프라인 시뮬레이션 플로팅 카드 */}
      <div style={{
        padding: '20px',
        backgroundColor: '#FFF',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.8)',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)'
      }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: '15px', fontWeight: 700, color: '#1F2937' }}>
          전단지 OCR 파싱 테스트 (Gemini Grid Crop Engine)
        </h4>

        <motion.button
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.02 }}
          onClick={handleSimulateParse}
          disabled={isParsing}
          style={{
            width: '100%',
            padding: '14px',
            backgroundColor: isParsing ? '#9CA3AF' : '#111827',
            color: '#FFF',
            border: 'none',
            borderRadius: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(17, 24, 39, 0.15)'
          }}
        >
          <Upload size={16} />
          <span>{isParsing ? '파싱 실행 중...' : '4분할 전단 파싱 테스트 실행'}</span>
        </motion.button>

        {parseMessage && (
          <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 600, color: '#059669' }}>
            {parseMessage}
          </div>
        )}
      </div>

      {/* 실시간 전단 핫딜 상품 리스트 (자연스러운 스크롤 피드) */}
      <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '20px 4px 12px 4px', color: '#374151' }}>
        🔥 이번 주 전단 파격 핫딜
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
            style={{
              padding: '16px 18px',
              backgroundColor: '#FFF',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    backgroundColor: item.brand === '이마트' ? '#FEF3C7' : item.brand === '홈플러스' ? '#FEE2E2' : '#FEE2E2',
                    color: item.brand === '이마트' ? '#B45309' : '#B91C1C'
                  }}
                >
                  {item.martName}
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF5E00' }}>
                  {item.badge}
                </span>
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#111827' }}>
                {item.productName}
              </div>
              <div style={{ fontSize: '12px', color: '#6B7280', marginTop: '3px' }}>
                {item.unitPrice}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', color: '#9CA3AF', textDecoration: 'line-through' }}>
                {item.originalPrice.toLocaleString()}원
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-end' }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }}>
                  {item.discountRate}
                </span>
                <span style={{ fontSize: '17px', fontWeight: 800, color: '#111827' }}>
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
