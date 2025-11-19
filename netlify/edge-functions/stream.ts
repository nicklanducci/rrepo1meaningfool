// netlify/edge-functions/stream.ts
// Calls your OpenAI Assistant and returns ONE sentence { sentence: "..." }

export default async (req: Request) => {
  const key = Deno.env.get("OPENAI_API_KEY") || "";
  const org = Deno.env.get("OPENAI_ORG_ID") || "";
  const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID") || "";

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  if (!assistantId) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_ASSISTANT_ID" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const headers: Record<string,string> = {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2"
  };
  if (org) headers["OpenAI-Organization"] = org;

  // 1. Create thread
  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers,
    body: JSON.stringify({})
  });

  const thread = await threadRes.json();
  const threadId = thread.id;

  // 2. Add message
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      role: "user",
      content: "Generate one conceptual contradictory art sentence."
    })
  });

  // 3. Run assistant
  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      assistant_id: assistantId
    })
  });
  const runData = await runRes.json();
  const runId = runData.id;

  // 4. Poll until completed
  let status = runData.status;

  while (status === "queued" || status === "in_progress") {
    await new Promise(r => setTimeout(r, 300));
    const pollRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers }
    );
    const pollData = await pollRes.json();
    status = pollData.status;
  }

  // 5. Retrieve messages
  const msgsRes = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    { headers }
  );
  const msgs = await msgsRes.json();

  const sentence =
    msgs?.data?.[0]?.content?.[0]?.text?.value?.trim() ||
    "A conceptual sentence could not be generated.";

  return new Response(JSON.stringify({ sentence }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
  });
};

export const config = { path: "/stream" };
// netlify/edge-functions/stream.ts
// Calls your OpenAI Assistant and returns ONE sentence { sentence: "..." }

export default async (req: Request) => {
  const key = Deno.env.get("OPENAI_API_KEY") || "";
  const org = Deno.env.get("OPENAI_ORG_ID") || "";
  const assistantId = Deno.env.get("OPENAI_ASSISTANT_ID") || "";

  if (!key) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_API_KEY" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
  if (!assistantId) {
    return new Response(JSON.stringify({ error: "Missing OPENAI_ASSISTANT_ID" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const headers: Record<string,string> = {
    "Authorization": `Bearer ${key}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2"
  };
  if (org) headers["OpenAI-Organization"] = org;

  // 1. Create thread
  const threadRes = await fetch("https://api.openai.com/v1/threads", {
    method: "POST",
    headers,
    body: JSON.stringify({})
  });

  const thread = await threadRes.json();
  const threadId = thread.id;

  // 2. Add message
  await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      role: "user",
      content: "Generate one conceptual contradictory art sentence."
    })
  });

  // 3. Run assistant
  const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      assistant_id: assistantId
    })
  });
  const runData = await runRes.json();
  const runId = runData.id;

  // 4. Poll until completed
  let status = runData.status;

  while (status === "queued" || status === "in_progress") {
    await new Promise(r => setTimeout(r, 300));
    const pollRes = await fetch(
      `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`,
      { headers }
    );
    const pollData = await pollRes.json();
    status = pollData.status;
  }

  // 5. Retrieve messages
  const msgsRes = await fetch(
    `https://api.openai.com/v1/threads/${threadId}/messages`,
    { headers }
  );
  const msgs = await msgsRes.json();

  const sentence =
    msgs?.data?.[0]?.content?.[0]?.text?.value?.trim() ||
    "A conceptual sentence could not be generated.";

  return new Response(JSON.stringify({ sentence }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*"
    },
  });
};

export const config = { path: "/stream" };

