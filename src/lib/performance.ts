/**
 * Performance monitoring utilities
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  count: number;
  totalDuration: number;
  avgDuration: number;
  minDuration: number;
  maxDuration: number;
  p50: number;
  p95: number;
  p99: number;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private maxMetricsPerKey = 1000; // Keep last 1000 metrics per key
  private cleanupInterval = 5 * 60 * 1000; // Clean up every 5 minutes

  constructor() {
    // Auto cleanup old metrics
    setInterval(() => this.cleanup(), this.cleanupInterval);
  }

  /**
   * Record a performance metric
   */
  record(name: string, duration: number, metadata?: Record<string, any>): void {
    const metric: PerformanceMetric = {
      name,
      duration,
      timestamp: Date.now(),
      metadata
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const metrics = this.metrics.get(name)!;
    metrics.push(metric);

    // Keep only last N metrics
    if (metrics.length > this.maxMetricsPerKey) {
      metrics.shift();
    }
  }

  /**
   * Get statistics for a specific metric
   */
  getStats(name: string): PerformanceStats | null {
    const metrics = this.metrics.get(name);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const totalDuration = durations.reduce((sum, d) => sum + d, 0);

    return {
      count,
      totalDuration,
      avgDuration: totalDuration / count,
      minDuration: durations[0],
      maxDuration: durations[count - 1],
      p50: this.percentile(durations, 50),
      p95: this.percentile(durations, 95),
      p99: this.percentile(durations, 99)
    };
  }

  /**
   * Get all metrics
   */
  getAllStats(): Record<string, PerformanceStats> {
    const stats: Record<string, PerformanceStats> = {};
    
    this.metrics.forEach((_, name) => {
      const stat = this.getStats(name);
      if (stat) {
        stats[name] = stat;
      }
    });

    return stats;
  }

  /**
   * Get recent slow operations
   */
  getSlowOperations(threshold: number = 1000, limit: number = 10): PerformanceMetric[] {
    const allMetrics: PerformanceMetric[] = [];
    
    this.metrics.forEach(metrics => {
      allMetrics.push(...metrics.filter(m => m.duration > threshold));
    });

    return allMetrics
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }

  /**
   * Clear metrics for a specific name
   */
  clear(name?: string): void {
    if (name) {
      this.metrics.delete(name);
    } else {
      this.metrics.clear();
    }
  }

  /**
   * Clean up old metrics (older than 1 hour)
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    this.metrics.forEach((metrics, name) => {
      const filtered = metrics.filter(m => m.timestamp > oneHourAgo);
      if (filtered.length === 0) {
        this.metrics.delete(name);
      } else {
        this.metrics.set(name, filtered);
      }
    });
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedArray: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)];
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024), // MB
        rss: Math.round(usage.rss / 1024 / 1024) // MB
      };
    }
    return null;
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    performanceMonitor.record(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.record(name, duration, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Measure sync function execution time
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  metadata?: Record<string, any>
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    performanceMonitor.record(name, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    performanceMonitor.record(name, duration, { ...metadata, error: true });
    throw error;
  }
}

/**
 * Performance decorator for class methods
 */
export function Measure(metricName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const name = metricName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return measureAsync(name, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Get system performance metrics
 */
export function getSystemMetrics() {
  return {
    memory: performanceMonitor.getMemoryUsage(),
    uptime: typeof process !== 'undefined' ? Math.floor(process.uptime()) : null,
    performance: performanceMonitor.getAllStats(),
    slowOperations: performanceMonitor.getSlowOperations(1000, 5)
  };
}
