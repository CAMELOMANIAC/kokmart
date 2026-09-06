import React, { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { containerStyle } from './styles/theme.css';
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

  const renderTabContent = () => {
    switch (currentTab) {
      case 'kok':
        return <KokHome />;
      case 'dding':
        return <DdingFlyers />;
      case 'ddib':
        return <DdibCart />;
      case 'bbum':
        return <BbumCommunity />;
      default:
        return <KokHome />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className={containerStyle}>
        <main>{renderTabContent()}</main>
        <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
      </div>
    </QueryClientProvider>
  );
};
