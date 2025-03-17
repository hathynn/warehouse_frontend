import { useState } from "react";
import { Layout, Menu } from "antd";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import HeaderDashboard from "@/components/header";
import { menuItemsByRole } from "@/constants/menuItems";
import "./index.scss";

const { Sider, Content } = Layout;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const user = useSelector((state) => state.user);
  const role = user ? user.role : "GUEST";
  const [selectedKey, setSelectedKey] = useState("1");
  const nav = useNavigate();

  // Get menu items based on user role
  const menuItems = menuItemsByRole[role] || [];
  
  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    const item = menuItems.find((item) => item.key === e.key);
    if (item?.path) {
      nav(item.path);
    }
  };

  return (
    <Layout className="dashboard h-screen flex">
      <div className="p-5 h-full relative">
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          className="!bg-black h-full rounded-3xl shadow-lg"
        >
          <div className="h-16 flex items-center justify-center text-white font-bold text-lg">
            {collapsed ? "D" : "Dappr"}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            className="!bg-black"
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick} 
          >
            {menuItems.map((item) => (
              <Menu.Item
                key={item.key}
                icon={item.icon}
                className={`${
                  selectedKey === item.key
                    ? "!border-l-4 !border-white !rounded-none"
                    : ""
                }`}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/9 right-2 transform -translate-y-1/2 bg-white text-black shadow-lg rounded-full w-6 h-6 flex items-center justify-center border border-gray-300"
        >
          {collapsed ? <MdKeyboardArrowRight /> : <MdKeyboardArrowLeft />}
        </button>
      </div>

      {/* Main content */}
      <Layout className="flex-1">
        <div className="mr-7">
          <HeaderDashboard />
        </div>

        <Content className="p-6 bg-gray-100 h-full">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;