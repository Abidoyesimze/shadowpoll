// Builds the full ShadowPollProviders bundle for the browser: a public
// indexer connection (no wallet needed), IndexedDB-backed private state, ZK
// artifacts fetched from /managed (see scripts/copy-managed.mjs), and the
// wallet/submission halves bridged from the connected Lace extension.
// Mirrors cli/src/direct-deploy.ts, swapping the Node-specific providers for
// browser-compatible ones.
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { createProofProvider, type ProofProvider } from '@midnight-ntwrk/midnight-js-types';
import type { ShadowPollProviders, PrivateStateId } from '@shadowpoll/api';
import type { ShadowPollPrivateState } from '@shadowpoll/contract';

import { INDEXER_HTTP_URL, INDEXER_WS_URL, PROOF_SERVER_URL, USE_LOCAL_PROOF_SERVER, ZK_CONFIG_BASE_URL } from './env';
import { LaceWalletBridge } from './wallet-bridge';

export const buildShadowPollProviders = async (wallet: LaceWalletBridge): Promise<ShadowPollProviders> => {
  // FetchZkConfigProvider calls its fetch function as `this.fetchFunc(...)`,
  // which invokes it with the provider instance as `this` instead of
  // `window` - native fetch requires the correct receiver and throws
  // "Illegal invocation" otherwise. Passing an explicitly bound fetch avoids
  // relying on however cross-fetch's own default export happens to be bound.
  const zkConfigProvider = new FetchZkConfigProvider<'castVote'>(ZK_CONFIG_BASE_URL, window.fetch.bind(window));

  // Proving happens either against a proof server the visitor runs locally
  // (opt in, matches the CLI's setup), or - by default - delegated to the
  // connected wallet's own proving capability, so this frontend works for
  // any visitor with a compatible wallet installed and no local Docker setup.
  const proofProvider: ProofProvider = USE_LOCAL_PROOF_SERVER
    ? httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider)
    : createProofProvider(await wallet.getProvingProvider(zkConfigProvider));

  return {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, ShadowPollPrivateState>({
      privateStateStoreName: 'shadowpoll-private-state',
      signingKeyStoreName: 'shadowpoll-private-state-signing-keys',
      privateStoragePasswordProvider: () => 'ShadowPoll-Frontend-2026!',
      accountId: wallet.unshieldedAddress,
    }),
    publicDataProvider: indexerPublicDataProvider(INDEXER_HTTP_URL, INDEXER_WS_URL),
    zkConfigProvider,
    proofProvider,
    walletProvider: wallet,
    midnightProvider: wallet,
  };
};
