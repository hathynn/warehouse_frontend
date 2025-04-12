import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES, checkRoutePermission, getDefaultRouteForRole } from '@/constants/routes';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, role } = useSelector((state) => state.user);
  const location = useLocation();
  
  // If no user is logged in, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={ROUTES.PUBLIC.LOGIN} state={{ from: location }} replace />;
  }

  // Check if user has permission to access the current route
  const currentPath = location.pathname;
  const hasPermission = checkRoutePermission(role, currentPath);

  // If no permission, redirect to default route for their role
  if (!hasPermission) {
    const defaultRoute = getDefaultRouteForRole(role);
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute; 