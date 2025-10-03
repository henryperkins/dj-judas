/**
 * Pull-to-refresh hook for mobile lists
 * Implements native-like pull-to-refresh gesture
 */

import { useEffect, useRef, useState, useCallback } from 'react'

export interface PullToRefreshOptions {
  onRefresh: () => Promise<void>
  threshold?: number // Distance to trigger refresh (default 80px)
  maxPullDistance?: number // Max pull distance (default 120px)
  resistance?: number // Pull resistance factor (default 2.5)
  enabled?: boolean
}

export interface PullToRefreshState {
  isPulling: boolean
  isRefreshing: boolean
  pullDistance: number
  canRefresh: boolean
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = 80,
    maxPullDistance = 120,
    resistance = 2.5,
    enabled = true,
  } = options

  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    canRefresh: false,
  })

  const touchStart = useRef<{ y: number; scrollTop: number } | null>(null)
  const containerRef = useRef<HTMLElement | null>(null)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return

      const container = containerRef.current
      if (!container) return

      // Only activate if scrolled to top
      if (container.scrollTop === 0) {
        touchStart.current = {
          y: e.touches[0].clientY,
          scrollTop: container.scrollTop,
        }
      }
    },
    [enabled]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!touchStart.current || !enabled) return

      const container = containerRef.current
      if (!container || container.scrollTop > 0) {
        touchStart.current = null
        return
      }

      const touch = e.touches[0]
      const deltaY = touch.clientY - touchStart.current.y

      // Only pull down
      if (deltaY > 0) {
        e.preventDefault() // Prevent bounce scroll

        // Apply resistance
        const resistedDistance = Math.min(deltaY / resistance, maxPullDistance)

        setState({
          isPulling: true,
          isRefreshing: false,
          pullDistance: resistedDistance,
          canRefresh: resistedDistance >= threshold,
        })
      }
    },
    [enabled, threshold, maxPullDistance, resistance]
  )

  const handleTouchEnd = useCallback(async () => {
    if (!touchStart.current || !enabled) return

    const { pullDistance, canRefresh } = state

    touchStart.current = null

    if (canRefresh && pullDistance >= threshold) {
      // Trigger refresh
      setState((prev) => ({
        ...prev,
        isPulling: false,
        isRefreshing: true,
      }))

      try {
        await onRefresh()
      } finally {
        setState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          canRefresh: false,
        })
      }
    } else {
      // Reset without refreshing
      setState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        canRefresh: false,
      })
    }
  }, [enabled, threshold, state, onRefresh])

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd])

  return {
    state,
    containerRef,
  }
}
