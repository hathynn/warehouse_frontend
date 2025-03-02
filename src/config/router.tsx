import DashboardLayout from "@/components/dashboard/layouts";
import Import from "@/components/dashboard/templates/import/department";
import Overview from "@/components/dashboard/templates/overview";
import { DEPARTMENT_ROUTER, USER_ROUTER } from "@/constants/routes";
import Login from "@/pages/auth/login";
import { createBrowserRouter } from "react-router-dom";

export const router = createBrowserRouter([
  {
    path: USER_ROUTER.LOGIN,
    element: <Login/>,
  },
  {
    path: "/",
    element: <DashboardLayout/>,
    children : [
      {
        path: DEPARTMENT_ROUTER.IMPORT,
        element: <Import/>,
      },
      {
        path: DEPARTMENT_ROUTER.OVERVIEW,
        element: <Overview/>,
      },
    ]
  },
]);
