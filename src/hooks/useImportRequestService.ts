import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

// Interface to match ImportRequestCreateRequest.java
export interface ImportRequestCreateRequest {
  importReason: string;
  importType: string;
  providerId: number;
  exportRequestId?: number | null;
}

// Interface to match ImportRequestResponse.java
export interface ImportRequestResponse {
  importRequestId: number;
  importReason: string;
  importType: string;
  status: string;
  providerId: number;
  exportRequestId: number | null;
  importRequestDetailIds: number[];
  importOrdersId: number[];
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
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

const useImportRequestService = () => {
  const { callApi, loading } = useApiService();

  // Get all import requests
  const getAllImportRequests = async (): Promise<ResponseDTO<ImportRequestResponse[]>> => {
    try {
      const response = await callApi("get", "/import-request");
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu nhập");
      console.error("Error fetching import requests:", error);
      throw error;
    }
  };

  // Get import request by ID
  const getImportRequestById = async (importRequestId: number): Promise<ResponseDTO<ImportRequestResponse>> => {
    try {
      const response = await callApi("get", `/import-request/${importRequestId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin phiếu nhập");
      console.error("Error fetching import request:", error);
      throw error;
    }
  };

  // Get paginated import requests
  const getImportRequestsByPage = async (
    page = 1, 
    limit = 10
  ): Promise<ResponseDTO<ImportRequestResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-request/page?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu nhập");
      console.error("Error fetching import requests:", error);
      throw error;
    }
  };

  // Create a new import request
  const createImportRequest = async (
    requestData: ImportRequestCreateRequest
  ): Promise<ResponseDTO<ImportRequestResponse>> => {
    try {
      const response = await callApi("post", "/import-request", requestData);
      if (response && response.content) {
        toast.success("Tạo phiếu nhập thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể tạo phiếu nhập");
      console.error("Error creating import request:", error);
      throw error;
    }
  };

  return {
    loading,
    getAllImportRequests,
    getImportRequestsByPage,
    getImportRequestById,
    createImportRequest,
  };
};

export default useImportRequestService;
