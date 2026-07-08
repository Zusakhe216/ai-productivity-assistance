import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Download, FileText, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { summarizeMeeting } from "@/lib/ai.functions";
import { saveHistoryItem } from "@/lib/storage";

export const Route = createFileRoute("/_app/meetings")({
  component: MeetingsPage,
});

const SAMPLE = `Attendees: Sarah, Priya, Marcus, Lin
- Sarah: launch delayed 2 weeks due to QA findings
- Priya: 3 critical bugs; will assign owners today
- Marcus: marketing to shift email drip to align with new date
- Lin: legal review completed; needs updated screenshots by Fri
- Next meeting Tue 10am to confirm go/no-go`;

function MeetingsPage() {
  const fn = useServerFn(summarizeMeeting);
  const [notes, setNotes] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (notes.trim().length < 10) {
      toast.error("Please paste at least a few lines of meeting notes.");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: { notes } });
      setOutput(res.text);
    } catch (e) {
      console.error(e);
      toast.error("Could not summarize. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!output.trim()) return;
    saveHistoryItem({
      kind: "meeting",
      title: output.split("\n").find((l) => l.trim())?.replace(/^#+\s*/, "") || "Meeting minutes",
      content: output,
    });
    toast.success("Saved to history");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        icon={<FileText className="h-5 w-5" />}
        title="Meeting Notes Summarizer"
        description="Turn raw meeting notes into structured, professional minutes."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Raw notes</CardTitle>
            <Button size="sm" variant="ghost" onClick={() => setNotes(SAMPLE)}>
              Try a sample
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              className="min-h-[380px]"
              placeholder="Paste your meeting notes here…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button
              onClick={run}
              disabled={loading}
              className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-95"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {loading ? "Summarizing…" : "Generate minutes"}
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Structured minutes (editable)</CardTitle>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                disabled={!output}
                onClick={() => {
                  navigator.clipboard.writeText(output);
                  toast.success("Copied");
                }}
              >
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={!output}
                onClick={() => {
                  const blob = new Blob([output], { type: "text/markdown" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "meeting-minutes.md";
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                <Download className="mr-1 h-3.5 w-3.5" /> Export
              </Button>
              <Button size="sm" onClick={save} disabled={!output}>
                <Save className="mr-1 h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[380px] font-mono text-sm leading-relaxed"
              placeholder="Your professionally formatted meeting minutes will appear here."
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
