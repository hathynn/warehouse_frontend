import useApi from "@/hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

export enum DetailType {
  SPOT_CHECK = "SPOT_CHECK",
  PERIODIC = "PERIODIC",
}

// Response từ API GET /stock-check và GET /stock-check/{id}
export interface StockCheckRequestResponse {
  id: string;
  stockCheckReason?: string;
  status: string;
  type: DetailType;
  startDate: string;
  expectedCompletedDate: string;
  countingDate: string;
  countingTime: string;
  note?: string;
  assignedWareHouseKeeperId: number | null;
  stockCheckRequestDetailIds: number[];
  paperId: string | number | null;
  createdDate: string;
  lastModifiedDate: string;
  createdBy: string;
  lastModifiedBy: string;
}

// Request body cho POST /stock-check/create
export interface StockCheckRequestRequest {
  stockCheckReason?: string;
  type: DetailType;
  startDate: string;
  expectedCompletedDate: string;
  countingDate: string;
  countingTime: string;
  note?: string;
}

const useStockCheckService = () => {
  const { callApi, loading } = useApi();

  // POST /stock-check/create - Tạo mới phiếu kiểm kho
  const createStockCheckRequest = async (
    requestData: StockCheckRequestRequest
  ): Promise<StockCheckRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        "/stock-check/create",
        requestData
      );
      if (response && response.content) {
        toast.success("Tạo phiếu kiểm kho thành công");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể tạo phiếu kiểm kho");
      console.error("Error creating stock check request:", error);
      throw error;
    }
  };

  // GET /stock-check - Lấy tất cả phiếu kiểm kho
  const getAllStockCheckRequests = async (): Promise<
    ResponseDTO<StockCheckRequestResponse[]>
  > => {
    try {
      const response = await callApi("get", "/stock-check");
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu kiểm kho");
      throw error;
    }
  };

  // GET /stock-check/{id} - Lấy phiếu kiểm kho theo ID
  const getStockCheckRequestById = async (
    id: string
  ): Promise<StockCheckRequestResponse | null> => {
    try {
      const response = await callApi("get", `/stock-check/${id}`);
      if (response && response.content) {
        return response.content;
      }
      return null;
    } catch (error) {
      toast.error("Không thể lấy thông tin phiếu kiểm kho");
      console.error("Error fetching stock check request:", error);
      throw error;
    }
  };

  return {
    loading,
    createStockCheckRequest,
    getAllStockCheckRequests,
    getStockCheckRequestById,
  };
};

export default useStockCheckService;
