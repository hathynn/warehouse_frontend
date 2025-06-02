import { useState } from "react";
import useApiService from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface to match ImportRequestCreateRequest.java
export interface ImportRequestCreateRequest {
  importReason: string;
  importType: string;
  exportRequestId?: number | null;
}

// Interface to match ImportRequestResponse.java
export interface ImportRequestResponse {
  importRequestId: string;
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
  batchCode: string;
  startDate: string;
  endDate: string;
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
  const getImportRequestById = async (importRequestId: string): Promise<ResponseDTO<ImportRequestResponse>> => {
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
