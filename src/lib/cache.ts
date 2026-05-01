/**
 * In-memory cache implementation
 * In production, replace with Redis or similar
 */

interface CacheItem<T> {
  data: T;
  expiry: number;
  tags?: string[];
}

class InMemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private tagMap = new Map<string, Set<string>>(); // tag -> set of keys

  /**
   * Get item from cache
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > item.expiry) {
      this.delete(key);
      return null;
    }
    
    return item.data;
  }

  /**
   * Set item in cache
   */
  set<T>(key: string, data: T, ttlSeconds: number = 300, tags?: string[]): void {
    const expiry = Date.now() + (ttlSeconds * 1000);
    
    // Remove old item if exists
    this.delete(key);
    
    // Add new item
    const item: CacheItem<T> = { data, expiry };
    if (tags) {
      item.tags = tags;
    }
    this.cache.set(key, item);
    
    // Update tag mappings
    if (tags) {
      tags.forEach(tag => {
        if (!this.tagMap.has(tag)) {
          this.tagMap.set(tag, new Set());
        }
        this.tagMap.get(tag)!.add(key);
      });
    }
  }

  /**
   * Delete item from cache
   */
  delete(key: string): boolean {
    const item = this.cache.get(key);
    
    if (item) {
      // Remove from tag mappings
      if (item.tags) {
        item.tags.forEach(tag => {
          const tagSet = this.tagMap.get(tag);
          if (tagSet) {
            tagSet.delete(key);
            if (tagSet.size === 0) {
              this.tagMap.delete(tag);
            }
          }
        });
      }
    }
    
    return this.cache.delete(key);
  }

  /**
   * Invalidate all items with specific tags
   */
  invalidateByTag(tag: string): void {
    const keys = this.tagMap.get(tag);
    if (keys) {
      keys.forEach(key => this.delete(key));
    }
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.tagMap.clear();
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    this.cache.forEach(item => {
      if (now > item.expiry) {
        expired++;
      } else {
        active++;
      }
    });
    
    return {
      total: this.cache.size,
      active,
      expired,
      tags: this.tagMap.size
    };
  }

  /**
   * Clean up expired items
   */
  cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.cache.forEach((item, key) => {
      if (now > item.expiry) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.delete(key));
  }
}

// Global cache instance
export const cache = new InMemoryCache();

// Clean up expired items every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

/**
 * Cache utility functions
 */
export const cacheKeys = {
  user: (id: string) => `user:${id}`,
  userCourses: (userId: string) => `user:${userId}:courses`,
  course: (id: string) => `course:${id}`,
  courseEnrollments: (courseId: string) => `course:${courseId}:enrollments`,
  assignment: (id: string) => `assignment:${id}`,
  courseAssignments: (courseId: string) => `course:${courseId}:assignments`,
  exam: (id: string) => `exam:${id}`,
  examAttempts: (examId: string) => `exam:${examId}:attempts`,
  plickersSession: (id: string) => `plickers:${id}`,
  plickersResponses: (sessionId: string) => `plickers:${sessionId}:responses`,
  notifications: (userId: string) => `user:${userId}:notifications`,
  conversations: (userId: string) => `user:${userId}:conversations`,
  dashboardStats: (userId: string) => `dashboard:${userId}:stats`
};

export const cacheTags = {
  user: (id: string) => `user:${id}`,
  course: (id: string) => `course:${id}`,
  assignment: (id: string) => `assignment:${id}`,
  exam: (id: string) => `exam:${id}`,
  plickers: (sessionId: string) => `plickers:${sessionId}`,
  notifications: (userId: string) => `notifications:${userId}`,
  conversations: (userId: string) => `conversations:${userId}`
};

/**
 * Cache TTL configurations (in seconds)
 */
export const cacheTTL = {
  short: 60,        // 1 minute - for frequently changing data
  medium: 300,      // 5 minutes - for moderately changing data
  long: 1800,       // 30 minutes - for rarely changing data
  veryLong: 3600    // 1 hour - for static data
};

/**
 * Wrapper function for caching async operations
 */
export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = cacheTTL.medium,
  tags?: string[]
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch data
  const data = await fetcher();
  
  // Store in cache
  cache.set(key, data, ttl, tags);
  
  return data;
}