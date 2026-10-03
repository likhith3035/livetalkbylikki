import { describe, it, expect, vi } from "vitest";
import {
  normalizeJavaCode,
  getRemoteCompilerConfig,
  parseRemoteExecutionResponse,
  executeRemoteCode,
} from "../features/code-studio/services/remoteCompilerService";

describe("Remote Compiler Service", () => {
  it("maps languages to verified Wandbox compilers", () => {
    const cppCfg = getRemoteCompilerConfig("cpp");
    expect(cppCfg).toBeDefined();
    expect(cppCfg?.compiler).toBe("gcc-head");
    expect(cppCfg?.displayName).toContain("C++");

    const pyCfg = getRemoteCompilerConfig("python");
    expect(pyCfg).toBeDefined();
    expect(pyCfg?.compiler).toContain("cpython");

    const javaCfg = getRemoteCompilerConfig("java");
    expect(javaCfg).toBeDefined();
    expect(javaCfg?.compiler).toContain("openjdk");

    const sqlCfg = getRemoteCompilerConfig("sql");
    expect(sqlCfg).toBeDefined();
    expect(sqlCfg?.compiler).toContain("sqlite");

    const jsCfg = getRemoteCompilerConfig("javascript");
    expect(jsCfg).toBeNull(); // JavaScript runs client-side
  });

  it("normalizes Java public class to class to prevent prog.java file mismatch error", () => {
    const rawJava = `
      import java.util.*;
      public class Main {
        public static void main(String[] args) {
          System.out.println("Hello");
        }
      }
    `;
    const normalized = normalizeJavaCode(rawJava);
    expect(normalized).not.toContain("public class Main");
    expect(normalized).toContain("class Main");
    expect(normalized).toContain("public static void main");
  });

  it("parses successful remote execution response into structured logs", () => {
    const mockResponse = {
      status: "0",
      compiler_message: "",
      program_output: "Hello World\nLine 2\n",
      program_error: "",
    };

    const parsed = parseRemoteExecutionResponse(mockResponse, "GCC 14.2 (C++20)", 150);
    expect(parsed.success).toBe(true);
    expect(parsed.error).toBeNull();
    expect(parsed.exitCode).toBe(0);
    expect(parsed.logs.some((l) => l.message === "Hello World")).toBe(true);
    expect(parsed.logs.some((l) => l.message === "Line 2")).toBe(true);
    expect(parsed.logs.some((l) => l.type === "success")).toBe(true);
  });

  it("parses compilation failure with diagnostic error lines", () => {
    const mockFailure = {
      status: "1",
      compiler_error: "prog.cpp:4:5: error: 'cout' was not declared in this scope",
      program_output: "",
      program_error: "",
    };

    const parsed = parseRemoteExecutionResponse(mockFailure, "GCC 14.2 (C++20)", 80);
    expect(parsed.success).toBe(false);
    expect(parsed.error).toContain("Compilation Error");
    expect(parsed.exitCode).toBe(1);
    expect(parsed.logs.some((l) => l.message.includes("'cout' was not declared"))).toBe(true);
  });

  it("handles network failure gracefully", async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error("Network offline"));
    const originalFetch = globalThis.fetch;
    globalThis.fetch = mockFetch as any;

    try {
      const result = await executeRemoteCode("print(1)", "python");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Network offline");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
