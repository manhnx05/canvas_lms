/**
 * api – lightweight fetch wrapper with unified error handling.
 * Usage: const data = await api.get('/api/courses')
 *        await api.post('/api/assignments', { title: '...' })
 */

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

async function request<T = any>(method: Method, url: string, body?: unknown): Promise<T> {
  const options: RequestInit = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body !== undefined) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`[${method} ${url}] ${res.status}: ${text}`);
  }

  // Return empty object for 204 No Content
  if (res.status === 204) return {} as T;
  return res.json();
}

export const api = {
  get:    <T = any>(url: string) => request<T>('GET', url),
  post:   <T = any>(url: string, body: unknown) => request<T>('POST', url, body),
  put:    <T = any>(url: string, body: unknown) => request<T>('PUT', url, body),
  patch:  <T = any>(url: string, body: unknown) => request<T>('PATCH', url, body),
  delete: <T = any>(url: string) => request<T>('DELETE', url),
};
