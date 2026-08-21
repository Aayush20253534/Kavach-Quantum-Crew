import { createBrowserRouter } from 'react-router-dom';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { TouristLayout } from './layouts/TouristLayout';
import { AuthorityLayout } from './layouts/AuthorityLayout';

<<<<<<< HEAD
import { HomePage } from '../features/public/pages/HomePage';
import LoginPage from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { TouristDashboardPage } from '../features/tourist/pages/TouristDashboardPage';
import { AuthorityDashboardPage } from '../features/authority/pages/AuthorityDashboardPage';
import { NotFoundPage } from '../features/public/pages/NotFoundPage';

=======
// Guards
import { PublicRoute } from './guards/PublicRoute';
import { ProtectedRoute } from './guards/ProtectedRoute';
import { RoleRoute } from './guards/RoleRoute';
import { OnboardingRoute } from './guards/OnboardingRoute';

// Pages - Public
import { HomePage } from '../features/public/pages/HomePage';
import { NotFoundPage } from '../features/public/pages/NotFoundPage';

// Pages - Auth
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';

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

>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe
export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
    ],
  },
  {
<<<<<<< HEAD
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
=======
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
        ],
      }
    ]
  },
  {
    element: <OnboardingRoute />,
    children: [
      { path: 'onboarding', element: <OnboardingPage /> },
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe
    ],
  },
  {
    path: '/tourist',
<<<<<<< HEAD
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
=======
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['TOURIST']} />,
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
            ]
          }
        ]
      }
    ]
  },
  {
    path: '/authority',
    element: <ProtectedRoute />,
    children: [
      {
        element: <RoleRoute allowedRoles={['AUTHORITY']} />,
        children: [
          {
            element: <AuthorityLayout />,
            children: [
              { path: 'dashboard', element: <AuthorityDashboardPage /> },
            ]
          }
        ]
      }
    ]
>>>>>>> 49c12ff8e761bf868f772210a5186b9bb53cbbfe
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
