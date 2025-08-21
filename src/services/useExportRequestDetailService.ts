import useApi from "../hooks/useApi";
import { toast } from "react-toastify";

// Interface mô tả dữ liệu chi tiết của export request trả về từ API
export interface ExportRequestDetailResponse {
  importRequestDetailId: number;
  exportRequestId: string;
  exportRequestDetailId: number;
  itemId: string;
  quantity: number;
  status: string;
  itemName: string;
  actualMeasurementValue: number;
  actualQuantity: number;
  inventoryItemIds: string[];
  measurementValue: number;
}

// Interface dùng cho payload khi tạo mới export request detail (nếu cần)
export interface ExportRequestDetailRequest {
  exportRequestId: string;
  itemId: string;
  quantity: number;
  status: string;
  itemName: string;
  measurementValue: number;
  inventoryItemId: string;
}

const useExportRequestDetailService = () => {
  const { callApi, loading } = useApi();

  /**
   * Upload file Excel để tạo mới export request detail.
   * @param file - Đối tượng File của file Excel
   * @param exportRequestId - Mã phiếu xuất đã được tạo thành công từ API
   * @returns Dữ liệu từ phản hồi của API nếu upload thành công
   */
  const createExportRequestDetail = async (
    details: {
      itemId: string;
      quantity: number;
      measurementValue: number;
      inventoryItemId: string;
    }[],
    exportRequestId: number
  ): Promise<ExportRequestDetailResponse[] | undefined> => {
    try {
      const response = await callApi(
        "post",
        `/export-request-detail/${exportRequestId}`,
        details
      );
      if (response && response.content) {
        toast.success("Tạo chi tiết phiếu xuất thành công");
      }
      return response.content;
    } catch (error: any) {
      if (error.message.includes("Inventory items not found for item ID")) {
        toast.error("Không tìm thấy hàng hóa trong kho");
      } else {
        toast.error("Lỗi khi tạo chi tiết phiếu xuất");
      }
      console.error("Error creating export request detail:", error);
      throw error;
    }
  };
  /**
   * Lấy danh sách export request detail theo exportRequestId (có phân trang).
   * @param exportRequestId - Mã phiếu xuất cần lấy chi tiết
   * @param page - Số trang (mặc định 1)
   * @param limit - Số mục trên 1 trang (mặc định 10)
   * @returns Đối tượng chứa mảng ExportRequestDetailResponse và metadata phân trang
   */
  const getExportRequestDetails = async (
    exportRequestId: string,
    page = 1,
    limit = 10
  ): Promise<{
    content: ExportRequestDetailResponse[];
    metaDataDTO: { page: number; limit: number; total: number } | null;
  }> => {
    try {
      const response = await callApi(
        "get",
        `/export-request-detail/${exportRequestId}?page=${page}&limit=${limit}`
      );
      if (response && response.content) {
        return response;
      }
      return {
        content: [],
        metaDataDTO: null,
      };
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết phiếu xuất");
      console.error("Error fetching export request details:", error);
      throw error;
    }
  };

  return {
    loading,
    createExportRequestDetail,
    getExportRequestDetails,
  };
};

export default useExportRequestDetailService;
