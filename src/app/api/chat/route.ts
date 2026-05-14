import { NextRequest } from "next/server";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { messages, model } = await req.json();

  const apiKey = process.env.RUNWARE_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const selectedModel = model || process.env.RUNWARE_MODEL || "openai:gpt@5.5";

  // Runware native API format for text inference
  const taskUUID = randomUUID();

  // Convert messages: extract system prompt if present
  const systemMessage = messages.find((m: { role: string }) => m.role === "system");
  const chatMessages = messages
    .filter((m: { role: string }) => m.role !== "system")
    .map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    }));

  // Build settings based on model capabilities
  const isOpenAI = selectedModel.startsWith("openai:");
  const isMiniMax = selectedModel.startsWith("minimax:");

  const settings: Record<string, unknown> = {
    maxTokens: 4096,
    ...(systemMessage ? { systemPrompt: systemMessage.content } : {}),
  };

  // MiniMax supports temperature, OpenAI/Claude use thinkingLevel
  if (isMiniMax) {
    settings.temperature = 0.7;
  } else {
    settings.thinkingLevel = "medium";
  }

  const requestBody = [
    {
      taskType: "textInference",
      taskUUID,
      model: selectedModel,
      messages: chatMessages,
      deliveryMethod: "stream",
      ...(isOpenAI ? { tools: [{ type: "webSearch" }] } : {}),
      settings,
    },
  ];

  console.log("Sending to Runware:", JSON.stringify(requestBody, null, 2));

  const response = await fetch("https://api.runware.ai/v1", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Runware API error:", response.status, errorText);
    return new Response(
      JSON.stringify({ error: `Runware API error: ${response.status}`, details: errorText }),
      { status: response.status, headers: { "Content-Type": "application/json" } }
    );
  }

  // Forward the SSE stream to the client
  // Runware native API streams: data: {"taskUUID":"...","taskType":"textInference","delta":{"text":"..."},"finishReason":null}
  // We convert to OpenAI-compatible format for the frontend
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      if (!reader) {
        controller.close();
        return;
      }

      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith(":")) continue;
            if (trimmed === "data: [DONE]") {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              continue;
            }
            if (trimmed.startsWith("data: ")) {
              try {
                const data = JSON.parse(trimmed.slice(6));

                // Check for errors
                if (data.errors) {
                  const errorChunk = {
                    choices: [{ delta: { content: `Error: ${data.errors[0]?.message}` }, finish_reason: "stop" }],
                  };
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorChunk)}\n\n`));
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                  break;
                }

                // Convert Runware native format to OpenAI-compatible format
                const text = data.delta?.text || "";
                const finishReason = data.finishReason;

                const chunk = {
                  choices: [{
                    delta: text ? { content: text } : {},
                    finish_reason: finishReason || null,
                  }],
                };

                controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));

                if (finishReason) {
                  controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                }
              } catch {
                // Skip malformed JSON
                continue;
              }
            }
          }
        }
      } catch (error) {
        console.error("Stream error:", error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
