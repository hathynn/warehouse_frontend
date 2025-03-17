export const USER_ROUTER = {
  LOGIN: "/login",
  REGISTER: "/register",
  HOME: "/home",
};
export const DEPARTMENT_ROUTER = {
  OVERVIEW: "/overview",
  IMPORT: {
    ROOT: "/import",
    REPORT: {
      LIST: "import/report-list",
      DETAIL: (id = ":reportId") => `/import/report-list/${id}`,
    },
    EXCEL: "import/excel"
  }
};
