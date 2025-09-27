import { TablePaginationConfig } from "antd";
import { createFilterHook } from "../contexts/filter/createFilterHook";

export interface ExportRequestFilterState {
  searchTerm: string;
  pagination: TablePaginationConfig;
  selectedStatusFilter: string | null;
  selectedExportType: string;
  advancedSearchFields: {
    exportRequestId: string;
    exportDate: string;
    createdDate: string;
    createdBy: string;
    receiverName: string;
    status: string[];
  };
  showAdvancedSearch: boolean;
}

const defaultExportRequestFilterState: ExportRequestFilterState = {
  searchTerm: "",
  selectedExportType: "SELLING",
  selectedStatusFilter: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
  advancedSearchFields: {
    exportRequestId: "",
    exportDate: "",
    createdDate: "",
    createdBy: "",
    receiverName: "",
    status: [],
  },
  showAdvancedSearch: false,
};

export const useExportRequestFilter = createFilterHook(
  "exportRequestList",
  defaultExportRequestFilterState
);
