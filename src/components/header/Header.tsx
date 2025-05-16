import { Avatar, Dropdown, Badge, List, Empty, Spin } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store';
import { logout } from '@/redux/features/userSlice';
import { useNavigate } from 'react-router-dom';
import { ItemType } from 'antd/es/menu/interface';
import { AccountRole } from '@/constants/account-roles';
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
import useNotificationService, { NotificationResponse } from '@/hooks/useNotificationService';
import notificationWav from "@/assets/notification-sound.wav";

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
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [recentNotification, setRecentNotification] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const notificationTimerRef = useRef<number | null>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fullName, role, id: accountId } = useSelector((state: RootState) => state.user);

  const { 
    loading, 
    getAllNotifications, 
    deleteNotification, 
    viewAllNotifications, 
    clickNotification 
  } = useNotificationService();

  const playNotificationSound = async () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();
      const response = await fetch(notificationWav);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      source.start();
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  };

  const loadNotifications = async () => {
    if (!accountId) return;
    
    try {
      const response = await getAllNotifications(Number(accountId));
      if (response && response.content) {
        setNotifications(response.content);
        
        const hasUnread = response.content.some(notif => !notif.isViewed);
        setHasUnreadNotifications(hasUnread);
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    
    loadNotifications();
  }, [accountId]);

  const handleNotificationClick = async (notification: NotificationResponse) => {
    try {
      await clickNotification(notification.id);
      
      if (notification.objectId) {
        navigate(`${ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(notification.objectId.toString())}`);
      }
      
      setDropdownVisible(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!accountId) return;
    
    try {
      await viewAllNotifications(Number(accountId));
      
      setHasUnreadNotifications(false);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notification: NotificationResponse, event: React.MouseEvent) => {
    event.stopPropagation();
    
    try {
      await deleteNotification(notification.id);
      
      setNotifications(prev => 
        prev.filter(n => n.id !== notification.id)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  useEffect(() => {
    if (!role || !accountId) return;
    
    console.log(`Subscribing to Pusher notifications for role: ${role}`);
    const pusher = createPusherClient();
    let channelName = "";
    
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
      const channel = pusher.subscribe(channelName);
      
      channel.bind('pusher:subscription_succeeded', () => {
        console.log(`Successfully subscribed to ${channelName}`);
      });
      
      channel.bind('pusher:subscription_error', (error: any) => {
        console.error(`Error subscribing to ${channelName}:`, error);
      });
      
      const handleNotificationEvent = (data: any, eventType: string) => {
        playNotificationSound();
        
        loadNotifications();
        
        setRecentNotification({ message: 'Có thông báo mới', visible: true });
        
        if (notificationTimerRef.current !== null) {
          window.clearTimeout(notificationTimerRef.current);
        }
        
        notificationTimerRef.current = window.setTimeout(() => {
          setRecentNotification(prev => ({ ...prev, visible: false }));
          notificationTimerRef.current = null;
        }, 5000);
      };
      
      channel.bind(IMPORT_ORDER_CREATED_EVENT, (data: any) => {
        console.log('[Pusher] Import order created notification:', data);
        handleNotificationEvent(data, IMPORT_ORDER_CREATED_EVENT);
      });
      
      channel.bind(IMPORT_ORDER_COUNTED_EVENT, (data: any) => {
        console.log('[Pusher] Import order counted notification:', data);
        handleNotificationEvent(data, IMPORT_ORDER_COUNTED_EVENT);
      });
      
      channel.bind(IMPORT_ORDER_CONFIRMED_EVENT, (data: any) => {
        console.log('[Pusher] Import order confirmed notification:', data);
        handleNotificationEvent(data, IMPORT_ORDER_CONFIRMED_EVENT);
      });
      
      return () => {
        console.log(`Unsubscribing from ${channelName}`);
        channel.unbind_all();
        pusher.unsubscribe(channelName);
        pusher.disconnect();
      };
    } catch (error) {
      console.error('Error setting up Pusher:', error);
    }
  }, [role, accountId, loadNotifications]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
      onClick: () => navigate('/profile')
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
      onClick: () => navigate('/settings')
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
      <div className="flex justify-between pb-4 items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <div className="flex gap-3 items-center">
          <Dropdown
            open={dropdownVisible}
            onOpenChange={(visible) => {
              setDropdownVisible(visible);
              if (visible) {
                loadNotifications();
                handleMarkAllAsRead();
                if (recentNotification.visible) {
                  setRecentNotification(prev => ({ ...prev, visible: false }));
                }
              }
            }}
            popupRender={() => (
              <div className="w-[340px] max-h-[440px] overflow-y-auto bg-white rounded-xl shadow-lg p-0">
                <div className="py-3 px-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                  <span className="font-bold text-base">Thông báo</span>
                </div>
                
                {loading ? (
                  <div className="py-10 text-center">
                    <Spin />
                  </div>
                ) : (
                  <List
                    dataSource={notifications}
                    locale={{ emptyText: <Empty description="Không có thông báo" /> }}
                    renderItem={item => (
                      <List.Item
                        key={item.id}
                        className={`cursor-pointer py-3 px-4 border-b border-gray-100 items-start hover:bg-gray-50 ${!item.isClicked ? 'bg-blue-50/50' : ''}`}
                        onClick={() => handleNotificationClick(item)}
                        style={{ padding: '0.75rem 1rem' }}
                      >
                        <div className="flex flex-col w-full">
                          <div className="flex justify-between">
                            <span className={`${item.isClicked ? 'font-normal text-gray-800' : 'font-semibold text-indigo-900'}`}>
                              {item.content}
                            </span>
                            <span 
                              onClick={(e) => handleDeleteNotification(item, e)}
                              className="ml-2 text-xs text-gray-500 cursor-pointer"
                            >
                              ✕
                            </span>
                          </div>
                          {item.createdDate && (
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(item.createdDate).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </List.Item>
                    )}
                  />
                )}
              </div>
            )}
            placement="bottomRight"
            trigger={['click']}
          >
            <span className="relative">
              <Badge count={hasUnreadNotifications && !recentNotification.visible ? notifications.filter(n => !n.isViewed).length : 0} style={{ backgroundColor: '#ff4d4f' }}>
                <span className={`text-[28px] cursor-pointer transition-colors ${hasUnreadNotifications ? 'text-red-500' : 'text-gray-600'}`}>
                  <BellOutlined />
                </span>
                {recentNotification.visible && (
                  <div className="w-32 absolute text-center -top-3 right-[6px] bg-red-500 text-white py-0.5 px-1 rounded-xl text-xs shadow-md z-10">
                    Có thông báo mới
                  </div>
                )}
              </Badge>
            </span>
          </Dropdown>
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