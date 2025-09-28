import { useState } from "react";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface to match ItemRequest.java
export interface ItemRequest {
  id?: string;
  name: string;
  description: string;
  measurementUnit: string;
  measurementValue?: number;
  totalMeasurementValue?: number;
  unitType: string;
  daysUntilDue?: number;
  minimumStockQuantity?: number;
  maximumStockQuantity?: number;
  categoryId: number;
  providerId?: number;
  providerCode?: string;
  providerIds?: number[];
  countingMinutes?: number;
}

// Interface to match ItemResponse.java
export interface ItemResponse {
  // List of valid provider IDs for this item
  quantity: number;
  providerIds: number[];
  id: string;
  name: string;
  description: string;
  measurementUnit: string;
  measurementValue: number;
  totalMeasurementValue: number;
  unitType: string;
  daysUntilDue: number;
  minimumStockQuantity: number;
  maximumStockQuantity: number;
  categoryId: number;
  providerId: number;
  importOrderDetailIds: number[];
  importRequestDetailIds: number[];
  exportRequestDetailIds: number[];
  inventoryItemIds: string[];
  numberOfAvailableItems: number;
  numberOfAvailableMeasurementValues: number;
}

export interface ItemImportExportResponse {
  importOrderIds: string[];
  exportRequestIds: string[];
  importMeasurementValue: number;
  exportMeasurementValue: number;
}

export interface ItemFiguresResponse {
  totalInStock: number;
  totalOutOfStock: number;
}

const useItemService = () => {
  const { callApi, loading } = useApi();
  const [itemId, setItemId] = useState<number | null>(null);

  // Tạo sản phẩm mới
  const createItem = async (
    requestData: ItemRequest
  ): Promise<ResponseDTO<ItemResponse>> => {
    try {
      const response = await callApi("post", "/item", requestData);
      if (response && response.content) {
        setItemId(response.content.id);
        toast.success("Tạo sản phẩm thành công");
      }
      return response;
    } catch (error) {
      toast.error("Không thể tạo sản phẩm");
      throw error;
    }
  };

  // Cập nhật sản phẩm
  const updateItem = async (
    requestData: ItemRequest
  ): Promise<ResponseDTO<ItemResponse>> => {
    try {
      const response = await callApi("put", "/item", requestData);
      toast.success("Cập nhật sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật sản phẩm");
      throw error;
    }
  };

  // Lấy danh sách sản phẩm
  const getItems = async (
    page = 1,
    limit = 999
  ): Promise<ResponseDTO<ItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/item?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm");
      throw error;
    }
  };

  // Lấy sản phẩm theo ID
  const getItemById = async (
    itemId: string
  ): Promise<ResponseDTO<ItemResponse>> => {
    try {
      const response = await callApi("get", `/item/${itemId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin sản phẩm");
      throw error;
    }
  };

  // Xóa sản phẩm
  const deleteItem = async (itemId: number): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi("delete", `/item/${itemId}`);
      toast.success("Xóa sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
      throw error;
    }
  };

  // Lấy sản phẩm theo danh mục
  const getItemsByCategory = async (
    categoryId: number,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<ItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/item/category/${categoryId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo danh mục");
      throw error;
    }
  };

  // Lấy sản phẩm theo nhà cung cấp
  const getItemsByProvider = async (
    providerId: number,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<ItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/item/provider/${providerId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo nhà cung cấp");
      throw error;
    }
  };

  const getItemImportExportNumber = async (
    itemId: string,
    fromDate: string,
    toDate: string
  ): Promise<ResponseDTO<ItemImportExportResponse>> => {
    try {
      const response = await callApi(
        "get",
        `/item/im-ex/${itemId}?fromDate=${fromDate}&toDate=${toDate}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin import-export của sản phẩm");
      throw error;
    }
  };

  const getItemFigures = async (): Promise<
    ResponseDTO<ItemFiguresResponse>
  > => {
    try {
      const response = await callApi("get", "/item/figures");
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin thống kê sản phẩm");
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
    getItemsByProvider,
    getItemImportExportNumber,
    getItemFigures,
  };
};

export default useItemService;
