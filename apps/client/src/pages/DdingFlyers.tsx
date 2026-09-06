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
      <header style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
        <Zap size={22} color="#FF5E00" />
        <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>⚡ 띵! 전단 핫딜</h2>
      </header>

      <div style={{
        padding: '16px',
        backgroundColor: '#FFF7ED',
        borderRadius: '12px',
        border: '1px solid #FFEDD5',
        marginBottom: '20px'
      }}>
        <div style={{ fontWeight: 700, color: '#C2410C', marginBottom: '4px' }}>
          📢 매주 목요일 전단 발행 알림
        </div>
        <div style={{ fontSize: '13px', color: '#9A3412' }}>
          이마트·홈플러스·롯데마트의 최신 종이 전단지가 4~6분할 AI 파싱으로 자동 업데이트됩니다.
        </div>
      </div>

      {/* AI 파싱 파이프라인 시뮬레이션 */}
      <div style={{
        padding: '16px',
        backgroundColor: '#FFF',
        borderRadius: '12px',
        border: '1px solid #E5E7EB'
      }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: 700 }}>
          전단지 OCR 파싱 테스트 (Gemini Grid Crop Engine)
        </h4>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSimulateParse}
          disabled={isParsing}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: isParsing ? '#9CA3AF' : '#111827',
            color: '#FFF',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Upload size={16} />
          <span>{isParsing ? '파싱 실행 중...' : '4분할 전단 파싱 테스트 실행'}</span>
        </motion.button>

        {parseMessage && (
          <div style={{ marginTop: '12px', fontSize: '13px', fontWeight: 600, color: '#059669' }}>
            {parseMessage}
          </div>
        )}
      </div>
    </div>
  );
};
