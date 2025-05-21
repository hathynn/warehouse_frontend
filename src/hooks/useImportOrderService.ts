import { useState } from "react";
import useApiService, { ResponseDTO } from "./useApi";
import { toast } from "react-toastify";

// Enum to match ImportStatus.java
export enum ImportStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COUNTED = "COUNTED",
  CONFIRMED = "CONFIRMED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED"
}

// Interface to match ImportOrderCreateRequest.java
export interface ImportOrderCreateRequest {
  importRequestId: string | null;
  accountId: number | null;
  dateReceived: string;
  timeReceived: string;
  note?: string;
}

// Interface to match ImportOrderResponse.java
export interface ImportOrderResponse {
  importOrderId: string;
  importRequestId: string;
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
  assignedStaffId?: number;
}

// Interface to match AssignStaffRequest.java
export interface AssignStaffRequest {
  importOrderId: string;
  accountId: number;
}

const useImportOrderService = () => {
  const { callApi, loading } = useApiService();
  const [importOrderId, setImportOrderId] = useState<string | null>(null);

  // Add new function to get all import orders
  const getAllImportOrders = async (
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<ImportOrderResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/import-order/page?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách đơn nhập");
      console.error("Error fetching all import orders:", error);
      throw error;
    }
  };

  // Get all import orders for a specific import request with pagination
  const getImportOrdersByRequestId = async (
    importRequestId: string, 
    page = 1, 
    limit = 10
  ): Promise<ResponseDTO<ImportOrderResponse[]>> => {
    try {
      const response = await callApi(
        "get", 
        `/import-order/page/${importRequestId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách đơn nhập");
      console.error("Error fetching import orders:", error);
      throw error;
    }
  };

  // Get import order by ID
  const getImportOrderById = async (importOrderId: string): Promise<ResponseDTO<ImportOrderResponse>> => {
    try {
      const response = await callApi("get", `/import-order/${importOrderId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin đơn nhập");
      console.error("Error fetching import order:", error);
      throw error;
    }
  };

  // Create a new import order
  const createImportOrder = async (requestData: ImportOrderCreateRequest): Promise<ResponseDTO<ImportOrderResponse>> => {
    try {
      const response = await callApi("post", "/import-order", requestData);
      if (response && response.content) {
        setImportOrderId(response.content.importOrderId);
        toast.success("Tạo đơn nhập thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể tạo đơn nhập");
      console.error("Error creating import order:", error);
      throw error;
    }
  };

  // Assign staff to an import order
  const assignStaff = async (requestData: AssignStaffRequest): Promise<ResponseDTO<ImportOrderResponse>> => {
    try {
      const response = await callApi("post", "/import-order/assign-staff", requestData);
      if (response && response.content) {
        toast.success("Phân công nhân viên kho thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể phân công nhân viên kho");
      console.error("Error assigning staff:", error);
      throw error;
    }
  };

  // Complete an import order
  const completeImportOrder = async (importOrderId: string): Promise<ResponseDTO<ImportOrderResponse>> => {
    try {
      const response = await callApi("post", `/import-order/complete/${importOrderId}`);
      if (response && response.content) {
        toast.success("Hoàn tất đơn nhập thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể hoàn tất đơn nhập");
      console.error("Error completing import order:", error);
      throw error;
    }
  };

  // Cancel an import order
  const cancelImportOrder = async (importOrderId: string): Promise<ResponseDTO<ImportOrderResponse>> => {
    try {
      const response = await callApi("post", `/import-order/cancel/${importOrderId}`);
      if (response && response.content) {
        toast.success("Hủy đơn nhập thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể hủy đơn nhập");
      console.error("Error cancelling import order:", error);
      throw error;
    }
  };

  return {
    loading,
    importOrderId,
    getAllImportOrders,
    getImportOrdersByRequestId,
    getImportOrderById,
    createImportOrder,
    assignStaff,
    completeImportOrder,
    cancelImportOrder,
  };
};

export default useImportOrderService;
