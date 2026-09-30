export async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function randomSecretHex(bytes = 16): string {
  const arr = crypto.getRandomValues(new Uint8Array(bytes));
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Matches `persistentHash<Bytes<32>>(secret)`. */
export function deriveRespondentLeaf(secret: string): Promise<string> {
  return sha256Hex(secret);
}

/** Matches the circuit's `[secret, hash(pulseQuestion)]`. */
export async function derivePulseNullifier(secret: string, pulseQuestion: string): Promise<string> {
  const qHash = await sha256Hex(pulseQuestion);
  return sha256Hex(`${secret}:${qHash}`);
}

export function isValidResponse(response: number): boolean {
  return Number.isInteger(response) && response >= 1 && response <= 5;
}
