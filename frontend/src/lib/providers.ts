// Builds the full ShadowPollProviders bundle for the browser: a public
// indexer connection (no wallet needed), IndexedDB-backed private state, ZK
// artifacts fetched from /managed (see scripts/copy-managed.mjs), proving
// delegated to a locally-run proof server, and the wallet/submission halves
// bridged from the connected Lace extension. Mirrors cli/src/direct-deploy.ts,
// swapping the Node-specific providers for browser-compatible ones.
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { FetchZkConfigProvider } from '@midnight-ntwrk/midnight-js-fetch-zk-config-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import type { ShadowPollProviders, PrivateStateId } from '@shadowpoll/api';
import type { ShadowPollPrivateState } from '@shadowpoll/contract';

import { INDEXER_HTTP_URL, INDEXER_WS_URL, PROOF_SERVER_URL, ZK_CONFIG_BASE_URL } from './env';
import { LaceWalletBridge } from './wallet-bridge';

export const buildShadowPollProviders = (wallet: LaceWalletBridge): ShadowPollProviders => {
  const zkConfigProvider = new FetchZkConfigProvider<'castVote'>(ZK_CONFIG_BASE_URL);

  return {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, ShadowPollPrivateState>({
      privateStateStoreName: 'shadowpoll-private-state',
      signingKeyStoreName: 'shadowpoll-private-state-signing-keys',
      privateStoragePasswordProvider: () => 'ShadowPoll-Frontend-2026!',
      accountId: wallet.unshieldedAddress,
    }),
    publicDataProvider: indexerPublicDataProvider(INDEXER_HTTP_URL, INDEXER_WS_URL),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(PROOF_SERVER_URL, zkConfigProvider),
    walletProvider: wallet,
    midnightProvider: wallet,
  };
};
