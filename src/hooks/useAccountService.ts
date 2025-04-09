import useApiService from "./useApi";
import { toast } from "react-toastify";

// Interface to match AccountResponse.java
export interface AccountResponse {
  id: number;
  email: string;
  phone: string;
  fullName: string;
  status: string;
  isEnable: boolean;
  isBlocked: boolean;
  role: AccountRole;
  importOrderIds: number[];
  exportRequestIds: number[];
}

// Enum to match AccountRole.java
export enum AccountRole {
  DEPARTMENT = "DEPARTMENT",
  WAREHOUSE_KEEPER = "WAREHOUSE_KEEPER",
  ADMIN = "ADMIN",
  WAREHOUSE_MANAGER = "WAREHOUSE_MANAGER",
  ACCOUNTING = "ACCOUNTING"
}

const useAccountService = () => {
  const { callApi, loading } = useApiService();

  /**
   * Get accounts by role
   * @param role - The role to filter accounts by
   * @returns Promise resolving to an array of AccountResponse objects
   */
  const getAccountsByRole = async (
    role: AccountRole
  ): Promise<AccountResponse[]> => {
    try {
      const response = await callApi("get", `/accounts/role/${role}`);
      if (response && response.content) {
        return response.content;
      }
      return [];
    } catch (error) {
      toast.error("Không thể lấy danh sách tài khoản theo vai trò");
      console.error("Error fetching accounts by role:", error);
      throw error;
    }
  };

  return {
    loading,
    getAccountsByRole,
  };
};

export default useAccountService; 