import { WalletChip } from "./components/WalletChip";
import { DeployStrip } from "./components/DeployStrip";
import { PulseScreen } from "./components/PulseScreen";
import { useMidnightWallet } from "./hooks/useMidnightWallet";
import { getDeployment } from "./lib/contractClient";

function App() {
  const wallet = useMidnightWallet();
  const deployment = getDeployment();

  return (
    <div className="h-screen flex flex-col bg-bone">
      <div className="flex items-center justify-between px-4 py-3 border-b-4 border-void">
        <span className="font-display text-lg font-bold text-void tracking-tight">MURMUR</span>
        <WalletChip
          status={wallet.status}
          address={wallet.address}
          walletName={wallet.walletName}
          error={wallet.error}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
        />
      </div>

      <PulseScreen walletApi={wallet.walletApi} walletConnected={wallet.status === "connected"} />

      <DeployStrip deployment={deployment} />
    </div>
  );
}

export default App;
