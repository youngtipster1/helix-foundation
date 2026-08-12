/**
 * Prototype transport layer.
 *
 * Every service resolves through `respond()` so the mock store can later be
 * swapped for `fetch()` calls against the Laravel API without touching the UI.
 */
export function respond<T>(data: T, delay = 120): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
