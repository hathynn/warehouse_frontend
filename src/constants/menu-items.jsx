import {
  HomeOutlined,
  ImportOutlined,
  LineChartOutlined,
  PaperClipOutlined,
  SettingOutlined,
  ShopOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { DEPARTMENT_ROUTER, WAREHOUSE_MANAGER_ROUTE } from "./routes";

export const menuItems = {
  DEPARTMENT: [
    {
      label: "Tổng quan",
      key: "overview",
      icon: <HomeOutlined />,
      path: DEPARTMENT_ROUTER.OVERVIEW,
    },
    {
      label: "Quản lý phiếu nhập",
      key: "import-request",
      icon: <ImportOutlined />,
      path: DEPARTMENT_ROUTER.IMPORT.REQUEST.LIST,
    },
    {
      label: "Quản lý phiếu xuất",
      key: "export-request",
      icon: <ExportOutlined />,
      path: DEPARTMENT_ROUTER.EXPORT.REQUEST.LIST,
    },
  ],

  USER: [
    { label: "Trang chủ", key: "home", icon: <HomeOutlined /> },
    { label: "Cửa hàng", key: "shop", icon: <ShopOutlined /> },
  ],

  WAREHOUSE_MANAGER: [
    {
      label: "Trang chủ",
      key: "home",
      icon: <HomeOutlined />,
      path: WAREHOUSE_MANAGER_ROUTE.OVERVIEW,
    },
    {
      label: "Quản lý phiếu xuất",
      key: "export-request",
      icon: <ExportOutlined />,
      path: WAREHOUSE_MANAGER_ROUTE.EXPORT.REQUEST.LIST,
    },
  ],
};
