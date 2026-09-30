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
  const { setNetworkId } = await import("@midnight-ntwrk/midnight-js-network-id");
  setNetworkId("preprod");

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

  let shieldedCoinPk = "0000000000000000000000000000000000000000000000000000000000000000";
  let shieldedEncPk = "0000000000000000000000000000000000000000000000000000000000000000";
  try {
    if (typeof anyWallet.getShieldedAddresses === 'function') {
      const addresses = await anyWallet.getShieldedAddresses();
      const first = Array.isArray(addresses) ? addresses[0] : addresses;
      if (first?.shieldedCoinPublicKey) shieldedCoinPk = first.shieldedCoinPublicKey;
      if (first?.shieldedEncryptionPublicKey) shieldedEncPk = first.shieldedEncryptionPublicKey;
    }
  } catch (e) {
    console.warn("Could not retrieve shielded addresses:", e);
  }

  const walletProvider = {
    getCoinPublicKey: () => shieldedCoinPk,
    getEncryptionPublicKey: () => shieldedEncPk,
    balanceTx: async (tx: { serialize: () => Uint8Array }) => {
      const { toHex, fromHex } = await import("@midnight-ntwrk/midnight-js-utils");
      const { Transaction } = await import("@midnight-ntwrk/midnight-js-protocol/ledger");
      const serializedTx = toHex(tx.serialize());
      if (typeof anyWallet.balanceUnsealedTransaction === 'function') {
        const received = await anyWallet.balanceUnsealedTransaction(serializedTx);
        return Transaction.deserialize('signature', 'proof', 'binding', fromHex(received.tx));
      }
      throw new Error("Wallet does not support balanceUnsealedTransaction");
    }
  };

  const midnightProvider = {
    submitTx: async (tx: { serialize: () => Uint8Array }) => {
      const { toHex } = await import("@midnight-ntwrk/midnight-js-utils");
      const txHex = toHex(tx.serialize());
      if (typeof anyWallet.submitTransaction === 'function') {
        const res = await anyWallet.submitTransaction(txHex);
        let returnedId = '';
        if (typeof res === 'string' && res.length > 0) {
          returnedId = res;
        } else if (res && typeof res === 'object') {
          returnedId = res.txHash || res.hash || res.id || '';
        }
        return returnedId;
      }
      throw new Error("Wallet does not support submitTransaction");
    }
  };

  const providers = {
    publicDataProvider: indexerPublicDataProvider(serviceUris.indexerUri, serviceUris.indexerUri.replace(/^http/, 'ws')),
    zkConfigProvider: new FetchZkConfigProvider(window.location.origin, window.fetch.bind(window)),
    proofProvider: httpClientProofProvider(serviceUris.proverServerUri, new FetchZkConfigProvider(window.location.origin, window.fetch.bind(window))),
    privateStateProvider: levelPrivateStateProvider({
      privateStateStoreName: 'murmur-state',
      privateStoragePasswordProvider: () => "mUrMuR-gUeSt-pAsSwOrD-94bX2pL",
      accountId: "guest-session",
    }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    walletProvider: walletProvider as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    midnightProvider: midnightProvider as any,
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
