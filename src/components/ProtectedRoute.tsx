import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute = () => {
  // Check for JWT token existence
  const token = localStorage.getItem('yp_admin_token');

  if (!token) {
    // Redirect to login page if not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render child routes (AdminPage) if authenticated
  return <Outlet />;
};
