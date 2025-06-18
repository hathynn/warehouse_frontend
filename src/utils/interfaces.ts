import { ExportRequestResponse } from "@/services/useExportRequestService";
import { ImportOrderResponse } from "@/services/useImportOrderService";
import { ImportRequestResponse } from "@/services/useImportRequestService";
import { IconType } from "react-icons";

/**
 * Interface to match MetaDataDTO.java
 */
export interface MetaDataDTO {
    hasNext: boolean;
    hasPrevious: boolean;
    limit: number;
    total: number;
    page: number;
}

/**
 * Interface to match ResponseDTO.java
 */
export interface ResponseDTO<T> {
    content: T;
    details: string[];
    statusCode: number;
    metaDataDTO?: MetaDataDTO;
}


/**
 * Interface for rendering menu items
 */
export interface MenuItem {
    key: string;
    icon?: IconType;
    label: string;
    path: string;
    children?: MenuItem[];
}

/**
 * Interface for rendering data row of import request detail table
 */
export interface ImportRequestDetailRow {
    itemId: string;
    quantity: number;
    itemName: string;
    measurementValue?: number;
    measurementUnit?: string;
    totalMeasurementValue?: number;
    providerId: number;
    providerName: string;
}


/**
 * Interface for transaction log type map
 */
type TransactionLogTypeMap = {
    IMPORT_ORDER: ImportOrderResponse;
    IMPORT_REQUEST: ImportRequestResponse | ImportRequestResponse[]; // Có thể là array trong trường hợp CREATE multiple
    EXPORT_REQUEST: ExportRequestResponse;
    // Có thể thêm các loại khác nếu cần
    // ACCOUNT: AccountResponse;
    // INVENTORY_ITEM: InventoryItemResponse;
};

/**
 * Base interface for all transaction logs
 */
export interface BaseTransactionLogResponse {
    id: number;
    executorUsername: string;
    executorFullName: string;
    action: string;
    objectId: string;
    createdDate: string;
}

/**
 * Specific types for each transaction log type
 */
export interface ImportRequestTransactionLog extends BaseTransactionLogResponse {
    type: 'IMPORT_REQUEST';
    responseContent: ImportRequestResponse;
}

export interface ImportOrderTransactionLog extends BaseTransactionLogResponse {
    type: 'IMPORT_ORDER';
    responseContent: ImportOrderResponse;
}

export interface ExportRequestTransactionLog extends BaseTransactionLogResponse {
    type: 'EXPORT_REQUEST';
    responseContent: ExportRequestResponse;
}

/**
 * Discriminated union for each type of transaction log
 */
export type TransactionLogResponse = {
    [K in keyof TransactionLogTypeMap]: BaseTransactionLogResponse & {
        type: K;
        responseContent: TransactionLogTypeMap[K];
    }
}[keyof TransactionLogTypeMap];