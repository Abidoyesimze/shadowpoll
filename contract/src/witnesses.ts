import { WitnessContext } from '@midnight-ntwrk/compact-runtime';
import { Ledger } from './managed/shadowpoll/contract/index.js';

export type ShadowPollPrivateState = {
  readonly secretId: Uint8Array;
  readonly choice: boolean;
};

export const createShadowPollPrivateState = (secretId: Uint8Array, choice: boolean): ShadowPollPrivateState => ({
  secretId,
  choice,
});

export const witnesses = {
  mySecretId: ({
    privateState,
  }: WitnessContext<Ledger, ShadowPollPrivateState>): [ShadowPollPrivateState, Uint8Array] => [
    privateState,
    privateState.secretId,
  ],

  myChoice: ({ privateState }: WitnessContext<Ledger, ShadowPollPrivateState>): [ShadowPollPrivateState, boolean] => [
    privateState,
    privateState.choice,
  ],
};
