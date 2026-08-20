import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { FullPageSpinner } from '@/components/FullPageSpinner';

import { useAuth } from './use-auth';

/**
 * Renders the auth-loading state until the session is resolved, so an
 * authenticated reload never flashes the login screen. The attempted path is
 * preserved and restored after a successful sign-in.
 */
export function ProtectedRoute() {
  const { status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return <FullPageSpinner />;
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
