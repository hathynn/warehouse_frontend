import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Request body cho POST /stock-check-detail/{stockCheckId}
export interface StockCheckDetailRequest {
  itemId: string;
  quantity?: number;
  measurementValue?: number;
}

interface CheckedInventoryItem {
  inventoryItemId?: string;
  measurementValue?: number;
  status?: "NEED_LIQUID" | "AVAILABLE" | "UNAVAILABLE"; // dùng union type để chặt chẽ
}

export interface InventoryItemDetail {
  inventoryItemId: string;
  measurementValue: number;
  status: string | null;
  note: string | null;
}

// Response từ API GET /stock-check-detail/{stockCheckId}
export interface StockCheckDetailResponse {
  id: number;
  measurementValue: number;
  quantity: number;
  actualQuantity: number;
  actualMeasurementValue: number;
  status: string | null;
  isChecked: boolean; // thêm field này
  stockCheckRequestId: string;
  itemId: string;
  inventoryItemIds: InventoryItemDetail[]; // ĐỔI từ string[] sang InventoryItemDetail[]
  checkedInventoryItemIds?: CheckedInventoryItem[];
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

      console.log("🔧 Service response.content:", response.content);

      return response.content;
    } catch (error) {
      toast.error("Không thể lấy chi tiết phiếu kiểm kho");
      console.error("Error fetching stock check detail:", error);
      throw error;
    }
  };

  // GET /stock-check-detail/detail/{id} - Lấy chi tiết phiếu kiểm kho theo detail ID
  const getStockCheckDetailByDetailId = async (
    detailId: number
  ): Promise<ResponseDTO<StockCheckDetailResponse>> => {
    try {
      if (!detailId) {
        throw new Error("ID chi tiết phiếu kiểm kho không được để trống");
      }

      const response = await callApi(
        "get",
        `/stock-check-detail/detail/${detailId}`
      );

      return response.content;
    } catch (error) {
      toast.error("Không thể lấy thông tin chi tiết phiếu kiểm kho");
      console.error("Error fetching stock check detail by detail ID:", error);
      throw error;
    }
  };

  return {
    loading,
    createStockCheckDetail,
    getStockCheckDetailById,
    getStockCheckDetailByDetailId,
  };
};

export default useStockCheckDetailService;
