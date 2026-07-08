import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { ListChecks, Plus, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { planTasks } from "@/lib/ai.functions";
import {
  type KanbanTask,
  readTasks,
  saveHistoryItem,
  useTasks,
  writeTasks,
} from "@/lib/storage";

export const Route = createFileRoute("/_app/tasks")({
  component: TasksPage,
});

const COLUMNS: { key: KanbanTask["status"]; label: string; tint: string }[] = [
  { key: "todo", label: "To Do", tint: "from-blue-500 to-indigo-500" },
  { key: "in_progress", label: "In Progress", tint: "from-violet-500 to-purple-500" },
  { key: "completed", label: "Completed", tint: "from-emerald-500 to-teal-500" },
];

function TasksPage() {
  const fn = useServerFn(planTasks);
  const tasks = useTasks();
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (raw.trim().length < 3) {
      toast.error("Please enter some tasks first.");
      return;
    }
    setLoading(true);
    try {
      const res = (await fn({ data: { tasks: raw } })) as { tasks?: KanbanTask[] };
      if (!res.tasks?.length) {
        toast.error("The AI couldn't parse that. Try one task per line.");
      } else {
        const withIds: KanbanTask[] = res.tasks.map((t) => ({
          ...t,
          id: crypto.randomUUID(),
          status: "todo",
        }));
        writeTasks([...withIds, ...readTasks()]);
        saveHistoryItem({
          kind: "tasks",
          title: `Task plan (${withIds.length} tasks)`,
          content: withIds.map((t) => `• ${t.title}`).join("\n"),
        });
        toast.success(`Added ${withIds.length} planned tasks`);
        setRaw("");
      }
    } catch (e) {
      console.error(e);
      toast.error("Could not plan tasks.");
    } finally {
      setLoading(false);
    }
  }

  function move(id: string, status: KanbanTask["status"]) {
    writeTasks(readTasks().map((t) => (t.id === id ? { ...t, status } : t)));
  }
  function remove(id: string) {
    writeTasks(readTasks().filter((t) => t.id !== id));
  }
  function addManual() {
    const title = window.prompt("Task title?");
    if (!title?.trim()) return;
    writeTasks([
      { id: crypto.randomUUID(), title: title.trim(), status: "todo", priority: "medium" },
      ...readTasks(),
    ]);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <PageHeader
        icon={<ListChecks className="h-5 w-5" />}
        title="AI Task Planner"
        description="Prioritize, estimate and schedule your workload with AI."
        actions={
          <Button variant="outline" onClick={addManual}>
            <Plus className="mr-1 h-4 w-4" /> Add task
          </Button>
        }
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add tasks — one per line</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            className="min-h-[120px]"
            placeholder={`e.g.\nWrite Q4 marketing brief\nReview candidate portfolios\nPrepare board deck for Thursday`}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
          />
          <Button
            onClick={run}
            disabled={loading}
            className="bg-gradient-brand text-white shadow-glow hover:opacity-95"
          >
            <Sparkles className="mr-1 h-4 w-4" />
            {loading ? "Planning…" : "Plan with AI"}
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = tasks.filter((t) => t.status === col.key);
          return (
            <div
              key={col.key}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                const id = e.dataTransfer.getData("text/plain");
                if (id) move(id, col.key);
              }}
              className="flex min-h-[280px] flex-col rounded-xl border bg-card p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full bg-gradient-to-br ${col.tint}`}
                    aria-hidden
                  />
                  <h3 className="text-sm font-semibold">{col.label}</h3>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <div className="flex flex-col gap-2">
                {items.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                    Drop tasks here
                  </p>
                ) : (
                  items.map((t) => (
                    <div
                      key={t.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", t.id)}
                      className="group cursor-grab rounded-lg border bg-background p-3 shadow-soft active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium">{t.title}</p>
                        <button
                          onClick={() => remove(t.id)}
                          className="opacity-0 transition group-hover:opacity-100"
                          aria-label="Delete task"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                      {t.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {t.description}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {t.priority ? (
                          <Badge
                            variant={t.priority === "high" ? "destructive" : "secondary"}
                            className="capitalize"
                          >
                            {t.priority}
                          </Badge>
                        ) : null}
                        {t.group ? (
                          <Badge variant="outline" className="text-[10px]">
                            {t.group}
                          </Badge>
                        ) : null}
                        {t.estimateMinutes ? (
                          <span className="text-[10px] text-muted-foreground">
                            ~{t.estimateMinutes}m
                          </span>
                        ) : null}
                        {t.suggestedDeadline ? (
                          <span className="text-[10px] text-muted-foreground">
                            · {new Date(t.suggestedDeadline).toLocaleDateString()}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      <ResponsibleAiNotice />
    </div>
  );
}
