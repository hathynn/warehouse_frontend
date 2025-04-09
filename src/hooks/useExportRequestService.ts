import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

// Các trường trong DB export_request:
// id: number;
export interface ExportRequestResponse {
  id: number;
  exportDate: string; // export_date
  exportTime: string; // export_time
  assignedWarehouseKeeperId?: number; // assigned_warehouse_keeper_id
  createdDate: string; // created_date
  updatedDate: string; // updated_date
  createdBy: string; // created_by
  updatedBy: string; // updated_by
  exportReason: string; // export_reason
  receiverAddress: string; // receiver_address
  receiverName: string; // receiver_name
  receiverPhone: string; // receiver_phone
  status: string; // status
  type: string; // type
}

// Khi tạo mới, có thể thiếu một số trường như id, createdDate, updatedDate, ...
// Những trường này sẽ được backend tự động set khi tạo mới.
export interface ExportRequestRequest {
  exportDate: string;
  exportTime: string;
  assignedWarehouseKeeperId?: number;
  exportReason: string;
  receiverAddress: string;
  receiverName: string;
  receiverPhone: string;
  status: string;
  type: string;
  // createdBy và updatedBy có thể do backend tự set hoặc bạn tự set
  //
  createdBy?: string;
  updatedBy?: string;
}

const useExportRequestService = () => {
  const { callApi, loading } = useApiService();

  // Lấy tất cả phiếu xuất
  // Các trường trong DB export_request:
  const getAllExportRequests = async (): Promise<ExportRequestResponse[]> => {
    try {
      const response = await callApi("get", "/export-request");
      if (response && response.content) {
        return response.content;
      }
      return [];
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu xuất");
      console.error("Error fetching export requests:", error);
      throw error;
    }
  };

  // Lấy phiếu xuất theo ID
  const getExportRequestById = async (
    id: number
  ): Promise<ExportRequestResponse | null> => {
    try {
      const response = await callApi("get", `/export-request/${id}`);
      if (response && response.content) {
        return response.content;
      }
      return null;
    } catch (error) {
      toast.error("Không thể lấy thông tin phiếu xuất");
      console.error("Error fetching export request:", error);
      throw error;
    }
  };

  // Lấy phiếu xuất phân trang
  const getExportRequestsByPage = async (page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get",
        `/export-request/page?page=${page}&limit=${limit}`
      );
      if (response && response.content) {
        return response;
      }
      return [];
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu xuất");
      console.error("Error fetching export requests:", error);
      throw error;
    }
  };

  // Tạo mới phiếu xuất
  const createExportRequest = async (
    requestData: ExportRequestRequest
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi("post", "/export-request", requestData);
      if (response && response.content) {
        toast.success("Tạo phiếu xuất thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo phiếu xuất");
      console.error("Error creating export request:", error);
      throw error;
    }
  };

  return {
    loading,
    getAllExportRequests,
    getExportRequestById,
    getExportRequestsByPage,
    createExportRequest,
  };
};

export default useExportRequestService;
