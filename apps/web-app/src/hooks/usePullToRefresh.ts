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

  useEffect(() => {
    if (disabled || !containerRef.current) return;

    const container = containerRef.current;
    let isPullingState = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if we're at the top of the container
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPullingState = false;
        setPullDistance(0);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startY.current) return;

      currentY.current = e.touches[0].clientY;
      const distance = currentY.current - startY.current;

      // Only allow pulling down (positive distance)
      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        
        // Calculate pull distance with resistance
        const resistance = 0.5;
        const adjustedDistance = distance * resistance;
        
        setPullDistance(Math.min(adjustedDistance, threshold * 2));
        setIsPulling(true);
        isPullingState = true;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPullingState || !startY.current) return;

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

      // Reset states
      setIsPulling(false);
      setPullDistance(0);
      startY.current = 0;
      currentY.current = 0;
      isPullingState = false;
    };

    // Mouse events for desktop testing
    const handleMouseDown = (e: MouseEvent) => {
      if (container.scrollTop === 0) {
        startY.current = e.clientY;
        isPullingState = false;
        setPullDistance(0);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!startY.current || e.buttons !== 1) return;

      const distance = e.clientY - startY.current;

      if (distance > 0 && container.scrollTop === 0) {
        e.preventDefault();
        
        const resistance = 0.5;
        const adjustedDistance = distance * resistance;
        
        setPullDistance(Math.min(adjustedDistance, threshold * 2));
        setIsPulling(true);
        isPullingState = true;
      }
    };

    const handleMouseUp = async () => {
      if (!isPullingState || !startY.current) return;

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

      setIsPulling(false);
      setPullDistance(0);
      startY.current = 0;
      currentY.current = 0;
      isPullingState = false;
    };

    // Touch events
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Mouse events for desktop
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);
    container.addEventListener('mouseleave', handleMouseUp);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
      container.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [onRefresh, threshold, disabled, isPulling, pullDistance, isRefreshing]);

  return {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    progress: Math.min(pullDistance / threshold, 1)
  };
}
