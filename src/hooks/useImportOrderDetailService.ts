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

// Interface to match ImportOrderDetailUpdateRequest.java
export interface ImportOrderDetailUpdateRequest {
  importOrderDetailId: number;
  actualQuantity: number;
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

  // Create import order details from Excel file
  const createImportOrderDetails = async (
    file: File,
    importOrderId: number
  ): Promise<ResponseDTO<null>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await callApi(
        "post", 
        `/import-order-detail/${importOrderId}`, 
        formData
      );
      
      toast.success("Upload danh sách sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể upload danh sách sản phẩm");
      console.error("Error uploading import order detail:", error);
      throw error;
    }
  };

  // Update actual quantities of import order details
  const updateImportOrderDetails = async (
    importOrderId: number,
    detailsList: ImportOrderDetailUpdateRequest[]
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi(
        "put", 
        `/import-order-detail/${importOrderId}`, 
        detailsList
      );
      
      toast.success("Cập nhật chi tiết đơn nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật chi tiết đơn nhập");
      console.error("Error updating import order details:", error);
      throw error;
    }
  };

  // Delete import order detail by ID
  const deleteImportOrderDetail = async (
    importOrderDetailId: number
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi(
        "delete", 
        `/import-order-detail/${importOrderDetailId}`
      );
      
      toast.success("Xóa chi tiết đơn nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa chi tiết đơn nhập");
      console.error("Error deleting import order detail:", error);
      throw error;
    }
  };

  return {
    loading,
    getImportOrderDetailsPaginated,
    getImportOrderDetailById,
    createImportOrderDetails,
    updateImportOrderDetails,
    deleteImportOrderDetail
  };
};

export default useImportOrderDetailService;
