import { Ledger } from "./managed/murmur/contract/index.js";
import { WitnessContext } from "@midnight-ntwrk/midnight-js-protocol/compact-runtime";
export type MurmurPrivateState = {
    readonly respondentSecret: Uint8Array;
    readonly respondentPath: any;
};
export declare const createMurmurPrivateState: (respondentSecret: Uint8Array, respondentPath: any) => MurmurPrivateState;
export declare const witnesses: {
    respondentSecret: ({ privateState, }: WitnessContext<Ledger, MurmurPrivateState>) => [MurmurPrivateState, Uint8Array];
    respondentPath: ({ privateState, }: WitnessContext<Ledger, MurmurPrivateState>) => [MurmurPrivateState, any];
};
