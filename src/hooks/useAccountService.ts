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

// Interface to match RegisterRequest.java
export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: string;
}

// Interface to match RegisterResponse.java
export interface RegisterResponse {
  id: number;
  email: string;
  phone: string;
  fullName: string;
  role: AccountRole;
  status: string;
  isEnable: boolean;
  isBlocked: boolean;
}

// Interface to match AuthenticationRequest.java
export interface AuthenticationRequest {
  email: string;
  password: string;
}

// Interface to match AuthenticationResponse.java
export interface AuthenticationResponse {
  access_token: string;
  refresh_token: string;
}

// Enum to match AccountRole.java
export enum AccountRole {
  DEPARTMENT = "ROLE_DEPARTMENT",
  STAFF = "ROLE_STAFF",
  ADMIN = "ROLE_ADMIN",
  WAREHOUSE_MANAGER = "ROLE_WAREHOUSE_MANAGER",
  ACCOUNTING = "ROLE_ACCOUNTING"
}

const useAccountService = () => {
  const { callApi, loading } = useApiService();

  /**
   * Register a new account
   * @param request - The registration request data
   * @returns Promise resolving to RegisterResponse
   */
  const register = async (request: RegisterRequest): Promise<RegisterResponse> => {
    try {
      const response = await callApi("post", "/account/register", request);
      if (response && response.content) {
        toast.success("Đăng ký tài khoản thành công");
        return response.content;
      }
      throw new Error("Registration failed");
    } catch (error) {
      toast.error("Đăng ký tài khoản thất bại");
      console.error("Error registering account:", error);
      throw error;
    }
  };

  /**
   * Authenticate user
   * @param request - The authentication request data
   * @returns Promise resolving to AuthenticationResponse
   */
  const login = async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
    try {
      const response = await callApi("post", "/account/login", request);
      if (response && response.content) {
        toast.success("Đăng nhập thành công");
        return response.content;
      }
      throw new Error("Authentication failed");
    } catch (error) {
      toast.error("Đăng nhập thất bại");
      console.error("Error authenticating:", error);
      throw error;
    }
  };

  /**
   * Refresh the access token
   * @returns Promise resolving to AuthenticationResponse
   */
  const refreshToken = async (): Promise<AuthenticationResponse> => {
    try {
      const response = await callApi("post", "/account/refresh-token");
      if (response && response.content) {
        return response.content;
      }
      throw new Error("Token refresh failed");
    } catch (error) {
      toast.error("Làm mới token thất bại");
      console.error("Error refreshing token:", error);
      throw error;
    }
  };

  /**
   * Get accounts by role
   * @param role - The role to filter accounts by
   * @returns Promise resolving to an array of AccountResponse objects
   */
  const getAccountsByRole = async (role: AccountRole): Promise<AccountResponse[]> => {
    try {
      const response = await callApi("get", `/account/role/${role}`);
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

  /**
   * Get paginated accounts by role
   * @param role - The role to filter accounts by
   * @param page - Page number (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @returns Promise resolving to paginated AccountResponse objects
   */
  const getAccountsByRoleWithPagination = async (
    role: AccountRole,
    page: number = 1,
    limit: number = 10
  ) => {
    try {
      const response = await callApi(
        "get",
        `/account/role/${role}/paged?page=${page}&limit=${limit}`
      );
      if (response && response.content) {
        return response.content;
      }
      return null;
    } catch (error) {
      toast.error("Không thể lấy danh sách tài khoản theo vai trò");
      console.error("Error fetching paginated accounts:", error);
      throw error;
    }
  };

  /**
   * Find account by email
   * @param email - The email to search for
   * @returns Promise resolving to AccountResponse
   */
  const findAccountByEmail = async (email: string): Promise<AccountResponse> => {
    try {
      const response = await callApi("get", `/account/by-email?email=${email}`);
      if (response && response.content) {
        return response.content;
      }
      throw new Error("Account not found");
    } catch (error) {
      toast.error("Không thể tìm thấy tài khoản");
      console.error("Error finding account by email:", error);
      throw error;
    }
  };

  return {
    loading,
    register,
    login,
    refreshToken,
    getAccountsByRole,
    getAccountsByRoleWithPagination,
    findAccountByEmail,
  };
};

export default useAccountService; 