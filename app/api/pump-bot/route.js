// app/api/pump-bot/route.js
import OpenAI from "openai";

const cors = {
  "Access-Control-Allow-Origin": "*",           // or "https://app.reachbakk.com"
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST,OPTIONS,GET"
};

export async function OPTIONS() {
  return new Response(null, { headers: cors });
}

export async function GET() {
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json", ...cors }
  });
}

export async function POST(req) {
  try {
    const { user, history = [] } = await req.json();
    if (!user) {
      return new Response(JSON.stringify({ error: "Missing `user`" }), {
        status: 400, headers: { "Content-Type": "application/json", ...cors }
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      console.error("Missing OPENAI_API_KEY");
      return new Response(JSON.stringify({ error: "Server not configured" }), {
        status: 500, headers: { "Content-Type": "application/json", ...cors }
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const systemPrompt = `You are Fluid Pump Systems Troubleshooter (FPST).
Safety first (LOTO, 0 psi, guards). Ask one thing at a time.
End every reply with "Next Step ▶ ...".`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map(h => ({ role: h.role, content: h.content })),
      { role: "user", content: user }
    ];

    const r = await client.chat.completions.create({
      model: "gpt-4o", temperature: 0.2, max_tokens: 600, messages
    });

    const reply = r.choices?.[0]?.message?.content ?? "No reply.";
    return new Response(JSON.stringify({ reply }), {
      headers: { "Content-Type": "application/json", ...cors }
    });
  } catch (e) {
    console.error("API error:", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { "Content-Type": "application/json", ...cors }
    });
  }
}

