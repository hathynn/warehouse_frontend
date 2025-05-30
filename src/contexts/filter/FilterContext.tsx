/**
 * Centralized filter store allowing each page to get/update its own filter state based on a unique pageKey
 * -Preserves filter state when navigating between pages
 * -Each page only needs to use a single custome hook, 
 * -Support updating filter, resetting for the current page and resetting all pages filters
 */

import { createContext } from "react";

/** Generic Filter States that can be extended by each page type
 * @property {string} [key] - A unique page identifier (e.g "import-request-list, export-request-list, etc")
 * @property {Object} [value] - A key-value pair of filter states for that page
 */
export type FilterStates = Record<string, Object>;

/*
* -filterStates: A record of filter states for each page
* -updateFilter: Updates the filter state for a specific page
* -resetFilter: Resets the filter state for a specific page
* -resetAllFilters: Resets the filter state for all pages
* -getFilterState: Gets the filter state for a specific page
* -registerFilter: Registers a new filter state for a page
* -isRegistered: Checks if a page has a registered filter state
* Will be implemented in the FilterProvider component
*/
export interface FilterContextType {
  filterStates: FilterStates;
  defaultFilterStates: FilterStates;
  updateFilter: (pageKey: string, updateFilterStates: Partial<Object>) => void;
  resetFilter: (pageKey: string) => void;
  resetAllFilters: () => void;
  getFilterStates: (pageKey: string) => Object;
  registerFilter: (pageKey: string, defaultState: Object) => void;
  isRegistered: (pageKey: string) => boolean;
}

// Create a context for the filter state
const FilterContext = createContext<FilterContextType | undefined>(undefined);

export default FilterContext;