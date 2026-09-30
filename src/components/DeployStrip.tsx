import { DeploymentInfo } from "../lib/contractClient";

export function DeployStrip({ deployment }: { deployment: DeploymentInfo }) {
  const deployed = Boolean(deployment.address);
  return (
    <div
      className={`w-full border-t-4 border-void px-4 py-2 font-mono text-[11px] font-bold ${deployed ? "bg-acid text-void" : "bg-void text-bone"}`}
    >
      {deployed
        ? `LIVE ON ${deployment.network.toUpperCase()} · ${deployment.address!.slice(0, 8)}…${deployment.address!.slice(-6)}`
        : "NOT YET DEPLOYED TO PREPROD — NO SIMULATED LEDGER. SEE docs/USAGE.md"}
    </div>
  );
}
