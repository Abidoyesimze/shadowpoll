/**
 * Provides types and utilities for working with ShadowPoll contracts.
 *
 * @packageDocumentation
 */

import * as ShadowPoll from '@shadowpoll/contract';
import { CompiledShadowPollContractContract } from '@shadowpoll/contract';

import { type ContractAddress } from '@midnight-ntwrk/midnight-js-protocol/compact-runtime';
import { type Logger } from 'pino';
import {
  type ShadowPollDerivedState,
  type ShadowPollContract,
  type ShadowPollProviders,
  type DeployedShadowPollContract,
  shadowPollPrivateStateKey,
} from './common-types.js';
import * as utils from './utils/index.js';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js-contracts';
import { combineLatest, map, tap, from, type Observable } from 'rxjs';
import { ShadowPollPrivateState, createShadowPollPrivateState } from '@shadowpoll/contract';

/**
 * An API for a deployed ShadowPoll contract.
 */
export interface DeployedShadowPollAPI {
  readonly deployedContractAddress: ContractAddress;
  readonly state$: Observable<ShadowPollDerivedState>;

  castVote: (choice: boolean) => Promise<void>;
  closePoll: () => Promise<void>;
}

/**
 * Provides an implementation of {@link DeployedShadowPollAPI} by adapting a deployed
 * ShadowPoll contract.
 *
 * @remarks
 * `ShadowPollPrivateState` holds a persistent `secretId` (which anonymously and
 * consistently identifies "this local wallet" to the contract, so it can be prevented
 * from voting twice) and a `choice`, which is only ever set locally, immediately before
 * a `castVote` call, and is never persisted or transmitted anywhere except as a single
 * disclosed boolean used to pick which public counter to increment.
 */
export class ShadowPollAPI implements DeployedShadowPollAPI {
  /** @internal */
  private constructor(
    public readonly deployedContract: DeployedShadowPollContract,
    private readonly providers: ShadowPollProviders,
    private readonly logger?: Logger,
  ) {
    this.deployedContractAddress = deployedContract.deployTxData.public.contractAddress;
    providers.privateStateProvider.setContractAddress(this.deployedContractAddress);
    this.state$ = combineLatest(
      [
        providers.publicDataProvider.contractStateObservable(this.deployedContractAddress, { type: 'latest' }).pipe(
          map((contractState) => ShadowPoll.ledger(contractState.data)),
          tap((ledgerState) =>
            logger?.trace({
              ledgerStateChanged: {
                ledgerState: {
                  yesVotes: ledgerState.yesVotes,
                  noVotes: ledgerState.noVotes,
                },
              },
            }),
          ),
        ),
        from(providers.privateStateProvider.get(shadowPollPrivateStateKey) as Promise<ShadowPollPrivateState>),
      ],
      (ledgerState, privateState) => {
        const nullifier = ShadowPoll.pureCircuits.nullifierFor(privateState.secretId);
        const creatorNullifier = ShadowPoll.pureCircuits.creatorNullifierFor(privateState.secretId);

        return {
          question: ledgerState.question,
          yesVotes: ledgerState.yesVotes,
          noVotes: ledgerState.noVotes,
          hasVoted: ledgerState.voted.member(nullifier),
          closed: ledgerState.closed,
          isCreator: Buffer.compare(creatorNullifier, ledgerState.creatorNullifier) === 0,
        };
      },
    );
  }

  /**
   * Gets the address of the current deployed contract.
   */
  readonly deployedContractAddress: ContractAddress;

  /**
   * Gets an observable stream of state changes based on the current public (ledger),
   * and private state data.
   */
  readonly state$: Observable<ShadowPollDerivedState>;

