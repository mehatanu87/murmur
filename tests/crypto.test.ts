import { describe, it, expect } from "vitest";
import { deriveRespondentLeaf, derivePulseNullifier, isValidResponse, randomSecretHex } from "../src/lib/crypto";

describe("deriveRespondentLeaf", () => {
  it("is deterministic for the same secret", async () => {
    const a = await deriveRespondentLeaf("respondent-a-secret");
    const b = await deriveRespondentLeaf("respondent-a-secret");
    expect(a).toBe(b);
  });

  it("produces a 64-character hex digest", async () => {
    expect(await deriveRespondentLeaf("respondent-a-secret")).toMatch(/^[0-9a-f]{64}$/);
  });

  it("differs for different secrets", async () => {
    const a = await deriveRespondentLeaf("respondent-a-secret");
    const b = await deriveRespondentLeaf("respondent-b-secret");
    expect(a).not.toBe(b);
  });
});

describe("derivePulseNullifier", () => {
  it("is deterministic for the same secret and question", async () => {
    const a = await derivePulseNullifier("respondent-a-secret", "How was demo day?");
    const b = await derivePulseNullifier("respondent-a-secret", "How was demo day?");
    expect(a).toBe(b);
  });

  it("differs between questions for the same respondent (nullifier is question-scoped)", async () => {
    const a = await derivePulseNullifier("respondent-a-secret", "How was demo day?");
    const b = await derivePulseNullifier("respondent-a-secret", "How was the workshop?");
    expect(a).not.toBe(b);
  });

  it("differs between respondents for the same question", async () => {
    const a = await derivePulseNullifier("respondent-a-secret", "How was demo day?");
    const b = await derivePulseNullifier("respondent-b-secret", "How was demo day?");
    expect(a).not.toBe(b);
  });

  it("never contains the raw secret as a substring", async () => {
    const n = await derivePulseNullifier("respondent-a-secret", "How was demo day?");
    expect(n).not.toContain("respondent-a-secret");
  });
});

describe("isValidResponse", () => {
  it("accepts integers 1 through 5", () => {
    for (let r = 1; r <= 5; r++) expect(isValidResponse(r)).toBe(true);
  });

  it("rejects 0 and 6", () => {
    expect(isValidResponse(0)).toBe(false);
    expect(isValidResponse(6)).toBe(false);
  });

  it("rejects non-integer input", () => {
    expect(isValidResponse(3.5)).toBe(false);
  });
});

describe("randomSecretHex", () => {
  it("produces distinct secrets across calls", () => {
    expect(randomSecretHex()).not.toBe(randomSecretHex());
  });

  it("produces a hex string of the expected length", () => {
    expect(randomSecretHex(16)).toMatch(/^[0-9a-f]{32}$/);
  });
});
