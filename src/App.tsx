import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GymLayout from './layouts/GymLayout';
import OverviewPage from './pages/Overview/OverviewPage';
import CourtsPage from './pages/Courts/CourtsPage';
import CourtDetailPage from './pages/Courts/CourtDetailPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import GymListPage from './pages/GymList/GymListPage';
import GymProfilePage from './pages/GymProfile/GymProfilePage';
import UsersPage from './pages/Users/UsersPage';
import ReservationsPage from './pages/Reservations/ReservationsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import PrivacyPolicyPage from './pages/Privacy/PrivacyPolicyPage';
import ClubMembersPage from './pages/ClubMembers/ClubMembersPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import AdminClubsPage from './pages/Admin/AdminClubsPage';
import AdminGestoresPage from './pages/Admin/AdminGestoresPage';
import CookieBanner from './components/ui/CookieBanner';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function RootRedirect() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <GymListPage />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/admin" element={<GymLayout />}>
        <Route path="clubs" element={<AdminClubsPage />} />
        <Route path="gestores" element={<AdminGestoresPage />} />
        <Route index element={<Navigate to="clubs" replace />} />
      </Route>
      <Route path="/gym/:gymId" element={<GymLayout />}>
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="courts" element={<CourtsPage />} />
        <Route path="courts/:id" element={<CourtDetailPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="profile" element={<GymProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="members" element={<ClubMembersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1C1C1E',
              border: '1px solid #2C2C2E',
              color: '#fff',
            },
          }}
        />
        <AppRoutes />
        <CookieBanner />
      </BrowserRouter>
    </AuthProvider>
  );
}
