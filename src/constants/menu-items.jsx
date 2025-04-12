import {
  HomeOutlined,
  ImportOutlined,
  LineChartOutlined,
  PaperClipOutlined,
  SettingOutlined,
  ShopOutlined,
  ExportOutlined,
} from "@ant-design/icons";
import { ROUTES } from "./routes";

export const menuItems = {
  DEPARTMENT: [
    {
      label: "Tổng quan",
      key: "overview",
      icon: <HomeOutlined />,
      path: ROUTES.PROTECTED.OVERVIEW,
    },
    {
      label: "Quản lý phiếu nhập",
      key: "import-request",
      icon: <ImportOutlined />,
      path: ROUTES.PROTECTED.IMPORT.REQUEST.LIST,
    },
    {
      label: "Quản lý phiếu xuất",
      key: "export-request",
      icon: <ExportOutlined />,
      path: ROUTES.PROTECTED.EXPORT.REQUEST.LIST,
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
      path: ROUTES.PROTECTED.OVERVIEW,
    },
    {
      label: "Quản lý phiếu xuất",
      key: "export-request",
      icon: <ExportOutlined />,
      path: ROUTES.PROTECTED.EXPORT.REQUEST.LIST,
    },
  ],
};
