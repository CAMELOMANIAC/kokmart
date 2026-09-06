import React from 'react';
import { Users, Plus, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export const BbumCommunity: React.FC = () => {
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
    }
  ];

  return (
    <div style={{ padding: '16px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Users size={22} color="#FF5E00" />
          <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>🍕 뿜! 대용량 반반 나눔</h2>
        </div>

        <motion.button
          whileTap={{ scale: 0.9 }}
          style={{
            backgroundColor: '#FF5E00',
            color: '#FFF',
            border: 'none',
            borderRadius: '20px',
            padding: '6px 12px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer'
          }}
        >
          <Plus size={14} />
          <span>뿜 글쓰기</span>
        </motion.button>
      </header>

      <div style={{
        padding: '12px 16px',
        backgroundColor: '#ECFDF5',
        borderRadius: '12px',
        border: '1px solid #A7F3D0',
        marginBottom: '16px',
        fontSize: '13px',
        color: '#065F46'
      }}>
        💡 1+1 이나 대용량 상품을 동네 이웃과 딱 절반 1/N 가격으로 스마트하게 나누세요!
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {posts.map(post => (
          <div
            key={post.id}
            style={{
              backgroundColor: '#FFF',
              borderRadius: '12px',
              padding: '16px',
              border: '1px solid #E5E7EB',
              boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: post.status === '매칭 완료' ? '#9CA3AF' : '#10B981',
                backgroundColor: post.status === '매칭 완료' ? '#F3F4F6' : '#D1FAE5',
                padding: '3px 8px',
                borderRadius: '4px'
              }}>
                {post.status}
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>{post.location}</span>
            </div>

            <div style={{ fontSize: '15px', fontWeight: 700, marginTop: '8px' }}>
              {post.title}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FF5E00' }}>
                1인 부담금: {post.pricePerShare}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                style={{
                  backgroundColor: '#111827',
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 10px',
                  fontSize: '12px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  cursor: 'pointer'
                }}
              >
                <MessageCircle size={14} />
                <span>채팅하기</span>
              </motion.button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
