import { lazy } from 'react';
import type { RouteObject } from 'react-router';
import { Navigate } from 'react-router';
import { isAuthenticated } from './services/auth-service';

const PostList = lazy(() => import('./components/PostList').then(module => ({ default: module.PostList })));
const PostListInfinite = lazy(() => import('./components/PostListInfinite').then(module => ({ default: module.PostListInfinite })));
const PostListWithFilters = lazy(() => import('./components/PostListWithFilters').then(module => ({ default: module.PostListWithFilters })));
const PostListVirtualized = lazy(() => import('./components/PostListVirtualized').then(module => ({ default: module.PostListVirtualized })));
const AlarmList = lazy(() => import('./components/AlarmList').then(module => ({ default: module.AlarmList })));
const BitMEXOrderBook = lazy(() => import('./components/BitMEXOrderBook').then(module => ({ default: module.BitMEXOrderBook })));
const LoginPage = lazy(() => import('./components/LoginPage').then(module => ({ default: module.LoginPage })));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export const routes: RouteObject[] = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><PostList /></ProtectedRoute>,
  },
  {
    path: '/infinite',
    element: <ProtectedRoute><PostListInfinite /></ProtectedRoute>,
  },
  {
    path: '/filters',
    element: <ProtectedRoute><PostListWithFilters /></ProtectedRoute>,
  },
  {
    path: '/virtualized',
    element: <ProtectedRoute><PostListVirtualized /></ProtectedRoute>,
  },
  {
    path: '/alarms',
    element: <ProtectedRoute><AlarmList wsUrl="wss://echo.websocket.org" /></ProtectedRoute>,
  },
  {
    path: '/bitmex',
    element: <ProtectedRoute><BitMEXOrderBook /></ProtectedRoute>,
  },
];
