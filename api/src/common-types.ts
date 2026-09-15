/**
 * ShadowPoll common types and abstractions.
 *
 * @module
 */

import { type MidnightProviders } from '@midnight-ntwrk/midnight-js-types';
import { type FoundContract } from '@midnight-ntwrk/midnight-js-contracts';
import type { ShadowPollPrivateState, Contract, Witnesses } from '@shadowpoll/contract';

export const shadowPollPrivateStateKey = 'shadowPollPrivateState';
export type PrivateStateId = typeof shadowPollPrivateStateKey;

/**
 * The private states consumed throughout the application.
 *
 * @public
 */
export type PrivateStates = {
  readonly shadowPollPrivateState: ShadowPollPrivateState;
};

/**
 * Represents a ShadowPoll contract and its private state.
 *
 * @public
 */
export type ShadowPollContract = Contract<ShadowPollPrivateState, Witnesses<ShadowPollPrivateState>>;

/**
 * The keys of the circuits exported from {@link ShadowPollContract}.
 *
 * @public
 */
export type ShadowPollCircuitKeys = Exclude<keyof ShadowPollContract['impureCircuits'], number | symbol>;

/**
 * The providers required by {@link ShadowPollContract}.
 *
 * @public
 */
export type ShadowPollProviders = MidnightProviders<ShadowPollCircuitKeys, PrivateStateId, ShadowPollPrivateState>;

/**
 * A {@link ShadowPollContract} that has been deployed to the network.
 *
 * @public
 */
export type DeployedShadowPollContract = FoundContract<ShadowPollContract>;

/**
 * The derived combination of public (ledger) state and private state.
 */
export type ShadowPollDerivedState = {
  readonly question: string;
  readonly yesVotes: bigint;
  readonly noVotes: bigint;

  /**
   * Whether the current private identity has already voted, derived by
   * hashing the local secret ID and checking it against the public
   * `voted` nullifier set.
   */
  readonly hasVoted: boolean;

  /** Whether the poll has been closed - `castVote` rejects once this is true. */
  readonly closed: boolean;

  /**
   * Whether the current private identity is the poll's creator, derived by
   * hashing the local secret ID (in the creator hash domain) and comparing
   * it against the public `creatorNullifier` - never disclosed to anyone
   * else, including other users of this same API instance.
   */
  readonly isCreator: boolean;
};
