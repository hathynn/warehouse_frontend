import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROLE_DEFAULT_ROUTES, ROUTES, ROUTE_PERMISSIONS } from '@/constants/routes';
import { AccountRole } from '@/constants/account-roles';
import { RootState } from '@/redux/store';

// Helper function to check permission
const checkRoutePermission = (role: AccountRole, pathname: string): boolean => {
  const permissions = ROUTE_PERMISSIONS[role] || [];
  return permissions.some((permission) => {
    const permissionPattern = permission.replace(/:id/g, "[^/]+");
    const regex = new RegExp(`^${permissionPattern}$`);
    return regex.test(pathname);
  });
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, role } = useSelector((state: RootState) => state.user);
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
    const defaultRoute = ROLE_DEFAULT_ROUTES[role] || "/overview";
    return <Navigate to={defaultRoute} replace />;
  }

  return children;
};

export default ProtectedRoute; 