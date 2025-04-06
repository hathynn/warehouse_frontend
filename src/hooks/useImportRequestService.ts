import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify"

interface ImportRequestRequest {
  importReason: string;
  importType: string;
  providerId: number;
  exportRequestId?: number | null;
}

interface ImportRequestResponse {
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

const useImportRequestService = () => {
  const { callApi, loading } = useApiService();

  // Lấy tất cả phiếu nhập
  const getAllImportRequests = async () => {
    try {
      const response = await callApi("get", "/import-request");
      if (response && response.content) {
        return response.content;
      }
      return [];
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu nhập");
      console.error("Error fetching import requests:", error);
      throw error;
    }
  };

  const getImportRequestById = async (importRequestId: number) => {
    try {
      const response = await callApi("get", `/import-request/${importRequestId}`);
      if (response) {
        return response.content;
      }
      return null;
    } catch (error) {
      toast.error("Không thể lấy thông tin phiếu nhập");
      console.error("Error fetching import request:", error);
      throw error;
    }
  };

  // Lấy phiếu nhập phân trang
  const getImportRequestsByPage = async (page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/import-request/page?page=${page}&limit=${limit}`
      );
      if (response && response.content) {
        return response;
      }
      return [];
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu nhập");
      console.error("Error fetching import requests:", error);
      throw error;
    }
  };

  // Tạo import request mới
  const createImportRequest = async (requestData: ImportRequestRequest) => {
    try {
      const response = await callApi("post", "/import-request", requestData);
      if (response) {
        toast.success("Tạo phiếu nhập thành công");
        return response.content;
      }
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
