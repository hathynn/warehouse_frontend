import { Avatar, Dropdown, Badge, List, Empty, Spin, Modal, Checkbox } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined, BellOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
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
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface HeaderProps {
  title?: string;
}

const getRoleDisplayName = (role: AccountRole): string => {
  const roleMap: Record<AccountRole, string> = {
    [AccountRole.DEPARTMENT]: "Phòng Kế Hoạch",
    [AccountRole.WAREHOUSE_MANAGER]: "Trưởng Kho",
    [AccountRole.STAFF]: "Thủ kho",
    [AccountRole.ACCOUNTING]: "Kế Toán",
    [AccountRole.ADMIN]: "Quản Trị Viên",
    [AccountRole.MANAGER]: "Quản lý",
    [AccountRole.OTHER]: "Nhân viên nội bộ"
  };
  return roleMap[role] || role;
};

function Header({ title = "Dashboard" }: HeaderProps) {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [recentNotification, setRecentNotification] = useState<{ message: string, visible: boolean }>({ message: '', visible: false });
  const [isDeleteAllModalOpen, setIsDeleteAllModalOpen] = useState(false);
  const [confirmDeleteAllResponsibilityChecked, setConfirmDeleteAllResponsibilityChecked] = useState(false);
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
    clickNotification,
    deleteAllNotifications
  } = useNotificationService();

  // Use Pusher context for notifications
  const { latestNotification } = usePusherContext();

  // Define ROUTE type from eventType
  const getRouteTypeFromEventType = (eventType: string): 'IMPORT-ORDER' | 'EXPORT' | 'STOCK-CHECK' | 'UNKNOWN' => {
    // Import events
    if (eventType.includes('import-order')) {
      return 'IMPORT-ORDER';
    }

    // Export events  
    if (eventType.includes('export-request') || eventType.startsWith('export-')) {
      return 'EXPORT';
    }

    if (eventType.includes('stock-check') || eventType.startsWith('stock-')) {
      return 'STOCK-CHECK';
    }

    return 'UNKNOWN';
  };

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
      const routeType = getRouteTypeFromEventType(notification.eventType);
      switch (routeType) {
        case 'IMPORT-ORDER':
          navigate(`${ROUTES.PROTECTED.IMPORT.ORDER.DETAIL(notification.objectId.toString())}`);
          break;

        case 'EXPORT':
          navigate(`${ROUTES.PROTECTED.EXPORT.REQUEST.DETAIL(notification.objectId.toString())}`);
          break;

        case 'STOCK-CHECK':
          navigate(`${ROUTES.PROTECTED.STOCK_CHECK.REQUEST.DETAIL(notification.objectId.toString())}`);
          break;

        default:
          //Log if no defined type 
          console.warn(`Unknown notification eventType: ${notification.eventType}`);
          break;
      }
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

  const handleDeleteAllNotifications = () => {
    setDropdownVisible(false);
    setConfirmDeleteAllResponsibilityChecked(false);
    setIsDeleteAllModalOpen(true);
  };

  const confirmDeleteAll = async () => {
    if (!confirmDeleteAllResponsibilityChecked) return;

    await deleteAllNotifications(Number(accountId));

    setNotifications([]);
    setHasUnreadNotifications(false);
    setIsDeleteAllModalOpen(false);
    setConfirmDeleteAllResponsibilityChecked(false);
    setDropdownVisible(true);
  };

  const cancelDeleteAll = () => {
    setIsDeleteAllModalOpen(false);
    setConfirmDeleteAllResponsibilityChecked(false);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const userMenuItems = [
    // {
    //   key: 'profile',
    //   icon: <UserOutlined />,
    //   label: 'Thông tin cá nhân',
    //   onClick: () => navigate('/profile')
    // },
    // {
    //   key: 'settings',
    //   icon: <SettingOutlined />,
    //   label: 'Cài đặt',
    //   onClick: () => navigate('/settings')
    // },
    // {
    //   type: 'divider',
    // },
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
      <div className="flex items-center justify-between pb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        </div>
        <div className="flex items-center gap-3">
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
                <div className="flex items-center justify-between px-4 py-2 bg-gray-200 border-b border-gray-200">
                  <span className="text-base font-bold">Thông báo</span>
                  {notifications.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAllNotifications();
                      }}
                      className="text-sm text-red-800 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-md font-medium"
                    >
                      Xoá toàn bộ
                    </button>
                  )}
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
                            <button
                              onClick={(e) => handleDeleteNotification(item, e)}
                              className="flex items-center justify-center w-8 h-8 p-1 ml-2 text-black transition-all duration-200 rounded-full hover:text-red-600 hover:bg-red-50"
                              title="Xoá thông báo này"
                            >
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                              >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                              </svg>
                            </button>
                          </div>
                          {item.createdDate && (
                            <div className="mt-1 text-xs text-gray-500">
                              Vào lúc {dayjs.utc(item.createdDate).local().format('DD-MM-YYYY HH:mm')}
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
            <div className="flex items-center gap-3 px-3 py-2 transition-all bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md">
              <Avatar
                size={45}
                icon={<UserOutlined />}
                className="bg-blue-600"
              />
              <div className="flex flex-col">
                <span className="text-lg font-medium text-gray-500">{fullName}</span>
                <span className="font-medium text-black text-s">{getRoleDisplayName(role)}</span>
              </div>
            </div>
          </Dropdown>
        </div>
      </div>

      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ExclamationCircleOutlined style={{ color: '#faad14' }} />
            Xác nhận xoá toàn bộ thông báo
          </div>
        }
        open={isDeleteAllModalOpen}
        onOk={confirmDeleteAll}
        onCancel={() => {
          cancelDeleteAll();
          setDropdownVisible(true);
        }}
        okText="Xoá toàn bộ"
        cancelText="Hủy"
        okButtonProps={{ disabled: !confirmDeleteAllResponsibilityChecked }}
        width={440}
        confirmLoading={loading}
      >
        <div style={{ marginBottom: '16px' }}>
          <p>Bạn có chắc chắn muốn xoá toàn bộ thông báo không?</p>
          <p className='font-bold text-red-900'>{notifications.length} thông báo sẽ bị xoá</p>
        </div>

        <Checkbox
          checked={confirmDeleteAllResponsibilityChecked}
          onChange={e => setConfirmDeleteAllResponsibilityChecked(e.target.checked)}
          style={{ fontSize: 14, fontWeight: "bold" }}
        >
          Tôi xác nhận xoá toàn bộ thông báo của mình
        </Checkbox>
      </Modal>
    </>
  );
}

export default Header;