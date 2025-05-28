import { BaseFilterState, createFilterHook, defaultPagination } from '../contexts/filter/FilterContext';

export interface ImportOrderFilterState extends BaseFilterState {
    selectedStaff: string[];
}

const defaultImportOrderFilterState: ImportOrderFilterState = {
    searchTerm: '',
    selectedStaff: [],
    selectedStatusFilter: null,
    pagination: defaultPagination,
};

export const useImportOrderFilter = createFilterHook(
    'importOrderList',
    defaultImportOrderFilterState
); 