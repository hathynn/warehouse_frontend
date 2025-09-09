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
  NEED_LIQUID = "NEED_LIQUID",
  NO_LONGER_EXIST = "NO_LONGER_EXIST",
  READY_TO_STORE = "READY_TO_STORE",
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

// Interface for update inventory item request
export interface UpdateInventoryItemRequest {
  id: string;
  status?: ItemStatus;
  reasonForDisposal?: string;
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

export interface InventoryItemFigureResponse {
  itemId: string;
  totalInventoryItemAvailable: number;
  totalInventoryItemUnAvailable: number;
  totalInventoryItemNeedLiquid: number;
  totalInventoryItemReadToStore: number;
  totalInventoryItemNoLongerExist: number;
}

export interface AutoChangeInventoryItemRequest {
  inventoryItemId: string;
}

interface PaginationOptions {
  page?: number;
  limit?: number;
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
      console.log("Error getting all inventory item by pagination" + error);
      throw error;
    }
  };

  const getAllInventoryItemsWithoutPagination = async () => {
    try {
      // Lấy page đầu để biết total
      const firstPage = await getAllInventoryItems(1, 10);

      if (!firstPage?.content || firstPage.content.length === 0) {
        return [];
      }

      const total = firstPage.metaDataDTO?.total || 0;

      // Nếu page đầu đã có hết thì return luôn
      if (firstPage.content.length >= total) {
        return firstPage.content;
      }

      // Tính số pages cần thiết
      const limit = 400;
      const totalPages = Math.ceil(total / limit);

      // Tạo promises cho các pages còn lại
      const remainingPromises = [];
      for (let page = 2; page <= totalPages; page++) {
        remainingPromises.push(getAllInventoryItems(page, limit));
      }

      // Chờ tất cả requests hoàn thành
      const remainingResponses = await Promise.all(remainingPromises);

      // Gộp tất cả content lại
      const allItems = [...firstPage.content];
      remainingResponses.forEach((response) => {
        if (response?.content) {
          allItems.push(...response.content);
        }
      });

      return allItems;
    } catch (error) {
      console.error("Error fetching all inventory items:", error);
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

  // Get inventory items by item ID
  const getInventoryItemsByItemId = async (
    itemId: string,
    options: PaginationOptions = {}
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const { page = 1, limit = 10 } = options;
      const response = await callApi("get", `/inventory-item/item/${itemId}`, {
        params: { page, limit },
      });
      return response;
    } catch (error) {
      console.error("Không thể lấy mã tồn kho theo mã hàng");
      throw error;
    }
  };

  const getAllInventoryItemsByItemId = async (
    itemId: string
  ): Promise<InventoryItemResponse[]> => {
    try {
      // Lấy page đầu để biết total
      const firstPage = await getInventoryItemsByItemId(itemId, {
        page: 1,
        limit: 50,
      });

      if (!firstPage?.content || firstPage.content.length === 0) {
        return [];
      }

      const total = firstPage.metaDataDTO?.total || 0;

      // Nếu page đầu đã có hết thì return luôn
      if (firstPage.content.length >= total) {
        return firstPage.content;
      }

      // Tính số pages cần thiết
      const limit = 50;
      const totalPages = Math.ceil(total / limit);

      // Tạo promises cho các pages còn lại
      const remainingPromises: Promise<ResponseDTO<InventoryItemResponse[]>>[] =
        [];
      for (let page = 2; page <= totalPages; page++) {
        remainingPromises.push(
          getInventoryItemsByItemId(itemId, { page, limit })
        );
      }

      // Chờ tất cả requests hoàn thành
      const remainingResponses = await Promise.all(remainingPromises);

      // Gộp tất cả content lại
      const allItems: InventoryItemResponse[] = [...firstPage.content];
      remainingResponses.forEach((response) => {
        if (response?.content) {
          allItems.push(...response.content);
        }
      });

      console.log(
        `✅ Fetched ${allItems.length}/${total} inventory items for ${itemId}`
      );
      return allItems;
    } catch (error) {
      console.error("Error fetching all inventory items:", error);
      throw error;
    }
  };

  const getInventoryItemFigure = async (): Promise<
    ResponseDTO<InventoryItemFigureResponse[]>
  > => {
    try {
      const response = await callApi("get", "/inventory-item/figure");
      return response;
    } catch (error) {
      console.error("Không thể lấy được số liệu hàng tồn kho");
      throw error;
    }
  };

  // Update an existing inventory item
  const updateInventoryItem = async (
    request: UpdateInventoryItemRequest
  ): Promise<ResponseDTO<InventoryItemResponse>> => {
    try {
      const response = await callApi("put", "/inventory-item", request);
      toast.success("Cập nhật trạng thái mã hàng thành công");
      return response;
    } catch (error) {
      toast.error("Không thể cập nhật trạng thái mã hàng");
      throw error;
    }
  };

  // Get inventory item history by ID
  const getInventoryItemHistory = async (
    inventoryItemId: string
  ): Promise<ResponseDTO<InventoryItemResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/inventory-item/history/${inventoryItemId}`
      );
      return response;
    } catch (error) {
      console.error("Không thể lấy lịch sử inventory item");
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
    getInventoryItemsByItemId,
    getAllInventoryItemsByItemId,
    getInventoryItemFigure,
    updateInventoryItem,
    getInventoryItemHistory,
    getAllInventoryItemsWithoutPagination,
  };
};

export default useInventoryItemService;
