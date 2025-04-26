// Interface to match MetaDataDTO.java
export interface MetaDataDTO {
  hasNext: boolean;
  hasPrevious: boolean;
  limit: number;
  total: number;
  page: number;
}

// Interface to match ResponseDTO.java
export interface ResponseDTO<T> {
  content: T;
  details: string[];
  statusCode: number;
  metaDataDTO?: MetaDataDTO;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from "react";
import api from "@/config/api";

const useApiService = () => {
  const [loading, setIsLoading] = useState<boolean>(false);

  const callApi = useCallback(
    async (
      method: "get" | "post" | "put" | "delete",
      url: string,
      data?: any
    ) => {
      try {
        setIsLoading(true);
        const response = await api[method](url, data);
        return response.data;
      } catch (e: any) {
        console.error(e);
        // toast.error(e?.response?.data || "Operation failed");
        throw e;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { loading, callApi, setIsLoading };
};

export default useApiService;
