import { useState, useCallback } from "react";
import api from "@/config/api";

const useApi = () => {
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

export default useApi;
