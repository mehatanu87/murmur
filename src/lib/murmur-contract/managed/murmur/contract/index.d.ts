import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  respondentSecret(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
  respondentPath(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, { leaf: Uint8Array,
                                                                               path: { sibling: { field: bigint
                                                                                                },
                                                                                       goes_left: boolean
                                                                                     }[]
                                                                             }];
}

export type ImpureCircuits<PS> = {
  submitResponse(context: __compactRuntime.CircuitContext<PS>,
                 response_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closePulse(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  submitResponse(context: __compactRuntime.CircuitContext<PS>,
                 response_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closePulse(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  submitResponse(context: __compactRuntime.CircuitContext<PS>,
                 response_0: bigint): __compactRuntime.CircuitResults<PS, []>;
  closePulse(context: __compactRuntime.CircuitContext<PS>): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  responseTally: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  usedNullifiers: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  readonly eligibilityRoot: Uint8Array;
  readonly isOpen: boolean;
  readonly totalResponses: bigint;
  readonly pulseId: Uint8Array;
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               id_0: Uint8Array,
               root_0: Uint8Array): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
