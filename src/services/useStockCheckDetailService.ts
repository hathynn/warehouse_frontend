import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Request body cho POST /stock-check-detail/{stockCheckId}
export interface StockCheckDetailRequest {
  itemId: string;
  quantity?: number;
  measurementValue?: number;
}

// Response từ API GET /stock-check-detail/{stockCheckId}
export interface StockCheckDetailResponse {
  id: number;
  measurementValue: number;
  quantity: number;
  actualQuantity: number;
  actualMeasurementValue: number;
  status: string | null;
  stockCheckRequestId: string;
  itemId: string;
  inventoryItemIds: string[];
}

const useStockCheckDetailService = () => {
  const { callApi, loading } = useApi();

  // POST /stock-check-detail/{stockCheckId} - Tạo chi tiết phiếu kiểm kho
  const createStockCheckDetail = async (
    stockCheckId: string,
    detailsData: StockCheckDetailRequest[]
  ): Promise<StockCheckDetailResponse[] | undefined> => {
    try {
      if (!stockCheckId) {
        throw new Error("ID phiếu kiểm kho không được để trống");
      }

      if (!detailsData || detailsData.length === 0) {
        throw new Error("Danh sách chi tiết không được để trống");
      }

      const response = await callApi(
        "post",
        `/stock-check-detail/${stockCheckId}`,
        detailsData
      );

      if (response && response.content) {
        toast.success("Tạo chi tiết phiếu kiểm kho thành công");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể tạo chi tiết phiếu kiểm kho");
      console.error("Error creating stock check detail:", error);
      throw error;
    }
  };

  // GET /stock-check-detail/{stockCheckId} - Lấy chi tiết phiếu kiểm kho theo ID
  const getStockCheckDetailById = async (
    stockCheckId: string
  ): Promise<ResponseDTO<StockCheckDetailResponse[]>> => {
    try {
      if (!stockCheckId) {
        throw new Error("ID phiếu kiểm kho không được để trống");
      }

      const response = await callApi(
        "get",
        `/stock-check-detail/${stockCheckId}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy chi tiết phiếu kiểm kho");
      console.error("Error fetching stock check detail:", error);
      throw error;
    }
  };

  return {
    loading,
    createStockCheckDetail,
    getStockCheckDetailById,
  };
};

export default useStockCheckDetailService;
