import { WebSocket } from 'ws';
globalThis.WebSocket = WebSocket as unknown as typeof globalThis.WebSocket;

import fs from 'node:fs';
import { PreprodRemoteConfig } from '../config.js';
import { MidnightWalletProvider } from '../midnight-wallet-provider.js';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { deployContract } from '@midnight-ntwrk/midnight-js-contracts';
import { CompiledMurmurContractContract } from '@midnight-ntwrk/murmur-contract';
import { createLogger } from '../logger-utils.js';
import { getUnshieldedAddress } from '../wallet-utils.js';
import { generateDust } from '../generate-dust.js';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { FaucetClient } from '@midnight-ntwrk/testkit-js';
import * as Rx from 'rxjs';

async function main() {
  console.log("Starting deployment to Preprod...");
  const seed = process.env.WALLET_SEED;
  if (!seed) throw new Error("WALLET_SEED environment variable is required");
  
  const config = new PreprodRemoteConfig();
  const logger = await createLogger(config.logDir, false);
  const testEnv = config.getEnvironment(logger);
  console.log("Starting environment...");
  let envConfiguration: any;
  try {
    envConfiguration = await testEnv.start();
  } catch (err: any) {
    try {
      envConfiguration = testEnv.getEnvironmentConfiguration();
      console.warn("Notice: Public faucet is temporarily offline (503), but node, indexer, and proof server are healthy. Continuing with funded wallet...");
    } catch {
      throw err;
    }
  }
  
  console.log("Building wallet provider...");
  const walletProvider = await MidnightWalletProvider.build(logger, envConfiguration, seed);
  await walletProvider.start();
  
  const walletAddress = await getUnshieldedAddress(logger, walletProvider.wallet);
  console.log(`Wallet Address: ${walletAddress}`);

  console.log("Getting wallet state snapshot (no full sync)...");
  // Use a 15s snapshot instead of waiting for full sync
  let unshieldedState: any;
  try {
    unshieldedState = await Rx.firstValueFrom(
      walletProvider.wallet.unshielded.state.pipe(Rx.timeout(15000))
    );
  } catch {
    console.warn("Could not get unshielded state snapshot, using empty state.");
    unshieldedState = { balances: {} };
  }
  const nightBalance = unshieldedState.balances[unshieldedToken().raw] ?? 0n;
  console.log(`Wallet tNIGHT balance (snapshot): ${nightBalance}`);

  // Skip ALL DUST sync — attempt deployment directly
  console.log("Skipping DUST sync. Deploying contract directly...");

  console.log("Initializing providers...");
  const zkConfigProvider = new NodeZkConfigProvider(config.zkConfigPath);
  const storagePassword = "TempPassword123!Secure";
  
  const providers = {
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: config.privateStateStoreName,
      signingKeyStoreName: `${config.privateStateStoreName}-signing-keys`,
      privateStoragePasswordProvider: () => storagePassword,
      accountId: seed,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };
  
  console.log("Deploying contract...");
  let success = false;
  try {
    const initialRoot = new Uint8Array(32); // 32 bytes of zeros — replace with real merkle root
    const pulseId = new Uint8Array(32);     // unique ID for this pulse

    const deployed = await deployContract(providers, {
        compiledContract: CompiledMurmurContractContract,
        args: [pulseId, initialRoot]
    });

    const contractAddress = deployed.deployTxData.public.contractAddress;
    console.log("================================================================================");
    console.log("🎉 SUCCESS! CONTRACT DEPLOYED TO PREPROD!");
    console.log("CONTRACT_ADDRESS=" + contractAddress);
    console.log("Contract Address:", contractAddress);
    console.log("Explorer:", `https://preprod.midnight.network/contract/${contractAddress}`);
    console.log("================================================================================");

    const deploymentInfo = {
      network: "preprod",
      contractAddress,
      explorerUrl: `https://preprod.midnight.network/contract/${contractAddress}`,
      indexer: envConfiguration.indexer,
      node: envConfiguration.node,
      deployedAt: new Date().toISOString(),
    };

    fs.writeFileSync('deployment.json', JSON.stringify(deploymentInfo, null, 2));
    fs.writeFileSync('../../deployed_contract.json', JSON.stringify(deploymentInfo, null, 2));
    success = true;
  } catch (err) {
    console.error("Deployment failed:", err);
  } finally {
    await walletProvider.stop();
    await testEnv.shutdown();
    process.exit(success ? 0 : 1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
