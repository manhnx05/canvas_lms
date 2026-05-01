import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useOptimizedFetch } from '../useOptimizedFetch';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useOptimizedFetch', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Mock local storage
    const mockLocalStorage = {
      getItem: vi.fn().mockReturnValue('fake-token'),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };
    global.localStorage = mockLocalStorage as any;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('fetches data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foo: 'bar' }),
    });

    const { result } = renderHook(() => useOptimizedFetch('/api/test'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ foo: 'bar' });
    expect(result.current.error).toBe(null);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.any(Object));
  });

  it('handles API errors correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const { result } = renderHook(() => useOptimizedFetch('/api/error'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toBe(null);
    expect(result.current.error).toContain('HTTP error! status: 500');
  });

  it('uses cached data if within staleTime', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ count: 1 }),
    });

    const { result, rerender } = renderHook(() => useOptimizedFetch('/api/cache', { staleTime: 5000 }));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ count: 1 });
    expect(mockFetch).toHaveBeenCalledTimes(1);

    // We just call rerender and check
    rerender();
    
    // It should not fetch again because cache is valid
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it('refetches explicitly when refetch is called', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 'initial' }),
    });

    const { result } = renderHook(() => useOptimizedFetch('/api/refetch'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    expect(result.current.data).toEqual({ value: 'initial' });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ value: 'updated' }),
    });

    await act(async () => {
      await result.current.refetch();
    });

    await waitFor(() => {
      expect(result.current.data).toEqual({ value: 'updated' });
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});
