import { DEPARTMENT_ROUTER, USER_ROUTER } from "@/constants/routes";
import Overview from "@/components/overview";
import { Navigate } from "react-router-dom";
import ImportProductList from "@/pages/dashboard/import/import-product-list";
import ImportReportList from "@/pages/dashboard/import/import-report-list";
import ImportReportDetail from "@/pages/dashboard/import/import-report-detail";
import ImportExcel from "@/pages/dashboard/import/import-excel";
import ProductForm from "@/pages/dashboard/import/import-create-product";

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
    path: DEPARTMENT_ROUTER.IMPORT.EXCEL,
    element: <ImportExcel />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.REPORT.LIST,
    element: <ImportReportList />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.REPORT.DETAIL(),
    element: <ImportReportDetail />,
  },
  {
    path: DEPARTMENT_ROUTER.IMPORT.PRODUCT.CREATE,
    element: <ProductForm />,
  },
];

export default dashboardRouter;
