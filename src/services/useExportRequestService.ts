import { ExportStatus } from "@/utils/enums";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Các trường trong DB export_request:
export interface ExportRequestResponse {
  exportRequestId: string;
  exportReason: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  departmentId?: number;
  providerId?: number;
  status: string;
  type: string;
  exportDate: string;
  exportTime: string;
  expectedReturnDate?: string;
  isExtended?: boolean;
  extendedDate?: string;
  extendedTime?: string;
  extendedReason?: string;
  assignedWarehouseKeeperId?: number;
  countingDate?: string;
  countingTime?: string;
  countingStaffId?: number;
  paperId?: string;
  importRequestIds: string[];
  exportRequestDetailIds: string[];
  createdBy: string;
  updatedBy: string;
  createdDate: string;
  updatedDate: string;
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
  countingDate: string; // counting_date
  countingTime: string; // counting_time
}

const useExportRequestService = () => {
  const { callApi, loading } = useApi();

  // Lấy tất cả phiếu xuất
  const getAllExportRequests = async (): Promise<ResponseDTO<ExportRequestResponse[]>> => {
    try {
      const response = await callApi("get", "/export-request");
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách phiếu xuất");
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
      }
      return response.content;
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
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể tạo phiếu xuất mượn");
      console.error("Error creating export request loan:", error);
      throw error;
    }
  };

  // Assign warehouse keeper to count an export request
  const assignCountingStaff = async (
    exportRequestId: number,
    accountId: number
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        "export-request/counting/assign-warehouse-keeper",
        { exportRequestId, accountId }
      );
      if (response && response.content) {
        toast.success("Phân công nhân viên kiểm đếm thành công");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể phân công nhân viên kiểm đếm");
      console.error("Error assigning warehouse keeper:", error);
      throw error;
    }
  };

  // Assign warehouse keeper to confirm an export request
  const assignConfirmimgStaff = async (
    exportRequestId: number,
    accountId: number
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        "export-request/assign-warehouse-keeper",
        { exportRequestId, accountId }
      );
      if (response && response.content) {
        toast.success("Phân công nhân viên xác nhận hàng thành công");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể phân công nhân viên xác nhận hàng");
      console.error("Error assigning warehouse keeper:", error);
      throw error;
    }
  };

  // Xác nhận phiếu xuất đã kiểm đếm
  const confirmCountedExportRequest = async (
    exportRequestId: number
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        `/export-request/confirm-counted/${exportRequestId}`
      );
      if (response && response.content) {
        toast.success("Xác nhận kiểm đếm thành công");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể xác nhận kiểm đếm");
      console.error("Error confirming counted export request:", error);
      throw error;
    }
  };

  // Cập nhật trạng thái phiếu xuất
  const updateExportRequestStatus = async (
    exportRequestId: number,
    status: ExportStatus
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        `/export-request/update-status/${exportRequestId}?status=${status}`
      );
      if (response && response.content) {
        toast.success("Trạng thái phiếu xuất đã đổi");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái phiếu xuất");
      console.error("Error updating export request status:", error);
      throw error;
    }
  };

  // Cập nhật ngày và giờ xuất phiếu xuất
  const updateExportDateTime = async (
    exportRequestId: number,
    data: { exportDate: string; exportTime: string }
  ): Promise<ExportRequestResponse | undefined> => {
    try {
      const response = await callApi(
        "post",
        `/export-request/update-export-date-time/${exportRequestId}`,
        data
      );
      if (response && response.content) {
        toast.success("Cập nhật ngày giờ xuất thành công");
      }
      return response.content;
    } catch (error) {
      toast.error("Không thể cập nhật ngày giờ xuất");
      console.error("Error updating export date/time:", error);
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
    assignCountingStaff,
    assignConfirmimgStaff,
    confirmCountedExportRequest,
    updateExportRequestStatus,
    updateExportDateTime,
  };
};

export default useExportRequestService;
