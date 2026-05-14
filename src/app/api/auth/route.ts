import { NextRequest } from "next/server";

// Simple single-user password auth
export async function POST(req: NextRequest) {
  const { password } = await req.json();

  const correctPassword = process.env.CHAT_PASSWORD;
  if (!correctPassword) {
    return new Response(JSON.stringify({ error: "Password not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (password === correctPassword) {
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Invalid password" }), {
    status: 401,
    headers: { "Content-Type": "application/json" },
  });
}
