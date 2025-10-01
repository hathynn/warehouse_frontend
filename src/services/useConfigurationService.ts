// services/useConfigurationService.ts
import useApi from "../hooks/useApi";
import { toast } from "react-toastify";

// Match backend response exactly
export interface ConfigurationDto {
  id: number;
  itemIds: string[]; // NOTE: array of strings from backend
  workingTimeStart: string; // "HH:mm:ss"
  workingTimeEnd: string; // "HH:mm:ss"
  createRequestTimeAtLeast: string; // "HH:mm:ss"
  timeToAllowAssign: string; // "HH:mm:ss"
  timeToAllowConfirm: string; // "HH:mm:ss"
  timeToAllowCancel: string; // "HH:mm:ss"
  dayWillBeCancelRequest: number; // days
  daysToAllowExtend: number;
  maxAllowedDaysForExtend: number;
  maxAllowedDaysForImportRequestProcess: number;
  maxDispatchErrorPercent: number;
  maxPercentOfItemForExport: number;
}

const useConfigurationService = () => {
  const { callApi, loading } = useApi();

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

  const saveConfiguration = async (
    config: ConfigurationDto
  ): Promise<ConfigurationDto> => {
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
