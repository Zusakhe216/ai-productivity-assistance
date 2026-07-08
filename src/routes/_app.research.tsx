import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Download, Save, Search, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { researchTopic } from "@/lib/ai.functions";
import { saveHistoryItem } from "@/lib/storage";

export const Route = createFileRoute("/_app/research")({
  component: ResearchPage,
});

function ResearchPage() {
  const fn = useServerFn(researchTopic);
  const [form, setForm] = useState({
    topic: "",
    audience: "General professional",
    length: "Medium",
    style: "Analytical",
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (form.topic.trim().length < 3) {
      toast.error("Please enter a research topic.");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: form });
      setOutput(res.text);
    } catch (e) {
      console.error(e);
      toast.error("Could not run research.");
    } finally {
      setLoading(false);
    }
  }
  function save() {
    if (!output.trim()) return;
    saveHistoryItem({
      kind: "research",
      title: form.topic || "Research report",
      content: output,
      meta: form,
    });
    toast.success("Saved to history");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        icon={<Search className="h-5 w-5" />}
        title="AI Research Assistant"
        description="Generate structured, professional reports on any workplace topic."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Research brief</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <F label="Topic">
              <Input
                placeholder="e.g. Impact of AI on customer support"
                value={form.topic}
                onChange={(e) => setForm({ ...form, topic: e.target.value })}
              />
            </F>
            <F label="Audience">
              <Input
                value={form.audience}
                onChange={(e) => setForm({ ...form, audience: e.target.value })}
              />
            </F>
            <F label="Report length">
              <Select value={form.length} onValueChange={(v) => setForm({ ...form, length: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Short", "Medium", "Long"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <F label="Writing style">
              <Select value={form.style} onValueChange={(v) => setForm({ ...form, style: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Analytical", "Executive", "Academic", "Journalistic"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </F>
            <Button
              onClick={run}
              disabled={loading}
              className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-95"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {loading ? "Researching…" : "Generate report"}
            </Button>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Report (editable)</CardTitle>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="ghost" disabled={!output} onClick={() => { navigator.clipboard.writeText(output); toast.success("Copied"); }}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" disabled={!output} onClick={() => {
                const blob = new Blob([output], { type: "text/markdown" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a"); a.href = url; a.download = `${form.topic || "report"}.md`; a.click(); URL.revokeObjectURL(url);
              }}>
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
              <Button size="sm" onClick={save} disabled={!output}>
                <Save className="mr-1 h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[460px] font-mono text-sm leading-relaxed"
              placeholder="Your AI research report will appear here."
              value={output}
              onChange={(e) => setOutput(e.target.value)}
            />
          </CardContent>
        </Card>
      </div>
      <ResponsibleAiNotice />
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
