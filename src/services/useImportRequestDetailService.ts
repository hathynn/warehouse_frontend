import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface to match ImportRequestDetailResponse.java
export interface ImportRequestDetailResponse {
  importRequestDetailId: string;
  importRequestId: string;
  providerCode: string;
  itemId: string;
  itemName: string;
  actualQuantity: number;
  orderedQuantity: number;
  expectQuantity: number;
  actualMeasurementValue: number;
  expectMeasurementValue: number;
  orderedMeasurementValue: number;
  status: DetailStatus;
  inventoryItemId: string;
}

export enum DetailStatus {
  LACK = "LACK",
  EXCESS = "EXCESS",
  MATCH = "MATCH"
}

// Interface to match ImportRequestDetailRequest.java
export interface ImportRequestCreateWithDetailRequest {
  itemId: string;
  quantity: number;
  providerId: number;
  importReason: string;
  importType: string;
  startDate: string;
  endDate: string;
  exportRequestId?: string | null;
}

const useImportRequestDetailService = () => {
  const { callApi, loading } = useApi();

  // Get paginated import request details by import request ID
  const getImportRequestDetails = async (
    importRequestId: string
  ): Promise<ResponseDTO<ImportRequestDetailResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-request-detail/import-request/${importRequestId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết phiếu nhập");
      throw error;
    }
  };

  // Get import request detail by ID
  const getImportRequestDetailById = async (
    importRequestDetailId: string
  ): Promise<ResponseDTO<ImportRequestDetailResponse>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-request-detail/${importRequestDetailId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin chi tiết phiếu nhập");
      throw error;
    }
  };

  const createImportRequestDetail = async (details: ImportRequestCreateWithDetailRequest[]): Promise<ResponseDTO<string[]> | null> => {
    try {
      const response = await callApi(
        "post",
        "/import-request-detail/import-requests-with-import-request-details",
        details
      );
      return response;
    } catch (error) {
      toast.error("Có lỗi xảy ra khi tạo phiếu nhập kho");
      throw error;
    }
  };

  return {
    loading,
    getImportRequestDetails,
    getImportRequestDetailById,
    createImportRequestDetail
  };
};

export default useImportRequestDetailService; 