import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { TouristLayout } from './layouts/TouristLayout';
import { AuthorityLayout } from './layouts/AuthorityLayout';

import { HomePage } from '../features/public/pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { TouristDashboardPage } from '../features/tourist/pages/TouristDashboardPage';
import { AuthorityDashboardPage } from '../features/authority/pages/AuthorityDashboardPage';
import { NotFoundPage } from '../features/public/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  {
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/tourist',
    element: <TouristLayout />,
    children: [
      { path: 'dashboard', element: <TouristDashboardPage /> },
    ],
  },
  {
    path: '/authority',
    element: <AuthorityLayout />,
    children: [
      { path: 'dashboard', element: <AuthorityDashboardPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
