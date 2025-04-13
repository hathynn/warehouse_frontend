import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

// Interface to match ProviderRequest.java
export interface ProviderRequest {
  id?: number;
  name: string;
  phone: string;
  address: string;
  itemIds?: number[];
  importRequestId?: number;
}

// Interface to match ProviderResponse.java
export interface ProviderResponse {
  id: number;
  name: string;
  phone: string;
  address: string;
  itemIds: number[];
  importRequestId: number[];
}

// Interface to match MetaDataDTO.java
export interface MetaDataDTO {
  hasNext: boolean;
  hasPrevious: boolean;
  limit: number;
  total: number;
  page: number;
}

// Interface to match ResponseDTO.java
export interface ResponseDTO<T> {
  content: T;
  message: string;
  status: number;
  metadata?: MetaDataDTO;
}

const useProviderService = () => {
  const { callApi, loading } = useApiService();
  const [providers, setProviders] = useState<ProviderResponse[]>([]);

  // Lấy danh sách nhà cung cấp
  const getAllProviders = async (page = 1, limit = 10): Promise<ResponseDTO<ProviderResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/provider?page=${page}&limit=${limit}`
      );
      if (response && response.content) {
        setProviders(response.content);
      }
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách nhà cung cấp");
      console.error("Error fetching providers:", error);
      throw error;
    }
  };

  // Lấy nhà cung cấp theo ID
  const getProviderById = async (providerId: number): Promise<ResponseDTO<ProviderResponse>> => {
    try {
      const response = await callApi("get", `/provider/${providerId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin nhà cung cấp");
      console.error("Error fetching provider:", error);
      throw error;
    }
  };

  // Tạo nhà cung cấp mới
  const createProvider = async (requestData: ProviderRequest): Promise<ResponseDTO<ProviderResponse>> => {
    try {
      const response = await callApi("post", "/provider", requestData);
      toast.success("Tạo nhà cung cấp thành công");
      await getAllProviders();
      return response;
    } catch (error) {
      toast.error("Không thể tạo nhà cung cấp");
      console.error("Error creating provider:", error);
      throw error;
    }
  };

  // Cập nhật nhà cung cấp
  const updateProvider = async (requestData: ProviderRequest): Promise<ResponseDTO<ProviderResponse>> => {
    try {
      const response = await callApi("put", "/provider", requestData);
      toast.success("Cập nhật nhà cung cấp thành công");
      await getAllProviders();
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật nhà cung cấp");
      console.error("Error updating provider:", error);
      throw error;
    }
  };

  // Xóa nhà cung cấp
  const deleteProvider = async (providerId: number): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi("delete", `/provider/${providerId}`);
      toast.success("Xóa nhà cung cấp thành công");
      await getAllProviders();
      return response;
    } catch (error) {
      toast.error("Không thể xóa nhà cung cấp");
      console.error("Error deleting provider:", error);
      throw error;
    }
  };

  return {
    loading,
    providers,
    getAllProviders,
    getProviderById,
    createProvider,
    updateProvider,
    deleteProvider
  };
};

export default useProviderService;