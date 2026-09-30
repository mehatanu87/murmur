// contractClient.ts — the single place the UI submits a transaction.
// Not a local ledger simulator. See docs/USAGE.md "Going from stub to
// live calls" for wiring this to a real deployed contract.

import deployedContract from "../../deployed_contract.json";
import { WalletApi } from "./midnightWallet";

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

export async function submitResponse(_params: SubmitResponseParams): Promise<TxResult> {
  if (!isDeployed()) {
    throw new Error("No contract is deployed yet. Run `compact compile`, deploy to Preprod, and fill in deployed_contract.json.");
  }
  throw new Error("Live circuit call not wired yet — see docs/USAGE.md 'Going from stub to live calls' for the exact steps once you've pinned a Midnight.js SDK version.");
}
