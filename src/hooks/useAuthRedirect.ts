// src/hooks/useAuthRedirect.ts
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '@/contexts/redux/store'; // Thêm type này vào store.js
import { ROLE_DEFAULT_ROUTES } from '@/constants/routes';

export const useAuthRedirect = () => {
  const navigate = useNavigate();
  const { role } = useSelector((state: RootState) => state.user);

  const redirectToDefaultRoute = () => {
    const defaultRoute = ROLE_DEFAULT_ROUTES[role] || "/overview";
    navigate(defaultRoute, { replace: true });
  };

  return { redirectToDefaultRoute };
};