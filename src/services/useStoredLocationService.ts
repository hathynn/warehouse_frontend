import useApi from "@/hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

export interface StoredLocationResponse {
    id: number;
    zone: string;
    floor: string;
    row: string;
    line: string;
    isRoad: boolean;
    isDoor: boolean;
    isUsed: boolean;
    isFulled: boolean;
    inventoryItemIds: string[];
    currentCapacity: number;
    maximumCapacityForItem: number;
    itemId: string;
}

const useStoredLocationService = () => {
    const { callApi, loading } = useApi();

    const getAllStoredLocations = async (): Promise<ResponseDTO<StoredLocationResponse[]>> => {
        try {
            const response = await callApi("get", "/stored-location");
            return response;
        } catch (error) {
            toast.error("Không thể lấy danh sách sản phẩm theo vị trí và mã sản phẩm");
            throw error;
        }
    };

    const suggestLocations = async (itemId: string, locationId: number): Promise<ResponseDTO<StoredLocationResponse[]>> => {
        try {
            const response = await callApi("get", `/stored-location/suggest-locations?itemId=${itemId}&locationId=${locationId}`);
            return response;
        } catch (error) {
            toast.error("Không thể lấy danh sách vị trí gợi ý");
            throw error;
        }
    };

    const autoChooseLocationForImport = async (inventoryItemIds: string[]): Promise<ResponseDTO<StoredLocationResponse[]>> => {
        try {
            const response = await callApi("post", "/stored-location/import-auto-choose", inventoryItemIds);
            return response;
        } catch (error) {
            toast.error("Không thể tự động chọn vị trí cho nhập kho");
            throw error;
        }
    };

    return {
        getAllStoredLocations,
        suggestLocations,
        autoChooseLocationForImport,
        loading
    };
};

export default useStoredLocationService;