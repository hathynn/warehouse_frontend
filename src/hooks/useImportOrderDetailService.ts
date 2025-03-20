import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";
import { ImportOrderDetailRequest } from "./useImportOrderService";

const useImportOrderDetailService = () => {
  const { callApi, loading } = useApiService();

  // Upload file Excel cho import order detail
  const uploadImportOrderDetail = async (file: File, importOrderId: number) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      
      const response = await callApi(
        "post", 
        `/import-order-detail/${importOrderId}`, 
        formData
      );
      
      toast.success("Upload danh sách sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể upload danh sách sản phẩm");
      console.error("Error uploading import order detail:", error);
      throw error;
    }
  };

  // Lấy danh sách import order detail theo import order ID (phân trang)
  const getImportOrderDetailsPaginated = async (importOrderId: number, page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/import-order-detail/page/${importOrderId}?page=${page}&limit=${limit}`
      );
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết đơn nhập");
      console.error("Error fetching import order details:", error);
      throw error;
    }
  };

  // Lấy tất cả import order detail theo import order ID
  const getAllImportOrderDetails = async (importOrderId: number) => {
    try {
      const response = await callApi(
        "get", 
        `/import-order-detail/${importOrderId}`
      );
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy danh sách chi tiết đơn nhập");
      console.error("Error fetching import order details:", error);
      throw error;
    }
  };

  // Cập nhật import order detail
  const updateImportOrderDetails = async (importOrderId: number, detailsList: ImportOrderDetailRequest[]) => {
    try {
      const response = await callApi(
        "put", 
        `/import-order-detail/${importOrderId}`, 
        detailsList
      );
      
      toast.success("Cập nhật chi tiết đơn nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật chi tiết đơn nhập");
      console.error("Error updating import order details:", error);
      throw error;
    }
  };

  // Xóa import order detail
  const deleteImportOrderDetails = async (importOrderId: number) => {
    try {
      const response = await callApi(
        "delete", 
        `/import-order-detail/${importOrderId}`
      );
      
      toast.success("Xóa chi tiết đơn nhập thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa chi tiết đơn nhập");
      console.error("Error deleting import order details:", error);
      throw error;
    }
  };

  return {
    loading,
    uploadImportOrderDetail,
    getImportOrderDetailsPaginated,
    getAllImportOrderDetails,
    updateImportOrderDetails,
    deleteImportOrderDetails
  };
};

export default useImportOrderDetailService;
