import React, { ReactNode, useState } from "react";
import FilterContext, { FilterContextType, FilterStates } from "./FilterContext";

interface FilterProviderProps {
  children: ReactNode;
}

export const FilterProvider: React.FC<FilterProviderProps> = ({ children }) => {
  // global filter states of every page
  const [filterStates, setFilterStates] = useState<FilterStates>({})
  // default filter states when starting app or when reset filter
  const [defaultFilterStates, setDefaultFilterStates] = useState<FilterStates>({})


  const isRegistered = (pageKey: string): boolean => {
    return pageKey in defaultFilterStates
  }

  // register all filter properties of the page when first visit
  const registerFilter = (pageKey: string, initialFilterStates: Object) => {
    if (!isRegistered(pageKey)) {
      setDefaultFilterStates(prev => ({
        ...prev,
        [pageKey]: initialFilterStates
      }))
      setFilterStates(prev => ({
        ...prev, // keep all previous pages filter states
        [pageKey]: initialFilterStates // attach new page filter states
      }))
    }
  }

  const updateFilter = (pageKey: string, updateFilterStates: Partial<Object>) => {
    setFilterStates(prev => ({
      ...prev, // keep all previous pages filter states
      [pageKey]: { // update filter states of the current page base on pageKey
        ...prev[pageKey], // keep all previous filter states of the current page
        ...updateFilterStates // update filter states of the current page base on updateFilterStates input fields
      }
    }))
  }

  const resetFilter = (pageKey: string) => {
    if (defaultFilterStates[pageKey]) {
      setFilterStates(prev => ({
        ...prev, // keep all previous pages filter stages
        [pageKey]: defaultFilterStates[pageKey] // only reset current page filter
      }))
    }
  }

  const resetAllFilters = () => {
    setFilterStates({ ...defaultFilterStates }) // create whole new object to make React re-render
  }

  const getFilterStates = (pageKey: string): Object => {
    return filterStates[pageKey];
  }

  const value: FilterContextType = {
    filterStates,
    defaultFilterStates,
    isRegistered,
    registerFilter,
    updateFilter,
    resetFilter,
    resetAllFilters,
    getFilterStates
  }

  return (
    <FilterContext.Provider value={value}>
      {children}
    </FilterContext.Provider>
  )
}