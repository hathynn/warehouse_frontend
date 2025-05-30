import { TablePaginationConfig } from 'antd';
import { createFilterHook } from '../contexts/filter/createFilterHook';

export interface ImportOrderFilterState {
    searchTerm: string;
    pagination: TablePaginationConfig;
    selectedStatusFilter: string | null;
    selectedStaff: string[];
}

const defaultImportOrderFilterState: ImportOrderFilterState = {
    searchTerm: '',
    selectedStaff: [],
    selectedStatusFilter: null,
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