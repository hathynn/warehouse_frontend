import { useState } from "react";
import useApiService from "./useApi";
import { toast } from "react-toastify";

interface ItemRequest {
  id?: number;
  name: string;
  description: string;
  measurementUnit: string;
  totalMeasurementValue?: number;
  unitType: string;
  daysUntilDue?: number;
  minimumStockQuantity?: number;
  maximumStockQuantity?: number;
  categoryId: number;
  providerId: number;
}

const useItemService = () => {
  const { callApi, loading } = useApiService();
  const [itemId, setItemId] = useState<number | null>(null);

  // Tạo sản phẩm mới
  const createItem = async (requestData: ItemRequest) => {
    try {
      const response = await callApi("post", "/item", requestData);
      if (response && response.content) {
        setItemId(response.content.id);
        toast.success("Tạo sản phẩm thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo sản phẩm");
      console.error("Error creating item:", error);
      throw error;
    }
  };

  // Cập nhật sản phẩm
  const updateItem = async (requestData: ItemRequest) => {
    try {
      const response = await callApi("put", "/item", requestData);
      toast.success("Cập nhật sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật sản phẩm");
      console.error("Error updating item:", error);
      throw error;
    }
  };

  // Lấy danh sách sản phẩm
  const getItems = async (page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/item?page=${page}&limit=${limit}`
      );
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm");
      console.error("Error fetching items:", error);
      throw error;
    }
  };

  // Lấy sản phẩm theo ID
  const getItemById = async (itemId: number) => {
    try {
      const response = await callApi("get", `/item/${itemId}`);
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy thông tin sản phẩm");
      console.error("Error fetching item:", error);
      throw error;
    }
  };

  // Xóa sản phẩm
  const deleteItem = async (itemId: number) => {
    try {
      const response = await callApi("delete", `/item/${itemId}`);
      toast.success("Xóa sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
      console.error("Error deleting item:", error);
      throw error;
    }
  };

  // Lấy sản phẩm theo danh mục
  const getItemsByCategory = async (categoryId: number, page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/item/category/${categoryId}?page=${page}&limit=${limit}`
      );
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo danh mục");
      console.error("Error fetching items by category:", error);
      throw error;
    }
  };

  // Lấy sản phẩm theo nhà cung cấp
  const getItemsByProvider = async (providerId: number, page = 1, limit = 10) => {
    try {
      const response = await callApi(
        "get", 
        `/item/provider/${providerId}?page=${page}&limit=${limit}`
      );
      return response.content;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo nhà cung cấp");
      console.error("Error fetching items by provider:", error);
      throw error;
    }
  };

  return {
    loading,
    itemId,
    createItem,
    updateItem,
    getItems,
    getItemById,
    deleteItem,
    getItemsByCategory,
    getItemsByProvider
  };
};

export default useItemService;
