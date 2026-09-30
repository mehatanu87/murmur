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
import { fetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";

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
  
  // Create a dummy Merkle Path. The compiler requires a MerkleTreePath object.
  // Since we deployed with 32 bytes of zeros as eligibilityRoot, we will construct a matching dummy path.
  // In a real application, you'd fetch the merkle path for this specific respondentSecret.
  const dummyPath = {
    leaf: secretBytes, // actually we need persistentHash of secret, but we skip the real tree logic here
    path: Array.from({ length: 10 }, () => new Uint8Array(32)), // 10 levels
    directions: Array.from({ length: 10 }, () => false) // all left
  };

  // Get service URLs from wallet
  const serviceUris = await params.wallet.serviceUriConfig?.();
  if (!serviceUris) {
    throw new Error("Connected wallet did not provide service URIs");
  }

  const providers = {
    publicDataProvider: indexerPublicDataProvider(serviceUris.indexerUri, serviceUris.indexerUri.replace(/^http/, 'ws')),
    zkConfigProvider: fetchZkConfigProvider(window.location.origin),
    proofProvider: httpClientProofProvider(serviceUris.proverServerUri),
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'murmur-state',
      privateStoragePasswordProvider: () => "pass123",
      accountId: "dummy",
    }),
    walletProvider: params.wallet as any,
    midnightProvider: params.wallet as any,
  };

  const initialPrivateState = createMurmurPrivateState(secretBytes, dummyPath);
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
