import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { useAuth } from '@/features/auth/AuthProvider';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/client/DashboardPage';
import { CatalogPage } from '@/features/client/CatalogPage';
import { FormationPage } from '@/features/client/FormationPage';
import { ProfilePage } from '@/features/client/ProfilePage';

// Admin area is code-split: clients never download it.
const AdminLayout = lazy(() => import('@/components/layout/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminDashboardPage = lazy(() => import('@/features/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })));
const FormationsListPage = lazy(() => import('@/features/admin/FormationsListPage').then((m) => ({ default: m.FormationsListPage })));
const FormationEditorPage = lazy(() => import('@/features/admin/FormationEditorPage').then((m) => ({ default: m.FormationEditorPage })));
const PacksPage = lazy(() => import('@/features/admin/PacksPage').then((m) => ({ default: m.PacksPage })));
const ClientsPage = lazy(() => import('@/features/admin/ClientsPage').then((m) => ({ default: m.ClientsPage })));
const ClientDetailPage = lazy(() => import('@/features/admin/ClientDetailPage').then((m) => ({ default: m.ClientDetailPage })));

/** "/" is the student dashboard; admins are sent straight to the admin panel. */
function HomeRoute() {
  const { isAdmin } = useAuth();
  return isAdmin ? <Navigate to="/admin" replace /> : <DashboardPage />;
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route index element={<HomeRoute />} />
            <Route path="catalog" element={<CatalogPage />} />
            <Route path="formation/:slug" element={<FormationPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute adminOnly />}>
          <Route path="admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboardPage />} />
            <Route path="formations" element={<FormationsListPage />} />
            <Route path="formations/:id" element={<FormationEditorPage />} />
            <Route path="packs" element={<PacksPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="clients/:id" element={<ClientDetailPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
