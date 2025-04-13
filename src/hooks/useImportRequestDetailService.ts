import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

// Interface to match ImportRequestDetailResponse.java
export interface ImportRequestDetailResponse {
  importRequestDetailId: number;
  importRequestId: number;
  itemId: number;
  itemName: string;
  actualQuantity: number;
  orderedQuantity: number;
  expectQuantity: number;
  status: DetailStatus;
}

export enum DetailStatus {
  LACK = "LACK",
  EXCESS = "EXCESS",
  MATCH = "MATCH"
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

const useImportRequestDetailService = () => {
  const { callApi, loading } = useApiService();

  // Get paginated import request details by import request ID
  const getImportRequestDetails = async (
    importRequestId: number, 
    page = 1, 
    limit = 10
  ): Promise<ResponseDTO<ImportRequestDetailResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-request-detail/page/${importRequestId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết phiếu nhập");
      console.error("Error fetching import request details:", error);
      throw error;
    }
  };

  // Get import request detail by ID
  const getImportRequestDetailById = async (
    importRequestDetailId: number
  ): Promise<ResponseDTO<ImportRequestDetailResponse>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-request-detail/${importRequestDetailId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin chi tiết phiếu nhập");
      console.error("Error fetching import request detail:", error);
      throw error;
    }
  };

  // Create import request details from file upload
  const createImportRequestDetail = async (
    file: File,
    importRequestId: number
  ): Promise<ResponseDTO<null>> => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await callApi(
        "post", 
        `/import-request-detail/${importRequestId}`, 
        formData
      );
      
      toast.success("Upload danh sách sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể upload danh sách sản phẩm");
      console.error("Error uploading import request detail:", error);
      throw error;
    }
  };

  // Delete import request detail by ID
  const deleteImportRequestDetail = async (
    importRequestDetailId: number
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi(
        "delete", 
        `/import-request-detail/${importRequestDetailId}`
      );
      
      toast.success("Xóa chi tiết phiếu nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa chi tiết phiếu nhập");
      console.error("Error deleting import request detail:", error);
      throw error;
    }
  };

  return {
    loading,
    getImportRequestDetails,
    getImportRequestDetailById,
    createImportRequestDetail,
    deleteImportRequestDetail
  };
};

export default useImportRequestDetailService; 