// Retired one-off ingestion endpoint. Kept as a non-mutating tombstone so old callers fail safely.
Deno.serve((_req: Request) => new Response(
  JSON.stringify({ error: "This ingestion endpoint is retired." }),
  { status: 410, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
));