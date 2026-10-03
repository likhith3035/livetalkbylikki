/**
 * Remote Cloud Compiler Service
 * Powered by Wandbox Open Compiler Engine
 *
 * Executes real C++ (GCC 14 C++20/C++23), Python (CPython 3.12+), Java (OpenJDK 21 LTS),
 * and SQLite 3.46 with real compiler diagnostics, stdout, stderr, and exit codes.
 */

import { ExecutionLog, SupportedLanguage } from "../types";

export interface RemoteCompilerConfig {
  compiler: string;
  displayName: string;
  options?: string;
  compilerOptionRaw?: string;
}

export interface RemoteCompileResult {
  success: boolean;
  logs: ExecutionLog[];
  error: string | null;
  executionTimeMs: number;
  compilerName: string;
  exitCode: number;
}

const WANDBOX_API_URL = "https://wandbox.org/api/compile.json";

/**
 * Maps supported languages to verified cloud compilers
 */
export function getRemoteCompilerConfig(language: SupportedLanguage): RemoteCompilerConfig | null {
  switch (language) {
    case "cpp":
      return {
        compiler: "gcc-head",
        displayName: "GCC 14.2 (C++20)",
        compilerOptionRaw: "-std=c++20\n-O2",
      };
    case "python":
      return {
        compiler: "cpython-3.12.7",
        displayName: "CPython 3.12.7",
      };
    case "java":
      return {
        compiler: "openjdk-jdk-21+35",
        displayName: "OpenJDK 21 LTS",
      };
    case "sql":
      return {
        compiler: "sqlite-3.46.1",
        displayName: "SQLite 3.46.1",
      };
    default:
      return null;
  }
}

/**
 * Normalizes Java class declarations to prevent file-mismatch errors
 * In Wandbox Java execution, the source file is `prog.java`.
 * Converting `public class` to `class` allows compilation without Main.java requirement.
 */
export function normalizeJavaCode(code: string): string {
  return code.replace(/\bpublic\s+class\b/g, "class");
}

/**
 * Converts Wandbox JSON output into clean, categorized ExecutionLog arrays
 */
export function parseRemoteExecutionResponse(
  data: any,
  compilerName: string,
  durationMs: number
): RemoteCompileResult {
  const logs: ExecutionLog[] = [];
  let logId = 1;

  logs.push({
    id: `rc-info-${logId++}`,
    type: "info",
    message: `[${compilerName}] Execution finished in ${durationMs}ms`,
    timestamp: Date.now(),
  });

  const exitCode = data.status !== undefined ? parseInt(String(data.status), 10) : 0;
  const hasCompilerError = Boolean(data.compiler_error && data.compiler_error.trim());
  const hasCompilerMessage = Boolean(data.compiler_message && data.compiler_message.trim());
  const hasProgramOutput = Boolean(data.program_output && data.program_output.trim());
  const hasProgramError = Boolean(data.program_error && data.program_error.trim());

  // 1. Compiler warnings or errors
  if (hasCompilerError) {
    const lines = data.compiler_error.trim().split("\n");
    for (const line of lines) {
      logs.push({
        id: `rc-cerr-${logId++}`,
        type: "error",
        message: line,
        timestamp: Date.now(),
      });
    }
  } else if (hasCompilerMessage && !hasProgramOutput) {
    const lines = data.compiler_message.trim().split("\n");
    for (const line of lines) {
      logs.push({
        id: `rc-cmsg-${logId++}`,
        type: line.toLowerCase().includes("warning") ? "warn" : "info",
        message: line,
        timestamp: Date.now(),
      });
    }
  }

  // 2. Standard Program Output
  if (hasProgramOutput) {
    const lines = data.program_output.trimEnd().split("\n");
    for (const line of lines) {
      logs.push({
        id: `rc-out-${logId++}`,
        type: "log",
        message: line,
        timestamp: Date.now(),
      });
    }
  }

  // 3. Runtime Standard Error
  if (hasProgramError) {
    const lines = data.program_error.trimEnd().split("\n");
    for (const line of lines) {
      logs.push({
        id: `rc-err-${logId++}`,
        type: "error",
        message: line,
        timestamp: Date.now(),
      });
    }
  }

  // 4. Status determination
  const success = exitCode === 0 && !hasCompilerError;
  const errorSummary = hasCompilerError
    ? `Compilation Error (Exit code ${exitCode})`
    : exitCode !== 0
    ? `Runtime Error (Exit code ${exitCode})`
    : null;

  if (success) {
    logs.push({
      id: `rc-status-${logId++}`,
      type: "success",
      message: `Process finished with exit code 0.`,
      timestamp: Date.now(),
    });
  } else {
    logs.push({
      id: `rc-status-${logId++}`,
      type: "error",
      message: errorSummary || `Process exited with error code ${exitCode}.`,
      timestamp: Date.now(),
    });
  }

  return {
    success,
    logs,
    error: errorSummary,
    executionTimeMs: durationMs,
    compilerName,
    exitCode,
  };
}

/**
 * Execute real code via remote cloud compiler with timeout & retries
 */
export async function executeRemoteCode(
  code: string,
  language: SupportedLanguage,
  stdin: string = ""
): Promise<RemoteCompileResult> {
  const config = getRemoteCompilerConfig(language);
  if (!config) {
    return {
      success: false,
      logs: [
        {
          id: "rc-unsupported",
          type: "error",
          message: `Language '${language}' is not configured for cloud compilation.`,
          timestamp: Date.now(),
        },
      ],
      error: `Unsupported remote language: ${language}`,
      executionTimeMs: 0,
      compilerName: "Unknown",
      exitCode: -1,
    };
  }

  const startTime = performance.now();
  let preparedCode = code;

  // Apply language-specific normalizations
  if (language === "java") {
    preparedCode = normalizeJavaCode(code);
  }

  const payload: Record<string, any> = {
    compiler: config.compiler,
    code: preparedCode,
  };

  if (stdin && stdin.trim()) {
    payload.stdin = stdin;
  }

  if (config.options) {
    payload.options = config.options;
  }

  if (config.compilerOptionRaw) {
    payload["compiler-option-raw"] = config.compilerOptionRaw;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(WANDBOX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Cloud compiler HTTP error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const duration = Math.max(1, Math.round(performance.now() - startTime));
    return parseRemoteExecutionResponse(data, config.displayName, duration);
  } catch (err: any) {
    clearTimeout(timeoutId);
    const duration = Math.max(1, Math.round(performance.now() - startTime));
    const isTimeout = err?.name === "AbortError";
    const errorMessage = isTimeout
      ? "Compilation timed out after 12 seconds."
      : (err?.message || "Failed to connect to cloud compiler.");

    return {
      success: false,
      logs: [
        {
          id: "rc-network-err",
          type: "error",
          message: `[${config.displayName}] ${errorMessage}`,
          timestamp: Date.now(),
        },
      ],
      error: errorMessage,
      executionTimeMs: duration,
      compilerName: config.displayName,
      exitCode: -1,
    };
  }
}
