import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Download, History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteHistoryItem, useHistory, type HistoryKind } from "@/lib/storage";

export const Route = createFileRoute("/_app/history")({
  component: HistoryPage,
});

const KINDS: { key: HistoryKind | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "email", label: "Emails" },
  { key: "meeting", label: "Meetings" },
  { key: "research", label: "Research" },
  { key: "tasks", label: "Tasks" },
  { key: "chat", label: "Chats" },
];

function HistoryPage() {
  const items = useHistory();
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<string>("all");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(
    () =>
      items.filter(
        (i) =>
          (tab === "all" || i.kind === tab) &&
          (q.trim() === "" ||
            i.title.toLowerCase().includes(q.toLowerCase()) ||
            i.content.toLowerCase().includes(q.toLowerCase())),
      ),
    [items, q, tab],
  );

  const active = filtered.find((i) => i.id === selected) ?? filtered[0];

  function exportItem() {
    if (!active) return;
    const blob = new Blob([active.content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${active.title.replace(/\W+/g, "-").slice(0, 40) || "item"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-5">
      <PageHeader
        icon={<HistoryIcon className="h-5 w-5" />}
        title="History"
        description="Search, review, export or delete your past AI outputs."
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search history…" className="pl-8" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            {KINDS.map((k) => (
              <TabsTrigger key={k.key} value={k.key} className="text-xs">
                {k.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            {filtered.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground">Nothing here yet.</p>
            ) : (
              <ul className="divide-y">
                {filtered.map((i) => (
                  <li key={i.id}>
                    <button
                      onClick={() => setSelected(i.id)}
                      className={`flex w-full items-start justify-between gap-2 p-3 text-left transition hover:bg-accent/50 ${
                        active?.id === i.id ? "bg-accent/60" : ""
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{i.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(i.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Badge variant="secondary" className="shrink-0 capitalize">
                        {i.kind}
                      </Badge>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardContent className="p-4">
            {!active ? (
              <p className="text-sm text-muted-foreground">Select an item to preview.</p>
            ) : (
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold">{active.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {new Date(active.createdAt).toLocaleString()} · {active.kind}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button size="sm" variant="ghost" onClick={exportItem}>
                      <Download className="mr-1 h-3.5 w-3.5" /> Export
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteHistoryItem(active.id);
                        setSelected(null);
                        toast.success("Deleted");
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5 text-destructive" /> Delete
                    </Button>
                  </div>
                </div>
                <pre className="max-h-[520px] overflow-auto whitespace-pre-wrap rounded-lg border bg-muted/40 p-4 font-mono text-sm leading-relaxed">
                  {active.content}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
