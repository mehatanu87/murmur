import { useState } from "react";
import { randomSecretHex, isValidResponse } from "../lib/crypto";
import { submitResponse, isDeployed } from "../lib/contractClient";
import { WalletApi } from "../lib/midnightWallet";

type Phase = "no-secret" | "ready" | "proving" | "done" | "error";

const QUESTION = "How did demo day feel?";
const SCALE = [1, 2, 3, 4, 5];

export function PulseScreen({
  walletApi, walletConnected,
}: { walletApi: WalletApi | null; walletConnected: boolean }) {
  const [secret, setSecret] = useState<string | null>(null);
  const [response, setResponse] = useState<number | null>(null);
  const [phase, setPhase] = useState<Phase>("no-secret");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function handleGenerateSecret() {
    setSecret(randomSecretHex());
    setPhase("ready");
  }

  async function handleSubmit() {
    if (!secret || !walletApi || response === null || !isValidResponse(response)) return;
    setPhase("proving");
    setErrorMsg(null);
    try {
      await submitResponse({ wallet: walletApi, respondentSecret: secret, response });
      setPhase("done");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "The response could not be submitted.");
      setPhase("error");
    }
  }

  if (phase === "done") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-5xl sm:text-6xl font-bold text-void leading-none">SEEN.</p>
        <p className="font-display text-5xl sm:text-6xl font-bold text-magenta leading-none mt-2">NOT KNOWN.</p>
        <p className="font-mono text-sm text-void/60 mt-6 max-w-sm">
          Your response is counted in the tally. Nothing on-chain ties it back to you.
        </p>
      </div>
    );
  }

  if (!walletConnected) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <p className="font-display text-3xl sm:text-4xl font-bold text-void max-w-md leading-tight">{QUESTION}</p>
        <p className="font-mono text-sm text-void/60 mt-6">Connect a wallet above to answer.</p>
      </div>
    );
  }

  if (phase === "no-secret") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <p className="font-display text-3xl sm:text-4xl font-bold text-void max-w-md leading-tight">{QUESTION}</p>
        <p className="font-mono text-xs text-void/60 max-w-sm">
          Generate a respondent secret first — it's made on your device
          and never leaves it. It must match a leaf already on the
          pulse's eligibility root to count for real. See docs/USAGE.md.
        </p>
        <button
          onClick={handleGenerateSecret}
          className="brutal-press font-mono text-sm font-bold text-bone bg-void border-4 border-void px-6 py-3 shadow-brutal"
        >
          GENERATE SECRET
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-8">
      <p className="font-display text-3xl sm:text-4xl font-bold text-void max-w-md leading-tight">{QUESTION}</p>

      <div className="flex gap-3 sm:gap-4">
        {SCALE.map((n) => (
          <button
            key={n}
            onClick={() => setResponse(n)}
            className={`brutal-press font-display text-2xl font-bold w-14 h-14 sm:w-16 sm:h-16 border-4 border-void shadow-brutal-sm ${
              response === n ? "bg-magenta text-bone" : "bg-bone text-void"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {errorMsg && (
        <p className="font-mono text-xs text-magenta border-2 border-magenta bg-magenta/5 px-3 py-2 max-w-sm">{errorMsg}</p>
      )}

      <button
        onClick={handleSubmit}
        disabled={response === null || phase === "proving" || !isDeployed()}
        className="brutal-press font-mono text-sm font-bold text-void bg-acid border-4 border-void px-8 py-3 shadow-brutal disabled:opacity-40 disabled:cursor-not-allowed"
        title={!isDeployed() ? "No contract deployed yet" : undefined}
      >
        {phase === "proving" ? "GENERATING PROOF…" : "SUBMIT"}
      </button>
    </div>
  );
}
