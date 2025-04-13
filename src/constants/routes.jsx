import { AccountRole } from "@/hooks/useAccountService";


// Base routes
export const BASE_ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  OVERVIEW: '/overview',
};

// Định nghĩa default landing route cho mỗi role
export const ROLE_DEFAULT_ROUTES = {
  [AccountRole.DEPARTMENT]: '/import/request-list',
  [AccountRole.STAFF]: '/import/order-list',
  [AccountRole.WAREHOUSE_MANAGER]: '/export/request-list',
  [AccountRole.ACCOUNTING]: '/overview', // Thay đổi theo requirement
  [AccountRole.ADMIN]: '/overview', // Thay đổi theo requirement
};

// Route permissions mapping
export const ROUTE_PERMISSIONS = {
  [AccountRole.DEPARTMENT]: [
    // Import routes
    '/import/request-list',
    '/import/request-detail/:id',
    '/import/create-request',
    '/import/order-list/:id',
    '/import/order-detail/:id',
    '/import/create-order/:id',

    // Export routes
    '/export/request-list',
    '/export/request-detail/:id',
    '/export/create-request',

    // Item routes
    '/item/list',
    '/item/detail/:id',
    '/item/create',
  ],
  [AccountRole.STAFF]: [

  ],
  [AccountRole.WAREHOUSE_MANAGER]: [
    '/import/order-list',
    '/import/order-detail/:id'
  ],
  [AccountRole.ACCOUNTING]: [
    // Add accounting specific routes here
  ],
  [AccountRole.ADMIN]: [
    // Add admin specific routes here
  ],
};

// Helper function để kiểm tra permission
export const checkRoutePermission = (role, pathname) => {
  const permissions = ROUTE_PERMISSIONS[role] || [];
  return permissions.some(permission => {
    const permissionPattern = permission.replace(/:id/g, '[^/]+');
    const regex = new RegExp(`^${permissionPattern}$`);
    return regex.test(pathname);
  });
};

// Helper function để lấy default route cho role
export const getDefaultRouteForRole = (role) => {
  console.log(ROLE_DEFAULT_ROUTES[role]);
  return ROLE_DEFAULT_ROUTES[role] || '/overview';
};

// Route definitions
export const ROUTES = {
  // Public routes
  PUBLIC: {
    LOGIN: BASE_ROUTES.LOGIN,
    REGISTER: BASE_ROUTES.REGISTER,
  },
  
  // Protected routes
  PROTECTED: {
    OVERVIEW: BASE_ROUTES.OVERVIEW,
    
    // Import routes
    IMPORT: {
      REQUEST: {
        LIST: '/import/request-list',
        DETAIL: (id = ':importRequestId') => `/import/request-detail/${id}`,
        CREATE: '/import/create-request',
      },
      ORDER: {
        LIST_FROM_REQUEST: (id = ':importRequestId') => `/import/order-list/${id}`,
        DETAIL: (id = ':importOrderId') => `/import/order-detail/${id}`,
        CREATE_FROM_REQUEST: (id = ':importRequestId') => `/import/create-order/${id}`,
      },
    },
    
    // Export routes
    EXPORT: {
      REQUEST: {
        LIST: '/export/request-list',
        DETAIL: (id = ':exportRequestId') => `/export/request-detail/${id}`,
        CREATE: '/export/create-request',
      },
    },
    
    // Item routes
    ITEM: {
      LIST: '/item/list',
      DETAIL: (id = ':id') => `/item/detail/${id}`,
      CREATE: '/item/create',
    },
  },
};
