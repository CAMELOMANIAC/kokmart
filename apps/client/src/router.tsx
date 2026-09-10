import React from 'react';
import {
  createRootRoute,
  createRoute,
  createRouter,
  createHashHistory,
  Outlet,
  ScrollRestoration,
  useLocation
} from '@tanstack/react-router';
import {
  containerStyle,
  mapContainerStyle,
  mainContent,
  mainContentMap
} from './styles/theme.css';
import { Navigation } from './components/Navigation';
import { KokHome } from './pages/KokHome';
import { DdingFlyers } from './pages/DdingFlyers';
import { DdibCart } from './pages/DdibCart';
import { BbumCommunity } from './pages/BbumCommunity';
import './styles/transitions.css';

const RootComponent: React.FC = () => {
  const location = useLocation();
  const isMapTab = location.pathname === '/';

  // 1. 라우트별 상태표시줄 & html/body 배경색 동적 동기화
  React.useEffect(() => {
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (isMapTab) {
      // 지도 탭: html·body 모두 투명하게 → 카카오 지도가 safe area까지 비치도록
      // #FFFFFF(불투명 흰색)이면 safe area가 흰색으로 막혀 지도가 가려짐
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';
      if (metaThemeColor) metaThemeColor.setAttribute('content', 'transparent');
    } else {
      // 다른 탭: 시스템 테마 배경색 복원
      document.documentElement.style.backgroundColor = '#F9FAFB';
      document.body.style.backgroundColor = '#F9FAFB';
      if (metaThemeColor) metaThemeColor.setAttribute('content', '#FFFFFF');
    }
  }, [isMapTab]);

  // 2. 모바일 풀투리프레시(새로고침) 제스처 및 단축키 새로고침 전면 차단
  React.useEffect(() => {
    let startY = 0;
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        startY = e.touches[0].clientY;
      }
    };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        const currentY = e.touches[0].clientY;
        // 최상단에서 아래로 당기는 새로고침 동작 차단
        if (window.scrollY <= 0 && currentY > startY) {
          if (e.cancelable) {
            e.preventDefault();
          }
        }
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className={isMapTab ? mapContainerStyle : containerStyle}>
      <ScrollRestoration />

      {/* 1. 지도콕 (항상 DOM 인스턴스를 유지하여 탭 전환 시 카카오맵 재요청/깜빡임 없이 0ms 즉시 표시) */}
      <div style={{ display: isMapTab ? 'contents' : 'none' }}>
        <main className={mainContentMap}>
          <KokHome isVisible={isMapTab} />
        </main>
      </div>

      {/* 2. 서브 탭 (전단 띵, 찜한 띱, 커뮤니티 뿜) */}
      {!isMapTab && (
        <main className={mainContent}>
          <Outlet />
        </main>
      )}

      <Navigation />
    </div>
  );
};

const rootRoute = createRootRoute({
  component: RootComponent
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => null
});

const ddingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dding',
  component: DdingFlyers
});

const ddibRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/ddib',
  component: DdibCart
});

const bbumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/bbum',
  component: BbumCommunity
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  ddingRoute,
  ddibRoute,
  bbumRoute
]);

const hashHistory = createHashHistory();

export const router = createRouter({
  routeTree,
  history: hashHistory,
  defaultPreload: 'intent'
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
