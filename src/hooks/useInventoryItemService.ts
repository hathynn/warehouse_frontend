import useApiService from "./useApi";
import { toast } from "react-toastify";

// Enum to match ItemStatus.java
export enum ItemStatus {
  // Add your item status enums here
}

// Interface to match InventoryItemRequest.java
export interface InventoryItemRequest {
  id?: number;
  reasonForDisposal?: string;
  quantity: number;
  status: ItemStatus;
  expiredDate: string;
  importedDate: string;
  updatedDate: string;
  parentId?: number;
  childrenIds?: number[];
  itemId: number;
  exportRequestDetailId?: number;
  importOrderDetailId?: number;
  storedLocationId?: number;
  numberOfItems: number;
}

// Interface to match QrCodeRequest.java
export interface QrCodeRequest {
  itemId: number;
  importOrderDetailId: number;
  numberOfQrCodes: number;
}

// Interface to match InventoryItemResponse.java
export interface InventoryItemResponse {
  id: number;
  reasonForDisposal?: string;
  quantity: number;
  status: ItemStatus;
  expiredDate: string;
  importedDate: string;
  updatedDate: string;
  parentId?: number;
  childrenIds?: number[];
  itemId: number;
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
  quantity: number;
}

const useInventoryItemService = () => {
  const { callApi, loading } = useApiService();

  // Get all inventory items with pagination
  const getAllInventoryItems = async (
    page = 1,
    limit = 10
  ): Promise<{ items: InventoryItemResponse[], metadata: any } | undefined> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-items?page=${page}&limit=${limit}`
      );
      if (response) {
        return response;
      }
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm trong kho");
      console.error("Error fetching inventory items:", error);
      throw error;
    }
  };

  // Get inventory item by ID
  const getInventoryItemById = async (inventoryItemId: number): Promise<InventoryItemResponse | undefined> => {
    try {
      const response = await callApi("get", `/inventory-items/${inventoryItemId}`);
      if (response && response.content) {
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể lấy thông tin sản phẩm");
      console.error("Error fetching inventory item:", error);
      throw error;
    }
  };

  // Get inventory items by import order detail ID
  const getByImportOrderDetailId = async (
    importOrderDetailId: number,
    page = 1,
    limit = 10
  ): Promise<{ items: InventoryItemResponse[], metadata: any } | undefined> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-items/import-order-detail/${importOrderDetailId}?page=${page}&limit=${limit}`
      );
      if (response) {
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo đơn nhập");
      console.error("Error fetching inventory items by import order detail:", error);
      throw error;
    }
  };

  // Get inventory items by export request detail ID
  const getByExportRequestDetailId = async (
    exportRequestDetailId: number,
    page = 1,
    limit = 10
  ): Promise<{ items: InventoryItemResponse[], metadata: any } | undefined> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-items/export-request-detail/${exportRequestDetailId}?page=${page}&limit=${limit}`
      );
      if (response) {
        return response;
      }
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo yêu cầu xuất");
      console.error("Error fetching inventory items by export request detail:", error);
      throw error;
    }
  };

  // Get inventory items by stored location ID
  const getByStoredLocationId = async (
    storedLocationId: number,
    page = 1,
    limit = 10
  ): Promise<{ items: InventoryItemResponse[], metadata: any } | undefined> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-items/stored-location/${storedLocationId}?page=${page}&limit=${limit}`
      );
      if (response) {
        return response;
      }
    } catch (error) {
      toast.error("Không thể lấy danh sách sản phẩm theo vị trí");
      console.error("Error fetching inventory items by stored location:", error);
      throw error;
    }
  };

  // Get QR codes by inventory item IDs
  const getListQrCodes = async (inventoryItemIds: number[]): Promise<QrCodeResponse[] | undefined> => {
    try {
      const response = await callApi("post", "/inventory-items/qr-codes", inventoryItemIds);
      if (response && response.content) {
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể lấy thông tin mã QR");
      console.error("Error fetching QR codes:", error);
      throw error;
    }
  };

  // Create new inventory item and generate QR codes
  const createInventoryItem = async (request: InventoryItemRequest): Promise<QrCodeResponse[] | undefined> => {
    try {
      const response = await callApi("post", "/inventory-items", request);
      if (response && response.content) {
        toast.success("Tạo sản phẩm thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo sản phẩm");
      console.error("Error creating inventory item:", error);
      throw error;
    }
  };

  // Create new inventory item with QR codes
  const createInventoryItemWithQrCode = async (request: QrCodeRequest): Promise<QrCodeResponse[] | undefined> => {
    try {
      const response = await callApi("post", "/inventory-items/create-with-qr", request);
      if (response && response.content) {
        toast.success("Tạo sản phẩm và mã QR thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể tạo sản phẩm và mã QR");
      console.error("Error creating inventory item with QR codes:", error);
      throw error;
    }
  };

  // Update inventory item
  const updateInventoryItem = async (request: InventoryItemRequest): Promise<InventoryItemResponse | undefined> => {
    try {
      const response = await callApi("put", "/inventory-items", request);
      if (response && response.content) {
        toast.success("Cập nhật sản phẩm thành công");
        return response.content;
      }
    } catch (error) {
      toast.error("Không thể cập nhật sản phẩm");
      console.error("Error updating inventory item:", error);
      throw error;
    }
  };

  // Delete inventory item
  const deleteInventoryItem = async (inventoryItemId: number): Promise<void> => {
    try {
      await callApi("delete", `/inventory-items/${inventoryItemId}`);
      toast.success("Xóa sản phẩm thành công");
    } catch (error) {
      toast.error("Không thể xóa sản phẩm");
      console.error("Error deleting inventory item:", error);
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
    createInventoryItem,
    createInventoryItemWithQrCode,
    updateInventoryItem,
    deleteInventoryItem,
    getListQrCodes
  };
};

export default useInventoryItemService; 