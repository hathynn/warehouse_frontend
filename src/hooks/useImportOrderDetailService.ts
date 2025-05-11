import { useState } from "react";
import useApiService, { ResponseDTO } from "./useApi";
import { toast } from "react-toastify";

// Interface to match ImportOrderDetailResponse.java
export interface ImportOrderDetailResponse {
  importOrderDetailId: number;
  importOrderId: number;
  itemId: number;
  itemName: string;
  expectQuantity: number;
  actualQuantity: number;
  status: string;
}

// Interface cho request tạo import order detail (đơn giản)
export interface ImportOrderDetailCreateRequest {
  providerId: number;
  itemOrders: {
    itemId: number;
    quantity: number;
  }[];
}

const useImportOrderDetailService = () => {
  const { callApi, loading } = useApiService();

  // Get paginated import order details by import order ID
  const getImportOrderDetailsPaginated = async (
    importOrderId: number, 
    page = 1, 
    limit = 10
  ): Promise<ResponseDTO<ImportOrderDetailResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-order-detail/page/${importOrderId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết đơn nhập");
      console.error("Error fetching import order details:", error);
      throw error;
    }
  };

  // Get import order detail by ID
  const getImportOrderDetailById = async (
    importOrderDetailId: number
  ): Promise<ResponseDTO<ImportOrderDetailResponse>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-order-detail/${importOrderDetailId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin chi tiết đơn nhập");
      console.error("Error fetching import order detail:", error);
      throw error;
    }
  };

  // Create import order details using JSON body, not file
  const createImportOrderDetails = async (
    request: ImportOrderDetailCreateRequest,
    importOrderId: number
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi(
        "post",
        `/import-order-detail/${importOrderId}`,
        request
      );
      toast.success("Tạo danh sách sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể tạo danh sách sản phẩm");
      console.error("Error creating import order detail:", error);
      throw error;
    }
  };

  return {
    loading,
    getImportOrderDetailsPaginated,
    getImportOrderDetailById,
    createImportOrderDetails,
  };
};

export default useImportOrderDetailService;
