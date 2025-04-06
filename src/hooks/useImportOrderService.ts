import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

// Enum to match ImportStatus.java
export enum ImportStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

// Enum to match DetailStatus.java
export enum DetailStatus {
  PENDING = "PENDING",
  RECEIVED = "RECEIVED",
  REJECTED = "REJECTED"
}

// Interface to match ImportOrderRequest.java
export interface ImportOrderRequest {
  importOrderId?: number;
  status?: ImportStatus;
  importRequestId: number;
  accountId: number;
  dateReceived: string; // LocalDate in backend
  timeReceived: string; // LocalTime in backend
  note?: string;
}

// Interface to match ImportOrderResponse.java
export interface ImportOrderResponse {
  importOrderId: number;
  importRequestId: number;
  dateReceived: string;
  timeReceived: string;
  note?: string;
  status: ImportStatus;
  importOrderDetailIds: number[];
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
  paperIds?: number;
  assignedWareHouseKeeperId?: number;
}

// Interface to match ImportOrderDetailRequest.java
export interface ImportOrderDetailRequest {
  itemId: number;
  quantity: number;
  actualQuantity: number;
}

// Interface to match ImportOrderDetailResponse.java
export interface ImportOrderDetailResponse {
  importOrderDetailId: number;
  importOrderId: number;
  itemId: number;
  itemName: string;
  expectQuantity: number;
  actualQuantity: number;
  status: DetailStatus;
}

const useImportOrderService = () => {
  const { callApi, loading } = useApiService();
  const [importOrderId, setImportOrderId] = useState<number | null>(null);

  // Create a new import order
  const createImportOrder = async (requestData: ImportOrderRequest): Promise<ImportOrderResponse | undefined> => {
    try {
      const response = await callApi("post", "/import-order", requestData);
      if (response && response.content) {
        setImportOrderId(response.content.importOrderId);
        toast.success("Tạo đơn nhập thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo đơn nhập");
      console.error("Error creating import order:", error);
      throw error;
    }
  };

  // Update an existing import order
  const updateImportOrder = async (requestData: ImportOrderRequest): Promise<ImportOrderResponse | undefined> => {
    try {
      const response = await callApi("put", "/import-order", requestData);
      if (response && response.content) {
        toast.success("Cập nhật đơn nhập thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể cập nhật đơn nhập");
      console.error("Error updating import order:", error);
      throw error;
    }
  };

  // Delete an import order
  const deleteImportOrder = async (importOrderId: number): Promise<void> => {
    try {
      await callApi("delete", `/import-order/${importOrderId}`);
      toast.success("Xóa đơn nhập thành công");
    } catch (error) {
      toast.error("Không thể xóa đơn nhập");
      console.error("Error deleting import order:", error);
      throw error;
    }
  };

  // Get import order by ID
  const getImportOrderById = async (importOrderId: number): Promise<ImportOrderResponse | undefined> => {
    try {
      const response = await callApi("get", `/import-order/${importOrderId}`);
      if (response && response.content) {
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể lấy thông tin đơn nhập");
      console.error("Error fetching import order:", error);
      throw error;
    }
  };

  // Get import orders by import request ID with pagination
  const getImportOrdersByRequestId = async (
    importRequestId: number, 
    page = 1, 
    limit = 10
  ): Promise<{ items: ImportOrderResponse[], metadata: any } | undefined> => {
    try {
      const response = await callApi(
        "get", 
        `/import-order/page/${importRequestId}?page=${page}&limit=${limit}`
      );
      if (response) {
        return response
      }
    } catch (error) {
      toast.error("Không thể lấy danh sách đơn nhập");
      console.error("Error fetching import orders:", error);
      throw error;
    }
  };

  return {
    loading,
    importOrderId,
    // Import Order methods
    createImportOrder,
    updateImportOrder,
    deleteImportOrder,
    getImportOrderById,
    getImportOrdersByRequestId,
  };
};

export default useImportOrderService;
