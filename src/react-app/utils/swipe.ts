/**
 * Swipe gesture handler for cart items
 * Supports left-swipe to reveal delete action
 */

import { useCallback, useRef, useState } from 'react'

export interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeStart?: () => void
  onSwipeEnd?: () => void
}

export interface SwipeState {
  isSwiping: boolean
  swipeDistance: number
  direction: 'left' | 'right' | null
}

const SWIPE_THRESHOLD = 50 // Min distance for swipe detection
const SWIPE_VELOCITY_THRESHOLD = 0.3 // Min velocity for swipe
const MAX_SWIPE_DISTANCE = 120 // Max distance for delete reveal

export function useSwipe(handlers: SwipeHandlers) {
  const [swipeState, setSwipeState] = useState<SwipeState>({
    isSwiping: false,
    swipeDistance: 0,
    direction: null,
  })

  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const currentTransform = useRef(0)

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0]
      touchStart.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      }
      handlers.onSwipeStart?.()
    },
    [handlers]
  )

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart.current) return

    const touch = e.touches[0]
    const deltaX = touch.clientX - touchStart.current.x
    const deltaY = touch.clientY - touchStart.current.y

    // Only horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      e.preventDefault() // Prevent vertical scroll

      // Clamp swipe distance (only allow left swipe)
      const clampedDistance = Math.max(-MAX_SWIPE_DISTANCE, Math.min(0, deltaX))

      setSwipeState({
        isSwiping: true,
        swipeDistance: clampedDistance,
        direction: deltaX < 0 ? 'left' : 'right',
      })

      currentTransform.current = clampedDistance
    }
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart.current) return

    const distance = currentTransform.current
    const duration = Date.now() - touchStart.current.time
    const velocity = Math.abs(distance / duration)

    // Determine if swipe threshold met
    if (Math.abs(distance) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      if (distance < 0) {
        handlers.onSwipeLeft?.()
      } else {
        handlers.onSwipeRight?.()
      }
    }

    handlers.onSwipeEnd?.()

    // Reset state
    touchStart.current = null
    setSwipeState({
      isSwiping: false,
      swipeDistance: 0,
      direction: null,
    })
    currentTransform.current = 0
  }, [handlers])

  return {
    swipeState,
    handlers: {
      onTouchStart: handleTouchStart,
      onTouchMove: handleTouchMove,
      onTouchEnd: handleTouchEnd,
    },
  }
}
