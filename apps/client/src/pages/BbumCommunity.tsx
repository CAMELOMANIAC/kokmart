import React from 'react';
import { Users, Plus, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { FloatingTopBar } from '../components/FloatingTopBar';
import { useScrollDirection } from '../hooks/useScrollDirection';
import * as s from './BbumCommunity.css';

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
    <div className={s.container}>
      {/* 상단 공통 플로팅 바 (GNB Users 아이콘 추가) */}
      <FloatingTopBar
        title="뿜! 함께 나눔"
        icon={<Users size={18} color="#FF5E00" />}
      />

      {/* 플로팅 안내 카드 & 뿜 글쓰기 */}
      <div className={s.bannerCard}>
        <div className={s.bannerText}>
          💡 1+1 이나 대용량 상품을 동네 이웃과 딱 절반 1/N 가격으로 나누세요!
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.05 }}
          className={s.writeButton}
        >
          <Plus size={14} />
          <span>뿜 글쓰기</span>
        </motion.button>
      </div>

      <div className={s.postList}>
        {posts.map(post => (
          <motion.div
            key={post.id}
            whileHover={{ y: -2 }}
            className={s.postCard}
          >
            <div className={s.postHeader}>
              <span
                className={
                  post.status === '매칭 완료'
                    ? s.statusBadge.completed
                    : s.statusBadge.inProgress
                }
              >
                {post.status}
              </span>
              <span className={s.locationText}>{post.location}</span>
            </div>

            <div className={s.postTitle}>
              {post.title}
            </div>

            <div className={s.postFooter}>
              <div className={s.priceText}>
                1인 부담금: {post.pricePerShare}
              </div>

              <motion.button
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                className={s.chatButton}
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
