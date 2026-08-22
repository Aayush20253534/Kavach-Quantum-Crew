import { createBrowserRouter } from 'react-router-dom';
import { GlobalLayout } from './layouts/GlobalLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { TouristLayout } from './layouts/TouristLayout';
import { AuthorityLayout } from './layouts/AuthorityLayout';

// Guards
import { PublicRoute } from './guards/PublicRoute';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleRoute } from './guards/RoleRoute';
import { OnboardingRoute } from './guards/OnboardingRoute';

// Pages - Public
import { HomePage } from '../features/public/pages/HomePage';
import { NotFoundPage } from '../features/public/pages/NotFoundPage';

// Pages - Auth
import LoginPage from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { VerifyEmailPage } from '../features/auth/pages/VerifyEmailPage';

// Pages - Onboarding
import { OnboardingPage } from '../features/onboarding/pages/OnboardingPage';

// Pages - Tourist
import { TouristDashboardPage } from '../features/tourist/pages/TouristDashboardPage';
import { CreateTripPage } from '../features/trips/pages/CreateTripPage';
import { CurrentTripPage } from '../features/trips/pages/CurrentTripPage';
import { TripHistoryPage } from '../features/trips/pages/TripHistoryPage';
import { CreateGroupPage } from '../features/groups/pages/CreateGroupPage';
import { JoinGroupPage } from '../features/groups/pages/JoinGroupPage';
import { ReportIncidentPage } from '../features/incidents/pages/ReportIncidentPage';
import { IncidentHistoryPage } from '../features/incidents/pages/IncidentHistoryPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';

// Pages - Authority
import { AuthorityDashboardPage } from '../features/authority/pages/AuthorityDashboardPage';

export const router = createBrowserRouter([
  {
    element: <GlobalLayout />,
    children: [
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
          {
            element: <PublicRoute />,
            children: [
              { path: 'login', element: <LoginPage /> },
              { path: 'register', element: <RegisterPage /> },
            ],
          },
          { path: 'verify-email', element: <VerifyEmailPage /> },
        ],
      },
      {
        element: <OnboardingRoute />,
        children: [
          { path: 'onboarding', element: <OnboardingPage /> },
        ],
      },
      {
        path: '/tourist',
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute allowedRoles={['TOURIST', 'ADMIN', 'AUTHORITY']} />,
            children: [
              {
                element: <TouristLayout />,
                children: [
                  { path: 'dashboard', element: <TouristDashboardPage /> },
                  { path: 'trips/create', element: <CreateTripPage /> },
                  { path: 'trips/current', element: <CurrentTripPage /> },
                  { path: 'trips/history', element: <TripHistoryPage /> },
                  { path: 'groups/create', element: <CreateGroupPage /> },
                  { path: 'groups/join', element: <JoinGroupPage /> },
                  { path: 'incidents/report', element: <ReportIncidentPage /> },
                  { path: 'incidents/history', element: <IncidentHistoryPage /> },
                  { path: 'profile', element: <ProfilePage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '/authority',
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute allowedRoles={['AUTHORITY', 'ADMIN', 'TOURIST']} />,
            children: [
              {
                element: <AuthorityLayout />,
                children: [
                  { path: 'dashboard', element: <AuthorityDashboardPage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ]
  }
]);
