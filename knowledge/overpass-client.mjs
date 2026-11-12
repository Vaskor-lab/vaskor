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
    let timeout, rejectCancelled;
    const abortFromCaller = () => {
      controller.abort();
      rejectCancelled(new OverpassRequestError('cancelled', endpoint));
    };
    const cancellation = new Promise((_, reject) => { rejectCancelled = reject; });
    signal?.addEventListener('abort', abortFromCaller, { once: true });
    if (signal?.aborted) abortFromCaller();
    const deadline = new Promise((_, reject) => {
      timeout = setTimeout(() => {
        controller.abort();
        reject(new OverpassRequestError('timeout', endpoint, `${timeoutMs} ms`));
      }, timeoutMs);
    });
    const request = (async () => {
      const response = await fetchImpl(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }),
        signal: controller.signal
      });
      if (!response.ok) throw new OverpassRequestError('http', endpoint, String(response.status));
      try {
        return await response.json();
      } catch {
        throw new OverpassRequestError('json', endpoint);
      }
    })();
    try {
      return { data: await Promise.race([request, deadline, cancellation]), endpoint };
    } catch (error) {
      if (error instanceof OverpassRequestError && error.kind === 'cancelled') throw error;
      if (error instanceof OverpassRequestError) lastError = error;
      else if (signal?.aborted) throw new OverpassRequestError('cancelled', endpoint);
      else lastError = new OverpassRequestError('network', endpoint);
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abortFromCaller);
    }
  }
  throw lastError || new OverpassRequestError('network', 'no endpoint');
}
