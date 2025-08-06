import { createBrowserRouter, Outlet, Navigate } from "react-router-dom";
import DashboardLayout from "@/layouts/dashboard-layout";
import AuthLayout from "@/layouts/auth-layout";
import { ROUTES } from "@/constants/routes";
import ProtectedRoute from "@/router/ProtectedRoute";
import SomethingWrong from "@/components/something-wrong/SomethingWrong";
import PublicRoute from "@/router/PublicRoute";

// Auth pages
import Login from "@/pages/auth/login";
import Register from "@/pages/auth/register";

// Dashboard pages
import Overview from "@/pages/dashboard/overview";
import ItemList from "@/pages/dashboard/item/item-list";
import ItemCreate from "@/pages/dashboard/item/item-create";
import ItemDetail from "@/pages/dashboard/item/item-detail";
import InventoryItemList from "@/pages/dashboard/inventory-item/inventory-item-list";
import ImportRequestList from "@/pages/dashboard/import/import-request-list";
import ImportRequestDetail from "@/pages/dashboard/import/import-request-detail";
import ImportRequestCreate from "@/pages/dashboard/import/import-request-create";
import ImportOrderList from "@/pages/dashboard/import/import-order-list";
import ImportOrderDetail from "@/pages/dashboard/import/import-order-detail";
import ImportOrderCreate from "@/pages/dashboard/import/import-order-create";
import ExportRequestList from "@/pages/dashboard/export/export-request-list";
import ExportRequestDetail from "@/pages/dashboard/export/export-request-detail";
import ExportRequestCreate from "@/pages/dashboard/export/export-request-create";
import StockCheckRequestCreate from "@/pages/dashboard/stock-check/stock-check-create";
import StockCheckRequestList from "@/pages/dashboard/stock-check/stock-check-list";
import StockCheckRequestDetail from "@/pages/dashboard/stock-check/stock-check-detail";
import ConfigurationPage from "@/pages/dashboard/configuration";
import ImportTransactionHistory from "@/pages/dashboard/transaction/import";
import WarehouseSection from "@/pages/dashboard/inventory-item/warehouse-section";

export const Router = createBrowserRouter([
  {
    errorElement: <SomethingWrong />,
    children: [
      {
        path: "/",
        element: <Navigate to={ROUTES.PROTECTED.OVERVIEW} replace />,
      },
      // Public routes
      {
        element: <AuthLayout />,
        children: [
          {
            path: ROUTES.PUBLIC.LOGIN,
            element: (
              <PublicRoute>
                <Login />
              </PublicRoute>
            ),
          },
          {
            path: ROUTES.PUBLIC.REGISTER,
            element: (
              <PublicRoute>
                <Register />
              </PublicRoute>
            ),
          },
        ],
      },

      // Protected routes
      {
        element: (
          <ProtectedRoute>
            <DashboardLayout>
              <Outlet />
            </DashboardLayout>
          </ProtectedRoute>
        ),
        children: [
          {
            path: ROUTES.PROTECTED.OVERVIEW,
            element: <Overview />,
          },

          // Item routes
          {
            path: ROUTES.PROTECTED.ITEM.LIST,
            element: <ItemList />,
          },
          {
            path: ROUTES.PROTECTED.ITEM.CREATE,
            element: <ItemCreate />,
          },
          {
            path: ROUTES.PROTECTED.ITEM.DETAIL(),
            element: <ItemDetail />,
          },
          {
            path: ROUTES.PROTECTED.INVENTORY_ITEM.LIST,
            element: <InventoryItemList />,
          },
          {
            path: ROUTES.PROTECTED.INVENTORY_ITEM.WAREHOUSE_SECTION,
            element: <WarehouseSection />,
          },
          // Import routes
          {
            path: ROUTES.PROTECTED.IMPORT.REQUEST.LIST,
            element: <ImportRequestList />,
          },
          {
            path: ROUTES.PROTECTED.IMPORT.REQUEST.CREATE,
            element: <ImportRequestCreate />,
          },
          {
            path: ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(),
            element: <ImportRequestDetail />,
          },
          {
            path: ROUTES.PROTECTED.IMPORT.ORDER.LIST,
            element: <ImportOrderList />,
          },
          {
            path: ROUTES.PROTECTED.IMPORT.ORDER.LIST_FROM_REQUEST(),
            element: <ImportOrderList />,
          },
          {
            path: ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(),
            element: <ImportOrderCreate />,
          },
          {
            path: ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(),
            element: <ImportOrderDetail />,
          },

          // Export routes
          {
            path: ROUTES.PROTECTED.EXPORT.REQUEST.LIST,
            element: <ExportRequestList />,
          },
          {
            path: ROUTES.PROTECTED.EXPORT.REQUEST.CREATE,
            element: <ExportRequestCreate />,
          },
          {
            path: ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(),
            element: <ExportRequestDetail />,
          },
          {
            path: ROUTES.PROTECTED.CONFIGURATION.LIST,
            element: <ConfigurationPage />,
          },

          //Stock-check routes
          {
            path: ROUTES.PROTECTED.STOCK_CHECK.REQUEST.CREATE,
            element: <StockCheckRequestCreate />,
          },
          {
            path: ROUTES.PROTECTED.STOCK_CHECK.REQUEST.LIST,
            element: <StockCheckRequestList />,
          },
          {
            path: ROUTES.PROTECTED.STOCK_CHECK.REQUEST.DETAIL(),
            element: <StockCheckRequestDetail />,
          },

          // Transaction Log routes
          {
            path: ROUTES.PROTECTED.TRANSACTION_LOGS.IMPORT,
            element: <ImportTransactionHistory />,
          },
        ],
      },
    ],
  },
]);

export default Router;
