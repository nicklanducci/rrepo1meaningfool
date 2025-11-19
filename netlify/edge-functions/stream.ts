// netlify/edge-functions/stream.ts
// Calls your OpenAI Assistant and returns ONE sentence: { sentence: "..." }

export default async (req: Request) => {
  const key = Deno.env.get("OPENAI_API_KEY") || "";
  const org = Deno.env.get("OPENAI_ORG_ID") || "";
  const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID") || ""; // <-- ADD THIS IN NETLIFY ENV

  if (!key || !assistantId) {
    return new Response(
      JSON.stringify({ error: "Missing OPENAI_API_KEY or OPENAI_ASSISTANT_ID" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      }
    );
  }

  const headers: Record<string,string> = {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  };
  if (org) headers["OpenAI-Organization"] = org;

  // 1. Create a thread
  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers,
    body: JSON.stringify({})
  });
  const thread = await threadRes.json();
  const threadId = thread.id;

  // 2. Add the user message (VERY SHORT!)
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      role: "user",
      content: "Generate one sentence."
    })
  });

  // 3. Run the assistant
  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ assistant_id: assistantId })
  });
  const run = await runRes.json();
  const runId = run.id;

  // 4. Poll until completion
  let status = run.status;
  while (status === "queued" || status === "in_progress") {
    await new Promise(r => setTimeout(r, 300));
    const check = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers }
    );
    const checkData = await check.json();
    status = checkData.status;
  }

  // 5. Get the messages
  const msgsRes = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    { headers }
  );
  const msgs = await msgsRes.json();

  const sentence =
    msgs.data?.[0]?.content?.[0]?.text?.value ??
    "A monochrome surface contains every color.";

  return new Response(JSON.stringify({ sentence }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

export const config = { path: "/stream" };
