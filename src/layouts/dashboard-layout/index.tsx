import React, { useState, useEffect, useMemo } from "react";
import { Layout, Menu } from "antd";
import { MdKeyboardArrowLeft, MdKeyboardArrowRight } from "react-icons/md";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Header from "@/components/header/Header";
import { getPageTitle } from "@/constants/page-titles";
import { RootState } from "@/redux/store";
import { UserState } from "@/redux/features/userSlice";
import { menuItems } from "@/constants/menu-items";
import type { MenuItem } from "@/constants/menu-items";
import { AccountRole } from "@/constants/account-roles";

const { Sider } = Layout;

// Styling constants
const LAYOUT_STYLES = {
  sider: {
    width: 280,
    colors: {
      background: '#fff',
      text: '#1e293b',
      active: '#1677ff',
      hover: '#f5f5f5',
      border: '#f0f0f0'
    },
    typography: {
      logo: {
        fontSize: '18px',
        fontWeight: 700
      },
      menu: {
        fontSize: '15px',
        fontWeight: 600,
        iconSize: 20
      }
    }
  }
};

const DashboardLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [openKeys, setOpenKeys] = useState<string[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const user = useSelector<RootState, UserState>((state) => state.user);
  const role = user.role || AccountRole.DEPARTMENT;
  const currentMenuItems = useMemo(() => menuItems[role] || [], [role]);

  // Handle menu item selection and navigation
  useEffect(() => {
    const findActiveMenuItem = (items: MenuItem[]): void => {
      for (const item of items) {
        if (location.pathname === item.path) {
          setSelectedKeys([item.key]);
          return;
        }
        if (item.children) {
          const childMatch = item.children.find(child =>
            location.pathname === child.path || location.pathname.startsWith(child.path + '/')
          );
          if (childMatch) {
            setSelectedKeys([childMatch.key]);
            setOpenKeys([item.key]);
            return;
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
  const getStyledMenuItems = (items: MenuItem[]) => {
    return items.map((item) => {
      const baseItem = {
        key: item.key,
        icon: item.icon ? React.createElement(item.icon, {
          style: { 
            fontSize: LAYOUT_STYLES.sider.typography.menu.iconSize,
            marginRight: '8px'
          }
        }) : null,
        label: <span style={{ 
          fontSize: LAYOUT_STYLES.sider.typography.menu.fontSize,
          fontWeight: LAYOUT_STYLES.sider.typography.menu.fontWeight 
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
      <Layout>
        {/* Sidebar */}
        <Sider
          width={LAYOUT_STYLES.sider.width}
          collapsed={collapsed}
          collapsible
          trigger={null}
          style={{
            background: LAYOUT_STYLES.sider.colors.background,
            borderRight: `1px solid ${LAYOUT_STYLES.sider.colors.border}`,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
          }}
        >
          {/* Logo Area */}
          <div className="h-16 flex items-center justify-center border-b px-6"
            style={{ borderColor: LAYOUT_STYLES.sider.colors.border }}>
            <span style={{ 
              fontSize: LAYOUT_STYLES.sider.typography.logo.fontSize,
              fontWeight: LAYOUT_STYLES.sider.typography.logo.fontWeight,
              color: LAYOUT_STYLES.sider.colors.text
            }}>
              {collapsed ? "WM" : "Warehouse Management"}
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
              fontSize: LAYOUT_STYLES.sider.typography.menu.fontSize,
              fontWeight: LAYOUT_STYLES.sider.typography.menu.fontWeight,
            }}
          />

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="absolute top-20 -right-3 z-10 bg-white hover:bg-gray-50 
                     shadow-md hover:shadow-lg transition-all duration-200 
                     rounded-full w-6 h-6 flex items-center justify-center border"
            style={{ borderColor: LAYOUT_STYLES.sider.colors.border }}
          >
            {collapsed ? <MdKeyboardArrowRight /> : <MdKeyboardArrowLeft />}
          </button>
        </Sider>

        {/* Main Content Area */}
        <Layout style={{
          marginLeft: collapsed ? 80 : LAYOUT_STYLES.sider.width,
          transition: 'margin-left 0.2s',
        }}>
          <div className="p-6">
            {/* Header */}
            <Header title={getPageTitle(location.pathname)} />

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <Outlet />
            </div>
          </div>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout; 