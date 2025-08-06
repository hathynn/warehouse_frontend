import { TablePaginationConfig } from "antd";
import { createFilterHook } from "../contexts/filter/createFilterHook";

export interface StockCheckRequestFilterState {
  searchTerm: string;
  pagination: TablePaginationConfig;
  selectedStatusFilter: string | null;
}

const defaultStockCheckRequestFilterState: StockCheckRequestFilterState = {
  searchTerm: "",
  selectedStatusFilter: null,
  pagination: {
    current: 1,
    pageSize: 10,
    total: 0,
  },
};

export const useStockCheckRequestFilter = createFilterHook(
  "stockCheckRequestList",
  defaultStockCheckRequestFilterState
);
