import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

export interface ImportOrderRequest {
  importOrderId?: number;
  status?: string;
  importRequestId: number;
  accountId: number;
  dateReceived: string;
  timeReceived: string;
  note?: string;
}

export interface ImportOrderDetailRequest {
  id?: number;
  importOrderId: number;
  itemId: number;
  quantity: number;
  actualQuantity: number;
  note?: string;
}

const useImportOrderService = () => {
  const { callApi, loading } = useApiService();
  const [importOrderId, setImportOrderId] = useState<number | null>(null);

  // Tạo đơn nhập mới
  const createImportOrder = async (requestData: ImportOrderRequest) => {
    try {
      const response = await callApi("post", "/import-order", requestData);
      if (response && response.content) {
        setImportOrderId(response.content.id);
        toast.success("Tạo đơn nhập thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo đơn nhập");
      console.error("Error creating import order:", error);
      throw error;
    }
  };

  // Cập nhật đơn nhập
  const updateImportOrder = async (requestData: ImportOrderRequest) => {
    try {
      const response = await callApi("put", "/import-order", requestData);
      toast.success("Cập nhật đơn nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật đơn nhập");
      console.error("Error updating import order:", error);
      throw error;
    }
  };

  // Xóa đơn nhập
  const deleteImportOrder = async (importOrderId: number) => {
    try {
      const response = await callApi("delete", `/import-order/${importOrderId}`);
      toast.success("Xóa đơn nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa đơn nhập");
      console.error("Error deleting import order:", error);
      throw error;
    }
  };

  // Lấy đơn nhập theo ID
  const getImportOrderById = async (importOrderId: number) => {
    try {
      const response = await callApi("get", `/import-order/${importOrderId}`);
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy thông tin đơn nhập");
      console.error("Error fetching import order:", error);
      throw error;
    }
  };

  // Lấy danh sách đơn nhập theo import request ID
  const getImportOrdersByRequestId = async (importRequestId: number, page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/import-order/page/${importRequestId}?page=${page}&limit=${limit}`
      );
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy danh sách đơn nhập");
      console.error("Error fetching import orders:", error);
      throw error;
    }
  };

  return {
    loading,
    importOrderId,
    createImportOrder,
    updateImportOrder,
    deleteImportOrder,
    getImportOrderById,
    getImportOrdersByRequestId
  };
};

export default useImportOrderService;