  /**
   * Casts a vote in the poll.
   *
   * @param choice The caller's raw vote (`true` for yes, `false` for no). This is stored
   * locally as private state and passed into the circuit as a witness. Only a nullifier
   * (proving "this identity hasn't voted yet") and the disclosed choice (used solely to
   * pick which public counter to increment) ever reach the ledger - the identity itself
   * never does.
   *
   * @remarks
   * This method can fail during local circuit execution if this identity has already voted.
   */
  async castVote(choice: boolean): Promise<void> {
    this.logger?.info('castingVote');

    const existing = (await this.providers.privateStateProvider.get(shadowPollPrivateStateKey)) as
      | ShadowPollPrivateState
      | null;
    const secretId = existing?.secretId ?? utils.randomBytes(32);
    await this.providers.privateStateProvider.set(shadowPollPrivateStateKey, createShadowPollPrivateState(secretId, choice));

    const txData = await this.deployedContract.callTx.castVote();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'castVote',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Permanently closes the poll, so `castVote` will reject any further votes.
   *
   * @remarks
   * This method can fail during local circuit execution if the current private identity
   * isn't the one that deployed this contract, or if the poll is already closed - in
   * either case, no transaction is submitted.
   */
  async closePoll(): Promise<void> {
    this.logger?.info('closingPoll');

    const txData = await this.deployedContract.callTx.closePoll();

    this.logger?.trace({
      transactionAdded: {
        circuit: 'closePoll',
        txHash: txData.public.txHash,
        blockHeight: txData.public.blockHeight,
      },
    });
  }

  /**
   * Deploys a new ShadowPoll contract to the network.
   *
   * @param providers The ShadowPoll providers.
   * @param question The public poll question to open with.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link ShadowPollAPI} instance that manages
   * the newly deployed {@link DeployedShadowPollContract}; or rejects with a deployment error.
   */
  static async deploy(providers: ShadowPollProviders, question: string, logger?: Logger): Promise<ShadowPollAPI> {
    logger?.info('deployContract');

    const deployedShadowPollContract = await deployContract(providers, {
      compiledContract: CompiledShadowPollContractContract,
      privateStateId: shadowPollPrivateStateKey,
      initialPrivateState: createShadowPollPrivateState(utils.randomBytes(32), false),
      args: [question],
    });

    logger?.trace({
      contractDeployed: {
        finalizedDeployTxData: deployedShadowPollContract.deployTxData.public,
      },
    });

    return new ShadowPollAPI(deployedShadowPollContract, providers, logger);
  }

  /**
   * Finds an already deployed ShadowPoll contract on the network, and joins it.
   *
   * @param providers The ShadowPoll providers.
   * @param contractAddress The contract address of the deployed ShadowPoll contract to
   * search for and join.
   * @param logger An optional 'pino' logger to use for logging.
   * @returns A `Promise` that resolves with a {@link ShadowPollAPI} instance that manages
   * the joined {@link DeployedShadowPollContract}; or rejects with an error.
   */
  static async join(providers: ShadowPollProviders, contractAddress: ContractAddress, logger?: Logger): Promise<ShadowPollAPI> {
    logger?.info({
      joinContract: {
        contractAddress,
      },
    });

    // getPrivateState() below reads from privateStateProvider, which requires
    // the provider to already be scoped to a contract address - normally set
    // by the ShadowPollAPI constructor, but that only runs after this whole
    // method returns. Set it explicitly first so the read doesn't throw.
    providers.privateStateProvider.setContractAddress(contractAddress);

    const deployedShadowPollContract = await findDeployedContract<ShadowPollContract>(providers, {
      contractAddress,
      compiledContract: CompiledShadowPollContractContract,
      privateStateId: shadowPollPrivateStateKey,
      initialPrivateState: await ShadowPollAPI.getPrivateState(providers),
    });

    logger?.trace({
      contractJoined: {
        finalizedDeployTxData: deployedShadowPollContract.deployTxData.public,
      },
    });

    return new ShadowPollAPI(deployedShadowPollContract, providers, logger);
  }

  private static async getPrivateState(providers: ShadowPollProviders): Promise<ShadowPollPrivateState> {
    const existingPrivateState = await providers.privateStateProvider.get(shadowPollPrivateStateKey);
    return existingPrivateState ?? createShadowPollPrivateState(utils.randomBytes(32), false);
  }
}

/**
 * A namespace that represents the exports from the `'utils'` sub-package.
 *
 * @public
 */
export * as utils from './utils/index.js';

export * from './common-types.js';
