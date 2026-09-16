import React, { useState } from "react";
import { IssueItem, IssueSeverity } from "../types";
import { ShieldAlert, AlertTriangle, Info, CheckCircle2, ArrowRight, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface IssueCardsListProps {
  issues: IssueItem[];
}

type FilterSeverity = "all" | IssueSeverity;

export const IssueCardsList: React.FC<IssueCardsListProps> = ({ issues }) => {
  const [activeFilter, setActiveFilter] = useState<FilterSeverity>("all");

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

  const filteredIssues =
    activeFilter === "all"
      ? [...criticals, ...majors, ...minors]
      : issues.filter((i) => i.severity === activeFilter);

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
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

        <Badge variant="outline" className="text-xs font-mono self-start sm:self-auto">
          {issues.length} {issues.length === 1 ? "issue" : "issues"} total
        </Badge>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs" role="toolbar" aria-label="Filter issues by severity">
        <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
          <Filter className="h-3 w-3" /> Filter:
        </span>
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          aria-pressed={activeFilter === "all"}
          className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
            activeFilter === "all"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          All ({issues.length})
        </button>
        {criticals.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter("critical")}
            aria-pressed={activeFilter === "critical"}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              activeFilter === "critical"
                ? "bg-destructive text-destructive-foreground shadow-sm"
                : "bg-destructive/10 text-destructive hover:bg-destructive/20"
            }`}
          >
            Critical ({criticals.length})
          </button>
        )}
        {majors.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter("major")}
            aria-pressed={activeFilter === "major"}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              activeFilter === "major"
                ? "bg-amber-500 text-black shadow-sm font-semibold"
                : "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20"
            }`}
          >
            Major ({majors.length})
          </button>
        )}
        {minors.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveFilter("minor")}
            aria-pressed={activeFilter === "minor"}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 ${
              activeFilter === "minor"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
            }`}
          >
            Minor ({minors.length})
          </button>
        )}
      </div>

      {/* Semantic List of Issues */}
      <ul
        role="list"
        aria-label="Detected prompt issues list"
        className="space-y-3.5 pt-1 list-none p-0 m-0"
      >
        {filteredIssues.map((issue) => {
          let badgeColor = "bg-amber-500/10 text-amber-500 border-amber-500/30";
          let icon = <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" aria-hidden="true" />;
          let borderLeft = "border-l-4 border-l-amber-500";

          if (issue.severity === "critical") {
            badgeColor = "bg-destructive/10 text-destructive border-destructive/30";
            icon = <ShieldAlert className="h-4 w-4 text-destructive shrink-0" aria-hidden="true" />;
            borderLeft = "border-l-4 border-l-destructive";
          } else if (issue.severity === "minor") {
            badgeColor = "bg-blue-500/10 text-blue-500 border-blue-500/30";
            icon = <Info className="h-4 w-4 text-blue-500 shrink-0" aria-hidden="true" />;
            borderLeft = "border-l-4 border-l-blue-500";
          }

          return (
            <li
              role="listitem"
              key={issue.id}
              className={`bg-secondary/40 border border-border/60 rounded-xl p-4 space-y-3 ${borderLeft}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  {icon}
                  <h4 className="text-sm font-display font-bold text-foreground">
                    {issue.title || "Unspecified Issue"}
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
                  <p className="text-muted-foreground leading-normal">
                    {issue.problem || "The prompt contains ambiguous or incomplete instructions."}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-semibold text-foreground block uppercase text-[10px] tracking-wider text-muted-foreground">
                    Why does it matter?
                  </span>
                  <p className="text-muted-foreground leading-normal">
                    {issue.whyItMatters || "This can degrade the quality and accuracy of the generated AI output."}
                  </p>
                </div>

                <div className="space-y-1 bg-card/60 p-2.5 rounded-lg border border-border/40">
                  <span className="font-semibold text-primary block uppercase text-[10px] tracking-wider flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" aria-hidden="true" /> How to fix:
                  </span>
                  <p className="text-foreground font-medium leading-normal">
                    {issue.suggestion || "Provide more explicit constraints and target expectations."}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
