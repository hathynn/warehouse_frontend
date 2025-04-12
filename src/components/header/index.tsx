import { Avatar, Dropdown } from 'antd';
import { UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/redux/store'; // You'll need to ensure this path is correct
import { logout } from '@/redux/features/userSlice';
import { useNavigate } from 'react-router-dom';
import { ItemType } from 'antd/es/menu/interface';
import { AccountRole } from '@/hooks/useAccountService';

interface HeaderDashboardProps {
  title?: string;
}

const getRoleDisplayName = (role: AccountRole): string => {
  const roleMap: Record<AccountRole, string> = {
    [AccountRole.DEPARTMENT]: "Phòng Ban",
    [AccountRole.STAFF]: "Nhân Viên",
    [AccountRole.ADMIN]: "Quản Trị Viên",
    [AccountRole.WAREHOUSE_MANAGER]: "Quản Lý Kho",
    [AccountRole.ACCOUNTING]: "Kế Toán"
  };
  return roleMap[role] || role;
};

function HeaderDashboard({ title = "Dashboard" }: HeaderDashboardProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { fullName, role } = useSelector((state: RootState) => state.user);

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
  );
}

export default HeaderDashboard;