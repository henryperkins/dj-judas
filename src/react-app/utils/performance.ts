/**
 * Performance monitoring using Web Vitals
 */

export interface PerformanceMetrics {
  lcp: number | null // Largest Contentful Paint
  fid: number | null // First Input Delay
  cls: number | null // Cumulative Layout Shift
  fcp: number | null // First Contentful Paint
  ttfb: number | null // Time to First Byte
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {
    lcp: null,
    fid: null,
    cls: null,
    fcp: null,
    ttfb: null,
  }

  constructor() {
    if (typeof window === 'undefined') return

    // Modern browsers
    if ('PerformanceObserver' in window) {
      this.observeLCP()
      this.observeFID()
      this.observeCLS()
    }

    // Legacy
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.measureFCP()
        this.measureTTFB()
      })
    }
  }

  private observeLCP() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number
          loadTime?: number
        }
        this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime || 0
      })
      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch {
      // Silently fail if not supported
    }
  }

  private observeFID() {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        entries.forEach((entry: PerformanceEntry) => {
          const fidEntry = entry as PerformanceEntry & {
            processingStart?: number
          }
          this.metrics.fid = fidEntry.processingStart
            ? fidEntry.processingStart - entry.startTime
            : 0
        })
      })
      observer.observe({ entryTypes: ['first-input'] })
    } catch {
      // Silently fail if not supported
    }
  }

  private observeCLS() {
    try {
      let clsValue = 0
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & {
            hadRecentInput?: boolean
            value?: number
          }
          if (!layoutShift.hadRecentInput && layoutShift.value) {
            clsValue += layoutShift.value
            this.metrics.cls = clsValue
          }
        }
      })
      observer.observe({ entryTypes: ['layout-shift'] })
    } catch {
      // Silently fail if not supported
    }
  }

  private measureFCP() {
    try {
      const perfEntries = performance.getEntriesByType('paint')
      const fcpEntry = perfEntries.find((entry) => entry.name === 'first-contentful-paint')
      if (fcpEntry) {
        this.metrics.fcp = fcpEntry.startTime
      }
    } catch {
      // Silently fail if not supported
    }
  }

  private measureTTFB() {
    try {
      const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navEntry) {
        this.metrics.ttfb = navEntry.responseStart - navEntry.requestStart
      }
    } catch {
      // Silently fail if not supported
    }
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  logMetrics(): void {
    const metrics = this.getMetrics()
    console.group('📊 Performance Metrics')
    console.log(
      'LCP (Largest Contentful Paint):',
      metrics.lcp ? `${metrics.lcp.toFixed(0)}ms` : 'N/A',
      metrics.lcp && metrics.lcp < 2500 ? '✅' : '❌'
    )
    console.log(
      'FID (First Input Delay):',
      metrics.fid ? `${metrics.fid.toFixed(0)}ms` : 'N/A',
      metrics.fid && metrics.fid < 100 ? '✅' : '❌'
    )
    console.log(
      'CLS (Cumulative Layout Shift):',
      metrics.cls ? metrics.cls.toFixed(3) : 'N/A',
      metrics.cls && metrics.cls < 0.1 ? '✅' : '❌'
    )
    console.log('FCP (First Contentful Paint):', metrics.fcp ? `${metrics.fcp.toFixed(0)}ms` : 'N/A')
    console.log('TTFB (Time to First Byte):', metrics.ttfb ? `${metrics.ttfb.toFixed(0)}ms` : 'N/A')
    console.groupEnd()
  }

  /**
   * Send metrics to analytics (optional)
   */
  sendToAnalytics(): void {
    const metrics = this.getMetrics()

    // Example: Send to Google Analytics if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
      if (gtag) {
        Object.entries(metrics).forEach(([key, value]) => {
          if (value !== null) {
            gtag('event', 'web_vitals', {
              event_category: 'Performance',
              event_label: key.toUpperCase(),
              value: Math.round(value),
              non_interaction: true,
            })
          }
        })
      }
    }
  }
}

export const perfMonitor = new PerformanceMonitor()

// Auto-log after 5 seconds in development
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  setTimeout(() => {
    perfMonitor.logMetrics()
  }, 5000)
}
