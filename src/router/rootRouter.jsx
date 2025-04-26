import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';
import DashboardLayout from '@/layouts/dashboard-layout';
import AuthLayout from '@/layouts/auth-layout';
import { ROUTES } from '@/constants/routes';
import ProtectedRoute from '@/router/ProtectedRoute';
import SomethingWrong from '@/components/something-wrong';
import PublicRoute from '@/router/PublicRoute';

// Auth pages
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';

// Dashboard pages
import Overview from '@/components/overview';
import ItemList from '@/pages/dashboard/item/item-list';
import ItemCreate from '@/pages/dashboard/item/item-create';
import ImportRequestList from '@/pages/dashboard/import/import-request-list';
import ImportRequestDetail from '@/pages/dashboard/import/import-request-detail';
import ImportRequestCreate from '@/pages/dashboard/import/import-request-create';
import ImportOrderList from '@/pages/dashboard/import/import-order-list';
import ImportOrderDetail from '@/pages/dashboard/import/import-order-detail';
import ImportOrderCreate from '@/pages/dashboard/import/import-order-create';
import ExportRequestList from '@/pages/dashboard/export/export-request-list';
import ExportRequestDetail from '@/pages/dashboard/export/export-request-detail';
import ExportRequestCreate from '@/pages/dashboard/export/export-request-create';
import InventoryItemList from '@/pages/dashboard/inventory-item';
import ConfigurationPage from '@/pages/dashboard/configuration';

export const rootRouter = createBrowserRouter([
  {
    errorElement: <SomethingWrong />,
    children: [
      // Add root route
      {
        path: '/',
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
            path: ROUTES.PROTECTED.INVENTORY_ITEM.LIST,
            element: <InventoryItemList />,
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
        ],
      },
    ],
  },
]);

export default rootRouter;
