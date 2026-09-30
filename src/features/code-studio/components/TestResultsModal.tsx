import React, { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Trophy, Sparkles, Clock, ArrowRight } from "lucide-react";
import { ExecutionResult, CodingChallenge } from "../types";
import { triggerConfetti } from "@/features/games/services/confettiEffect";

interface TestResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ExecutionResult | null;
  challenge: CodingChallenge | null;
  onNextChallenge?: () => void;
}

export const TestResultsModal: React.FC<TestResultsModalProps> = ({
  isOpen,
  onClose,
  result,
  challenge,
  onNextChallenge,
}) => {
  const allPassed = Boolean(
    result &&
      result.totalTests &&
      result.testsPassed === result.totalTests &&
      result.totalTests > 0
  );

  useEffect(() => {
    if (isOpen && allPassed) {
      triggerConfetti({ particleCount: 90, spread: 75 });
    }
  }, [isOpen, allPassed]);

  if (!result) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[92vw] sm:max-w-lg p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-card/95 backdrop-blur-2xl border border-border/60 shadow-2xl text-left max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
            {allPassed ? (
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </span>
            ) : (
              <span className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 border border-red-500/40 flex items-center justify-center">
                <XCircle className="w-5 h-5" />
              </span>
            )}
            <div>
              <DialogTitle className="text-base sm:text-lg font-black text-foreground">
                {allPassed ? "🎉 Challenge Completed!" : "Test Suite Incomplete"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                {allPassed
                  ? `Passed all ${result.totalTests} test cases for ${challenge?.title || "Challenge"}.`
                  : `Passed ${result.testsPassed} of ${result.totalTests} tests. Review failing cases below.`}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Detailed Test Results Table */}
        <div className="my-3 space-y-2 font-mono text-xs">
          {result.testResults?.map((tc, idx) => (
            <div
              key={tc.testId || idx}
              className={`p-3 rounded-xl border transition-all ${
                tc.passed
                  ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                  : "bg-red-500/5 border-red-500/30 text-red-400"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5 font-sans font-bold">
                <span className="flex items-center gap-1.5 text-xs text-foreground">
                  {tc.passed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  )}
                  Test Case #{idx + 1}
                </span>

                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {tc.executionTimeMs} ms
                </span>
              </div>

              <div className="space-y-1 text-[11px] bg-background/60 p-2 rounded-lg border border-border/40 font-mono text-foreground/90">
                <div>
                  <span className="text-muted-foreground">Input: </span>
                  <span className="text-cyan-300">{tc.input}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Expected: </span>
                  <span className="text-emerald-300">{tc.expected}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Actual: </span>
                  <span className={tc.passed ? "text-emerald-300" : "text-red-400 font-bold"}>
                    {tc.actual}
                  </span>
                </div>
                {tc.error && (
                  <div className="text-red-400 pt-1 border-t border-border/30 text-[10px]">
                    Error: {tc.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={onClose} className="cursor-pointer text-xs">
            Keep Coding
          </Button>

          {allPassed && onNextChallenge && (
            <Button
              size="sm"
              onClick={() => {
                onClose();
                onNextChallenge();
              }}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold gap-1 cursor-pointer text-xs"
            >
              <span>Next Problem</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
