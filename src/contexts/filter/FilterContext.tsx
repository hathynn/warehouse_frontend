import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TablePaginationConfig } from 'antd';

interface BaseFilterState {
  searchTerm: string;
  pagination: TablePaginationConfig;
  selectedStatusFilter: string | null;
}

type FilterStates = Record<string, BaseFilterState>;

const defaultPagination: TablePaginationConfig = {
  current: 1,
  pageSize: 10,
  total: 0,
};

interface FilterContextType {
  filterStates: FilterStates;
  updateFilter: <T extends BaseFilterState>(
    pageKey: string,
    updates: Partial<T>
  ) => void;
  resetFilter: (pageKey: string) => void;
  resetAllFilters: () => void;
  getFilterState: <T extends BaseFilterState>(pageKey: string) => T;
  registerFilter: <T extends BaseFilterState>(pageKey: string, defaultState: T) => void;
  isRegistered: (pageKey: string) => boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  const [filterStates, setFilterStates] = useState<FilterStates>({});
  const [defaultStates, setDefaultStates] = useState<FilterStates>({});

  const isRegistered = (pageKey: string): boolean => {
    return pageKey in defaultStates;
  };

  const registerFilter = <T extends BaseFilterState>(pageKey: string, defaultState: T) => {
    if (!isRegistered(pageKey)) {
      setDefaultStates(prev => ({
        ...prev,
        [pageKey]: defaultState,
      }));
      
      setFilterStates(prev => ({
        ...prev,
        [pageKey]: defaultState,
      }));
    }
  };

  const updateFilter = <T extends BaseFilterState>(
    pageKey: string,
    updates: Partial<T>
  ) => {
    setFilterStates(prev => ({
      ...prev,
      [pageKey]: {
        ...prev[pageKey],
        ...updates,
      },
    }));
  };

  const resetFilter = (pageKey: string) => {
    const defaultState = defaultStates[pageKey];
    if (defaultState) {
      setFilterStates(prev => ({
        ...prev,
        [pageKey]: defaultState,
      }));
    }
  };

  const resetAllFilters = () => {
    setFilterStates({ ...defaultStates });
  };

  const getFilterState = <T extends BaseFilterState>(pageKey: string): T => {
    return filterStates[pageKey] as T;
  };

  const value: FilterContextType = {
    filterStates,
    updateFilter,
    resetFilter,
    resetAllFilters,
    getFilterState,
    registerFilter,
    isRegistered,
  };

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  );
};

const useFilterContext = () => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilterContext must be used within a FilterProvider');
  }
  return context;
};

export const createFilterHook = <T extends BaseFilterState>(
  pageKey: string,
  defaultState: T
) => {
  return () => {
    const { getFilterState, updateFilter, resetFilter, registerFilter, isRegistered } = useFilterContext();
    
    // Register the filter on first use if not already registered
    React.useEffect(() => {
      if (!isRegistered(pageKey)) {
        registerFilter(pageKey, defaultState);
      }
    }, [pageKey]);
    
    // Get current state or return default if not yet registered
    const currentState = isRegistered(pageKey) ? getFilterState<T>(pageKey) : defaultState;
    
    return {
      filterState: currentState,
      updateFilter: (updates: Partial<T>) => updateFilter(pageKey, updates),
      resetFilter: () => resetFilter(pageKey),
    };
  };
};

// Export the default pagination for reuse
export { defaultPagination };
export type { BaseFilterState }; 