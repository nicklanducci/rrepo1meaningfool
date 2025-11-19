// netlify/edge-functions/stream.ts
// Returns ONE conceptual sentence as JSON: { sentence: "..." }
// Requires: OPENAI_API_KEY (and optionally OPENAI_ORG_ID) in Netlify env.

export default async (req: Request) => {
  const url = new URL(req.url);

  const key = Deno.env.get("OPENAI_API_KEY") || "";
  const org = Deno.env.get("OPENAI_ORG_ID") || ""; // optional
  const prompt =
    url.searchParams.get("prompt") ??
    "make a contradictory short sentence composed by two atomic propositions about art and its essence";

  if (!key) {
    return new Response(
      JSON.stringify({ error: "Missing OPENAI_API_KEY" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
  };
  if (org) headers["OpenAI-Organization"] = org;

  const systemInstruction =
    "make a contradictory short sentence composed by two atomic propositions about art and its essence. " +
    "here are some examples: A monochrome surface contains every color. The sculpture exists only when unseen. " +
    "This drawing erases itself as it is made. A closed space remains fully accessible. The work changes only when it stays the same. " +
    "A single point covers the whole wall. The empty frame completes the image. A straight line bends around itself. " +
    "The title describes what the work is not. The installation expands by being removed. The material is immaterial. " +
    "The visible part is entirely hidden. This performance occurs without happening. The original is identical to its copy. " +
    "The text reads what is not written. This object is heavier than itself. The audience completes a work that is already finished. " +
    "The concept exists without being conceived. Every mark on the page is blank. The frame surrounds nothing and contains everything. " +
    "This image is smaller than its detail. The negative space occupies more than the object. A permanent work exists only temporarily. " +
    "The idea is finished when it begins. This space is both empty and full. The work exists only as its documentation. " +
    "The image is composed entirely of what is missing. The projection illuminates darkness without light. " +
    "The sequence begins at its conclusion. This surface is both opaque and transparent. The act of looking removes the work from view.";

  const model = "gpt-4.1"; // puoi usare anche "gpt-4.1-mini" o "gpt-4o-mini"

  let upstream: Response;
  try {
    upstream = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        input: [
          { role: "system", content: systemInstruction },
          { role: "user", content: prompt },
        ],
        stream: false,
        max_output_tokens: 80,
      }),
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: `Network error: ${String(e)}` }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  if (!upstream.ok) {
    const text = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: `Upstream error ${upstream.status}: ${text}`,
      }),
      {
        status: upstream.status,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  const data = await upstream.json().catch(() => ({} as any));

  // Responses API: data.output[0].content[0].text
  const sentenceRaw =
    data?.output?.[0]?.content?.[0]?.text ??
    "A monochrome surface contains every color.";

  let sentence = String(sentenceRaw).trim();

  if (!/[.!?…]$/.test(sentence)) {
    sentence += ".";
  }

  return new Response(JSON.stringify({ sentence }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = { path: "/stream" };



