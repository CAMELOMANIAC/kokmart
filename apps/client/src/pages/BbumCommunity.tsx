import React from 'react';
import { Users, Plus, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useScrollDirection } from '../hooks/useScrollDirection';

export const BbumCommunity: React.FC = () => {
  // window 스크롤 감지 → useUIStore.isScrollingDown 업데이트 → GNB 자동 축소/펼침
  useScrollDirection();

  const posts = [
    {
      id: 1,
      title: '트레이더스 삼겹살 2.5kg 1/N 소분 나눔해요!',
      location: '역삼1동',
      pricePerShare: '14,000원 (1.25kg)',
      author: '장보기고수',
      status: '매칭 진행중'
    },
    {
      id: 2,
      title: '코스트코 베이글 1+1 (플레인/어니언) 한 봉지씩!',
      location: '역삼2동',
      pricePerShare: '4,500원',
      author: '빵순이',
      status: '매칭 완료'
    },
    {
      id: 3,
      title: '이마트 프리미엄 샤인머스캣 3송이 1송이씩 나누실 분!',
      location: '역삼1동',
      pricePerShare: '5,000원 (1송이)',
      author: '과일사랑',
      status: '매칭 진행중'
    },
    {
      id: 4,
      title: '노브랜드 냉동 닭가슴살 2kg 딱 절반 1kg 가져가세요~',
      location: '도곡동',
      pricePerShare: '6,200원 (1kg)',
      author: '헬린이',
      status: '매칭 진행중'
    },
    {
      id: 5,
      title: '쿠팡 롤화장지 30롤 15롤씩 반반 나눠요 (문앞거래)',
      location: '역삼2동',
      pricePerShare: '7,500원 (15롤)',
      author: '자취달인',
      status: '매칭 완료'
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      {/* 상단 공통 플로팅 바 (GNB Users 아이콘 추가) */}
      <FloatingTopBar
        title="뿜! 함께 나눔"
        icon={<Users size={18} color="#FF5E00" />}
      />

      {/* 플로팅 안내 카드 & 뿜 글쓰기 */}
      <div style={{
        padding: '14px 18px',
        backgroundColor: '#ECFDF5',
        borderRadius: '20px',
        border: '1px solid #A7F3D0',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        <div style={{ fontSize: '13px', color: '#065F46', lineHeight: '1.4' }}>
          💡 1+1 이나 대용량 상품을 동네 이웃과 딱 절반 1/N 가격으로 나누세요!
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          style={{
            backgroundColor: '#059669',
            color: '#FFF',
            border: 'none',
            borderRadius: '16px',
            padding: '8px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.25)'
          }}
        >
          <Plus size={14} />
          <span>뿜 글쓰기</span>
        </motion.button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {posts.map(post => (
          <motion.div
            key={post.id}
            whileHover={{ y: -2 }}
            style={{
              backgroundColor: '#FFF',
              borderRadius: '24px',
              padding: '20px',
              border: '1px solid rgba(255, 255, 255, 0.8)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: post.status === '매칭 완료' ? '#9CA3AF' : '#10B981',
                backgroundColor: post.status === '매칭 완료' ? '#F3F4F6' : '#D1FAE5',
                padding: '4px 10px',
                borderRadius: '12px'
              }}>
                {post.status}
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>{post.location}</span>
            </div>

            <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '10px', color: '#111827' }}>
              {post.title}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF5E00' }}>
                1인 부담금: {post.pricePerShare}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                style={{
                  backgroundColor: '#111827',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(17, 24, 39, 0.15)'
                }}
              >
                <MessageCircle size={14} />
                <span>채팅하기</span>
              </motion.button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
