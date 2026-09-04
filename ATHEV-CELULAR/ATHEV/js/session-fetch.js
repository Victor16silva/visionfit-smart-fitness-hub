// Retry only rejected data reads; never replay a write or refresh the JWT here.
export function sessionFetch(baseUrl, fetcher = globalThis.fetch, wait = ms => new Promise(resolve => setTimeout(resolve, ms))) {
  const origin = new URL(baseUrl).origin;
  return async (input, init) => {
    const request = new Request(input, init);
    const target = new URL(request.url);
    const eligible = request.method === 'GET' && target.origin === origin && target.pathname.startsWith('/rest/v1/');
    for (let attempt = 0; ; attempt++) {
      request.signal.throwIfAborted();
      const response = await fetcher(request.clone());
      if (!eligible || response.status !== 401 || attempt >= 2) return response;
      const error = await response.clone().json().catch(() => null);
      if (error?.code !== 'PGRST303' || error.message !== 'JWT issued at future') return response;
      await wait((attempt + 1) * 1000);
    }
  };
}
