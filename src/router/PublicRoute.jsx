// src/router/PublicRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ROUTES } from '@/constants/routes';

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.user);
  const location = useLocation();

  // If user is authenticated, redirect to overview
  if (isAuthenticated) {
    return <Navigate to={ROUTES.PROTECTED.OVERVIEW} state={{ from: location }} replace />;
  }

  return children;
};

export default PublicRoute;