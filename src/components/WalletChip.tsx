import { WalletStatus } from "../lib/midnightWallet";

function truncate(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export function WalletChip({
  status, address, walletName, error, onConnect, onDisconnect,
}: {
  status: WalletStatus;
  address: string | null;
  walletName: string | null;
  error?: string | null;
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
    <div className="flex flex-col items-end relative">
      <button
        onClick={onConnect}
        disabled={status === "connecting"}
        className="brutal-press font-mono text-xs font-bold text-void bg-acid border-3 border-void px-3 py-2 shadow-brutal-sm disabled:opacity-50"
        style={{ borderWidth: 3 }}
      >
        {status === "connecting" ? "CONNECTING…" : "CONNECT WALLET"}
      </button>
      {error && (
        <div className="absolute top-full right-0 mt-2 p-2 bg-magenta text-bone text-[10px] font-mono border-2 border-void w-64 text-right shadow-brutal-sm z-50">
          {error}
        </div>
      )}
    </div>
  );
}
