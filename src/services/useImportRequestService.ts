import useApiService from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";
import { ImportRequestDetailResponse } from "./useImportRequestDetailService";

// Interface to match ImportRequestCreateRequest.java
export interface ImportRequestCreateRequest {
  importReason: string;
  importType: string;
  exportRequestId?: string | null;
  startDate: string;
  endDate: string;
}

// Interface to match ImportRequestResponse.java
export interface ImportRequestResponse {
  importRequestId: string;
  importReason: string;
  importType: string;
  status: string;
  providerId: number;
  exportRequestId: string | null;
  importRequestDetails: ImportRequestDetailResponse[];
  importOrdersId: number[];
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  batchCode: string;
  startDate: string;
  endDate: string;
  departmentId: number;
}

export interface ImportRequestNumberResponse {
  numberOfOngoingImport: number;
  numberOfFinishImport: number;
}

const useImportRequestService = () => {
  const { callApi, loading } = useApiService();

  // Get all import requests
  const getAllImportRequests = async (): Promise<
    ResponseDTO<ImportRequestResponse[]>
  > => {
    try {
      const response = await callApi("get", "/import-request");
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu nhập");
      throw error;
    }
  };

  // Get import request by ID
  const getImportRequestById = async (
    importRequestId: string
  ): Promise<ResponseDTO<ImportRequestResponse>> => {
    try {
      const response = await callApi(
        "get",
        `/import-request/${importRequestId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin phiếu nhập");
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
      throw error;
    }
  };

  const createReturnImportRequest = async (
    request: ImportRequestCreateRequest
  ): Promise<ResponseDTO<ImportRequestResponse>> => {
    try {
      const response = await callApi("post", "/import-request/return", request);
      return response;
    } catch (error) {
      toast.error("Không thể tạo phiếu nhập");
      throw error;
    }
  };

  const getImportRequestNumber = async (
    fromDate: string,
    toDate: string
  ): Promise<ResponseDTO<ImportRequestNumberResponse>> => {
    try {
      const response = await callApi(
        "get",
        `/import-request/number?fromDate=${fromDate}&toDate=${toDate}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thống kê số lượng phiếu nhập");
      console.error("Error fetching import request number:", error);
      throw error;
    }
  };

  return {
    loading,
    getAllImportRequests,
    getImportRequestsByPage,
    getImportRequestById,
    createReturnImportRequest,
    getImportRequestNumber,
  };
};

export default useImportRequestService;
