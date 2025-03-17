import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "@/layouts/dashboard-layout";
import AuthLayout from "@/layouts/auth-layout";
import { USER_ROUTER } from "@/constants/routes";
import { useSelector } from "react-redux";
import authRouter from "./auth-router";
import dashboardRouter from "./dashboard-router";
import SomethingWrong from "@/components/something-wrong";

const ProtectedRoute = () => {
  const user = useSelector((state) => state.user.user);
  return user ? <Outlet /> : <Navigate to={`/${USER_ROUTER.LOGIN}`} replace />;
};

export const rootRouter = createBrowserRouter([
  {
    errorElement: <SomethingWrong />,
    children: [
      // Auth routes with AuthLayout
      {
        element: <AuthLayout />,
        errorElement: <SomethingWrong />,
        children: authRouter,
      },
      
      // Protected dashboard routes with DashboardLayout
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <DashboardLayout />,
            errorElement: <SomethingWrong />,
            children: dashboardRouter,
          },
        ],
      },
    ],
  },
]);

export default rootRouter;
