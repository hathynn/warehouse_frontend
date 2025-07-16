import { ROUTES } from "./routes";

type PageTitlesType = {
  [key: string]: string;
};

export const pageTitles: PageTitlesType = {
  // Import request pages
  [ROUTES.PROTECTED.IMPORT.REQUEST.LIST]: "Quản lý phiếu nhập",
  [ROUTES.PROTECTED.IMPORT.REQUEST.CREATE]: "Tạo phiếu nhập",
  [ROUTES.PROTECTED.IMPORT.REQUEST.DETAIL(':id')]: "Chi tiết phiếu nhập",
  
  // Import order pages
  [ROUTES.PROTECTED.IMPORT.ORDER.LIST]: "Danh sách đơn nhập",
  [ROUTES.PROTECTED.IMPORT.ORDER.CREATE_FROM_REQUEST(':id')]: "Tạo đơn nhập",
  [ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(':id')]: "Chi tiết đơn nhập",
  
  // Export request pages
  [ROUTES.PROTECTED.EXPORT.REQUEST.LIST]: "Quản lý phiếu xuất",
  [ROUTES.PROTECTED.EXPORT.REQUEST.CREATE]: "Tạo phiếu xuất",
  [ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(':id')]: "Chi tiết phiếu xuất",
  
  // Item pages
  [ROUTES.PROTECTED.ITEM.LIST]: "Danh sách vật phẩm",
  [ROUTES.PROTECTED.ITEM.CREATE]: "Tạo vật phẩm",
  [ROUTES.PROTECTED.ITEM.DETAIL(':id')]: "Chi tiết vật phẩm",

  // Inventory item pages
  [ROUTES.PROTECTED.INVENTORY_ITEM.LIST]: "Danh sách hàng hoá trong kho",
  [ROUTES.PROTECTED.INVENTORY_ITEM.WAREHOUSE_SECTION]: "Khu vực kho",
  
  // Default pages
  [ROUTES.PROTECTED.OVERVIEW]: "Tổng quan",

  // Transaction Log pages
  [ROUTES.PROTECTED.TRANSACTION_LOGS.IMPORT]: "Lịch sử phiếu nhập",
  [ROUTES.PROTECTED.TRANSACTION_LOGS.EXPORT]: "Lịch sử phiếu xuất",
  
  // Public pages
  [ROUTES.PUBLIC.LOGIN]: "Đăng nhập",
  [ROUTES.PUBLIC.REGISTER]: "Đăng ký",
};

