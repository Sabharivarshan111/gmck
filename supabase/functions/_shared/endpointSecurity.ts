/** Transport guard only. Each handler still owns authentication and authorization. */
const ALLOWED_ORIGINS = new Set([
  'https://mbbsqbank-questor.lovable.app',
  ...(Deno.env.get('ORBIT_ALLOWED_ORIGINS') ?? '').split(',').map(x => x.trim()).filter(Boolean),
]);

export function secureEndpoint(
  handler: (req: Request) => Response | Promise<Response>,
  options: { publicCors?: boolean; maxBytes?: number; allowGet?: boolean } = {},
) {
  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('origin');
    const allowed = !origin || options.publicCors || ALLOWED_ORIGINS.has(origin) ||
      /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': options.allowGet ? 'GET, POST, OPTIONS' : 'POST, OPTIONS',
    });
    if (origin && allowed) headers.set('Access-Control-Allow-Origin', origin);
    else if (options.publicCors) headers.set('Access-Control-Allow-Origin', '*');
    const reject = (error: string, status: number) => new Response(JSON.stringify({ error }), { status, headers });
    if (!allowed) return reject('Origin is not allowed.', 403);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers });
    if (request.method !== 'POST' && !(options.allowGet && request.method === 'GET')) return reject('Method is not allowed.', 405);
    try {
      let req = request;
      if (request.body) {
        const max = options.maxBytes ?? 1024 * 1024;
        if (Number(request.headers.get('content-length')) > max) return reject('Request is too large.', 413);
        const reader = request.body.getReader();
        const chunks: Uint8Array[] = [];
        let size = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.byteLength;
          if (size > max) { await reader.cancel(); return reject('Request is too large.', 413); }
          chunks.push(value);
        }
        const bytes = new Uint8Array(size);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        req = new Request(request.url, { method: request.method, headers: request.headers, body: bytes });
      }
      let response = await handler(req);
      // Internal/provider failures must not expose keys, SQL or stack details.
      if (response.status >= 500) response = reject('Service unavailable. Please try again later.', response.status);
      const merged = new Headers(response.headers);
      merged.delete('Access-Control-Allow-Origin');
      merged.delete('Access-Control-Allow-Credentials');
      headers.forEach((value, key) => { if (key !== 'Content-Type') merged.set(key, value); });
      return new Response(response.body, { status: response.status, headers: merged });
    } catch {
      return reject('Service unavailable. Please try again later.', 500);
    }
  };
}

