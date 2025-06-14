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
import useNotificationService, { NotificationResponse } from '@/services/useNotificationService';
import notificationWav from "@/assets/notification-sound.wav";
import { usePusherContext } from '@/contexts/pusher/PusherContext';
import dayjs from 'dayjs';

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

  // Add audio context refs for better audio handling
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const isAudioInitializedRef = useRef<boolean>(false);

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

  // Initialize audio system
  const initializeAudio = async () => {
    if (isAudioInitializedRef.current) return;
    // Create AudioContext
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    // Resume context if suspended (required for autoplay policy)
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    // Load audio buffer
    const response = await fetch(notificationWav);
    const arrayBuffer = await response.arrayBuffer();
    audioBufferRef.current = await audioContextRef.current.decodeAudioData(arrayBuffer);
    isAudioInitializedRef.current = true;
  };

  const playNotificationSound = async () => {
    // Initialize audio if not already done
    if (!isAudioInitializedRef.current) {
      await initializeAudio();
    }
    if (!audioContextRef.current || !audioBufferRef.current) {
      return;
    }
    // Resume context if suspended
    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }
    // Create and play audio
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBufferRef.current;
    source.connect(audioContextRef.current.destination);
    source.start();
  };

  useEffect(() => {
    if (!isAudioInitializedRef.current) {
      initializeAudio();
    }
  }, []);

  useEffect(() => {
    if (latestNotification) {
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

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    loadNotifications();
  }, [accountId]);

  const loadNotifications = async () => {
    if (!accountId) return;

    const response = await getAllNotifications(Number(accountId));
    if (response && response.content) {
      setNotifications(response.content);

      const hasUnread = response.content.some(notif => !notif.isViewed);
      setHasUnreadNotifications(hasUnread);
    }
  };

  const handleNotificationClick = async (notification: NotificationResponse) => {
    await clickNotification(notification.id);

    if (notification.objectId) {
      navigate(`${ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(notification.objectId.toString())}`);
    }

    setDropdownVisible(false);
  };

  const handleMarkAllAsRead = async () => {
    if (!accountId) return;

    await viewAllNotifications(Number(accountId));

    setHasUnreadNotifications(false);
  };

  const handleDeleteNotification = async (notification: NotificationResponse, event: React.MouseEvent) => {
    event.stopPropagation();

    await deleteNotification(notification.id);

    setNotifications(prev =>
      prev.filter(n => n.id !== notification.id)
    );
  };

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
                        className={`cursor-pointer py-3 px-4 border-b border-gray-100 items-start hover:!bg-[rgba(59,130,246,0.14)] ${!item.isClicked ? '!bg-[rgba(59,130,246,0.08)]' : ''}`}
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
                              Vào lúc {dayjs(item.createdDate).format('DD-MM-YYYY HH:mm')}
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