import { ResponseDTO } from "@/utils/interfaces";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";

// Enum to match ItemStatus.java
export enum ItemStatus {
  AVAILABLE = "AVAILABLE",
  UNAVAILABLE = "UNAVAILABLE",
  DISPOSED = "DISPOSED",
  SAFE = "SAFE",
  ALMOST_OUT_OF_DATE = "ALMOST_OUT_OF_DATE",
}

// Interface to match UpdateInventoryLocationRequest.java
export interface UpdateInventoryLocationRequest {
  inventoryItemId: string;
  storedLocationId: number;
}

// Interface for change inventory item export detail request
export interface ChangeInventoryItemExportDetailRequest {
  oldInventoryItemId: string;
  newInventoryItemId: string;
}

// Interface to match InventoryItemResponse.java
export interface InventoryItemResponse {
  id: string;
  reasonForDisposal?: string;
  measurementValue?: number;
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
  isTrackingForExport?: boolean;
}

export interface AutoChangeInventoryItemRequest {
  inventoryItemId: string;
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
  const getInventoryItemById = async (
    inventoryItemId: string
  ): Promise<ResponseDTO<InventoryItemResponse>> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-item/${inventoryItemId}`
      );
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

  // Get inventory items by list import order detail IDs
  const getByListImportOrderDetailIds = async (
    importOrderDetailIds: string[]
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "post",
        "/inventory-item/import-order-detail",
        importOrderDetailIds
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

  // Get QR codes by inventory item IDs
  const getListQrCodes = async (
    inventoryItemIds: string[]
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "post",
        "/inventory-item/qr-codes",
        inventoryItemIds
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin mã QR");
      throw error;
    }
  };

  // Update stored location of inventory items
  const updateStoredLocation = async (
    requests: UpdateInventoryLocationRequest[]
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "put",
        "/inventory-item/update-location",
        requests
      );
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật vị trí sản phẩm");
      throw error;
    }
  };

  // Change inventory item of export request detail
  const changeInventoryItemExportDetail = async (
    request: ChangeInventoryItemExportDetailRequest
  ): Promise<ResponseDTO<any>> => {
    try {
      const response = await callApi(
        "post",
        "/inventory-item/change-inventory-item-export-detail",
        request
      );
      toast.success("Đổi sản phẩm xuất kho thành công");
      return response;
    } catch (error) {
      toast.error("Không thể đổi sản phẩm xuất kho");
      throw error;
    }
  };

  // Auto change new suitable inventory item for export request detail
  const autoChangeInventoryItem = async (
    inventoryItemId: string
  ): Promise<ResponseDTO<any>> => {
    try {
      const response = await callApi(
        "put",
        `/inventory-item/auto-change/${inventoryItemId}`
      );
      toast.success("Tự động đổi sản phẩm phù hợp thành công");
      return response;
    } catch (error) {
      toast.error("Không thể tự động đổi sản phẩm");
      throw error;
    }
  };

  return {
    loading,
    getAllInventoryItems,
    getInventoryItemById,
    getByImportOrderDetailId,
    getByListImportOrderDetailIds,
    getByExportRequestDetailId,
    getListQrCodes,
    updateStoredLocation,
    changeInventoryItemExportDetail,
    autoChangeInventoryItem,
  };
};

export default useInventoryItemService;
