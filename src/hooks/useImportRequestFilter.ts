import moment from 'moment';
import { createFilterHook } from '../contexts/filter/createFilterHook';
import { TablePaginationConfig } from 'antd';

export interface ImportRequestFilterState {
    searchTerm: string;
    pagination: TablePaginationConfig;
    selectedStatusFilter: string | null;
    selectedDate: moment.Moment | null;
    selectedImportType: string;
    selectedProvider: string[];
}

const defaultImportRequestFilterState: ImportRequestFilterState = {
    searchTerm: '',
    selectedDate: null,
    selectedImportType: 'ORDER',
    selectedProvider: [],
    selectedStatusFilter: null,
    pagination: {   
        current: 1,
        pageSize: 10,
        total: 0
    }
};

export const useImportRequestFilter = createFilterHook(
    'importRequestList',
    defaultImportRequestFilterState
); 