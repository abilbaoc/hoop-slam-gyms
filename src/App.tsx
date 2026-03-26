import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GymLayout from './layouts/GymLayout';
import AdminLayout from './layouts/AdminLayout';
import OverviewPage from './pages/Overview/OverviewPage';
import CourtsPage from './pages/Courts/CourtsPage';
import CourtDetailPage from './pages/Courts/CourtDetailPage';
import LoginPage from './pages/Auth/LoginPage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';
import PendingPage from './pages/Auth/PendingPage';
import GymProfilePage from './pages/GymProfile/GymProfilePage';
import UsersPage from './pages/Users/UsersPage';
import ReservationsPage from './pages/Reservations/ReservationsPage';
import GestoresPage from './pages/Gestores/GestoresPage';
import MaintenancePage from './pages/Maintenance/MaintenancePage';
import OnboardingPage from './pages/Onboarding/OnboardingPage';
import PrivacyPolicyPage from './pages/Privacy/PrivacyPolicyPage';
import NotificationsPage from './pages/Notifications/NotificationsPage';
import AdminClubsPage from './pages/Admin/AdminClubsPage';
import AdminGestoresPage from './pages/Admin/AdminGestoresPage';
import CookieBanner from './components/ui/CookieBanner';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

function RootRedirect() {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (currentUser?.role === 'admin') return <Navigate to="/admin/clubs" replace />;

  if (currentUser?.gymIds && currentUser.gymIds.length > 0)
    return <Navigate to={`/gym/${currentUser.gymIds[0]}/dashboard`} replace />;

  if (currentUser?.role === 'staff') return <Navigate to="/pending" replace />;

  // No gymIds assigned — go to default gym (Laietà) instead of onboarding
  return <Navigate to="/gym/laieta/dashboard" replace />;
}

/** Guard: solo usuarios con role === 'admin' pueden acceder a rutas /admin/* */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<OnboardingPage />} />
      <Route path="/pending" element={<PendingPage />} />
      <Route path="/privacy" element={<PrivacyPolicyPage />} />
      <Route path="/" element={<RootRedirect />} />
      <Route path="/admin" element={<AdminGuard><AdminLayout /></AdminGuard>}>
        <Route path="clubs" element={<AdminClubsPage />} />
        <Route path="gestores" element={<AdminGestoresPage />} />
        <Route index element={<Navigate to="clubs" replace />} />
      </Route>
      <Route path="/gym/:gymId" element={<GymLayout />}>
        <Route path="dashboard" element={<OverviewPage />} />
        <Route path="courts" element={<CourtsPage />} />
        <Route path="courts/:id" element={<CourtDetailPage />} />
        <Route path="reservations" element={<ReservationsPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="gestores" element={<GestoresPage />} />
        <Route path="profile" element={<GymProfilePage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
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
    </ThemeProvider>
  );
}
