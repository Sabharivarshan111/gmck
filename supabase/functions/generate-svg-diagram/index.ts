import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

/**
 * Track 1: Generate code-based diagrams (SVG/Mermaid) for diagrammatic questions.
 * Reads the render_prompt from question_diagrams, asks Gemini for raw SVG markup,
 * and stores it back in the table.
 */

const BodySchema = z.object({
  question_id: z.string().min(1).max(300),
  geminiApiKey: z.string().min(1).max(255).optional(),
});

const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_TIMEOUT_MS = 55_000;

const SYSTEM_PROMPT = `You are an expert medical illustrator and MBBS professor. Generate a clean, exam-ready SVG diagram based on the user's request.

Output rules:
- Return ONLY a single valid SVG string starting with <svg and ending with </svg>.
- Do NOT wrap the SVG in markdown fences, JSON, or any other text.
- Use a white or transparent background.
- Use a clean, readable sans-serif font (e.g., Arial, Helvetica, sans-serif).
- For flowcharts: use rectangles with rounded corners, arrows, and clear labels.
- For tables: use <rect> cells and <text> labels with grid lines.
- For lifecycles/cycles: use circular or curved arrows.
- Keep the SVG width="100%" and include a reasonable viewBox (e.g., viewBox="0 0 800 600").
- Use distinct medical-friendly colors: #2563eb (blue), #16a34a (green), #dc2626 (red), #f59e0b (amber), #7c3aed (violet), #0f172a (slate).
- Include all labels, numbers, drug names, and doses mentioned in the prompt.
- Do not include page numbers, watermarks, or textbook citations.`;

class UpstreamError extends Error {
  status: number;
  constructor(status: number, msg: string) {
    super(msg);
    this.status = status;
  }
}

async function callGemini(apiKey: string, prompt: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.35,
          topP: 0.9,
          maxOutputTokens: 8192,
        },
      }),
    });
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      throw new UpstreamError(504, "Gemini request timed out");
    }
    throw new UpstreamError(502, (err as Error).message);
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new UpstreamError(res.status, `Gemini error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const raw = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  const match = raw.match(/<svg[\s\S]*?<\/svg>/i);
  if (!match) {
    throw new UpstreamError(500, `Gemini did not return valid SVG markup`);
  }
  return match[0];
}

serve(async (req) => {
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

  const { question_id, geminiApiKey: bodyKey } = parsed.data;
  const geminiApiKey = bodyKey ?? Deno.env.get("GEMINI_API_KEY");
  if (!geminiApiKey) {
    return new Response(JSON.stringify({ error: "Gemini API key required. Pass geminiApiKey in body or set GEMINI_API_KEY secret." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: row, error: fetchError } = await supabase
    .from("question_diagrams")
    .select("*")
    .eq("question_id", question_id)
    .single();

  if (fetchError || !row) {
    return new Response(JSON.stringify({ error: fetchError?.message ?? "Row not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (row.needs_ai_raster) {
    return new Response(JSON.stringify({ error: "This question is flagged for AI raster generation, not SVG" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const svg = await callGemini(geminiApiKey, row.render_prompt);
    const { error: updateError } = await supabase
      .from("question_diagrams")
      .update({
        svg_code: svg,
        status: "generated",
        error_log: null,
      })
      .eq("id", row.id);

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ svg, status: "generated" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const status = (err as UpstreamError).status ?? 500;
    await supabase
      .from("question_diagrams")
      .update({ status: "failed", error_log: (err as Error).message })
      .eq("id", row.id);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
