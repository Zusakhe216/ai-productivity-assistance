import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import { MessageSquare, Plus, Send, Sparkles, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { saveHistoryItem } from "@/lib/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/chat")({
  component: ChatPage,
});

const STORAGE_KEY = "aria.chat.v1";
const SUGGESTED = [
  "Write a professional email declining a meeting",
  "Summarize this meeting into action items",
  "Organize my top 5 tasks for tomorrow",
  "Research the impact of AI on marketing teams",
  "Improve the clarity of this paragraph",
];

function ChatPage() {
  const [initial, setInitial] = useState<UIMessage[] | null>(null);
  const [chatId, setChatId] = useState<string>(() => crypto.randomUUID());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setInitial(raw ? (JSON.parse(raw) as UIMessage[]) : []);
    } catch {
      setInitial([]);
    }
  }, []);

  if (!initial) {
    return (
      <div className="mx-auto max-w-4xl">
        <PageHeader
          icon={<MessageSquare className="h-5 w-5" />}
          title="AI Chatbot"
          description="Your always-on workplace assistant."
        />
      </div>
    );
  }

  return (
    <ChatWindow
      key={chatId}
      chatId={chatId}
      initial={initial}
      onNewChat={() => {
        setInitial([]);
        setChatId(crypto.randomUUID());
        localStorage.removeItem(STORAGE_KEY);
      }}
    />
  );
}

function ChatWindow({
  chatId,
  initial,
  onNewChat,
}: {
  chatId: string;
  initial: UIMessage[];
  onNewChat: () => void;
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, sendMessage, status, setMessages } = useChat({
    id: chatId,
    messages: initial,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    onError: (e) => {
      console.error(e);
      toast.error("Chat error. Please try again.");
    },
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {}
  }, [messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [status]);

  const isLoading = status === "submitted" || status === "streaming";

  async function submit(text?: string) {
    const value = (text ?? input).trim();
    if (!value || isLoading) return;
    setInput("");
    await sendMessage({ text: value });
  }

  function newChat() {
    if (messages.length > 0) {
      const title = firstUserText(messages).slice(0, 60) || "Chat conversation";
      saveHistoryItem({
        kind: "chat",
        title,
        content: messages.map(msgToText).join("\n\n"),
      });
    }
    setMessages([]);
    onNewChat();
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <PageHeader
        icon={<MessageSquare className="h-5 w-5" />}
        title="AI Chatbot"
        description="Your always-on workplace assistant."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={newChat}>
              <Plus className="mr-1 h-4 w-4" /> New chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setMessages([]);
                localStorage.removeItem(STORAGE_KEY);
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" /> Clear
            </Button>
          </div>
        }
      />

      <Card className="flex h-[70vh] min-h-[520px] flex-col overflow-hidden">
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
          {messages.length === 0 ? (
            <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-10 text-center">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-brand text-white shadow-glow">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Hi, I'm Aria</h3>
                <p className="text-sm text-muted-foreground">
                  I can help you draft, summarize, plan and research. Try a suggestion below.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => submit(s)}
                    className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground shadow-soft transition hover:border-primary/60 hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => <Bubble key={m.id} message={m} />)
          )}
          {isLoading && messages[messages.length - 1]?.role !== "assistant" ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary" />
              Aria is thinking…
            </div>
          ) : null}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
          className="border-t bg-background/60 p-3 backdrop-blur"
        >
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              rows={1}
              placeholder="Ask Aria anything about your work…"
              className="max-h-40 min-h-11 resize-none"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void submit();
                }
              }}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="bg-gradient-brand text-white shadow-glow hover:opacity-95"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </form>
      </Card>
      <ResponsibleAiNotice compact />
    </div>
  );
}

function msgToText(m: UIMessage) {
  const text = m.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
  return `${m.role === "user" ? "You" : "Aria"}: ${text}`;
}
function firstUserText(ms: UIMessage[]) {
  const u = ms.find((m) => m.role === "user");
  return u ? u.parts.map((p) => (p.type === "text" ? p.text : "")).join("") : "";
}

function Bubble({ message }: { message: UIMessage }) {
  const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
  const isUser = message.role === "user";
  const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-semibold ${
          isUser ? "bg-secondary text-secondary-foreground" : "bg-gradient-brand text-white"
        }`}
      >
        {isUser ? "You" : "A"}
      </div>
      <div className={`flex max-w-[85%] flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-soft ${
            isUser
              ? "bg-gradient-brand text-white"
              : "border bg-card text-card-foreground"
          }`}
        >
          {text || <span className="opacity-70">…</span>}
        </div>
        <span className="px-1 text-[10px] text-muted-foreground">{ts}</span>
      </div>
    </div>
  );
}
