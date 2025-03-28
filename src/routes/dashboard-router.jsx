import { DEPARTMENT_ROUTER, USER_ROUTER } from "@/constants/routes";
import Overview from "@/components/overview";
import { Navigate } from "react-router-dom";
import ImportProductList from "@/pages/dashboard/import/import-product-list";
import ImportRequestList from "@/pages/dashboard/import/import-request-list";
import ImportRequestDetail from "@/pages/dashboard/import/import-request-detail";
import ImportCreateProduct from "@/pages/dashboard/import/import-product-create";
import ImportOrderCreate from "@/pages/dashboard/import/import-order-create";
import ImportRequestCreate from "@/pages/dashboard/import/import-request-create";
import ImportOrderList from "@/pages/dashboard/import/import-order-list";
import ImportOrderDetail from "@/pages/dashboard/import/import-order-detail";
import ExportRequestList from "@/pages/dashboard/export/export-request-list";
import ExportRequestCreate from "@/pages/dashboard/export/export-request-create";
import ExportRequestDetail from "@/pages/dashboard/export/export-request-detail";
// import ImportOrderDetail from "@/pages/dashboard/import/import-order-detail";

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
    path: DEPARTMENT_ROUTER.IMPORT.ORDER.CREATE__FROM_IMPORT_REQUEST_ID(),
    element: <ImportOrderCreate />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.ORDER.LIST_FROM_IMPORT_REQUEST_ID(),
    element: <ImportOrderList />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.ORDER.DETAIL(),
    element: <ImportOrderDetail />,
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

  {
    path: DEPARTMENT_ROUTER.EXPORT.REQUEST.LIST,
    element: <ExportRequestList />,
  },
  {
    path: DEPARTMENT_ROUTER.EXPORT.REQUEST.CREATE,
    element: <ExportRequestCreate />,
  },
  {
    path: DEPARTMENT_ROUTER.EXPORT.REQUEST.DETAIL(),
    element: <ExportRequestDetail />,
  },
];

export default dashboardRouter;
