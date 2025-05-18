import { useState, useEffect, useCallback } from 'react';

/**
 * This hook tracks which pages have been viewed and determines if all pages have been viewed.
 * 
 * @param totalItems - The total number of items in the dataset
 * @param pageSize - The current page size
 * @param currentPage - The current page number
 * @returns An object containing state and functions for page confirmation gating
 */
export const usePaginationViewTracker = (
  totalItems: number,
  pageSize: number,
  currentPage: number
) => {
  // Track viewed pages, start with the initial page
  const [viewedPages, setViewedPages] = useState<Set<number>>(new Set([currentPage]));
  const [allPagesViewed, setAllPagesViewed] = useState(false);
  
  // Calculate total pages
  const totalPages = Math.ceil(totalItems / pageSize);

  // Check if all pages have been viewed
  useEffect(() => {
    if (viewedPages.size === totalPages && totalPages > 0) {
      setAllPagesViewed(true);
    } else {
      setAllPagesViewed(false);
    }
  }, [viewedPages, totalPages]);

  // Only reset viewed pages when page size or total items changes
  // NOT when current page changes (which would defeat the purpose of tracking)
  useEffect(() => {
    setViewedPages(new Set([currentPage]));
    setAllPagesViewed(totalPages === 1);
  }, [pageSize, totalItems]); // Removed currentPage dependency

  // Mark a page as viewed - use useCallback to maintain reference stability
  const markPageAsViewed = useCallback((pageNumber: number) => {
    setViewedPages(prev => {
      const updatedSet = new Set(prev);
      updatedSet.add(pageNumber);
      return updatedSet;
    });
  }, []);

  // Mark the current page as viewed whenever it changes
  useEffect(() => {
    markPageAsViewed(currentPage);
  }, [currentPage, markPageAsViewed]);

  // Reset all viewed pages
  const resetViewedPages = useCallback((initialPage: number = 1) => {
    setViewedPages(new Set([initialPage]));
    setAllPagesViewed(totalPages === 1);
  }, [totalPages]);

  return {
    viewedPages,
    allPagesViewed,
    markPageAsViewed,
    resetViewedPages,
    totalPages
  };
};
