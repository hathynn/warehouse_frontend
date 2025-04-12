import { ROUTES } from "./routes";

export const pageTitles = {
  // Import request pages
  [ROUTES.PROTECTED.IMPORT.REQUEST.LIST]: "Quản lý phiếu nhập",
  [ROUTES.PROTECTED.IMPORT.REQUEST.CREATE]: "Tạo phiếu nhập",
  [`/import/request-list/request-detail`]: "Chi tiết phiếu nhập",
  
  // Import order pages
  [ROUTES.PROTECTED.IMPORT.ORDER.CREATE]: "Quản lý đơn nhập",
  [`/import/create-order`]: "Tạo đơn nhập",
  [`/import/order-list`]: "Danh sách đơn nhập",
  [`/import/order-list/order-detail`]: "Chi tiết đơn nhập",
  
  // Default pages
  [ROUTES.PROTECTED.OVERVIEW]: "Tổng quan",
};
