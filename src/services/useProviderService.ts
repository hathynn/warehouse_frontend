import { useState } from "react";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

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

const useProviderService = () => {
  const { callApi, loading } = useApi();
  const [providers, setProviders] = useState<ProviderResponse[]>([]);

  // Lấy danh sách nhà cung cấp
  const getAllProviders = async (
    page = 1,
    limit = 999
  ): Promise<ResponseDTO<ProviderResponse[]>> => {
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
      throw error;
    }
  };

  // Lấy nhà cung cấp theo ID
  const getProviderById = async (
    providerId: number
  ): Promise<ResponseDTO<ProviderResponse>> => {
    try {
      const response = await callApi("get", `/provider/${providerId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin nhà cung cấp");
      throw error;
    }
  };

  // Tạo nhà cung cấp mới
  const createProvider = async (
    requestData: ProviderRequest
  ): Promise<ResponseDTO<ProviderResponse>> => {
    try {
      const response = await callApi("post", "/provider", requestData);
      toast.success("Tạo nhà cung cấp thành công");
      await getAllProviders();
      return response;
    } catch (error) {
      toast.error("Không thể tạo nhà cung cấp");
      throw error;
    }
  };

  // Cập nhật nhà cung cấp
  const updateProvider = async (
    requestData: ProviderRequest
  ): Promise<ResponseDTO<ProviderResponse>> => {
    try {
      const response = await callApi("put", "/provider", requestData);
      toast.success("Cập nhật nhà cung cấp thành công");
      await getAllProviders();
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật nhà cung cấp");
      throw error;
    }
  };

  // Xóa nhà cung cấp
  const deleteProvider = async (
    providerId: number
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi("delete", `/provider/${providerId}`);
      toast.success("Xóa nhà cung cấp thành công");
      await getAllProviders();
      return response;
    } catch (error) {
      toast.error("Không thể xóa nhà cung cấp");
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
    deleteProvider,
  };
};

export default useProviderService;
