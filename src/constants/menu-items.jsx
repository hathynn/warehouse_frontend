import {
  HomeOutlined,
  ImportOutlined,
  LineChartOutlined,
  PaperClipOutlined,
  SettingOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import { DEPARTMENT_ROUTER } from "./routes";


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
    }
  ],
  USER: [
    { label: "Trang chủ", key: "home", icon: <HomeOutlined /> },
    { label: "Cửa hàng", key: "shop", icon: <ShopOutlined /> },
  ],
};