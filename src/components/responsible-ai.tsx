import { AlertTriangle } from "lucide-react";

export function ResponsibleAiNotice({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`flex items-start gap-2 rounded-lg border bg-accent/40 p-3 text-xs text-muted-foreground ${
        compact ? "" : "sm:text-sm"
      }`}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      <p>
        <span className="font-medium text-foreground">Responsible AI: </span>
        AI-generated content may contain inaccuracies and should always be reviewed before
        professional use. Avoid entering confidential, personal, or sensitive business information.
      </p>
    </div>
  );
}
