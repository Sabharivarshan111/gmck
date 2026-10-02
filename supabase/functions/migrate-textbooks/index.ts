// Retired one-off textbook migration endpoint.
Deno.serve((_req: Request) => new Response(
  JSON.stringify({ error: "This migration endpoint is retired." }),
  { status: 410, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } },
));