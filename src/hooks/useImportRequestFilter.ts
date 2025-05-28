import moment from 'moment';
import { BaseFilterState, createFilterHook, defaultPagination } from '../contexts/filter/FilterContext';

export interface ImportRequestFilterState extends BaseFilterState {
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
    pagination: defaultPagination,
};

export const useImportRequestFilter = createFilterHook(
    'importRequestList',
    defaultImportRequestFilterState
); 