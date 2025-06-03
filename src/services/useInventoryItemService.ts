import { ResponseDTO } from "@/utils/interfaces";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";

// Enum to match ItemStatus.java
export enum ItemStatus {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  DISPOSED = "DISPOSED",
  SAFE = "SAFE",
  ALMOST_OUT_OF_DATE = "ALMOST_OUT_OF_DATE"
}

// Interface to match InventoryItemResponse.java
export interface InventoryItemResponse {
  id: string;
  reasonForDisposal?: string;
  quantity: number;
  status: ItemStatus;
  expiredDate: string;
  importedDate: string;
  updatedDate: string;
  parentId?: number;
  childrenIds?: number[];
  itemId: string;
  itemName: string;
  itemCode: string;
  exportRequestDetailId?: number;
  importOrderDetailId?: number;
  storedLocationId?: number;
  storedLocationName?: string;
}

// Interface to match QrCodeResponse.java
export interface QrCodeResponse {
  id: number;
  itemId: number;
  importOrderDetailId?: number;
  exportRequestDetailId?: number;
  measurementValue: number;
}

const useInventoryItemService = () => {
  const { callApi, loading } = useApi();

  // Get all inventory items with pagination
  const getAllInventoryItems = async (
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-item?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm trong kho");
      throw error;
    }
  };

  // Get inventory item by ID
  const getInventoryItemById = async (inventoryItemId: string): Promise<ResponseDTO<InventoryItemResponse>> => {
    try {
      const response = await callApi("get", `/inventory-item/${inventoryItemId}`);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin sản phẩm");
      throw error;
    }
  };

  // Get inventory items by import order detail ID
  const getByImportOrderDetailId = async (
    importOrderDetailId: string,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-item/import-order-detail/${importOrderDetailId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo đơn nhập");
      throw error;
    }
  };

  // Get inventory items by export request detail ID
  const getByExportRequestDetailId = async (
    exportRequestDetailId: string,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-item/export-request-detail/${exportRequestDetailId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo yêu cầu xuất");
      throw error;
    }
  };

  // Get inventory items by stored location ID
  const getByStoredLocationId = async (
    storedLocationId: string,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-item/stored-location/${storedLocationId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo vị trí");
      throw error;
    }
  };

  // Get QR codes by inventory item IDs
  const getListQrCodes = async (inventoryItemIds: string[]): Promise<ResponseDTO<QrCodeResponse[]>> => {
    try {
      const response = await callApi("post", "/inventory-item/qr-codes", inventoryItemIds);
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin mã QR");
      throw error;
    }
  };

  // Delete inventory item
  const deleteInventoryItem = async (inventoryItemId: string): Promise<ResponseDTO<null>> => {
    try {
      const response = await callApi("delete", `/inventory-item/${inventoryItemId}`);
      toast.success("Xóa sản phẩm thành công");
      return response;
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
      throw error;
    }
  };

  return {
    loading,
    getAllInventoryItems,
    getInventoryItemById,
    getByImportOrderDetailId,
    getByExportRequestDetailId,
    getByStoredLocationId,
    deleteInventoryItem,
    getListQrCodes
  };
};

export default useInventoryItemService; 