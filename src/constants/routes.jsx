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
      CREATE: "import/create-request",
      LIST: "import/request-list",
      DETAIL: (id = ":importRequestId") => `/import/request-list/${id}`,
    },
  
    ORDER: 
    {
      CREATE: "import/create-order",
    },
    PRODUCT: {
      CREATE: "import/add-product",
    },
  },
};
