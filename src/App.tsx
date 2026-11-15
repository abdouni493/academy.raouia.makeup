import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { PageLoader } from '@/components/ui';
import { ClientLayout } from '@/components/layout/ClientLayout';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage';
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

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<ClientLayout />}>
            <Route index element={<DashboardPage />} />
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
