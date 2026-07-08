import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Mail,
  FileText,
  ListChecks,
  Search,
  MessageSquare,
  ArrowUpRight,
  Sparkles,
  Clock,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCounts, useHistory, useTasks } from "@/lib/storage";

export const Route = createFileRoute("/_app/")({
  component: Dashboard,
});

const stats = [
  { key: "email", label: "Emails Generated", icon: Mail, to: "/email", tint: "from-blue-500 to-indigo-500" },
  { key: "meeting", label: "Meetings Summarized", icon: FileText, to: "/meetings", tint: "from-indigo-500 to-violet-500" },
  { key: "tasks", label: "Tasks Planned", icon: ListChecks, to: "/tasks", tint: "from-violet-500 to-purple-500" },
  { key: "research", label: "Research Requests", icon: Search, to: "/research", tint: "from-purple-500 to-fuchsia-500" },
  { key: "chat", label: "AI Chats", icon: MessageSquare, to: "/chat", tint: "from-fuchsia-500 to-pink-500" },
] as const;

const quickActions = [
  { label: "Draft an email", to: "/email", icon: Mail },
  { label: "Summarize a meeting", to: "/meetings", icon: FileText },
  { label: "Plan my day", to: "/tasks", icon: ListChecks },
  { label: "Research a topic", to: "/research", icon: Search },
  { label: "Ask the AI", to: "/chat", icon: MessageSquare },
] as const;

const suggestions = [
  "Turn last week's meeting notes into action items.",
  "Draft a follow-up email to a client after a proposal call.",
  "Plan your top 5 tasks for tomorrow with realistic time estimates.",
  "Research emerging trends in your industry before your next 1:1.",
];

function Dashboard() {
  const counts = useCounts();
  const history = useHistory();
  const tasks = useTasks();
  const upcoming = tasks
    .filter((t) => t.status !== "completed" && t.suggestedDeadline)
    .sort(
      (a, b) =>
        new Date(a.suggestedDeadline!).getTime() - new Date(b.suggestedDeadline!).getTime(),
    )
    .slice(0, 5);

  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <PageHeader
        icon={<Sparkles className="h-5 w-5" />}
        title="Good day — let's boost your productivity"
        description="One integrated AI workspace for emails, meetings, tasks, research and chat."
        actions={
          <Button asChild className="bg-gradient-brand text-white shadow-glow hover:opacity-95">
            <Link to="/chat">
              <Sparkles className="mr-1 h-4 w-4" /> Ask Aria
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Link key={s.key} to={s.to}>
            <Card className="group relative overflow-hidden border-border/60 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
              <div
                className={`pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-br opacity-20 blur-2xl ${s.tint}`}
              />
              <CardContent className="relative p-4">
                <div className="flex items-center justify-between">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br text-white shadow ${s.tint}`}
                  >
                    <s.icon className="h-4 w-4" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">
                  {counts[s.key as keyof typeof counts] ?? 0}
                </div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent activity</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/history">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No activity yet. Try generating an email or summarizing a meeting to get started.
              </p>
            ) : (
              <ul className="divide-y">
                {history.slice(0, 6).map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-2 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{h.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(h.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {h.kind}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-primary" /> Productivity insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              You've used Aria <span className="font-semibold">{total}</span> times so far.
            </p>
            <div className="rounded-lg border bg-gradient-soft p-3 text-sm">
              <p className="font-medium">AI suggestion</p>
              <p className="mt-1 text-muted-foreground">
                {suggestions[total % suggestions.length]}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4 text-primary" /> Upcoming tasks
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/tasks">Open planner</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No planned tasks yet. Use the Task Planner to organize your workload.
              </p>
            ) : (
              <ul className="space-y-2">
                {upcoming.map((t) => (
                  <li key={t.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{t.title}</p>
                      <p className="text-xs text-muted-foreground">
                        Due {new Date(t.suggestedDeadline!).toLocaleDateString()}
                        {t.estimateMinutes ? ` · ~${t.estimateMinutes} min` : ""}
                      </p>
                    </div>
                    <Badge
                      variant={t.priority === "high" ? "destructive" : "secondary"}
                      className="capitalize"
                    >
                      {t.priority ?? "normal"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-2">
            {quickActions.map((q) => (
              <Button
                asChild
                key={q.to}
                variant="outline"
                className="justify-start"
              >
                <Link to={q.to}>
                  <q.icon className="mr-2 h-4 w-4 text-primary" /> {q.label}
                </Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>

      <ResponsibleAiNotice />
    </div>
  );
}
