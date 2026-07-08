import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";

async function runPrompt(system: string, prompt: string) {
  const { getGateway, DEFAULT_MODEL } = await import("./ai-gateway.server");
  const gateway = getGateway();
  const { text } = await generateText({
    model: gateway(DEFAULT_MODEL),
    system,
    prompt,
  });
  return text;
}

const EmailInput = z.object({
  recipient: z.string().min(1),
  audience: z.string().min(1),
  subject: z.string().min(1),
  purpose: z.string().min(1),
  tone: z.string().min(1),
  notes: z.string().optional().default(""),
});

export const generateEmail = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => EmailInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      "You are an experienced corporate communication specialist. Write clear, well-formatted professional emails. Return only the completed email body with subject line and proper greetings/sign-off. Use markdown-friendly plain text.";
    const prompt = `Write a professional email using the following information.

Recipient: ${data.recipient}
Audience: ${data.audience}
Subject: ${data.subject}
Purpose: ${data.purpose}
Tone: ${data.tone}
Additional Notes: ${data.notes || "None"}

Return only the completed email using professional formatting.`;
    return { text: await runPrompt(system, prompt) };
  });

const MeetingInput = z.object({ notes: z.string().min(10) });

export const summarizeMeeting = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MeetingInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      "You convert raw meeting notes into professional meeting minutes formatted with clear markdown headings.";
    const prompt = `Convert the following meeting notes into professional meeting minutes.

Use these markdown sections in order:
## Meeting Title
## Executive Summary
## Key Discussion Points
## Decisions Made
## Action Items
## Deadlines
## Responsibilities
## Next Meeting

Meeting Notes:
"""
${data.notes}
"""`;
    return { text: await runPrompt(system, prompt) };
  });

const TasksInput = z.object({ tasks: z.string().min(3) });

export const planTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TasksInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      'You are an AI productivity coach. Return STRICT JSON only, no markdown fences. Shape: {"tasks":[{"title":string,"description":string,"priority":"high"|"medium"|"low","urgency":"urgent"|"soon"|"later","estimateMinutes":number,"suggestedDeadline":string,"group":string,"status":"todo"}],"recommendedOrder":string[]}';
    const prompt = `Organize these workplace tasks according to urgency and importance. Suggest realistic deadlines (ISO date strings within the next 14 days from today), estimate completion times in minutes, and recommend the most productive work order. Group related tasks under a short group label.

Tasks (one per line):
${data.tasks}

Return JSON only.`;
    const text = await runPrompt(system, prompt);
    const cleaned = text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      return { tasks: [], recommendedOrder: [], raw: text };
    }
  });

const ResearchInput = z.object({
  topic: z.string().min(3),
  audience: z.string().optional().default("General professional"),
  length: z.string().optional().default("Medium"),
  style: z.string().optional().default("Analytical"),
});

export const researchTopic = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ResearchInput.parse(d))
  .handler(async ({ data }) => {
    const system =
      "You are a professional workplace research assistant. Produce well-structured markdown reports.";
    const prompt = `Research the following topic and produce a report.

Topic: ${data.topic}
Audience: ${data.audience}
Report length: ${data.length}
Writing style: ${data.style}

Include these markdown sections in order:
## Executive Summary
## Key Findings
## Detailed Analysis
## Recommendations
## Conclusion
## References
(For References, provide a placeholder list noting that citations should be verified.)`;
    return { text: await runPrompt(system, prompt) };
  });
