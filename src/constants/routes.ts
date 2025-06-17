import { AccountRole } from "@/utils/enums";

// Base routes
export const BASE_ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  OVERVIEW: "/overview",
} as const;

// Default landing route for each role
export const ROLE_DEFAULT_ROUTES: Record<AccountRole, string> = {
  [AccountRole.DEPARTMENT]: "/import/request-list",
  [AccountRole.STAFF]: "/overview",
  [AccountRole.WAREHOUSE_MANAGER]: "/import/orders",
  [AccountRole.ACCOUNTING]: "/overview", // Change as per requirement
  [AccountRole.ADMIN]: "/configuration/list", // Change as per requirement
};

// Route permissions mapping
export const ROUTE_PERMISSIONS: Record<AccountRole, string[]> = {
  [AccountRole.DEPARTMENT]: [
    // Import routes
    "/import/request-list",
    "/import/request-detail/:id",
    "/import/create-request",
    "/import/order-list/:id",
    "/import/order-detail/:id",
    "/import/create-order/:id",
    "/import/orders",

    // Export routes
    "/export/request-list",
    "/export/request-detail/:id",
    "/export/create-request",

    // Inventory item routes
    "/inventory-item/list",

    // Item routes
    "/item/list",
    "/item/detail/:id",
    "/item/create",

    // Transaction log routes
    "/transaction-logs/import",
    "/transaction-logs/export",
  ],
  [AccountRole.STAFF]: [],
  [AccountRole.WAREHOUSE_MANAGER]: [
    // Import routes
    "/import/order-detail/:id",
    "/import/orders",

    // Export routes
    "/export/request-list",
    "/export/request-detail/:id",

    // Inventory item routes
    "/inventory-item/list",
  ],
  [AccountRole.ACCOUNTING]: [
    // Add accounting specific routes here
  ],
  [AccountRole.ADMIN]: [
    // Add admin specific routes here
    "/configuration/list"
  ],
}

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
        LIST: "/import/request-list",
        DETAIL: (id: string = ":importRequestId") => `/import/request-detail/${id}`,
        CREATE: "/import/create-request",
      },
      ORDER: {
        LIST: "/import/orders",
        LIST_FROM_REQUEST: (id: string = ":importRequestId") =>
          `/import/order-list/${id}`,
        DETAIL: (id: string = ":importOrderId") => `/import/order-detail/${id}`,
        CREATE_FROM_REQUEST: (id: string = ":importRequestId") =>
          `/import/create-order/${id}`,
      },
    },

    // Export routes
    EXPORT: {
      REQUEST: {
        LIST: "/export/request-list",
        DETAIL: (id: string = ":exportRequestId") => `/export/request-detail/${id}`,
        CREATE: "/export/create-request",
      },
    },

    // Item routes
    ITEM: {
      LIST: "/item/list",
      DETAIL: (id: string = ":id") => `/item/detail/${id}`,
      CREATE: "/item/create",
    },

    INVENTORY_ITEM: {
      LIST: "/inventory-item/list",
    },

    CONFIGURATION: {
      LIST: "/configuration/list",
    },

    // Transaction Log routes
    TRANSACTION_LOGS: {
      IMPORT: "/transaction-logs/import",
      EXPORT: "/transaction-logs/export",
    },
  },
} as const; 