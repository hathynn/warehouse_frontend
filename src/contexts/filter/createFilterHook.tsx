import { useContext, useEffect } from "react"
import FilterContext, { FilterContextType } from "./FilterContext"

export const createFilterHook = (pageKey: string, defaultFilterStates: Object) => {
  return () => {
    const context = useContext<FilterContextType | undefined>(FilterContext)
    if (!context) {
      throw new Error('useFilter must be used within a FilterProvider')
    }
    const { getFilterStates, updateFilter, resetFilter, registerFilter, isRegistered } = context

    useEffect(() => {
      if (!isRegistered(pageKey)) {
        registerFilter(pageKey, defaultFilterStates)
      }
    }, [pageKey])

    const currentState = isRegistered(pageKey) ? getFilterStates(pageKey) : defaultFilterStates

    return {
      filterState: currentState,
      updateFilter: (updateFilterStates: Object) => updateFilter(pageKey, updateFilterStates),
      resetFilter: () => resetFilter(pageKey)
    }
  }
}