import { WalletStatus } from "../lib/midnightWallet";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletChip({
  status, address, walletName, onConnect, onDisconnect,
}: {
  status: WalletStatus;
  address: string | null;
  walletName: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (status === "connected" && address) {
    return (
      <button
        onClick={onDisconnect}
        className="brutal-press font-mono text-xs font-bold text-void bg-bone border-3 border-void px-3 py-2 shadow-brutal-sm"
        style={{ borderWidth: 3 }}
      >
        {walletName ?? "WALLET"} · {truncate(address)}
      </button>
    );
  }
  return (
    <button
      onClick={onConnect}
      disabled={status === "connecting"}
      className="brutal-press font-mono text-xs font-bold text-void bg-acid border-3 border-void px-3 py-2 shadow-brutal-sm disabled:opacity-50"
      style={{ borderWidth: 3 }}
    >
      {status === "connecting" ? "CONNECTING…" : "CONNECT WALLET"}
    </button>
  );
}
