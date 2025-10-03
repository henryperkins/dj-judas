import { useSyncExternalStore } from 'react'

/**
 * Haptic feedback utility using Web Vibration API
 * Provides native-like tactile feedback on supported devices
 */
export type HapticPattern =
  | 'light' // 10ms - subtle tap
  | 'medium' // 20ms - button press
  | 'heavy' // 50ms - significant action
  | 'success' // [50, 30, 50] - success confirmation
  | 'error' // [50, 100, 50, 100, 50] - error alert
  | 'selection' // 5ms - list item selection

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 50,
  success: [50, 30, 50],
  error: [50, 100, 50, 100, 50],
  selection: 5,
}

class HapticManager {
  private enabled: boolean = true
  private supported: boolean = false
  private listeners: Set<() => void> = new Set()

  constructor() {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      this.supported = true
    }

    // Check user preference for reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.enabled = false
    }

    // Allow user to disable
    if (typeof localStorage !== 'undefined') {
      const userPref = localStorage.getItem('haptic-feedback')
      if (userPref === 'disabled') {
        this.enabled = false
      }
    }
  }

  private notifyListeners() {
    for (const listener of this.listeners) {
      listener()
    }
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Trigger haptic feedback
   */
  trigger(pattern: HapticPattern): void {
    if (!this.supported || !this.enabled || typeof navigator === 'undefined') return

    const vibration = PATTERNS[pattern]
    navigator.vibrate(vibration)
  }

  /**
   * Custom vibration pattern
   */
  custom(pattern: number | number[]): void {
    if (!this.supported || !this.enabled || typeof navigator === 'undefined') return
    navigator.vibrate(pattern)
  }

  /**
   * Enable/disable haptics
   */
  setEnabled(enabled: boolean): void {
    if (this.enabled === enabled) return

    this.enabled = enabled
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('haptic-feedback', enabled ? 'enabled' : 'disabled')
    }

    this.notifyListeners()
  }

  /**
   * Check if haptics are supported
   */
  isSupported(): boolean {
    return this.supported
  }

  /**
   * Check if haptics are enabled
   */
  isEnabled(): boolean {
    return this.enabled
  }
}

export const haptics = new HapticManager()

/**
 * React hook for haptic feedback
 */
export function useHaptics() {
  const getSnapshot = () => ({
    supported: haptics.isSupported(),
    enabled: haptics.isEnabled(),
  })

  const { supported, enabled } = useSyncExternalStore(
    (listener) => haptics.subscribe(listener),
    getSnapshot,
    getSnapshot
  )

  return {
    trigger: (pattern: HapticPattern) => haptics.trigger(pattern),
    custom: (pattern: number | number[]) => haptics.custom(pattern),
    isSupported: supported,
    isEnabled: enabled,
    setEnabled: (enabled: boolean) => haptics.setEnabled(enabled),
  }
}
