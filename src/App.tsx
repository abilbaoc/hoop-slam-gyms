import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GymLayout from './layouts/GymLayout';
import OverviewPage from './pages/Overview/OverviewPage';
import CourtsPage from './pages/Courts/CourtsPage';
import CourtDetailPage from './pages/Courts/CourtDetailPage';
import MatchesPage from './pages/Matches/MatchesPage';
import PlayersPage from './pages/Players/PlayersPage';
import ReportsPage from './pages/Reports/ReportsPage';
import SettingsPage from './pages/Settings/SettingsPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import GymListPage from './pages/GymList/GymListPage';
import GymProfilePage from './pages/GymProfile/GymProfilePage';
import UsersPage from './pages/Users/UsersPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import ReservationsPage from './pages/Reservations/ReservationsPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import GymMapPage from './pages/Map/GymMapPage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
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
      <Route path="/" element={<RootRedirect />} />
      <Route path="/gym/:gymId" element={<GymLayout />}>
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="courts" element={<CourtsPage />} />
        <Route path="courts/:id" element={<CourtDetailPage />} />
        <Route path="matches" element={<MatchesPage />} />
        <Route path="players" element={<PlayersPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="reports" element={<ReportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="profile" element={<GymProfilePage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="map" element={<GymMapPage />} />
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
      </BrowserRouter>
    </AuthProvider>
  );
}
