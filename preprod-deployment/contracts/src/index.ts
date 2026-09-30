import { CompiledContract } from "@midnight-ntwrk/midnight-js-protocol/compact-js";

export * from "./managed/murmur/contract/index.js";
export * from "./witnesses.js";

import * as CompiledMurmurContract from "./managed/murmur/contract/index.js";
import * as Witnesses from "./witnesses.js";

class ContractWrapper extends CompiledMurmurContract.Contract<unknown, unknown> {
  constructor() {
    super(Witnesses.witnesses);
  }
}

export const CompiledMurmurContractContract = CompiledContract.make(
  "murmur",
  ContractWrapper as unknown as new () => InstanceType<typeof ContractWrapper>
).pipe(
  CompiledContract.withCompiledFileAssets("./managed/murmur")
) as unknown as CompiledContract<unknown>;
