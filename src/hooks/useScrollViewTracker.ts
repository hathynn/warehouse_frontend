import { useCallback, useEffect, useRef, useState } from "react";

/**
 * This hook tracks scroll position and determines if the user has scrolled to the bottom of current component.
 * @param threshold - Distance from the bottom to consider as reached bottom.
 * @returns An object containing state and functions for scroll tracking.
 */
export const useScrollViewTracker = (threshold: number = 5) => {
    const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
    // useRef for storing the reference of the DOM element to track scroll position
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // will be attached on onScroll event of the container
    const checkScrollPosition = useCallback(() => {
        // access the DOM element of the current container
        const container = scrollContainerRef.current;
        if (!container) return;

        // scrollTop: amount of pixels that is scrolled already
        // scrollHeight: total height that can be scrolled
        // clientHeight: current height of the view
        const { scrollTop, scrollHeight, clientHeight } = container;

        if (scrollHeight > 0) {
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - threshold;
            if (isAtBottom && !hasScrolledToBottom) {
                setHasScrolledToBottom(true);
            }
        }
    }, [threshold, hasScrolledToBottom]);

    const resetScrollTracking = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        setHasScrolledToBottom(false);
    }

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (container) {
            const { scrollHeight, clientHeight } = container;
            // if content is not scrollable, set hasScrolledToBottom to true
            if ((scrollHeight <= clientHeight) && scrollHeight > 0) {
                setHasScrolledToBottom(true);
            } else {
                checkScrollPosition();
            }
        }
    }, [resetScrollTracking]);

    return {
        scrollContainerRef,
        hasScrolledToBottom,
        resetScrollTracking,
        checkScrollPosition
    };
}