/*
 * Adapted from midnightntwrk/example-bboard.
 * Copyright (C) Midnight Foundation
 * SPDX-License-Identifier: Apache-2.0
 * Licensed under the Apache License, Version 2.0 (the "License");
 * You may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { UnshieldedTokenType } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { type FacadeState, type WalletFacade } from '@midnight-ntwrk/wallet-sdk-facade';
import * as Rx from 'rxjs';

import { FaucetClient, type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';
import { Logger } from 'pino';
import { UnshieldedAddress } from '@midnight-ntwrk/wallet-sdk-address-format';
import { getNetworkId } from '@midnight-ntwrk/midnight-js-network-id';

// Derived structurally from WalletFacade itself, rather than imported from
// @midnight-ntwrk/wallet-sdk-shielded / -unshielded-wallet directly - npm's
// dependency resolution can hoist a different (newer) copy of those packages
// than the one WalletFacade's own nested dependency actually uses, which
// makes directly-imported types structurally incompatible with what
// `wallet.shielded` / `wallet.unshielded` actually return at runtime.
type UnwrapObservable<T> = T extends Rx.Observable<infer U> ? U : never;
type FacadeShielded = WalletFacade['shielded'];
type FacadeUnshielded = WalletFacade['unshielded'];
type ShieldedWalletState = UnwrapObservable<FacadeShielded['state']>;
type UnshieldedWalletState = UnwrapObservable<FacadeUnshielded['state']>;

export const getInitialShieldedState = async (logger: Logger, wallet: FacadeShielded): Promise<ShieldedWalletState> => {
  logger.info('Getting initial state of wallet...');
  return Rx.firstValueFrom(wallet.state);
};

export const getInitialUnshieldedState = async (
  logger: Logger,
  wallet: FacadeUnshielded,
): Promise<UnshieldedWalletState> => {
  logger.info('Getting initial state of wallet...');
  return Rx.firstValueFrom(wallet.state);
};

const isProgressStrictlyComplete = (progress: unknown): boolean => {
  if (!progress || typeof progress !== 'object') {
    return false;
  }
  const candidate = progress as { isStrictlyComplete?: unknown };
  if (typeof candidate.isStrictlyComplete !== 'function') {
    return false;
  }
  return (candidate.isStrictlyComplete as () => boolean)();
};

// Deploying a contract only needs the unshielded (NIGHT) balance to be
// confirmed. A brand-new wallet with zero shielded/dust history can sit at
// shielded/dust progress.isStrictlyComplete() === false indefinitely, so
// requiring those lanes here would make this never resolve. DUST balance
// (needed to pay fees) is checked separately, directly, in generate-dust.ts.
const isFacadeStateSynced = (state: FacadeState): boolean => isProgressStrictlyComplete(state.unshielded.progress);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Polls wallet.state() with a fresh, short-lived subscription each tick
// instead of holding one long-lived subscription open. In practice, staying
// subscribed to wallet.state() for many minutes while waiting on a slow
// network causes state objects to pile up somewhere in the wallet SDK's
// internal pipeline (RxJS operators, or the SDK's own state history) faster
// than they're released, eventually crashing the process with an OOM. Each
// poll here is independently garbage-collectable once its tick is done.
const pollWalletState = async <T>(
  logger: Logger,
  poll: () => Promise<T | undefined>,
  pollIntervalMs: number,
  maxWaitMs: number,
  description: string,
): Promise<T> => {
  const deadline = Date.now() + maxWaitMs;
  while (Date.now() < deadline) {
    const result = await poll();
    if (result !== undefined) {
      return result;
    }
    await sleep(pollIntervalMs);
  }
  throw new Error(`Timed out after ${maxWaitMs}ms waiting for: ${description}`);
};

export const syncWallet = async (
  logger: Logger,
  wallet: WalletFacade,
  pollIntervalMs = 3_000,
  maxWaitMs = 20 * 60_000,
) => {
  logger.info('Syncing wallet...');

  const state = await pollWalletState(
    logger,
    async () => {
      const state = await Rx.firstValueFrom(wallet.state());
      const shieldedSynced = isProgressStrictlyComplete(state.shielded.state.progress);
      const unshieldedSynced = isProgressStrictlyComplete(state.unshielded.progress);
      const dustSynced = isProgressStrictlyComplete(state.dust.state.progress);
      logger.debug(
        `Wallet synced state poll: { shielded=${shieldedSynced}, unshielded=${unshieldedSynced}, dust=${dustSynced} }`,
      );
      return shieldedSynced && unshieldedSynced && dustSynced ? state : undefined;
    },
    pollIntervalMs,
    maxWaitMs,
    'wallet sync (shielded + unshielded + dust)',
  );

  logger.info('Sync complete');
  const shieldedBalances = state.shielded.balances || {};
  const unshieldedBalances = state.unshielded.balances || {};
  const dustBalances = state.dust.balance(new Date(Date.now())) || 0n;
  logger.info(
    `Wallet balances after sync - Shielded: ${JSON.stringify(shieldedBalances)}, Unshielded: ${JSON.stringify(unshieldedBalances)}, Dust: ${dustBalances}`,
  );
  return state;
};

export const waitForUnshieldedFunds = async (
  logger: Logger,
  wallet: WalletFacade,
  env: EnvironmentConfiguration,
  tokenType: UnshieldedTokenType,
  fundFromFaucet = false,
  pollIntervalMs = 3_000,
  maxWaitMs = 20 * 60_000,
): Promise<UnshieldedWalletState> => {
  const initialState = await getInitialUnshieldedState(logger, wallet.unshielded);
  // initialState.address is nominally the address-format package's nested
  // copy under wallet-sdk-facade, structurally identical to (but a distinct
  // TS identity from) the top-level UnshieldedAddress imported below - same
  // npm-dedup identity split as the WalletFacade-derived types above.
  const unshieldedAddress = UnshieldedAddress.codec.encode(
    getNetworkId(),
    initialState.address as unknown as Parameters<typeof UnshieldedAddress.codec.encode>[1],
  );
  logger.info(`Using unshielded address: ${unshieldedAddress.toString()} waiting for funds...`);
  if (fundFromFaucet && env.faucet) {
    logger.info('Requesting tokens from faucet...');
    try {
      await new FaucetClient(env.faucet, logger).requestTokens(unshieldedAddress.toString());
    } catch (e) {
      // Don't let a faucet outage/network blip block us when the wallet
      // may already be funded - fall through to the balance check below.
      logger.warn(`Faucet request failed, continuing anyway: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  const initialBalance = initialState.balances[tokenType.raw];
  if (initialBalance === undefined || initialBalance === 0n) {
    logger.info(`Your wallet initial balance is: 0 (not yet initialized)`);
    logger.info(`Waiting to receive tokens...`);
    const state = await pollWalletState(
      logger,
      async () => {
        const state = await Rx.firstValueFrom(wallet.state());
        const balance = state.unshielded.balances[tokenType.raw] ?? 0n;
        logger.debug(`Wallet funds poll: { synced=${isFacadeStateSynced(state)}, balance=${balance.toString()} }`);
        return isFacadeStateSynced(state) && balance > 0n ? state : undefined;
      },
      pollIntervalMs,
      maxWaitMs,
      'unshielded funds to arrive',
    );

    logger.info('Sync complete');
    const shieldedBalances = state.shielded.balances || {};
    const unshieldedBalances = state.unshielded.balances || {};
    const dustBalances = state.dust.balance(new Date(Date.now())) || 0n;
    logger.info(
      `Wallet balances after sync - Shielded: ${JSON.stringify(shieldedBalances)}, Unshielded: ${JSON.stringify(unshieldedBalances)}, Dust: ${dustBalances}`,
    );
    return state.unshielded;
  }
  return initialState;
};
