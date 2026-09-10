import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { containerStyle, mapContainerStyle } from './styles/theme.css';
import { Navigation } from './components/Navigation';
import { KokHome } from './pages/KokHome';
import { DdingFlyers } from './pages/DdingFlyers';
import { DdibCart } from './pages/DdibCart';
import { BbumCommunity } from './pages/BbumCommunity';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5 // 5분 캐시
    }
  }
});

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('kok');

  const isMapTab = currentTab === 'kok';

  /**
   * 탭 전환 시 body 배경색과 PWA theme-color를 동적으로 변경.
   *
   * 지도(콕) 탭:
   *   - body 배경 → transparent: 카카오 지도가 safe area(상단 상태바·하단 홈 인디케이터)까지
   *     연장되어 비치도록 함. 불투명 배경이 남아있으면 safe area가 시스템 색으로 채워짐.
   *   - theme-color → transparent: Android PWA 상태바를 투명하게 처리.
   *
   * 나머지 탭:
   *   - body 배경 → 원래 #E5E7EB 복원 (CSS 변수에서 관리하지만 inline으로 덮어쓴 것만 해제)
   *   - theme-color → #FFFFFF 복원
   */
  useEffect(() => {
    const themeColorMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');

    if (isMapTab) {
      // html + body 모두 투명하게 — safe area 뒤로 카카오 지도가 비치도록
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      if (themeColorMeta) themeColorMeta.content = 'transparent';
    } else {
      // 다른 탭 전환 시 원래 스타일 복원
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      if (themeColorMeta) themeColorMeta.content = '#FFFFFF';
    }
  }, [isMapTab]);

  const renderTabContent = () => {
    switch (currentTab) {
      case 'kok':
        return <KokHome onNavigateTab={setCurrentTab} />;
      case 'dding':
        return <DdingFlyers />;
      case 'ddib':
        return <DdibCart />;
      case 'bbum':
        return <BbumCommunity />;
      default:
        return <KokHome onNavigateTab={setCurrentTab} />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={isMapTab ? mapContainerStyle : containerStyle}>
        <main style={{ height: isMapTab ? '100%' : 'auto' }}>{renderTabContent()}</main>
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    </QueryClientProvider>
  );
};
