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
 * Interface for rendering data row of import request detail table
 */
export interface ImportRequestDetailRow {
    itemId: string;
    quantity: number;
    itemName: string;
    measurementUnit?: string;
    totalMeasurementValue?: number;
    providerId: number;
    providerName: string;
}