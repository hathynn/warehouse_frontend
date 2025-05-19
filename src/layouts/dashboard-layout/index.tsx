import React, { useState, useEffect, useMemo } from "react";
import { Layout, Menu, theme } from "antd";
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
import { ItemType } from "antd/es/menu/interface";

const { Sider } = Layout;
const SIDER_WIDTH = 280;
const COLLAPSED_WIDTH = 80;
const IPAD_13_BREAKPOINT = 1366; // iPad 13-inch width threshold
const MIN_CONTENT_WIDTH = 1024; // Minimum content width for overflow

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
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
            padding: '0 24px'
          }}>
            <span style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#1e293b'
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
              fontSize: '15px',
              fontWeight: 600
            }}
          />

          {/* Collapse Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              position: 'absolute',
              top: '48px',
              right: '-12px',
              backgroundColor: '#fff',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #f0f0f0',
              transition: 'all 0.2s ease-in-out',
              cursor: 'pointer',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f5f5';
              e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)';
            }}
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