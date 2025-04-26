import { AccountRole } from "@/hooks/useAccountService";
import { ROUTES } from "./routes";
import { IconType } from "react-icons";
import {
  AiOutlineHome,
  AiOutlineImport,
  AiOutlineExport,
  AiOutlineInbox,
  AiOutlineSetting
} from "react-icons/ai";

export interface MenuItem {
  key: string;
  icon?: IconType;
  label: string;
  path: string;
  children?: MenuItem[];
}

type RoleMenuConfig = {
  [K in AccountRole]?: MenuItem[];
};

// Base menu items that are common across roles
const baseMenuItems: MenuItem[] = [
  {
    key: "overview",
    icon: AiOutlineHome,
    label: "Tổng quan",
    path: ROUTES.PROTECTED.OVERVIEW,
  },
];

// Import related menu items
const importMenuItems: MenuItem[] = [
  {
    key: "import",
    icon: AiOutlineImport,
    label: "Quản lý nhập kho",
    path: "",
    children: [
      {
        key: "import-request",
        label: "Danh sách phiếu nhập",
        path: ROUTES.PROTECTED.IMPORT.REQUEST.LIST,
      },
      {
        key: "import-order",
        label: "Danh sách đơn nhập",
        path: ROUTES.PROTECTED.IMPORT.ORDER.LIST,
      }
    ],
  },
];

// Export related menu items
const exportMenuItems: MenuItem[] = [
  {
    key: "export",
    icon: AiOutlineExport,
    label: "Quản lý xuất kho",
    path: "",
    children: [
      {
        key: "export-request",
        label: "Danh sách phiếu xuất",
        path: ROUTES.PROTECTED.EXPORT.REQUEST.LIST,
      },
    ],
  },
];

// Item management menu items
const itemMenuItems: MenuItem[] = [
  {
    key: "items",
    icon: AiOutlineInbox,
    label: "Quản lý vật phẩm",
    path: ROUTES.PROTECTED.ITEM.LIST,
  },
  {
    key: "inventory-items",
    icon: AiOutlineInbox,
    label: "Quản lý hàng tồn kho",
    path: ROUTES.PROTECTED.INVENTORY_ITEM.LIST,
  },
];

// Configuration menu items
const configurationMenuItems: MenuItem[] = [
  {
    key: "configuration",
    icon: AiOutlineSetting,
    label: "Cấu hình",
    path: ROUTES.PROTECTED.CONFIGURATION.LIST,
  },
];


// Role-based menu configuration
export const menuItems: RoleMenuConfig = {

  [AccountRole.DEPARTMENT]: [
    ...baseMenuItems,
    ...importMenuItems,
    ...exportMenuItems,
    {
      key: "inventory-items",
      icon: AiOutlineInbox,
      label: "Quản lý hàng tồn kho",
      path: ROUTES.PROTECTED.INVENTORY_ITEM.LIST,
    }
  ],

  [AccountRole.STAFF]: [

  ],

  [AccountRole.WAREHOUSE_MANAGER]: [
    ...baseMenuItems,
    {
      key: "import",
      icon: AiOutlineImport,
      label: "Quản lý nhập kho",
      path: "",
      children: [
        {
          key: "import-order",
          label: "Danh sách đơn nhập",
          path: ROUTES.PROTECTED.IMPORT.ORDER.LIST,
        }
      ],
    },
    ...exportMenuItems,
    {
      key: "inventory-items",
      icon: AiOutlineInbox,
      label: "Quản lý hàng tồn kho",
      path: ROUTES.PROTECTED.INVENTORY_ITEM.LIST,
    }
  ],

  [AccountRole.ACCOUNTING]: [
    ...baseMenuItems,
  ],

  [AccountRole.ADMIN]: [
    ...baseMenuItems,
    ...configurationMenuItems,
  ],
};

// Helper function to get menu items for a specific role
export const getMenuItemsByRole = (role: AccountRole): MenuItem[] => {
  return menuItems[role] || baseMenuItems;
};

// Helper function to check if a menu item should be visible for a role
export const isMenuItemVisibleForRole = (
  path: string,
  role: AccountRole
): boolean => {
  const roleMenuItems = getMenuItemsByRole(role);

  const isPathInMenuItems = (items: MenuItem[]): boolean => {
    for (const item of items) {
      if (item.path === path) return true;
      if (item.children?.length) {
        if (isPathInMenuItems(item.children)) return true;
      }
    }
    return false;
  };

  return isPathInMenuItems(roleMenuItems);
}; 