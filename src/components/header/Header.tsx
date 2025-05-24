import { Avatar, Dropdown, Badge, List, Empty, Spin } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined } from '@ant-design/icons';
import React, { useRef, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/contexts/redux/store';
import { logout } from '@/contexts/redux/features/userSlice';
import { useNavigate } from 'react-router-dom';
import { ItemType } from 'antd/es/menu/interface';
import { AccountRole } from '@/utils/enums';
import { ROUTES } from '@/constants/routes';
import useNotificationService, { NotificationResponse } from '@/hooks/useNotificationService';
import notificationWav from "@/assets/notification-sound.wav";
import { usePusherContext } from '@/contexts/pusher/PusherContext';

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

  // Use Pusher context for notifications
  const { latestNotification } = usePusherContext();

  const playNotificationSound = async () => {
    try {
      const AudioContext = window.AudioContext;
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

  // Handle notifications from Pusher context
  useEffect(() => {
    if (latestNotification) {
      console.log('[Header] Received notification from context:', latestNotification);
      
      // Play notification sound
      playNotificationSound();
      
      // Reload notifications
      loadNotifications();
      
      // Show recent notification popup
      setRecentNotification({ message: 'Có thông báo mới', visible: true });
      
      // Clear existing timer
      if (notificationTimerRef.current !== null) {
        window.clearTimeout(notificationTimerRef.current);
      }
      
      // Set timer to hide notification popup
      notificationTimerRef.current = window.setTimeout(() => {
        setRecentNotification(prev => ({ ...prev, visible: false }));
        notificationTimerRef.current = null;
      }, 5000);
    }
  }, [latestNotification]);

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
            dropdownRender={() => (
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
            <div className="relative">
              <Badge count={hasUnreadNotifications && !recentNotification.visible ? notifications.filter(n => !n.isViewed).length : 0} style={{ backgroundColor: '#ff4d4f' }}>
                <span className={`text-[28px] cursor-pointer transition-colors ${hasUnreadNotifications ? 'text-red-500' : 'text-gray-600'}`}>
                  <BellOutlined />
                </span>
              </Badge>
              
              {recentNotification.visible && (
                <div className="w-32 absolute text-center -top-3 right-[6px] bg-red-500 text-white py-0.5 px-1 rounded-xl text-xs shadow-md z-10">
                  Có thông báo mới
                </div>
              )}
            </div>
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