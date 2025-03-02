import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/layouts";
import Import from "@/components/dashboard/templates/import/department";
import Overview from "@/components/dashboard/templates/overview";
import { DEPARTMENT_ROUTER, USER_ROUTER } from "@/constants/routes";
import Login from "@/pages/auth/login";
import { useSelector } from "react-redux";


const ProtectedRoute = () => {
  const user = useSelector((state) => state.user.user); // Lấy user từ Redux
console.log(user)
  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export const router = createBrowserRouter([
  {
    path: USER_ROUTER.LOGIN,
    element: <Login />,
  },
  {
    path: "/",
    element: <ProtectedRoute />, // Kiểm tra đăng nhập trước khi vào Dashboard
    children: [
      {
        path: "/",
        element: <DashboardLayout />,
        children: [
          {
            path: DEPARTMENT_ROUTER.IMPORT,
            element: <Import />,
          },
          {
            path: DEPARTMENT_ROUTER.OVERVIEW,
            element: <Overview />,
          },
        ],
      },
    ],
  },
]);
