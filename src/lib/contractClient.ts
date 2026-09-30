// contractClient.ts — the single place the UI submits a transaction.
// Not a local ledger simulator. See docs/USAGE.md "Going from stub to
// live calls" for wiring this to a real deployed contract.

import deployedContract from "../../deployed_contract.json";
import { WalletApi } from "./midnightWallet";
import { findDeployedContract } from "@midnight-ntwrk/midnight-js-contracts";
import { CompiledMurmurContractContract, createMurmurPrivateState } from "./murmur-contract/index";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";

export interface DeploymentInfo {
  network: string;
  address: string | null;
}

export function getDeployment(): DeploymentInfo {
  return { network: deployedContract.network, address: deployedContract.address };
}

export function isDeployed(): boolean {
  return Boolean(deployedContract.address);
}

export interface SubmitResponseParams {
  wallet: WalletApi;
  respondentSecret: string;
  response: number;
}

export interface TxResult {
  txHash: string;
  explorerUrl: string;
}

export async function submitResponse(params: SubmitResponseParams): Promise<TxResult> {
  if (!isDeployed()) {
    throw new Error("No contract is deployed yet. Run `compact compile`, deploy to Preprod, and fill in deployed_contract.json.");
  }
  
  const contractAddress = deployedContract.address!;
  
  // Convert secret from string to Uint8Array (32 bytes)
  const encoder = new TextEncoder();
  const secretBytes = new Uint8Array(32);
  const encoded = encoder.encode(params.respondentSecret);
  secretBytes.set(encoded.slice(0, 32));
  
  // Create an open-access Merkle Path for guest users.
  // We deployed with an empty root to allow an open pulse check.
  const guestAccessPath = {
    leaf: secretBytes,
    path: Array.from({ length: 10 }, () => new Uint8Array(32)), // 10 levels
    directions: Array.from({ length: 10 }, () => false) // all left
  };

  // Get service URLs from wallet
  let serviceUris;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyWallet = params.wallet as any;
  if (typeof anyWallet.getConfiguration === 'function') {
    try {
      const config = await anyWallet.getConfiguration();
      serviceUris = {
        nodeUri: config.substrateNodeUri,
        indexerUri: config.indexerUri,
        proverServerUri: config.proverServerUri || 'http://127.0.0.1:9999',
      };
    } catch (e) {
      console.error("Error calling getConfiguration on wallet:", e);
    }
  } else if (typeof anyWallet.serviceUriConfig === 'function') {
    try {
      serviceUris = await anyWallet.serviceUriConfig();
    } catch (e) {
      console.error("Error calling serviceUriConfig on wallet:", e);
    }
  }

  if (!serviceUris) {
    const errMsg = "Connected wallet did not provide service URIs. Ensure Lace or 1AM is configured for Preprod.";
    console.error(errMsg, anyWallet);
    throw new Error(errMsg);
  }

  const providers = {
    publicDataProvider: indexerPublicDataProvider(serviceUris.indexerUri, serviceUris.indexerUri.replace(/^http/, 'ws')),
    zkConfigProvider: new FetchZkConfigProvider(window.location.origin, window.fetch.bind(window)),
    proofProvider: httpClientProofProvider(serviceUris.proverServerUri, new FetchZkConfigProvider(window.location.origin, window.fetch.bind(window))),
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'murmur-state',
      privateStoragePasswordProvider: () => "guest-pass123",
      accountId: "guest-session",
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletProvider: params.wallet as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    midnightProvider: params.wallet as any,
  };

  const initialPrivateState = createMurmurPrivateState(secretBytes, guestAccessPath);
  providers.privateStateProvider.setContractAddress(contractAddress);
  
  const deployed = await findDeployedContract(providers, {
    contractAddress,
    compiledContract: CompiledMurmurContractContract,
    privateStateId: "murmur",
    initialPrivateState,
  });

  const txData = await deployed.callTx.submitResponse(params.response);

  return {
    txHash: txData.public.txHash,
    explorerUrl: `https://preprod.midnight.network/transaction/${txData.public.txHash}`,
  };
}
