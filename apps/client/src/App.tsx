import React, { useState } from 'react';
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
