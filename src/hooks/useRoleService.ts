import useApiService from "./useApi";
import { toast } from "react-toastify";

// Interface dùng để gửi request, chứa thông tin role cần lấy
export interface AccountRequest {
  role: string;
}

// Interface mô tả cấu trúc dữ liệu của account trả về từ API
export interface AccountResponse {
  id: number;
  email: string;
  phone: string;
  fullName: string;
  status: string;
  isEnable: boolean;
  isBlocked: boolean;
  role: string;
  importOrderIds: number[];
  exportRequestIds: number[];
}

const useRoleService = () => {
  const { callApi, loading } = useApiService();

  const getAccountsByRole = async (
    request: AccountRequest
  ): Promise<AccountResponse[]> => {
    try {
      const response = await callApi("get", `/account/role/${request.role}`);
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

export default useRoleService;
