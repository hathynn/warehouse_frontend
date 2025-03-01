import { useState } from "react";
import { Layout, Menu, Button } from "antd";
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  HomeOutlined,
  MailOutlined,
  UserOutlined,
  SettingOutlined,
  RightOutlined,
  LeftOutlined,
} from "@ant-design/icons";
import { useSelector } from "react-redux";
import HeaderDashboard from "@/components/header";
import "./index.scss"
const { Sider, Content } = Layout;

const DashboardLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const user = useSelector((state) => state.user);
  const role = user ? user.role : null;
  const [selectedKey, setSelectedKey] = useState("1");
  return (
    <Layout className="dashboard h-screen flex">
      <div className="p-5 h-full relative">
        <Sider
          collapsible
          collapsed={collapsed}
          trigger={null}
          className="!bg-black h-full rounded-3xl shadow-lg"
        >
          <div className="h-16  flex items-center justify-center text-white font-bold text-lg">
            {collapsed ? "D" : "Dappr"}
          </div>

   
         <Menu
            theme="dark"
            mode="inline"
            className="!bg-black"
            selectedKeys={[selectedKey]}
            // items={menuItemsByRole[role] || []}
            onClick={(e) => setSelectedKey(e.key)}

            
          >
            <Menu.Item
              key="1"
              icon={<HomeOutlined />}
              className={` ${selectedKey === "1" ? "!border-l-4 !border-white !rounded-none" : ""} `}

            >
              Dashboard
            </Menu.Item>
            <Menu.Item
              key="2"
              icon={<MailOutlined />}
              className={` ${selectedKey === "2" ? "!border-l-4 !border-white !rounded-none" : ""} `}

            >
              Messages
            </Menu.Item>
            <Menu.Item
              key="3"
              icon={<UserOutlined />}
              className={` ${selectedKey === "3" ? "!border-l-4 !border-white !rounded-none" : ""} `}

            >
              Clients
            </Menu.Item>
            <Menu.Item
              key="4"
              icon={<SettingOutlined />}
              className={` ${selectedKey === "4" ? "!border-l-4 !border-white !rounded-none" : ""} `}

            >
              Settings
            </Menu.Item>
          </Menu>
      
      
        </Sider>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-1/9 -right-0 transform -translate-y-1/2 bg-white text-black shadow-lg rounded-full w-8 h-8  flex items-center justify-center border border-gray-300"
        >
          {collapsed ? <RightOutlined /> : <LeftOutlined />}
        </button>
      </div>

      {/* Nội dung chính */}
      <Layout className="flex-1">
        <div className="mr-7">
          <HeaderDashboard />{" "}
        </div>

        <Content className="p-6 bg-gray-100 h-full">
          <h2>Nội dung chính ở đây...</h2>
        </Content>
      </Layout>
    </Layout>
  );
};

export default DashboardLayout;
