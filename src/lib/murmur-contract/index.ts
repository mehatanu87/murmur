import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import * as ContractModule from "./managed/murmur/contract/index.js";
import { witnesses } from "./witnesses.js";

export * from "./managed/murmur/contract/index.js";
export * from "./witnesses.js";

class ContractWrapper {
  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ContractClass = ContractModule.Contract || (ContractModule as any).default?.Contract;
    if (!ContractClass) {
      console.error("ContractModule keys:", Object.keys(ContractModule));
      throw new Error("Contract class not found in generated module.");
    }
    return new ContractClass(witnesses);
  }
}

export const CompiledMurmurContractContract = CompiledContract.make(
  "murmur",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ContractWrapper as any
).pipe(
  CompiledContract.withCompiledFileAssets("./managed/murmur")
// eslint-disable-next-line @typescript-eslint/no-explicit-any
) as any;
