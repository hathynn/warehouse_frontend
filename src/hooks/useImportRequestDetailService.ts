import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

interface ImportRequestDetailResponse {
  importRequestDetailId: number;
  importRequestId: number;
  itemId: number;
  itemName: string;
  actualQuantity: number;
  expectQuantity: number;
  status: string;
}

const useImportRequestDetailService = () => {
  const { callApi, loading } = useApiService();

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
      return response.content;
    } catch (error) {
      toast.error("Không thể upload danh sách sản phẩm");
      console.error("Error uploading import request detail:", error);
      throw error;
    }
  };

  const getImportRequestDetails = async (importRequestId: number, page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/import-request-detail/page/${importRequestId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết phiếu nhập");
      console.error("Error fetching import request details:", error);
      throw error;
    }
  };

  const updateImportRequestDetails = async (importRequestId: number, detailsList: any[]) => {
    try {
      const response = await callApi(
        "put", 
        `/import-request-detail/${importRequestId}`, 
        detailsList
      );
      
      toast.success("Cập nhật chi tiết phiếu nhập thành công");
      return response.content;
    } catch (error) {
      toast.error("Không thể cập nhật chi tiết phiếu nhập");
      console.error("Error updating import request details:", error);
      throw error;
    }
  };

  return {
    loading,
    uploadImportRequestDetail,
    getImportRequestDetails,
    updateImportRequestDetails
  };
};

export default useImportRequestDetailService; 