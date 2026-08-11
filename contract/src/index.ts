import { CompiledContract } from '@midnight-ntwrk/midnight-js-protocol/compact-js';

export * from './managed/shadowpoll/contract/index.js';
export * from './witnesses';

import * as CompiledShadowPollContract from './managed/shadowpoll/contract/index.js';
import * as Witnesses from './witnesses';

export const CompiledShadowPollContractContract = CompiledContract.make<
  CompiledShadowPollContract.Contract<Witnesses.ShadowPollPrivateState>
>('ShadowPoll', CompiledShadowPollContract.Contract<Witnesses.ShadowPollPrivateState>).pipe(
  CompiledContract.withWitnesses(Witnesses.witnesses),
  CompiledContract.withCompiledFileAssets('./managed/shadowpoll'),
);
