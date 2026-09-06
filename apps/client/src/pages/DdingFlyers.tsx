import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Upload } from 'lucide-react';

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
      {/* 플로팅 헤더 아일랜드 */}
      <header style={{
        margin: '0 0 16px 0',
        padding: '14px 20px',
        backgroundColor: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.7)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}>
        <Zap size={22} color="#FF5E00" />
        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#111827' }}>⚡ 띵! 전단 핫딜</h2>
      </header>

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
    </div>
  );
};
