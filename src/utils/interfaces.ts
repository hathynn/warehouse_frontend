export interface ImportRequestDetailRow {
    itemId: string;
    quantity: number;
    itemName: string;
    measurementUnit?: string;
    totalMeasurementValue?: number;
    providerId: number;
    providerName: string;
}