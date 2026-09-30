import { Ledger } from "./managed/murmur/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";

export type MurmurPrivateState = {
  readonly respondentSecret: Uint8Array;
  readonly respondentPath: {
    leaf: Uint8Array;
    path: { sibling: { field: bigint }; goes_left: boolean }[];
  };
};

export const createMurmurPrivateState = (
  respondentSecret: Uint8Array,
  respondentPath: MurmurPrivateState["respondentPath"]
): MurmurPrivateState => ({
  respondentSecret,
  respondentPath,
});

export const witnesses = {
  respondentSecret: ({
    privateState,
  }: WitnessContext<Ledger, MurmurPrivateState>): [
    MurmurPrivateState,
    Uint8Array,
  ] => [privateState, privateState.respondentSecret],

  respondentPath: ({
    privateState,
  }: WitnessContext<Ledger, MurmurPrivateState>): [
    MurmurPrivateState,
    MurmurPrivateState["respondentPath"],
  ] => [privateState, privateState.respondentPath],
};
