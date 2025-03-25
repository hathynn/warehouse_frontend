import React from 'react';
import { Avatar, Dropdown } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';

function HeaderDashboard({ title = "Dashboard" }) {
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
    },
  ];

  return (
    <div className="flex justify-between py-6 items-center">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
      </div>
      <div className="flex gap-3 items-center">
        <Dropdown 
          menu={{ items: userMenuItems }} 
          placement="bottomRight" 
          trigger={['click']}
          arrow
        >
          <div className="flex items-center gap-3 cursor-pointer bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
            <Avatar 
              size={40} 
              icon={<UserOutlined />} 
              className="bg-blue-600" 
            />
            <div className="flex flex-col">
              <span className="font-medium text-gray-800">Nguyễn Văn A</span>
              <span className="text-xs text-gray-500">Phòng kế hoạch</span>
            </div>
          </div>
        </Dropdown>
      </div>
    </div>
  );
}

export default HeaderDashboard;