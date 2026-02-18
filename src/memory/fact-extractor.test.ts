import { describe, expect, it } from "vitest";

import { parseExtractionResponse } from "./fact-extractor.js";

describe("parseExtractionResponse", () => {
  const sessionId = "test-session-123";

  it("parses valid JSON array", () => {
    const response = `[
      {"category": "identity", "content": "Tên là Minh", "confidence": 1.0},
      {"category": "skill", "content": "Biết TypeScript", "confidence": 0.9}
    ]`;
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(2);
    expect(facts[0]?.category).toBe("identity");
    expect(facts[0]?.content).toBe("Tên là Minh");
    expect(facts[0]?.confidence).toBe(1.0);
    expect(facts[1]?.category).toBe("skill");
  });

  it("handles markdown code fences", () => {
    const response =
      '```json\n[{"category": "identity", "content": "Tên Minh", "confidence": 0.9}]\n```';
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(1);
    expect(facts[0]?.content).toBe("Tên Minh");
  });

  it("filters out confidence < 0.7", () => {
    const response = `[
      {"category": "identity", "content": "Tên Minh", "confidence": 1.0},
      {"category": "fact", "content": "Có thể ở Hà Nội", "confidence": 0.5}
    ]`;
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(1);
    expect(facts[0]?.content).toBe("Tên Minh");
  });

  it("filters out invalid categories", () => {
    const response = `[
      {"category": "identity", "content": "Tên Minh", "confidence": 0.9},
      {"category": "invalid_cat", "content": "Something", "confidence": 0.9}
    ]`;
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(1);
  });

  it("handles empty array response", () => {
    const facts = parseExtractionResponse("[]", sessionId);
    expect(facts).toEqual([]);
  });

  it("handles invalid JSON gracefully", () => {
    const facts = parseExtractionResponse("not valid json at all", sessionId);
    expect(facts).toEqual([]);
  });

  it("handles empty string", () => {
    const facts = parseExtractionResponse("", sessionId);
    expect(facts).toEqual([]);
  });

  it("handles JSON embedded in text", () => {
    const response = `Here are the extracted facts:\n[{"category": "identity", "content": "Tên Minh", "confidence": 0.9}]\nDone.`;
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(1);
  });

  it("handles malformed objects in array", () => {
    const response = `[
      {"category": "identity", "content": "Valid", "confidence": 0.9},
      {"category": "skill"},
      null,
      {"content": "Missing category", "confidence": 0.9},
      {"category": "fact", "content": "", "confidence": 0.9}
    ]`;
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(1);
    expect(facts[0]?.content).toBe("Valid");
  });

  it("sets correct source and timestamp", () => {
    const response = '[{"category": "identity", "content": "Tên Minh", "confidence": 0.9}]';
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts[0]?.source.sessionId).toBe("test-session-123");
    expect(facts[0]?.source.extractedAt).toBeTruthy();
    expect(facts[0]?.verified).toBe(false);
  });

  it("clamps confidence to [0, 1]", () => {
    const response = '[{"category": "identity", "content": "Test", "confidence": 1.5}]';
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts[0]?.confidence).toBe(1);
  });

  it("trims content whitespace", () => {
    const response = '[{"category": "identity", "content": "  Tên Minh  ", "confidence": 0.9}]';
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts[0]?.content).toBe("Tên Minh");
  });

  it("accepts all valid categories", () => {
    const categories = ["identity", "preference", "project", "relationship", "skill", "fact"];
    const items = categories.map((cat) => ({
      category: cat,
      content: `Test ${cat}`,
      confidence: 0.9,
    }));
    const response = JSON.stringify(items);
    const facts = parseExtractionResponse(response, sessionId);
    expect(facts.length).toBe(6);
  });
});
