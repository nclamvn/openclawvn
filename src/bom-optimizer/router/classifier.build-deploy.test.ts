import { describe, it, expect } from "vitest";
import { classifyTask } from "./classifier.js";

describe("classifyTask — build/deploy/workflow types", () => {
  // ── BUILD ─────────────────────────────────────────────────

  it("classifies 'build cho toi landing page ban ca phe' as build", () => {
    const result = classifyTask("build cho toi landing page ban ca phe");
    expect(result.type).toBe("build");
  });

  it("classifies 'tạo landing page' as build", () => {
    const result = classifyTask("tạo landing page");
    expect(result.type).toBe("build");
  });

  it("classifies 'xây dựng dashboard cho dự án' as build", () => {
    const result = classifyTask("xây dựng dashboard cho dự án");
    expect(result.type).toBe("build");
  });

  it("classifies 'scaffold a next.js app' as build", () => {
    const result = classifyTask("scaffold a next.js app");
    expect(result.type).toBe("build");
  });

  it("classifies 'generate app for my portfolio' as build", () => {
    const result = classifyTask("generate app for my portfolio");
    expect(result.type).toBe("build");
  });

  it("classifies '/build saas' as build", () => {
    const result = classifyTask("/build saas");
    expect(result.type).toBe("build");
  });

  it("classifies 'vibecode-build a web app' as build", () => {
    const result = classifyTask("vibecode-build a web app");
    expect(result.type).toBe("build");
  });

  it("classifies 'build a react app for e-commerce' as build", () => {
    const result = classifyTask("build a react app for e-commerce");
    expect(result.type).toBe("build");
  });

  // ── DEPLOY ────────────────────────────────────────────────

  it("classifies 'deploy to vercel' as deploy", () => {
    const result = classifyTask("deploy to vercel");
    expect(result.type).toBe("deploy");
  });

  it("classifies 'triển khai lên vercel' as deploy", () => {
    const result = classifyTask("triển khai lên vercel");
    expect(result.type).toBe("deploy");
  });

  it("classifies 'ship to production' as deploy", () => {
    const result = classifyTask("ship to production server");
    expect(result.type).toBe("deploy");
  });

  it("classifies 'publish to netlify' as deploy", () => {
    const result = classifyTask("publish to netlify");
    expect(result.type).toBe("deploy");
  });

  it("classifies 'push to prod' as deploy", () => {
    const result = classifyTask("push to prod");
    expect(result.type).toBe("deploy");
  });

  it("classifies 'deploy with docker' as deploy", () => {
    const result = classifyTask("deploy with docker");
    expect(result.type).toBe("deploy");
  });

  // ── WORKFLOW ──────────────────────────────────────────────

  it("classifies 'set up a workflow' as workflow", () => {
    const result = classifyTask("set up a workflow for CI/CD");
    expect(result.type).toBe("workflow");
  });

  it("classifies 'automate the pipeline' as workflow", () => {
    const result = classifyTask("automate the pipeline");
    expect(result.type).toBe("workflow");
  });

  it("classifies 'orchestrate a multi-step process' as workflow", () => {
    const result = classifyTask("orchestrate a multi-step process");
    expect(result.type).toBe("workflow");
  });

  it("classifies 'quy trình xử lý dữ liệu' as workflow", () => {
    const result = classifyTask("quy trình xử lý dữ liệu tự động");
    expect(result.type).toBe("workflow");
  });

  // ── REGRESSION ────────────────────────────────────────────

  it("still classifies 'write an email' as writing (regression)", () => {
    const result = classifyTask("write an email to my boss");
    expect(result.type).toBe("writing");
  });

  it("still classifies 'hi' as conversation (regression)", () => {
    const result = classifyTask("hi");
    expect(result.type).toBe("conversation");
  });

  it("still classifies 'translate this' as translation (regression)", () => {
    const result = classifyTask("translate this to Vietnamese: hello");
    expect(result.type).toBe("translation");
  });

  it("still classifies 'summarize' as summarization (regression)", () => {
    const result = classifyTask("summarize this article");
    expect(result.type).toBe("summarization");
  });

  it("still classifies coding request as coding (regression)", () => {
    const result = classifyTask("write a Python function for binary search");
    expect(result.type).toBe("coding");
  });
});
