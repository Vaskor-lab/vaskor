export class OverpassRequestError extends Error {
  constructor(kind, endpoint, detail) {
    super(`${kind} at ${endpoint}${detail ? ` (${detail})` : ''}`);
    this.name = 'OverpassRequestError';
    this.kind = kind;
    this.endpoint = endpoint;
    this.detail = detail;
  }
}

export async function fetchOverpass(query, { endpoints, signal, timeoutMs = 70000, fetchImpl = fetch }) {
  let lastError;
  for (const endpoint of endpoints) {
    if (signal?.aborted) throw new OverpassRequestError('cancelled', endpoint);
    const controller = new AbortController();
    const abortFromCaller = () => controller.abort();
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
    try {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal
      });
      if (!response.ok) throw new OverpassRequestError('http', endpoint, String(response.status));
      try {
        return { data: await response.json(), endpoint };
      } catch {
        if (signal?.aborted) throw new OverpassRequestError('cancelled', endpoint);
        if (timedOut) throw new OverpassRequestError('timeout', endpoint, `${timeoutMs} ms`);
        throw new OverpassRequestError('json', endpoint);
      }
    } catch (error) {
      if (error instanceof OverpassRequestError) lastError = error;
      else if (signal?.aborted) throw new OverpassRequestError('cancelled', endpoint);
      else if (timedOut) lastError = new OverpassRequestError('timeout', endpoint, `${timeoutMs} ms`);
      else lastError = new OverpassRequestError('network', endpoint);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }
  throw lastError || new OverpassRequestError('network', 'no endpoint');
}
