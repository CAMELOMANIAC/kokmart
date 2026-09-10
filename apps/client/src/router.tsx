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
