// ... existing code ...
import { useState, useEffect } from "react";
import { Layout, Menu, theme } from "antd";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import HeaderDashboard from "@/components/header";
import { menuItemsByRole } from "@/constants/menuItems";
import "./index.scss";

const { Sider, Content } = Layout;

const DashboardLayout = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const user = useSelector((state) => state.user);
  const role = user ? user.role : "GUEST";
  const [selectedKey, setSelectedKey] = useState("1");
  const [pageTitle, setPageTitle] = useState("");
  const navigate = useNavigate();

  // Get menu items based on user role
  const menuItems = menuItemsByRole[role] || [];

  useEffect(() => {
    // Find active menu item based on current path
    const activeItem = menuItems.find(item => location.pathname.includes(item.path));
    if (activeItem) {
      setSelectedKey(activeItem.key);
      setPageTitle(activeItem.label);
    }
  }, [location.pathname, menuItems]);

  const handleMenuClick = (e) => {
    setSelectedKey(e.key);
    const item = menuItems.find((item) => item.key === e.key);
    if (item?.path) {
      setPageTitle(item.label);
      navigate(item.path);
    }
  };

  return (
    <Layout className="dashboard h-screen flex">
      <div className="p-5 h-full relative">
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          className="h-full rounded-3xl shadow-lg transition-all duration-300"
          width={230}
          style={{ background: 'linear-gradient(180deg, #1a2a6c 0%, #2a4478 100%)' }}
        >
          {/* Logo */}
          <div className="h-16 flex items-center justify-center text-white font-bold text-xl py-6 mb-4">
            {collapsed ? "WM" : "Warehouse"}
          </div>

          <Menu
            theme="dark"
            mode="inline"
            className="border-0"
            style={{ background: 'transparent' }}
            selectedKeys={[selectedKey]}
            onClick={handleMenuClick}
          >
            {menuItems.map((item) => (
              <Menu.Item
                key={item.key}
                icon={item.icon}
                className={`
                  mb-2 hover:bg-white/10 transition-all 
                  ${selectedKey === item.key
                    ? "font-medium !text-white border-l-4 !border-white"
                    : "text-gray-300"
                  }
                `}
              >
                {item.label}
              </Menu.Item>
            ))}
          </Menu>
        </Sider>

        {/* Toggle button for sidebar */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/2 -right-3 transform -translate-y-1/2 bg-white text-blue-800 shadow-md hover:shadow-lg transition-all duration-200 rounded-full w-6 h-6 flex items-center justify-center border border-gray-200"
        >
          {collapsed ? <MdKeyboardArrowRight /> : <MdKeyboardArrowLeft />}
        </button>
      </div>

      {/* Main content */}
      <Layout className="flex-1 bg-gray-50">
        <div className="mx-8">
          <HeaderDashboard title={pageTitle} />
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-180px)] mx-8">
          <Outlet />
        </div>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;