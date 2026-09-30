// eslint-disable-next-line @typescript-eslint/no-require-imports
import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/murmur/contract/index.js";
export * from "./witnesses.js";

import * as CompiledMurmurContract from "./managed/murmur/contract/index.js";
import * as Witnesses from "./witnesses.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class ContractWrapper extends CompiledMurmurContract.Contract<any, any> {
  constructor() {
    super(Witnesses.witnesses);
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
