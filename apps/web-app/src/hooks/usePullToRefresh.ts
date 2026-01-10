import { useState, useEffect, useRef } from 'react';

interface UsePullToRefreshProps {
  onRefresh: () => Promise<void> | void;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80, 
  disabled = false 
}: UsePullToRefreshProps) {
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const containerRef = useRef<HTMLElement>(null);
  const isPullingState = useRef(false);

  useEffect(() => {
    if (disabled) return;

    const getScrollTop = () => {
      return window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we're at the top of the page
      if (getScrollTop() === 0) {
        startY.current = e.touches[0].clientY;
        isPullingState.current = false;
        setPullDistance(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startY.current) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // Only allow pulling down (positive distance) and only if we're still at the top
      if (distance > 0 && getScrollTop() === 0) {
        e.preventDefault();
        
        // Calculate pull distance with resistance
        const resistance = 0.5;
        const adjustedDistance = distance * resistance;
        
        setPullDistance(Math.min(adjustedDistance, threshold * 2));
        setIsPulling(true);
        isPullingState.current = true;
      } else if (distance < 0) {
        // Reset if scrolling up
        resetPullState();
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingState.current || !startY.current) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Error during refresh:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      resetPullState();
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      if (getScrollTop() === 0) {
        startY.current = e.clientY;
        isPullingState.current = false;
        setPullDistance(0);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startY.current || e.buttons !== 1) return;

      const distance = e.clientY - startY.current;

      if (distance > 0 && getScrollTop() === 0) {
        e.preventDefault();
        
        const resistance = 0.5;
        const adjustedDistance = distance * resistance;
        
        setPullDistance(Math.min(adjustedDistance, threshold * 2));
        setIsPulling(true);
        isPullingState.current = true;
      } else if (distance < 0) {
        resetPullState();
      }
    };

    const handleMouseUp = async () => {
      if (!isPullingState.current || !startY.current) return;

      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        try {
          await onRefresh();
        } catch (error) {
          console.error('Error during refresh:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      resetPullState();
    };

    const resetPullState = () => {
      setIsPulling(false);
      setPullDistance(0);
      startY.current = 0;
      currentY.current = 0;
      isPullingState.current = false;
    };

    // Touch events on document
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Mouse events on document
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mouseleave', handleMouseUp);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [onRefresh, threshold, disabled, pullDistance, isRefreshing]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1)
  };
}
