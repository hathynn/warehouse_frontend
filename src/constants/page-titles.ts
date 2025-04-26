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
  
  // Default pages
  [ROUTES.PROTECTED.OVERVIEW]: "Tổng quan",
  
  // Public pages
  [ROUTES.PUBLIC.LOGIN]: "Đăng nhập",
  [ROUTES.PUBLIC.REGISTER]: "Đăng ký",
};

// Helper function to get page title
export const getPageTitle = (path: string): string => {
  // Handle dynamic routes with IDs
  const normalizedPath = path.replace(/\/\d+/g, '/:id');
  return pageTitles[normalizedPath] || "Warehouse Management System";
}; 