// netlify/edge-functions/stream.ts
// Returns ONE conceptual sentence as JSON: { sentence: "..." }
// Requires: OPENAI_API_KEY (and optionally OPENAI_ORG_ID) in Netlify env.

export default async (req: Request) => {
  const url = new URL(req.url);

  const key = Deno.env.get("OPENAI_API_KEY") || "";
  const org = Deno.env.get("OPENAI_ORG_ID") || ""; // optional

  const prompt =
    url.searchParams.get("prompt") ??
    "make a contradictory short sentence composed by two atomic propositions about art and its essence and give me only the sentence";

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
    "ake a contradictory short sentence composed by two atomic propositions about art and its essence. The atomic proposition must be in Wittgenstein's theory of logical atomism sense, An atomic proposition is a basic, logically independent statement that describes a simple state of affairs, or a configuration of objects. It is the simplest form of a proposition, meaning it is not a truth-function of any other propositions." +
    "Here are some examples: " +
    "A monochrome surface contains every color. " +
    "The sculpture exists only when unseen. " +
    "This drawing erases itself as it is made. " +
    "A closed space remains fully accessible. " +
    "The work changes only when it stays the same. " +
    "The empty frame completes the image. " +
    "A straight line bends around itself. " +
    "The material is immaterial. " +
    "The visible part is entirely hidden. " +
    "The origin is located in the future. " +
    "Generate only one short sentence.";

  // 🔥 VERSIONE A COSTO RIDOTTISSIMO
  const model = "gpt-4.1-mini";

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




