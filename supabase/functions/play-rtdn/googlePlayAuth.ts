/**
 * A Google access token for the Play Developer API, from the service-account key.
 *
 * A signed JWT exchanged for a bearer token -- the same dance googleapis does,
 * done by hand because pulling the whole client library into an edge function
 * for one RS256 signature and two GETs is not a trade worth making.
 *
 * ## This file exists TWICE, on purpose
 *
 * `play-verify-purchase/` and `play-rtdn/` each carry a copy. Supabase deploys
 * a function as a self-contained bundle, so a shared module outside both
 * folders is not something either could import. `npm run check:billing` asserts
 * the two copies are byte-identical -- which is the part that matters, since a
 * silently diverged auth helper means one of the two functions stops being able
 * to talk to Play and the other keeps working.
 */

function b64url(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToPkcs8(pem: string): Uint8Array {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  return Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
}

/**
 * Tokens last an hour and these functions are called once per purchase or
 * notification, so there is nothing to cache: a cache would be a
 * warm-instance-only optimisation that mostly misses, and a stale token failing
 * once an hour is a worse bug than one signature nobody noticed the cost of.
 */
export async function playAccessToken(): Promise<string> {
  const raw = Deno.env.get("PLAY_SERVICE_ACCOUNT_JSON");
  if (!raw) {
    throw new Error("PLAY_SERVICE_ACCOUNT_JSON is not set on this project.");
  }
  const account = JSON.parse(raw) as { client_email: string; private_key: string };
  if (!account.client_email || !account.private_key) {
    throw new Error("PLAY_SERVICE_ACCOUNT_JSON is missing client_email or private_key.");
  }

  const now = Math.floor(Date.now() / 1000);
  const header = b64url(new TextEncoder().encode(JSON.stringify({ alg: "RS256", typ: "JWT" })));
  const claim = b64url(new TextEncoder().encode(JSON.stringify({
    iss: account.client_email,
    scope: "https://www.googleapis.com/auth/androidpublisher",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  })));
  const signingInput = `${header}.${claim}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    // The JSON carries the PEM with literal \n, which JSON.parse has already
    // turned into real newlines. Both forms are handled: a key pasted through a
    // console that kept the escapes would otherwise fail to import with a
    // message that says nothing about why.
    pemToPkcs8(account.private_key.replace(/\\n/g, "\n")),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = new Uint8Array(
    await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(signingInput)),
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${signingInput}.${b64url(signature)}`,
    }),
  });
  const body = await response.json().catch(() => null) as
    { access_token?: string; error_description?: string } | null;
  if (!response.ok || !body?.access_token) {
    throw new Error(`Google token exchange failed: ${body?.error_description ?? response.status}`);
  }
  return body.access_token;
}
