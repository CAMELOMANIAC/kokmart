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
    // 지도콕에서는 지도가 비치도록 화이트, 다른 페이지는 시스템 테마 배경색(#F9FAFB)
    const targetColor = isMapTab ? '#FFFFFF' : '#F9FAFB';
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', targetColor);
    }
    document.documentElement.style.backgroundColor = targetColor;
    document.body.style.backgroundColor = targetColor;
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
      <main className={isMapTab ? mainContentMap : mainContent}>
        <Outlet />
      </main>
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
  component: KokHome
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
