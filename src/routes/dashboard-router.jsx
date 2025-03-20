import { DEPARTMENT_ROUTER, USER_ROUTER } from "@/constants/routes";
import Overview from "@/components/overview";
import { Navigate } from "react-router-dom";
import ImportProductList from "@/pages/dashboard/import/import-product-list";
import ImportRequestList from "@/pages/dashboard/import/import-request-list";
import ImportRequestDetail from "@/pages/dashboard/import/import-request-detail";
import ImportCreateProduct from "@/pages/dashboard/import/import-create-product";
import ImportOrderCreate from "@/pages/dashboard/import/import-order-create";
import ImportRequestCreate from "@/pages/dashboard/import/import-request-create";

const dashboardRouter = [
  {
    path: "/",
    element: <Navigate to={`/${DEPARTMENT_ROUTER.OVERVIEW}`} replace />,
  },
  {
    path: USER_ROUTER.HOME,
    element: <Navigate to={`/${DEPARTMENT_ROUTER.OVERVIEW}`} replace />,
  },
  {
    path: DEPARTMENT_ROUTER.OVERVIEW,
    element: <Overview />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.ROOT,
    element: <ImportProductList />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.REQUEST.CREATE,
    element: <ImportRequestCreate />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.ORDER.CREATE,
    element: <ImportOrderCreate />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.REQUEST.LIST,
    element: <ImportRequestList />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.REQUEST.DETAIL(),
    element: <ImportRequestDetail />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.PRODUCT.CREATE,
    element: <ImportCreateProduct />,
  },
];

export default dashboardRouter;
