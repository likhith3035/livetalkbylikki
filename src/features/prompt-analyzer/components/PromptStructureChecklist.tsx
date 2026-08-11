import React from "react";
import { ElementCheck } from "../types";
import { CheckCircle2, XCircle, MinusCircle, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface PromptStructureChecklistProps {
  checklist: ElementCheck[];
}

export const PromptStructureChecklist: React.FC<PromptStructureChecklistProps> = ({ checklist }) => {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-border/40 pb-3">
        <div className="h-7 w-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold">
          <CheckSquare className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
            Prompt Structure Checklist
          </h3>
          <p className="text-xs text-muted-foreground">
            Visual inspection of foundational prompt engineering components.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {checklist.map((item) => {
          let icon = <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />;
          let badgeVariant = "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
          let label = "Present";

          if (item.status === "missing") {
            icon = <XCircle className="h-4 w-4 text-destructive shrink-0" />;
            badgeVariant = "bg-destructive/10 text-destructive border-destructive/30";
            label = "Missing";
          } else if (item.status === "optional") {
            icon = <MinusCircle className="h-4 w-4 text-amber-500 shrink-0" />;
            badgeVariant = "bg-amber-500/10 text-amber-500 border-amber-500/30";
            label = "Optional";
          } else if (item.status === "not_relevant") {
            icon = <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />;
            badgeVariant = "bg-secondary text-muted-foreground border-border/50";
            label = "N/A";
          }

          return (
            <div
              key={item.element}
              className="p-3 rounded-xl bg-secondary/30 border border-border/40 space-y-1.5 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-xs font-bold text-foreground truncate">{item.element}</span>
                {icon}
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <Badge variant="outline" className={`py-0 px-1.5 font-semibold uppercase ${badgeVariant}`}>
                  {label}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
