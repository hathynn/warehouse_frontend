import { Menu } from "antd";
import { Link } from "react-router-dom";
import {
  BarsOutlined,
  HomeOutlined,
  LineChartOutlined,
  PaperClipOutlined,
  SettingOutlined,
  ShopOutlined,
} from "@ant-design/icons";


export const menuItemsByRole = {
    ADMIN: [
      { label: "Tổng quan", key: "overview", icon: <HomeOutlined /> },
      { label: "Doanh thu", key: "sales", icon: <LineChartOutlined /> },
      { label: "Bài đăng", key: "create-blog", icon: <PaperClipOutlined /> },
      { label: "Cấu hình", key: "settings", icon: <SettingOutlined /> },
    ],
    USER: [
      { label: "Trang chủ", key: "home", icon: <HomeOutlined /> },
      { label: "Cửa hàng", key: "shop", icon: <ShopOutlined /> },
    ],
  };

// // Hàm tạo menu item
// const getItem = (label, key, icon, children) => {
//   return {
//     key,
//     icon,
//     children,
//     label: <Link to={`${key}`}>{label}</Link>,
//   };
// };

// // Danh sách menu admin
// const adminItems = [
//   { label: "Tổng quan", key: "overview", icon: <HomeOutlined /> },
//   { label: "Doanh thu", key: "sales", icon: <LineChartOutlined /> },
//   { label: "Sản phẩm", key: "product", icon: <BarsOutlined /> },
//   { label: "Nhãn hàng", key: "brand", icon: <ShopOutlined /> },
//   { label: "Category", key: "category", icon: <BarsOutlined /> },
//   { label: "Bài đăng", key: "create-blog", icon: <PaperClipOutlined /> },
//   { label: "Danh mục bài đăng", key: "blog-category", icon: <SettingOutlined /> },
// ];

// const adminMenuItems = adminItems.map((item) => getItem(item.label, item.key, item.icon));


// // Component hiển thị menu
// const AdminSidebar = () => {
//   return (
//     <Menu theme="dark" mode="inline" items={adminMenuItems} />
//   );
// };

// export { AdminSidebar, adminMenuItems, headerItems };
