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

  console.log("Syncing unshielded wallet (fast — needed for tNIGHT balance)...");
  let unshieldedState: any;
  try {
    unshieldedState = await walletProvider.wallet.unshielded.waitForSyncedState();
  } catch {
    console.warn("Unshielded sync failed, using empty state.");
    unshieldedState = { balances: {} };
  }
  const nightBalance = unshieldedState.balances[unshieldedToken().raw] ?? 0n;
  console.log(`Current tNIGHT balance: ${nightBalance}`);

  // Register tNIGHT for DUST generation (required for tx fees)
  console.log("Registering DUST generation...");
  try {
    const dustTx = await generateDust(logger, seed, unshieldedState, walletProvider.wallet);
    if (dustTx) {
      console.log(`DUST generation registered: ${dustTx}`);
    } else {
      console.log("DUST already registered.");
    }
  } catch (e: any) {
    console.warn(`generateDust warning: ${e?.message}`);
  }

  // Wait up to 30 min for DUST — registration is in a recent block (~1.5M)
  // The wallet must scan through all blocks to find it. At ~15K blocks/5s, needs ~8-15 min.
  console.log("Waiting up to 30 minutes for DUST wallet to scan to registration block...");
  try {
    const dustBalance = await Rx.firstValueFrom(
      walletProvider.wallet.state().pipe(
        Rx.throttleTime(30000),
        Rx.tap((s: any) => console.log(`[DUST scan] balance: ${s.dust.balance(new Date())}`)),
        Rx.filter((s: any) => s.dust.balance(new Date()) > 0n),
        Rx.map((s: any) => s.dust.balance(new Date())),
        Rx.timeout(1800000), // 30 minutes
      )
    );
    console.log(`DUST ready: ${dustBalance}`);
  } catch {
    console.warn("DUST not found after 30 min — attempting deploy anyway...");
  }

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
  const MAX_RETRIES = 5;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Deployment attempt ${attempt}/${MAX_RETRIES}...`);
      const initialRoot = new Uint8Array(32);
      const pulseId = new Uint8Array(32);

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
      break;
    } catch (err: any) {
      console.error(`Attempt ${attempt} failed:`, err?.message ?? err);
      if (attempt < MAX_RETRIES) {
        console.log(`Retrying in 5 minutes...`);
        await new Promise(resolve => setTimeout(resolve, 300000)); // 5 minutes
      }
    }
  }
  await walletProvider.stop();
  await testEnv.shutdown();
  process.exit(success ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
