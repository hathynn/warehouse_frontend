import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify"

interface ImportRequestRequest {
  importReason: string;
  importType: string;
  providerId: number;
  exportRequestId?: number | null;
}

const useImportRequestService = () => {
  const { callApi, loading } = useApiService();
  const [importRequestId, setImportRequestId] = useState<number | null>(null);

  // Tạo import request mới
  const createImportRequest = async (requestData: ImportRequestRequest) => {
    try {
      const response = await callApi("post", "/import-request", requestData);
      if (response && response.data) {
        setImportRequestId(response.data.id);
        toast.success("Tạo phiếu nhập thành công");
        return response.data;
      }
    } catch (error) {
      toast.error("Không thể tạo phiếu nhập");
      console.error("Error creating import request:", error);
      throw error;
    }
  };

  // Upload file Excel cho import request detail
  const uploadImportRequestDetail = async (file: File, importRequestId: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await callApi(
        "post", 
        `/import-request-detail/${importRequestId}`, 
        formData
      );
      
      toast.success("Upload danh sách sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể upload danh sách sản phẩm");
      console.error("Error uploading import request detail:", error);
      throw error;
    }
  };

  // Lấy danh sách import request detail theo import request ID
  const getImportRequestDetails = async (importRequestId: number, page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/import-request-detail/page/${importRequestId}?page=${page}&limit=${limit}`
      );
      return response.data;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết phiếu nhập");
      console.error("Error fetching import request details:", error);
      throw error;
    }
  };

  // Cập nhật import request detail
  const updateImportRequestDetails = async (importRequestId: number, detailsList: any[]) => {
    try {
      const response = await callApi(
        "put", 
        `/import-request-detail/${importRequestId}`, 
        detailsList
      );
      
      toast.success("Cập nhật chi tiết phiếu nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật chi tiết phiếu nhập");
      console.error("Error updating import request details:", error);
      throw error;
    }
  };

  return {
    loading,
    importRequestId,
    createImportRequest,
    uploadImportRequestDetail,
    getImportRequestDetails,
    updateImportRequestDetails
  };
};

export default useImportRequestService;
