import useApiService from "./useApi";
import { toast } from "react-toastify";

export enum ExportStatus {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum DetailStatus {
  LACK = "LACK",
  EXCESS = "EXCESS",
  MATCH = "MATCH",
}

// Các trường trong DB export_request:
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
  createdBy?: string;
  updatedBy?: string;
}

const useExportRequestService = () => {
  const { callApi, loading } = useApiService();

  // Lấy tất cả phiếu xuất
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

  // Tạo mới phiếu xuất cho Production
  const createExportRequestProduction = async (
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

  // Tạo mới phiếu xuất cho Loan (borrow)
  const createExportRequestLoan = async (
    requestData: ExportRequestRequest
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        "/export-request/borrow",
        requestData
      );
      if (response && response.content) {
        toast.success("Tạo phiếu xuất mượn thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo phiếu xuất mượn");
      console.error("Error creating export request loan:", error);
      throw error;
    }
  };

  // Assign warehouse keeper to an export request
  const assignStaff = async (
    exportRequestId: number,
    accountId: number
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        "/export-request/assign-warehouse-keeper",
        { exportRequestId, accountId }
      );
      if (response && response.content) {
        toast.success("Phân công nhân viên kho thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể phân công nhân viên kho");
      console.error("Error assigning warehouse keeper:", error);
      throw error;
    }
  };

  return {
    loading,
    getAllExportRequests,
    getExportRequestById,
    getExportRequestsByPage,
    createExportRequestProduction,
    createExportRequestLoan,
    assignStaff,
  };
};

export default useExportRequestService;
