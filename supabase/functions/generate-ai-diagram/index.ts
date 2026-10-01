import { secureEndpoint } from '../_shared/endpointSecurity.ts';
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Track 2: Generate AI raster images for diagrammatic questions that need
 * realistic visuals (histology plates, gross specimens, anatomy illustrations, etc.).
 * Uses Lovable AI Gateway, then uploads the image to Supabase Storage.
 */

const BodySchema = z.object({
  question_id: z.string().min(1).max(300),
  model: z.enum(["openai/gpt-image-2", "google/gemini-3.1-flash-image"]).optional(),
});

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/images/generations";
const GATEWAY_TIMEOUT_MS = 180_000;

class UpstreamError extends Error {
  status: number;
  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}

async function generateImage(apiKey: string, prompt: string, model: string): Promise<Uint8Array> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  let res: Response;

  const body: any = {
    model,
    prompt,
    quality: "low",
    size: "1024x1024",
    n: 1,
    stream: false,
  };

  if (model.startsWith("google/")) {
    delete body.prompt;
    delete body.quality;
    delete body.size;
    delete body.partial_images;
    body.messages = [{ role: "user", content: prompt }];
    body.modalities = ["image", "text"];
  }

  try {
    res = await fetch(GATEWAY_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new UpstreamError(504, "AI Gateway request timed out");
    }
    throw new UpstreamError(502, (err as Error).message);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstreamError(res.status, `AI Gateway error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const b64 = json?.data?.[0]?.b64_json;
  if (!b64) {
    throw new UpstreamError(500, "AI Gateway returned no image data");
  }

  const binaryString = atob(b64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

serve(secureEndpoint(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Admin identity is checked before any service-role read, write, or model call.
  const bearer = req.headers.get("Authorization") ?? "";
  const token = bearer.startsWith("Bearer ") ? bearer.slice(7) : "";
  if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const caller = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: bearer } }, auth: { persistSession: false } },
  );
  const { data: userData, error: userError } = await caller.auth.getUser(token);
  if (userError || !userData.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  const { data: isAdmin, error: roleError } = await caller.rpc("is_admin");
  if (roleError || isAdmin !== true) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { question_id, model = "openai/gpt-image-2" } = parsed.data;

  const { data: row, error: fetchError } = await supabase
    .from("question_diagrams")
    .select("*")
    .eq("question_id", question_id)
    .single();

  if (fetchError || !row) {
    return new Response(JSON.stringify({ error: "Row could not be read" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!row.needs_ai_raster) {
    return new Response(JSON.stringify({ error: "This question is not flagged for AI raster generation" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const imageBytes = await generateImage(lovableApiKey, row.render_prompt, model);
    const ext = "png";
    const storagePath = `${row.year}/${row.subject}/${row.subtopic_key}/${row.question_id}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("diagrams")
      .upload(storagePath, imageBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (uploadError) {
      throw new UpstreamError(500, `Storage upload failed: ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from("diagrams").getPublicUrl(storagePath);
    const publicUrl = urlData?.publicUrl ?? "";

    const { error: updateError } = await supabase
      .from("question_diagrams")
      .update({
        storage_path: storagePath,
        public_url: publicUrl,
        status: "uploaded",
        error_log: null,
      })
      .eq("id", row.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: "Unable to save result" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ public_url: publicUrl, status: "uploaded" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = (err as UpstreamError).status ?? 500;
    await supabase
      .from("question_diagrams")
      .update({ status: "failed", error_log: (err as Error).message })
      .eq("id", row.id);
    return new Response(JSON.stringify({ error: "Unable to complete request" }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}));
