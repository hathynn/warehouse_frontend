import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO, TransactionLogResponse } from "@/utils/interfaces";

const useTransactionLogService = () => {
    const { callApi, loading } = useApi();
    
    // Lấy tất cả transaction logs
    const getAllTransactionLogs = async (): Promise<ResponseDTO<TransactionLogResponse[]>> => {
        try {
            const response = await callApi("get", `/transaction-log`);
            return response;
        } catch (error) {
            toast.error("Không thể lấy danh sách transaction logs");
            throw error;
        }
    };

    return {
        loading,
        getAllTransactionLogs
        };
};

export default useTransactionLogService; 