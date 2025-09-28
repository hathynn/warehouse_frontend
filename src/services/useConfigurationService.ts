import useApi from "../hooks/useApi";
import { toast } from "react-toastify";

// Interface to match ConfigurationDto.java
export interface ConfigurationDto {
  id: number;
  itemIds: number[];
  workingTimeStart: string; // LocalTime as string, e.g. "08:00:00"
  workingTimeEnd: string;
  createRequestTimeAtLeast: string;
  timeToAllowAssign: string;
  timeToAllowConfirm: string;
  timeToAllowCancel: string;
  daysToAllowExtend: number;
  maxAllowedDaysForExtend: number;
  maxAllowedDaysForImportRequestProcess: number;
}

const useConfigurationService = () => {
  const { callApi, loading } = useApi();

  // Fetch the configuration
  const getConfiguration = async (): Promise<ConfigurationDto | null> => {
    try {
      const response = await callApi("get", "/configuration");
      if (response && response.content) {
        return response.content as ConfigurationDto;
      }
      return null;
    } catch (error) {
      toast.error("Không thể lấy cấu hình hệ thống");
      throw error;
    }
  };

  // Save/update the configuration
  const saveConfiguration = async (config: ConfigurationDto): Promise<ConfigurationDto> => {
    try {
      const response = await callApi("post", "/configuration/save", config);
      toast.success("Lưu cấu hình thành công");
      return response.content as ConfigurationDto;
    } catch (error) {
      toast.error("Không thể lưu cấu hình");
      throw error;
    }
  };

  return {
    loading,
    getConfiguration,
    saveConfiguration,
  };
};

export default useConfigurationService;
