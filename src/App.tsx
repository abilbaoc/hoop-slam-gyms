import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import GymLayout from './layouts/GymLayout';
import AdminLayout from './layouts/AdminLayout';
import LoginPage from './pages/Auth/LoginPage';
import AuthCallbackPage from './pages/Auth/AuthCallbackPage';
import PendingPage from './pages/Auth/PendingPage';
import CookieBanner from './components/ui/CookieBanner';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

// Páginas con code-splitting: cada una va en su propio chunk (recharts solo
// se descarga al entrar en el Dashboard, no en el login).
const OverviewPage = lazy(() => import('./pages/Overview/OverviewPage'));
const CourtsPage = lazy(() => import('./pages/Courts/CourtsPage'));
const CourtDetailPage = lazy(() => import('./pages/Courts/CourtDetailPage'));
const GymProfilePage = lazy(() => import('./pages/GymProfile/GymProfilePage'));
const UsersPage = lazy(() => import('./pages/Users/UsersPage'));
const ReservationsPage = lazy(() => import('./pages/Reservations/ReservationsPage'));
const GestoresPage = lazy(() => import('./pages/Gestores/GestoresPage'));
const MaintenancePage = lazy(() => import('./pages/Maintenance/MaintenancePage'));
const PrivacyPolicyPage = lazy(() => import('./pages/Privacy/PrivacyPolicyPage'));
const NotificationsPage = lazy(() => import('./pages/Notifications/NotificationsPage'));
const AdminClubsPage = lazy(() => import('./pages/Admin/AdminClubsPage'));
const AdminGestoresPage = lazy(() => import('./pages/Admin/AdminGestoresPage'));

function RouteFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-[#7BFF00] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function RootRedirect() {
  const { isAuthenticated, currentUser } = useAuth();

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (currentUser?.role === 'admin') return <Navigate to="/admin/clubs" replace />;

  if (currentUser?.gymIds && currentUser.gymIds.length > 0)
    return <Navigate to={`/gym/${currentUser.gymIds[0]}/dashboard`} replace />;

  // No gymIds assigned — wait until an admin assigns this user to a club
  return <Navigate to="/pending" replace />;
}

/** Guard: solo usuarios con role === 'admin' pueden acceder a rutas /admin/* */
function AdminGuard({ children }: { children: React.ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (currentUser?.role !== 'admin') return <Navigate to="/" replace />;
  return <>{children}</>;
}

/** Guard: rutas dentro de un gym reservadas a admins (p. ej. gestores). */
function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  if (currentUser?.role !== 'admin') return <Navigate to="dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<Navigate to="/login" replace />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/onboarding" element={<Navigate to="/" replace />} />
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
        <Route path="gestores" element={<AdminOnlyRoute><GestoresPage /></AdminOnlyRoute>} />
        <Route path="profile" element={<GymProfilePage />} />
        <Route path="maintenance" element={<MaintenancePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
    </Routes>
    </Suspense>
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
