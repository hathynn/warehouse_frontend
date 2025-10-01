import { useState } from "react";
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";
import { ResponseDTO } from "@/utils/interfaces";

// Interface for Paper Response
export interface PaperResponse {
  id: number;
  signProviderUrl: string;
  signProviderName: string;
  signReceiverUrl: string;
  signReceiverName: string;
  description: string;
  importOrderId: string | null;
  exportRequestId: string;
}

const usePaperService = () => {
  const { callApi, loading } = useApi();
  const [paperId, setPaperId] = useState<number | null>(null);

  // Lấy papers theo import order ID
  const getPapersByImportOrderId = async (
    importOrderId: string,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<PaperResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/paper/import-order/${importOrderId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin chứng từ của đơn nhập");
      throw error;
    }
  };

  // Lấy papers theo export request ID
  const getPapersByExportRequestId = async (
    exportRequestId: string,
    page = 1,
    limit = 10
  ): Promise<ResponseDTO<PaperResponse[]>> => {
    try {
      const response = await callApi(
        "get",
        `/paper/export-order/${exportRequestId}?page=${page}&limit=${limit}`
      );
      return response;
    } catch (error) {
      toast.error("Không thể lấy thông tin chứng từ của phiếu xuất");
      throw error;
    }
  };

  return {
    loading,
    paperId,
    setPaperId,
    getPapersByImportOrderId,
    getPapersByExportRequestId,
  };
};

export default usePaperService;
