// Simple localStorage-backed store for history + counters + chat threads.
import { useEffect, useState } from "react";

export type HistoryKind = "email" | "meeting" | "research" | "tasks" | "chat";

export interface HistoryItem {
  id: string;
  kind: HistoryKind;
  title: string;
  content: string; // markdown/text
  createdAt: number;
  meta?: Record<string, unknown>;
}

const HISTORY_KEY = "aria.history.v1";
const COUNTS_KEY = "aria.counts.v1";

export function readHistory(): HistoryItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

export function writeHistory(items: HistoryItem[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("aria:history"));
}

export function saveHistoryItem(item: Omit<HistoryItem, "id" | "createdAt">) {
  const items = readHistory();
  const entry: HistoryItem = { ...item, id: crypto.randomUUID(), createdAt: Date.now() };
  items.unshift(entry);
  writeHistory(items.slice(0, 200));
  bumpCount(item.kind);
  return entry;
}

export function deleteHistoryItem(id: string) {
  writeHistory(readHistory().filter((i) => i.id !== id));
}

export function clearHistory() {
  writeHistory([]);
  localStorage.setItem(COUNTS_KEY, JSON.stringify({}));
  window.dispatchEvent(new Event("aria:counts"));
}

export function useHistory() {
  const [items, setItems] = useState<HistoryItem[]>([]);
  useEffect(() => {
    const load = () => setItems(readHistory());
    load();
    window.addEventListener("aria:history", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("aria:history", load);
      window.removeEventListener("storage", load);
    };
  }, []);
  return items;
}

export type Counts = Record<HistoryKind, number>;
export function readCounts(): Counts {
  if (typeof window === "undefined") return blank();
  try {
    return { ...blank(), ...JSON.parse(localStorage.getItem(COUNTS_KEY) || "{}") };
  } catch {
    return blank();
  }
}
function blank(): Counts {
  return { email: 0, meeting: 0, research: 0, tasks: 0, chat: 0 };
}
export function bumpCount(kind: HistoryKind) {
  const c = readCounts();
  c[kind] = (c[kind] || 0) + 1;
  localStorage.setItem(COUNTS_KEY, JSON.stringify(c));
  window.dispatchEvent(new Event("aria:counts"));
}
export function useCounts() {
  const [c, setC] = useState<Counts>(blank());
  useEffect(() => {
    const load = () => setC(readCounts());
    load();
    window.addEventListener("aria:counts", load);
    return () => window.removeEventListener("aria:counts", load);
  }, []);
  return c;
}

// Kanban tasks
export interface KanbanTask {
  id: string;
  title: string;
  description?: string;
  priority?: "high" | "medium" | "low";
  urgency?: string;
  estimateMinutes?: number;
  suggestedDeadline?: string;
  group?: string;
  status: "todo" | "in_progress" | "completed";
}
const TASKS_KEY = "aria.tasks.v1";
export function readTasks(): KanbanTask[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(TASKS_KEY) || "[]");
  } catch {
    return [];
  }
}
export function writeTasks(t: KanbanTask[]) {
  localStorage.setItem(TASKS_KEY, JSON.stringify(t));
  window.dispatchEvent(new Event("aria:tasks"));
}
export function useTasks() {
  const [t, setT] = useState<KanbanTask[]>([]);
  useEffect(() => {
    const load = () => setT(readTasks());
    load();
    window.addEventListener("aria:tasks", load);
    return () => window.removeEventListener("aria:tasks", load);
  }, []);
  return t;
}
