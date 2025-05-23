// src/router/PublicRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/constants/routes';
import { RootState } from '@/redux/store';

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useSelector((state: RootState) => state.user);
  const location = useLocation();

  // If user is authenticated, redirect to overview
  if (isAuthenticated) {
    return <Navigate to={ROUTES.PROTECTED.OVERVIEW} state={{ from: location }} replace />;
  }

  return children;
};

export default PublicRoute;