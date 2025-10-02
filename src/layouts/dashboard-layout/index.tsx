import React, { useState, useEffect } from "react";
import { Layout, Menu } from "antd";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "@/components/commons/Header";
import { pageTitles } from "@/constants/pageTitles";
import { RootState } from "@/contexts/redux/store";
import { UserState } from "@/contexts/redux/features/userSlice";
import { menuItems } from "@/constants/menuItems";
import { AccountRole } from "@/utils/enums";
import { ItemType } from "antd/es/menu/interface";
import { MenuItem } from "@/utils/interfaces";
import logo from "@/assets/logo.png";

const { Sider } = Layout;
const SIDER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;
const IPAD_13_BREAKPOINT = 1366; // iPad 13-inch width threshold
const MIN_CONTENT_WIDTH = 1024; // Minimum content width for overflow

const getPageTitle = (path: string): string => {
  // Handle dynamic routes with IDs
  const normalizedPath = path.replace(/\/\d+/g, '/:id');
  return pageTitles[normalizedPath] || "Hệ thống quản lý kho vải";
};

const DashboardLayout: React.FC = () => {
  // Responsive state
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Update window width on resize
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Automatically collapse sidebar on smaller screens
  const [collapsed, setCollapsed] = useState(windowWidth < IPAD_13_BREAKPOINT);

  // Update collapsed state when window width changes
  useEffect(() => {
    if (windowWidth < IPAD_13_BREAKPOINT) {
      setCollapsed(true);
    }
  }, [windowWidth]);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const user = useSelector<RootState, UserState>((state) => state.user);
  const role = user.role || AccountRole.DEPARTMENT;
  const currentMenuItems = menuItems[role] || [];

  // Handle menu item selection and navigation
  useEffect(() => {
    const findActiveMenuItem = (items: MenuItem[]): void => {
      for (const item of items) {
        // Exact path match
        if (location.pathname === item.path) {
          setSelectedKeys([item.key]);
          return;
        }

        // Special case for import order routes
        if (item.key === "import-order" &&
          (location.pathname === "/import/orders" ||
            location.pathname.startsWith("/import/order-list/") ||
            location.pathname.startsWith("/import/order-detail/") ||
            location.pathname.startsWith("/import/create-order/"))) {
          setSelectedKeys([item.key]);
          setOpenKeys(["import"]);
          return;
        }

        // Check children
        if (item.children) {
          const childMatch = item.children.find(child =>
            location.pathname === child.path || location.pathname.startsWith(child.path + '/')
          );
          if (childMatch) {
            setSelectedKeys([childMatch.key]);
            setOpenKeys([item.key]);
            return;
          }

          // Special case for child items
          for (const child of item.children) {
            if (child.key === "import-order" &&
              (location.pathname === "/import/orders" ||
                location.pathname.startsWith("/import/order-list/") ||
                location.pathname.startsWith("/import/order-detail/") ||
                location.pathname.startsWith("/import/create-order/"))) {
              setSelectedKeys([child.key]);
              setOpenKeys([item.key]);
              return;
            }
          }
        }
      }
    };

    findActiveMenuItem(currentMenuItems);
  }, [location.pathname, currentMenuItems]);

  const handleMenuClick = ({ key }: { key: string }) => {
    const findMenuItem = (items: MenuItem[]): MenuItem | undefined => {
      for (const item of items) {
        if (item.key === key) return item;
        if (item.children) {
          const found = findMenuItem(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const clickedItem = findMenuItem(currentMenuItems);
    if (clickedItem?.path) {
      navigate(clickedItem.path);
    }
  };

  // Transform menu items with consistent styling
  const getStyledMenuItems = (items: MenuItem[]): ItemType[] => {
    return items.map((item) => {
      const baseItem = {
        key: item.key,
        icon: item.icon ? React.createElement(item.icon, {
          style: {
            fontSize: '20px',
            marginRight: '8px'
          }
        }) : null,
        label: <span style={{
          fontSize: '15px',
          fontWeight: 600
        }}>{item.label}</span>,
      };

      if (item.children) {
        return {
          ...baseItem,
          children: getStyledMenuItems(item.children)
        };
      }
      return baseItem;
    });
  };

  return (
    <Layout className="min-h-screen">
      <Layout style={{
        minWidth: MIN_CONTENT_WIDTH,
        overflowX: 'auto'
      }}>
        {/* Sidebar */}
        <Sider
          width={SIDER_WIDTH}
          collapsed={collapsed}
          collapsible
          trigger={null}
          style={{
            backgroundColor: '#fff',
            borderRight: '1px solid #f0f0f0',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1000
          }}
          theme="light"
        >
          {/* Logo Area */}
          <div style={{
            height: '100px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            padding: '8px 24px',
            gap: '4px'
          }}>
            <img
              src={logo}
              alt="Logo"
              style={{
                height: '55px',
                width: 'auto',
                objectFit: 'contain',
                // marginTop: '20px'
              }}
            />
            <span style={{
              fontSize: collapsed ? '12px' : '14px',
              fontWeight: 700,
              color: '#1e293b',
              textAlign: 'center',
              lineHeight: '1.2'
            }}>
              {collapsed ? "KV" : "Hệ thống quản lý kho vải"}
            </span>
          </div>

          {/* Navigation Menu */}
          <Menu
            mode="inline"
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={setOpenKeys}
            onClick={handleMenuClick}
            items={getStyledMenuItems(currentMenuItems)}
            style={{
              border: 'none',
              padding: '16px 0',
              fontSize: '15px',
              fontWeight: 600
            }}
          />

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="!absolute !top-12 !-right-3 !bg-white !shadow-md hover:!bg-gray-100 hover:!shadow-lg active:!bg-gray-200 !rounded-full !w-7 !h-7 !flex !items-center !justify-center !border !border-gray-200 !transition-all !duration-200 !ease-in-out !cursor-pointer focus:!outline-none focus:!ring-2 focus:!ring-blue-500 focus:!ring-opacity-50"
          >
            {collapsed ? <MdKeyboardArrowRight size={20} /> : <MdKeyboardArrowLeft size={20} />}
          </button>
        </Sider>

        {/* Main Content Area */}
        <Layout
          style={{
            marginLeft: collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH,
            transition: 'margin-left 0.2s',
            minWidth: `calc(${MIN_CONTENT_WIDTH}px - ${collapsed ? COLLAPSED_WIDTH : SIDER_WIDTH}px)`,
            overflow: 'auto'
          }}
        >
          <div style={{
            padding: '24px',
            minWidth: '100%'
          }}>
            {/* Header */}
            <Header title={getPageTitle(location.pathname)} />

            {/* Content */}
            <div style={{
              backgroundColor: '#fff',
              borderRadius: '8px',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              padding: '24px',
              overflowX: 'auto'
            }}>
              <Outlet />
            </div>
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout; 