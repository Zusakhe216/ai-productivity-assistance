import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, type UIMessage } from "ai";

type Body = { messages?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = (await request.json()) as Body;
        if (!Array.isArray(messages)) {
          return new Response("Messages are required", { status: 400 });
        }
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const { createLovableAiGatewayProvider } = await import("@/lib/ai-gateway.server");
        const gateway = createLovableAiGatewayProvider(key);

        const system = `You are Aria, an AI workplace productivity assistant. You help professionals draft emails, summarize meetings, plan tasks, research topics, and get quick advice.

Guidelines:
- Be concise, structured, and professional.
- Use markdown headings, bullet lists, and short paragraphs where helpful.
- If a request would need confidential data, remind the user not to share sensitive information.
- When uncertain, say so and suggest what info would help.`;

        const result = streamText({
          model: gateway("openai/gpt-5-mini"),
          system,
          messages: await convertToModelMessages(messages as UIMessage[]),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: messages as UIMessage[],
        });
      },
    },
  },
});
