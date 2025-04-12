// src/hooks/useAuthRedirect.ts
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getDefaultRouteForRole } from '@/constants/routes';
import type { RootState } from '@/redux/store'; // Thêm type này vào store.js

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { role } = useSelector((state: RootState) => state.user);

  const redirectToDefaultRoute = () => {
    const defaultRoute = getDefaultRouteForRole(role);
    navigate(defaultRoute, { replace: true });
  };

  return { redirectToDefaultRoute };
};