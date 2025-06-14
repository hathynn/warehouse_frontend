import { ResponseDTO } from "@/utils/interfaces";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";

// Interface to match ImportOrderDetailResponse.java
export interface ImportOrderDetailResponse {
  importOrderDetailId: string;
  importOrderId: string;
  itemId: number;
  itemName: string;
  expectQuantity: number;
  actualQuantity: number;
  status: string;
}

// Interface cho request tạo import order detail (đơn giản)
export interface ImportOrderDetailCreateRequest {
  providerId: number;
  importOrderItems: {
    itemId: number;
    quantity: number;
  }[];
}

const useImportOrderDetailService = () => {
  const { callApi, loading } = useApi();

  // Get paginated import order details by import order ID
  const getImportOrderDetailsPaginated = async (
    importOrderId: string, 
    page = 1, 
    limit = 999
  ): Promise<ResponseDTO<ImportOrderDetailResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-order-detail/page/${importOrderId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết đơn nhập");
      throw error;
    }
  };

  // Get import order detail by ID
  const getImportOrderDetailById = async (
    importOrderDetailId: string
  ): Promise<ResponseDTO<ImportOrderDetailResponse>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-order-detail/${importOrderDetailId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin chi tiết đơn nhập");
      throw error;
    }
  };

  // Create import order details using JSON body, not file
  const createImportOrderDetails = async (
    request: ImportOrderDetailCreateRequest,
    importOrderId: string
  ): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi(
        "post",
        `/import-order-detail/${importOrderId}`,
        request
      );
      return response;
    } catch (error) {
      toast.error("Không thể tạo danh sách sản phẩm");
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
