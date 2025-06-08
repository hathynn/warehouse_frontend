import { TablePaginationConfig } from "antd";
import { createFilterHook } from "../contexts/filter/createFilterHook";

export interface ExportRequestFilterState {
    searchTerm: string;
    pagination: TablePaginationConfig;
    selectedStatusFilter: string | null;
    selectedExportType: string;
}

const defaultExportRequestFilterState: ExportRequestFilterState = {
    searchTerm: '',
    selectedExportType: 'ALL',
    selectedStatusFilter: null,
    pagination: {
        current: 1,
        pageSize: 10,
        total: 0
    }
}

export const useExportRequestFilter = createFilterHook(
    'exportRequestList',
    defaultExportRequestFilterState
);