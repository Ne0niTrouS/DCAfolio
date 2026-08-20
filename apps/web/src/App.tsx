import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

import { FullPageSpinner } from '@/components/FullPageSpinner';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { AppShell } from '@/layouts/AppShell';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';

/**
 * The signed-in pages are loaded on demand: someone arriving at the login
 * screen should not download the export writer to read it. The auth pages stay
 * in the initial bundle because they are the first thing anyone sees.
 */
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
);
const HistoryPage = lazy(() =>
  import('@/pages/HistoryPage').then((module) => ({ default: module.HistoryPage })),
);
const StockDetailPage = lazy(() =>
  import('@/pages/StockDetailPage').then((module) => ({ default: module.StockDetailPage })),
);
const ExportPage = lazy(() =>
  import('@/pages/ExportPage').then((module) => ({ default: module.ExportPage })),
);

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route element={<ProtectedRoute />}>
        <Route
          element={
            <Suspense fallback={<FullPageSpinner label="Loading…" />}>
              <AppShell />
            </Suspense>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/stocks/:symbol" element={<StockDetailPage />} />
          <Route path="/export" element={<ExportPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
