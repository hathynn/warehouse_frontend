export const USER_ROUTER = {
  LOGIN: "/login",
  REGISTER: "/register",
  HOME: "/home",
};
export const DEPARTMENT_ROUTER = {
  OVERVIEW: "/overview",
  IMPORT: {
    ROOT: "/import",
    REQUEST: {
      CREATE: "/import/create-request",
      LIST: "/import/request-list",
      DETAIL: (id = ":importRequestId") =>
        `/import/request-list/request-detail/${id}`,
    },
    ORDER: {
      CREATE: "/import/create-order", // Keep as string for direct path
      CREATE__FROM_IMPORT_REQUEST_ID: (id = ":importRequestId") =>
        `/import/create-order/${id}`, // Function for parameterized path
      LIST_FROM_IMPORT_REQUEST_ID: (id = ":importRequestId") =>
        `/import/order-list/${id}`, // Function for parameterized path
      DETAIL: (id = ":importOrderId") =>
        `/import/order-list/order-detail/${id}`, // Function for parameterized path
    },
    PRODUCT: {
      CREATE: "/import/add-product",
    },
  },
  EXPORT: {
    REQUEST: {
      CREATE: "/export/create-request",
      LIST: "/export/request-list",
      DETAIL: (id = ":exportRequestId") =>
        `/export/request-list/request-detail/${id}`,
    },
  },
};
