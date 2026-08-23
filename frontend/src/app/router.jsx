import { createBrowserRouter } from 'react-router-dom';
import { GlobalLayout } from './layouts/GlobalLayout';
import { PublicLayout } from './layouts/PublicLayout';
import { AuthLayout } from './layouts/AuthLayout';
import { TouristLayout } from './layouts/TouristLayout';
import { AuthorityLayout } from './layouts/AuthorityLayout';
import { AdminLayout } from './layouts/AdminLayout';

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
import { LiveTrackingPage } from '../features/tracking/pages/LiveTrackingPage';
import { CreateTripPage } from '../features/trips/pages/CreateTripPage';
import { CurrentTripPage } from '../features/trips/pages/CurrentTripPage';
import { TripHistoryPage } from '../features/trips/pages/TripHistoryPage';
import { CreateGroupPage } from '../features/groups/pages/CreateGroupPage';
import { JoinGroupPage } from '../features/groups/pages/JoinGroupPage';
import { ReportIncidentPage } from '../features/incidents/pages/ReportIncidentPage';
import { IncidentHistoryPage } from '../features/incidents/pages/IncidentHistoryPage';
import { TouristCheckinsPage } from '../features/safety/pages/TouristCheckinsPage';
import { ProfilePage } from '../features/profile/pages/ProfilePage';

import { AuthorityDashboardPage } from '../features/authority/pages/AuthorityDashboardPage';
import { AuthorityIncidentsPage } from '../features/authority/pages/AuthorityIncidentsPage';
import { AuthorityIncidentDetailsPage } from '../features/authority/pages/AuthorityIncidentDetailsPage';
import { AuthorityDispatchPage } from '../features/authority/pages/AuthorityDispatchPage';
import { AuthorityRiskZonesPage } from '../features/authority/pages/AuthorityRiskZonesPage';
import { AuthorityHazardsPage } from '../features/authority/pages/AuthorityHazardsPage';
import { AuthorityRespondersPage } from '../features/authority/pages/AuthorityRespondersPage';
import { AuthorityAnalyticsPage } from '../features/authority/pages/AuthorityAnalyticsPage';

// Pages - Admin
import { AdminAccountsPage } from '../features/admin/pages/AdminAccountsPage';
import { AdminAuditPage } from '../features/admin/pages/AdminAuditPage';
import { AdminSettingsPage } from '../features/admin/pages/AdminSettingsPage';
import { AdminIntegrationsPage } from '../features/admin/pages/AdminIntegrationsPage';
import { AdminJobsPage } from '../features/admin/pages/AdminJobsPage';

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
            element: <RoleRoute allowedRoles={['TOURIST']} />,
            children: [
              {
                element: <TouristLayout />,
                children: [
                  { path: 'dashboard', element: <TouristDashboardPage /> },
                  { path: 'tracking', element: <LiveTrackingPage /> },
                  { path: 'trips/create', element: <CreateTripPage /> },
                  { path: 'trips/current', element: <CurrentTripPage /> },
                  { path: 'trips/history', element: <TripHistoryPage /> },
                  { path: 'groups/create', element: <CreateGroupPage /> },
                  { path: 'groups/join', element: <JoinGroupPage /> },
                  { path: 'incidents/report', element: <ReportIncidentPage /> },
                  { path: 'incidents/history', element: <IncidentHistoryPage /> },
                  { path: 'checkins', element: <TouristCheckinsPage /> },
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
            element: <RoleRoute allowedRoles={['DISASTER_MANAGER', 'SYSTEM_ADMIN']} />,
            children: [
              {
                element: <AuthorityLayout />,
                children: [
                  { path: 'dashboard', element: <AuthorityDashboardPage /> },
                  { path: 'incidents', element: <AuthorityIncidentsPage /> },
                  { path: 'incidents/:id', element: <AuthorityIncidentDetailsPage /> },
                  { path: 'hazards', element: <AuthorityHazardsPage /> },
                  { path: 'dispatch', element: <AuthorityDispatchPage /> },
                  { path: 'zones', element: <AuthorityRiskZonesPage /> },
                  { path: 'responders', element: <AuthorityRespondersPage /> },
                  { path: 'analytics', element: <AuthorityAnalyticsPage /> },
                ],
              },
            ],
          },
        ],
      },
      {
        path: '/admin',
        element: <ProtectedRoute />,
        children: [
          {
            element: <RoleRoute allowedRoles={['SYSTEM_ADMIN']} />,
            children: [
              {
                element: <AdminLayout />,
                children: [
                  { path: 'accounts', element: <AdminAccountsPage /> },
                  { path: 'audit', element: <AdminAuditPage /> },
                  { path: 'integrations', element: <AdminIntegrationsPage /> },
                  { path: 'jobs', element: <AdminJobsPage /> },
                  { path: 'settings', element: <AdminSettingsPage /> },
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
