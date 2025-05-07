import { Avatar, Dropdown, notification } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store'; // You'll need to ensure this path is correct
import { logout } from '@/redux/features/userSlice';
import { useNavigate } from 'react-router-dom';
import { ItemType } from 'antd/es/menu/interface';
import { AccountRole } from '@/constants/account-roles';
import { useEffect } from 'react';
import { createPusherClient } from '@/hooks/usePusherService';
import {
  IMPORT_ORDER_EVENT,
  PRIVATE_WAREHOUSE_MANAGER_CHANNEL,
  PRIVATE_DEPARTMENT_CHANNEL,
  PRIVATE_STAFF_CHANNEL,
  PRIVATE_ACCOUNTING_CHANNEL,
  PRIVATE_ADMIN_CHANNEL
} from '@/constants/channels-events';

interface HeaderProps {
  title?: string;
}

const getRoleDisplayName = (role: AccountRole): string => {
  const roleMap: Record<AccountRole, string> = {
    [AccountRole.DEPARTMENT]: "Phòng Kế Hoạch",
    [AccountRole.WAREHOUSE_MANAGER]: "Quản Lý Kho",
    [AccountRole.STAFF]: "Nhân Viên",
    [AccountRole.ACCOUNTING]: "Kế Toán",
    [AccountRole.ADMIN]: "Quản Trị Viên"
  };
  return roleMap[role] || role;
};

function Header({ title = "Dashboard" }: HeaderProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fullName, role } = useSelector((state: RootState) => state.user);

  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {
    if (!role) return;
    
    console.log(`Subscribing to Pusher notifications for role: ${role}`);
    const pusher = createPusherClient();
    let channelName = "";
    
    // Determine which private channel to subscribe to based on user role
    switch (role) {
      case AccountRole.WAREHOUSE_MANAGER:
        channelName = PRIVATE_WAREHOUSE_MANAGER_CHANNEL;
        break;
      case AccountRole.DEPARTMENT:
        channelName = PRIVATE_DEPARTMENT_CHANNEL;
        break;
      case AccountRole.STAFF:
        channelName = PRIVATE_STAFF_CHANNEL;
        break;
      case AccountRole.ACCOUNTING:
        channelName = PRIVATE_ACCOUNTING_CHANNEL;
        break;
      case AccountRole.ADMIN:
        channelName = PRIVATE_ADMIN_CHANNEL;
        break;
      default:
        console.warn(`No channel defined for role: ${role}`);
        return;
    }
    
    try {
      // Subscribe to the private channel
      const channel = pusher.subscribe(channelName);
      
      // Handle connection success
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to ${channelName}`);
      });
      
      // Handle connection error
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error(`Error subscribing to ${channelName}:`, error);
      });
      
      // Bind to specific events
      channel.bind(IMPORT_ORDER_EVENT, (data: any) => {
        console.log('[Pusher] New import order notification:', data);
        
        // Show notification to user
        api.info({
          message: 'New Import Order',
          description: data.message || 'A new import order has been created',
          placement: 'topRight',
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
          duration: 4
        });
      });
      
      // Clean up function
      return () => {
        console.log(`Unsubscribing from ${channelName}`);
        channel.unbind_all();
        pusher.unsubscribe(channelName);
        pusher.disconnect();
      };
    } catch (error) {
      console.error('Error setting up Pusher:', error);
    }
  }, [role, api]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login'); // Adjust the route as needed
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile') // Adjust the route as needed
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/settings') // Adjust the route as needed
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      danger: true,
      onClick: handleLogout
    },
  ];

  return (
    <>
      {contextHolder}
      <div className="flex justify-between pb-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <div className="flex gap-3 items-center">
          <Dropdown 
            menu={{ items: userMenuItems as ItemType[] }} 
            placement="bottomRight" 
            trigger={['click']}
            arrow
          >
            <div className="flex items-center gap-3 cursor-pointer bg-white px-3 py-2 rounded-lg shadow-sm hover:shadow-md transition-all">
              <Avatar 
                size={45} 
                icon={<UserOutlined />} 
                className="bg-blue-600" 
              />
              <div className="flex flex-col">
                <span className="font-medium text-lg text-gray-500">{fullName}</span>
                <span className="font-medium text-s text-black">{getRoleDisplayName(role)}</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>
    </>
  );
}

export default Header;