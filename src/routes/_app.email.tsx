import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Download, Mail, RefreshCw, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { ResponsibleAiNotice } from "@/components/responsible-ai";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { generateEmail } from "@/lib/ai.functions";
import { saveHistoryItem } from "@/lib/storage";

export const Route = createFileRoute("/_app/email")({
  component: EmailPage,
});

function EmailPage() {
  const fn = useServerFn(generateEmail);
  const [form, setForm] = useState({
    recipient: "",
    audience: "Client",
    subject: "",
    purpose: "",
    tone: "Professional",
    notes: "",
  });
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);

  async function run() {
    if (!form.recipient.trim() || !form.subject.trim() || !form.purpose.trim()) {
      toast.error("Please fill in recipient, subject, and purpose.");
      return;
    }
    setLoading(true);
    try {
      const res = await fn({ data: form });
      setOutput(res.text);
    } catch (e) {
      toast.error("Could not generate email. Please try again.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(output);
    toast.success("Copied to clipboard");
  }
  function download() {
    const blob = new Blob([output], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.subject || "email"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function save() {
    if (!output.trim()) return;
    saveHistoryItem({
      kind: "email",
      title: form.subject || "Untitled email",
      content: output,
      meta: form,
    });
    toast.success("Saved to history");
  }

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <PageHeader
        icon={<Mail className="h-5 w-5" />}
        title="Smart Email Generator"
        description="Draft polished professional emails in seconds."
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Email details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field label="Recipient">
              <Input
                placeholder="e.g. Sarah Chen"
                value={form.recipient}
                onChange={(e) => setForm({ ...form, recipient: e.target.value })}
              />
            </Field>
            <Field label="Audience">
              <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Client", "Manager", "Team Member", "Executive", "Vendor"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Subject">
              <Input
                placeholder="Project update — Q3 roadmap"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
              />
            </Field>
            <Field label="Purpose">
              <Textarea
                rows={3}
                placeholder="What's the goal of this email?"
                value={form.purpose}
                onChange={(e) => setForm({ ...form, purpose: e.target.value })}
              />
            </Field>
            <Field label="Tone">
              <Select value={form.tone} onValueChange={(v) => setForm({ ...form, tone: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Professional", "Formal", "Friendly", "Persuasive"].map((o) => (
                    <SelectItem key={o} value={o}>{o}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Additional notes">
              <Textarea
                rows={3}
                placeholder="Any specific points to include…"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </Field>
            <Button
              onClick={run}
              disabled={loading}
              className="w-full bg-gradient-brand text-white shadow-glow hover:opacity-95"
            >
              <Sparkles className="mr-1 h-4 w-4" />
              {loading ? "Generating…" : "Generate AI Email"}
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Draft (editable)</CardTitle>
            <div className="flex flex-wrap items-center gap-1">
              <Button size="sm" variant="ghost" onClick={copy} disabled={!output}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
              <Button size="sm" variant="ghost" onClick={run} disabled={loading}>
                <RefreshCw className="mr-1 h-3.5 w-3.5" /> Regenerate
              </Button>
              <Button size="sm" variant="ghost" onClick={download} disabled={!output}>
                <Download className="mr-1 h-3.5 w-3.5" /> Download
              </Button>
              <Button size="sm" onClick={save} disabled={!output}>
                <Save className="mr-1 h-3.5 w-3.5" /> Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Textarea
              className="min-h-[420px] font-mono text-sm leading-relaxed"
              placeholder="Your AI-generated email will appear here. You can edit it freely before sending."
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
