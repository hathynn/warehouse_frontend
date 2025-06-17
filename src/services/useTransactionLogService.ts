import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface cho response TransactionLog
export interface TransactionLogResponse {
    id: number;
    executorUsername: string;
    executorFullName: string;
    type: string;
    action: string;
    responseData: string;
    createdDate: string;
}

const useTransactionLogService = () => {
    const { callApi, loading } = useApi();
    // Lấy tất cả transaction logs
    const getAllTransactionLogs = async (): Promise<ResponseDTO<TransactionLogResponse[]>> => {
        try {
            const response = await callApi(
                "get",
                `/transaction-log`
            );
            return response;
        } catch (error) {
            toast.error("Không thể lấy danh sách transaction logs");
            throw error;
        }
    };

    // // Lấy transaction log theo ID
    // const getTransactionLogById = async (logId: number): Promise<ResponseDTO<TransactionLogResponse>> => {
    //     try {
    //         const response = await callApi("get", `/transaction-log/${logId}`);
    //         return response;
    //     } catch (error) {
    //         toast.error("Không thể lấy thông tin transaction log");
    //         throw error;
    //     }
    // };

    return {
        loading,
        getAllTransactionLogs,
        // getTransactionLogById,
    };
};

export default useTransactionLogService; 