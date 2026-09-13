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
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');

    if (isMapTab) {
      // 지도 탭: iOS PWA/사파리에서 상단 상태표시줄(노치) 뒤로 지도가 투명하게 관통하도록 처리
      document.documentElement.style.backgroundColor = 'transparent';
      document.body.style.backgroundColor = 'transparent';

      // iOS 사파리 15+ 및 PWA는 theme-color 메타 태그가 존재하면 black-translucent를 무시하고 해당 색상으로 상태바를 덮음
      // 따라서 지도 화면에서는 theme-color 태그를 임시 제거하여 온전한 black-translucent Edge-to-Edge 활성화
      if (metaThemeColor) {
        metaThemeColor.remove();
      }
    } else {
      // 다른 탭 (전단 띵, 찜한 띱, 커뮤니티 뿜): 흰색 테마 복원
      const bgColor = '#FFFFFF';
      document.documentElement.style.backgroundColor = bgColor;
      document.body.style.backgroundColor = bgColor;

      if (!metaThemeColor) {
        metaThemeColor = document.createElement('meta');
        metaThemeColor.setAttribute('name', 'theme-color');
        document.head.appendChild(metaThemeColor);
      }
      metaThemeColor.setAttribute('content', bgColor);
    }
  }, [isMapTab]);

  // 2. 단축키 새로고침 차단 (풀투리프레시는 CSS overscroll-behavior: none으로 네이티브 처리)
  React.useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'r')) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return (
    <div className={isMapTab ? mapContainerStyle : containerStyle}>
      <ScrollRestoration />

      {/* 1. 지도콕 (항상 DOM 인스턴스를 유지하여 탭 전환 시 카카오맵 재요청/깜빡임 없이 0ms 즉시 표시) */}
      <div
        style={
          isMapTab
            ? { display: 'contents' }
            : {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                visibility: 'hidden',
                pointerEvents: 'none',
                zIndex: -1,
                opacity: 0,
              }
        }
      >
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
