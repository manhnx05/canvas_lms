/**
 * @vitest-environment node
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { cache, withCache } from '../cache';

describe('InMemoryCache', () => {
  beforeEach(() => {
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('phải lưu và lấy dữ liệu thành công', () => {
    cache.set('test-key', { data: 'value' });
    const result = cache.get('test-key');
    expect(result).toEqual({ data: 'value' });
  });

  it('phải trả về null khi lấy key không tồn tại', () => {
    const result = cache.get('not-exist');
    expect(result).toBeNull();
  });

  it('phải xóa dữ liệu thành công', () => {
    cache.set('test-key', 'value');
    const deleted = cache.delete('test-key');
    expect(deleted).toBe(true);
    expect(cache.get('test-key')).toBeNull();
  });

  it('phải trả về null và tự xóa khi dữ liệu hết hạn', () => {
    cache.set('test-key', 'value', 1); // 1 giây
    vi.advanceTimersByTime(1500); // Tăng lên 1.5 giây
    const result = cache.get('test-key');
    expect(result).toBeNull();
  });

  it('phải invalidate dữ liệu theo tag thành công', () => {
    cache.set('key1', 'value1', 300, ['tag-A', 'tag-B']);
    cache.set('key2', 'value2', 300, ['tag-B']);
    cache.set('key3', 'value3', 300, ['tag-C']);

    cache.invalidateByTag('tag-B');

    expect(cache.get('key1')).toBeNull();
    expect(cache.get('key2')).toBeNull();
    expect(cache.get('key3')).toBe('value3');
  });

  it('phải xóa tất cả dữ liệu khi gọi clear()', () => {
    cache.set('k1', 'v1');
    cache.set('k2', 'v2', 300, ['tag']);
    cache.clear();
    
    expect(cache.get('k1')).toBeNull();
    expect(cache.get('k2')).toBeNull();
    expect(cache.getStats().total).toBe(0);
  });

  it('phải cung cấp đúng thông kê cache (getStats)', () => {
    cache.set('k1', 'v1'); // active
    cache.set('k2', 'v2', -10); // expired ngay lập tức
    cache.set('k3', 'v3', 300, ['my-tag']); // active, có tag

    const stats = cache.getStats();
    expect(stats.total).toBe(3);
    expect(stats.active).toBe(2);
    expect(stats.expired).toBe(1);
    expect(stats.tags).toBe(1);
  });

  it('phải dọn dẹp các items hết hạn khi gọi cleanup()', () => {
    cache.set('k1', 'v1', 10);
    cache.set('k2', 'v2', -1);
    
    expect(cache.getStats().total).toBe(2);
    
    cache.cleanup();
    
    expect(cache.getStats().total).toBe(1);
    expect(cache.get('k1')).toBe('v1');
    expect(cache.get('k2')).toBeNull();
  });
});

describe('withCache wrapper', () => {
  beforeEach(() => {
    cache.clear();
  });

  it('phải gọi hàm fetcher nếu cache trống và lưu lại kết quả', async () => {
    const fetcher = vi.fn().mockResolvedValue('data-from-api');
    
    const result1 = await withCache('wrap-key', fetcher);
    expect(result1).toBe('data-from-api');
    expect(fetcher).toHaveBeenCalledTimes(1);

    // Lần gọi thứ 2 phải lấy từ cache
    const result2 = await withCache('wrap-key', fetcher);
    expect(result2).toBe('data-from-api');
    expect(fetcher).toHaveBeenCalledTimes(1); // Không gọi lại fetcher
  });
});
