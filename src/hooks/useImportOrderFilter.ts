import { TablePaginationConfig } from 'antd';
import { createFilterHook } from '../contexts/filter/createFilterHook';

export interface ImportOrderFilterState {
    selectedImportRequest: string[];
    searchImportOrderTerm: string;
    pagination: TablePaginationConfig;
    selectedStatusFilter: string | null;
    selectedStaff: string[];
    selectedImportType: string | null;
}

const defaultImportOrderFilterState: ImportOrderFilterState = {
    selectedImportRequest: [],
    searchImportOrderTerm: '',
    selectedStaff: [],
    selectedStatusFilter: null,
    selectedImportType: "ORDER",
    pagination: {
        current: 1,
        pageSize: 10,
        total: 0
    }
};

export const useImportOrderFilter = createFilterHook(
    'importOrderList',
    defaultImportOrderFilterState
); 