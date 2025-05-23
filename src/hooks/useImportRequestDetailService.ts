import useApiService, { ResponseDTO } from "./useApi";
import { toast } from "react-toastify";

// Interface to match ImportRequestDetailResponse.java
export interface ImportRequestDetailResponse {
  importRequestDetailId: string;
  importRequestId: string;
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

// Interface to match ImportRequestDetailRequest.java
export interface ImportRequestDetailRequest {
  itemId: number;
  quantity: number;
  providerId: number;
}

const useImportRequestDetailService = () => {
  const { callApi, loading } = useApiService();

  // Get paginated import request details by import request ID
  const getImportRequestDetails = async (
    importRequestId: string, 
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
      console.error("Error fetching import request detail:", error);
      throw error;
    }
  };

  const createImportRequestDetail = async (
    details: ImportRequestDetailRequest[],
    importRequestId: string
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi(
        "post",
        `/import-request-detail/${importRequestId}`,
        details
      );
      return response;
    } catch (error) {
      toast.error("Không thể tạo danh sách sản phẩm");
      console.error("Error creating import request detail:", error);
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