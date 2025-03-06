import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/layouts";
import Import from "@/components/dashboard/templates/import/department";
import Overview from "@/components/dashboard/templates/overview";
import { DEPARTMENT_ROUTER, USER_ROUTER } from "@/constants/routes";
import Login from "@/pages/auth/login";
import { useSelector } from "react-redux";
import ImportExcel from "@/components/dashboard/templates/import/importExcel";
import ReportDetail from "@/components/dashboard/templates/import/reportDetail";
import ImportProductList from "@/components/dashboard/templates/import/importProdList";
import ImportList from "@/components/dashboard/templates/import/importListReport";

const ProtectedRoute = () => {
  const user = useSelector((state) => state.user.user); // Lấy user từ Redux
  console.log(user);
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
          {
            path: DEPARTMENT_ROUTER.IMPORT_EXCEL,
            element: <ImportExcel />,
          },
          {
            path: DEPARTMENT_ROUTER.IMPORT_REPORT_DETAIL,
            element: <ReportDetail />,
          },
          {
            path: DEPARTMENT_ROUTER.IMPORT_REPORT,
            element: <ImportList />,
          },
        ],
      },
    ],
  },
]);
