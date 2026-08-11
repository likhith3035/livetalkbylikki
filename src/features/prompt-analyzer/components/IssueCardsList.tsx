import React from "react";
import { IssueItem } from "../types";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IssueCardsListProps {
  issues: IssueItem[];
}

export const IssueCardsList: React.FC<IssueCardsListProps> = ({ issues }) => {
  if (!issues || issues.length === 0) {
    return (
      <div className="bg-card border border-emerald-500/30 rounded-2xl p-6 shadow-xl flex items-center gap-4">
        <div className="h-10 w-10 rounded-full bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
          <CheckCircle2 className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-base font-display font-bold text-foreground">
            No Major Prompt Flaws Detected!
          </h3>
          <p className="text-xs text-muted-foreground">
            Your prompt has clear structure and no contradictory instructions or missing format rules.
          </p>
        </div>
      </div>
    );
  }

  const criticals = issues.filter((i) => i.severity === "critical");
  const majors = issues.filter((i) => i.severity === "major");
  const minors = issues.filter((i) => i.severity === "minor");

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-destructive/10 text-destructive flex items-center justify-center font-bold">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-display font-bold text-foreground">
              Mistake & Problem Analysis
            </h3>
            <p className="text-xs text-muted-foreground">
              Detected issues sorted by severity with actionable fixes.
            </p>
          </div>
        </div>

        <Badge variant="outline" className="text-xs font-mono">
          {issues.length} {issues.length === 1 ? "issue" : "issues"}
        </Badge>
      </div>

      <div className="space-y-3.5 pt-1">
        {[...criticals, ...majors, ...minors].map((issue) => {
          let badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/30";
          let icon = <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
          let borderLeft = "border-l-4 border-l-amber-500";

          if (issue.severity === "critical") {
            badgeColor = "bg-destructive/10 text-destructive border-destructive/30";
            icon = <ShieldAlert className="h-4 w-4 text-destructive shrink-0" />;
            borderLeft = "border-l-4 border-l-destructive";
          } else if (issue.severity === "minor") {
            badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/30";
            icon = <Info className="h-4 w-4 text-blue-500 shrink-0" />;
            borderLeft = "border-l-4 border-l-blue-500";
          }

          return (
            <div
              key={issue.id}
              className={`bg-secondary/40 border border-border/60 rounded-xl p-4 space-y-3 ${borderLeft}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <h4 className="text-sm font-display font-bold text-foreground">
                    {issue.title}
                  </h4>
                </div>
                <Badge variant="outline" className={`text-[10px] uppercase tracking-wider font-bold ${badgeColor}`}>
                  {issue.severity}
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs pt-1 border-t border-border/30">
                <div className="space-y-1">
                  <span className="font-semibold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                    What is wrong?
                  </span>
                  <p className="text-muted-foreground leading-normal">{issue.problem}</p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                    Why does it matter?
                  </span>
                  <p className="text-muted-foreground leading-normal">{issue.whyItMatters}</p>
                </div>

                <div className="space-y-1 bg-card/60 p-2.5 rounded-lg border border-border/40">
                  <span className="font-semibold text-primary block uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" /> How to fix:
                  </span>
                  <p className="text-foreground font-medium leading-normal">{issue.suggestion}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
