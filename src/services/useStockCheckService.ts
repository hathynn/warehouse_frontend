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

export interface AssignStaffRequest {
  stockCheckId: string;
  staffId: string;
}

export interface UpdateStockCheckStatusRequest {
  status: string;
}

export interface StockCheckNumberResponse {
  numberOfOngoingStockCheck: number;
  numberOfFinishStockCheck: number;
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

  const assignStaffToStockCheck = async (
    requestData: AssignStaffRequest
  ): Promise<ResponseDTO<any>> => {
    try {
      if (!requestData.stockCheckId || !requestData.staffId) {
        throw new Error(
          "Mã phiếu kiểm kho và mã nhân viên không được để trống"
        );
      }

      const response = await callApi(
        "post",
        "/stock-check/assign-staff",
        requestData
      );

      if (response) {
        toast.success("Đã đổi nhân viên kiểm kho");
      }
      return response;
    } catch (error) {
      toast.error("Không thể phân công nhân viên");
      console.error("Error assigning staff to stock check:", error);
      throw error;
    }
  };

  const updateStockCheckStatus = async (
    stockCheckId: string,
    status: string // Thay đổi từ object thành string
  ): Promise<ResponseDTO<any>> => {
    try {
      if (!stockCheckId) {
        throw new Error("Mã phiếu kiểm kho không được để trống");
      }

      if (!status) {
        throw new Error("Trạng thái không được để trống");
      }

      const response = await callApi(
        "post",
        `/stock-check/update-status/${stockCheckId}?status=${status}`, // status làm query param
        {} // request body rỗng
      );

      if (response) {
        toast.success("Cập nhật trạng thái phiếu kiểm kho thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái phiếu kiểm kho");
      console.error("Error updating stock check status:", error);
      throw error;
    }
  };

  const completeStockCheck = async (
    stockCheckRequestDetailIds: number[]
  ): Promise<ResponseDTO<any>> => {
    try {
      if (
        !stockCheckRequestDetailIds ||
        stockCheckRequestDetailIds.length === 0
      ) {
        throw new Error(
          "Danh sách chi tiết phiếu kiểm kho không được để trống"
        );
      }

      const response = await callApi(
        "put",
        `/stock-check/complete`,
        { stockCheckRequestDetailIds } // request body với mảng IDs
      );

      if (response) {
        toast.success("Hoàn thành phiếu kiểm kho thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể hoàn thành phiếu kiểm kho");
      console.error("Error completing stock check:", error);
      throw error;
    }
  };

  const getStockCheckNumber = async (
    fromDate: string,
    toDate: string
  ): Promise<ResponseDTO<StockCheckNumberResponse>> => {
    try {
      const response = await callApi(
        "get",
        `/stock-check/number?fromDate=${fromDate}&toDate=${toDate}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thống kê số lượng phiếu kiểm kho");
      console.error("Error fetching stock check number:", error);
      throw error;
    }
  };

  return {
    loading,
    createStockCheckRequest,
    getAllStockCheckRequests,
    getStockCheckRequestById,
    assignStaffToStockCheck,
    updateStockCheckStatus,
    completeStockCheck,
    getStockCheckNumber,
  };
};

export default useStockCheckService;
