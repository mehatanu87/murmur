import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";
import { Contract } from "./managed/murmur/contract/index.js";
import { witnesses } from "./witnesses.js";

export * from "./managed/murmur/contract/index.js";
export * from "./witnesses.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ContractWrapper extends Contract<any, any> {
  constructor() {
    super(witnesses);
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
