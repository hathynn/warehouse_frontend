import { Avatar, Dropdown, notification, Badge, List } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store'; // You'll need to ensure this path is correct
import { logout } from '@/redux/features/userSlice';
import { useNavigate } from 'react-router-dom';
import { ItemType } from 'antd/es/menu/interface';
import { AccountRole } from '@/constants/account-roles';
import { useEffect } from 'react';
import { createPusherClient } from '@/config/pusher';
import {
  IMPORT_ORDER_CREATED_EVENT,
  IMPORT_ORDER_COUNTED_EVENT,
  IMPORT_ORDER_CONFIRMED_EVENT,
  PRIVATE_WAREHOUSE_MANAGER_CHANNEL,
  PRIVATE_DEPARTMENT_CHANNEL,
  PRIVATE_STAFF_CHANNEL,
  PRIVATE_ACCOUNTING_CHANNEL,
  PRIVATE_ADMIN_CHANNEL
} from '@/constants/channels-events';
import { ROUTES } from '@/constants/routes';

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
  type NotificationType = 'created' | 'counted' | 'confirmed';
  interface NotificationItem {
    id: number;
    message: string;
    type: NotificationType;
    timestamp: string;
  }
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fullName, role } = useSelector((state: RootState) => state.user);

  const [api, contextHolder] = notification.useNotification();


  // Request notification permission on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
  }, []);

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
      channel.bind(IMPORT_ORDER_CREATED_EVENT, (data: any) => {
        console.log('[Pusher] Import order created notification:', data);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        const message = `Đơn nhập #${data.id} đã được tạo.`;
        setNotifications(prev => [{ id: data.id, message, type: 'created', timestamp: new Date().toISOString() }, ...prev]);
        // Show system notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Thông báo', { body: message, icon: '/favicon.ico' });
        }
        api.info({
          message: 'Thông báo',
          description: message,
          placement: 'topRight',
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
          duration: 3
        });
      });
      channel.bind(IMPORT_ORDER_COUNTED_EVENT, (data: any) => {
        console.log('[Pusher] Import order counted notification:', data);
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play();
        }
        const message = `Đơn nhập #${data.id} đã được kiểm đếm.`;
        setNotifications(prev => [{ id: data.id, message, type: 'counted', timestamp: new Date().toISOString() }, ...prev]);
        // Show system notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Thông báo', { body: message, icon: '/favicon.ico' });
        }
        api.info({
          message: 'Thông báo',
          description: message,
          placement: 'topRight',
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
          duration: 3
        });
      });
      channel.bind(IMPORT_ORDER_CONFIRMED_EVENT, (data: any) => {
        console.log('[Pusher] Import order confirmed notification:', data);
        if (audioRef.current) {
          console.log('[Debug] audioRef.current exists:', audioRef.current);
          audioRef.current.currentTime = 0;
          const playPromise = audioRef.current.play();
        }
        const message = `Đơn nhập #${data.id} đã được xác nhận.`;
        setNotifications(prev => [{ id: data.id, message, type: 'confirmed', timestamp: new Date().toISOString() }, ...prev]);
        // Show system notification
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('Thông báo', { body: message, icon: '/favicon.ico' });
        }
        api.info({
          message: 'Thông báo',
          description: message,
          placement: 'topRight',
          icon: <BellOutlined style={{ color: '#1890ff' }} />,
          duration: 3
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
      {/* Notification sound */}
      <audio ref={audioRef} src="/notification-sound.wav" preload="auto" />
      <div className="flex justify-between pb-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <div className="flex gap-3 items-center">
          {/* Notification Bell */}
          <Dropdown
            open={dropdownVisible}
            onOpenChange={setDropdownVisible}
            dropdownRender={() => (
              <div style={{ width: 340, maxHeight: 440, overflowY: 'auto', background: '#fff', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.18)', padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0', fontWeight: 700, fontSize: 16, background: '#f7f7f7' }}>Thông báo</div>
                <List
                  dataSource={notifications}
                  locale={{ emptyText: 'Không có thông báo' }}
                  renderItem={item => (
                    <List.Item
                      key={item.id + '-' + item.type + '-' + item.timestamp}
                      style={{ cursor: 'pointer', padding: '12px 16px', borderBottom: '1px solid #f0f0f0', alignItems: 'flex-start' }}
                      onClick={() => {
                        setDropdownVisible(false);
                        navigate(`${ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(item.id.toString())}`);
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                        <div style={{ fontWeight: 500, color: '#1a237e', marginBottom: 2 }}>{item.message}</div>
                        {item.timestamp && <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{new Date(item.timestamp).toLocaleString('vi-VN')}</div>}
                      </div>
                    </List.Item>
                  )}
                />
              </div>
            )}
            placement="bottomRight"
            trigger={['click']}
          >
            <Badge count={notifications.length} overflowCount={99} style={{ backgroundColor: '#ff4d4f', boxShadow: '0 0 0 2px #fff' }}>
              <span style={{ fontSize: 28, cursor: 'pointer', color: notifications.length ? '#ff4d4f' : '#444', transition: 'color 0.2s' }}>
                <BellOutlined />
              </span>
            </Badge>
          </Dropdown>
          {/* User Dropdown */}
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