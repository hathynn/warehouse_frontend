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
    return {
        getAllStoredLocations,
        loading
    };
};

export default useStoredLocationService;