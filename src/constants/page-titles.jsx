import { DEPARTMENT_ROUTER } from "./routes";

export const pageTitles = {
  // Import request pages
  [DEPARTMENT_ROUTER.IMPORT.REQUEST.LIST]: "Quản lý phiếu nhập",
  [DEPARTMENT_ROUTER.IMPORT.REQUEST.CREATE]: "Tạo phiếu nhập",
  [`/import/request-list/request-detail`]: "Chi tiết phiếu nhập",
  
  // Import order pages
  [DEPARTMENT_ROUTER.IMPORT.ORDER.CREATE]: "Quản lý đơn nhập",
  [`/import/create-order`]: "Tạo đơn nhập",
  [`/import/order-list`]: "Danh sách đơn nhập",
  [`/import/order-list/order-detail`]: "Chi tiết đơn nhập",
  
  // Default pages
  [DEPARTMENT_ROUTER.OVERVIEW]: "Tổng quan",
};
