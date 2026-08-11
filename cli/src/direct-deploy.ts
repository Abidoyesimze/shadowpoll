// Deploys ShadowPoll to a given network without going through
// @midnight-ntwrk/testkit-js's docker-compose-managed RemoteTestEnvironment
// (which starts its own ephemeral proof-server container per run, and whose
// wallet-sync checks can hang indefinitely - see wallet-utils.ts). Instead
// this expects a proof server you started yourself, e.g.:
//
//   docker run -p 6300:6300 midnightntwrk/proof-server:8.0.3 midnight-proof-server -v

import { WebSocket } from 'ws';
import { NodeZkConfigProvider } from '@midnight-ntwrk/midnight-js-node-zk-config-provider';
import { indexerPublicDataProvider } from '@midnight-ntwrk/midnight-js-indexer-public-data-provider';
import { httpClientProofProvider } from '@midnight-ntwrk/midnight-js-http-client-proof-provider';
import { levelPrivateStateProvider } from '@midnight-ntwrk/midnight-js-level-private-state-provider';
import { setNetworkId, type NetworkId } from '@midnight-ntwrk/midnight-js-network-id';
import { unshieldedToken } from '@midnight-ntwrk/midnight-js-protocol/ledger';
import { toHex } from '@midnight-ntwrk/midnight-js-utils';
import { type EnvironmentConfiguration } from '@midnight-ntwrk/testkit-js';

import { ShadowPollAPI, type ShadowPollProviders, type PrivateStateId } from '@shadowpoll/api';
import { type ShadowPollPrivateState } from '@shadowpoll/contract';
import { createLogger } from './logger-utils.js';
import { MidnightWalletProvider } from './midnight-wallet-provider.js';
import { syncWallet, waitForUnshieldedFunds } from './wallet-utils.js';
import { generateDust } from './generate-dust.js';
import { utils } from '@shadowpoll/api';
import { getShadowPollLedgerState } from './index.js';

// @ts-expect-error: needed to enable WebSocket usage through apollo
globalThis.WebSocket = WebSocket;

const POLL_QUESTION = process.env.POLL_QUESTION ?? 'Should Midnight ship privacy-first dApps by default?';

export const deployDirect = async (network: 'preview' | 'preprod'): Promise<void> => {
  setNetworkId(network as NetworkId);

  const envConfiguration: EnvironmentConfiguration = {
    walletNetworkId: network,
    networkId: network,
    indexer: `https://indexer.${network}.midnight.network/api/v4/graphql`,
    indexerWS: `wss://indexer.${network}.midnight.network/api/v4/graphql/ws`,
    node: `https://rpc.${network}.midnight.network`,
    nodeWS: `wss://rpc.${network}.midnight.network`,
    faucet: `https://midnight-tmnight-${network}.nethermind.dev/`,
    proofServer: 'http://localhost:6300',
  };

  const logger = await createLogger(`../logs/${network}-direct/${new Date().toISOString()}.log`);

  // If WALLET_MNEMONIC/WALLET_SEED is set, import that wallet instead of
  // generating a fresh random one (useful when you already funded a
  // specific wallet via the faucet UI). Never pass real/mainnet-holding
  // seeds this way - this script logs the derived master seed and stores
  // private state on disk.
  const mnemonic = process.env.WALLET_MNEMONIC;
  const seedOverride = process.env.WALLET_SEED;
  logger.info(
    mnemonic
      ? `Importing wallet from WALLET_MNEMONIC for ${network}...`
      : seedOverride
        ? `Importing wallet from WALLET_SEED for ${network}...`
        : `Building a fresh wallet for ${network}...`,
  );
  const walletProvider = mnemonic
    ? await MidnightWalletProvider.build(logger, envConfiguration, undefined, mnemonic)
    : await MidnightWalletProvider.build(logger, envConfiguration, seedOverride ?? toHex(utils.randomBytes(32)));
  const seed = walletProvider.masterSeedHex;
  await walletProvider.start();

  logger.info('Requesting funds from the faucet and waiting for balance...');
  const unshieldedState = await waitForUnshieldedFunds(
    logger,
    walletProvider.wallet,
    envConfiguration,
    unshieldedToken(),
    true,
  );
  const nightBalance = unshieldedState.balances[unshieldedToken().raw];
  logger.info(`NIGHT balance: ${nightBalance}`);

  logger.info('Registering NIGHT UTXOs for DUST generation (needed to pay tx fees)...');
  const dustTx = await generateDust(logger, seed, unshieldedState, walletProvider.wallet);
  if (dustTx) {
    await syncWallet(logger, walletProvider.wallet);
  }

  const zkConfigProvider = new NodeZkConfigProvider<'castVote'>(
    new URL('../../contract/src/managed/shadowpoll', import.meta.url).pathname,
  );
  const providers: ShadowPollProviders = {
    privateStateProvider: levelPrivateStateProvider<PrivateStateId, ShadowPollPrivateState>({
      privateStateStoreName: `shadowpoll-private-state-${network}`,
      signingKeyStoreName: `shadowpoll-private-state-${network}-signing-keys`,
      privateStoragePasswordProvider: () => 'ShadowPoll-Test-2026!',
      accountId: seed,
    }),
    publicDataProvider: indexerPublicDataProvider(envConfiguration.indexer, envConfiguration.indexerWS),
    zkConfigProvider,
    proofProvider: httpClientProofProvider(envConfiguration.proofServer, zkConfigProvider),
    walletProvider,
    midnightProvider: walletProvider,
  };

  logger.info(`Deploying ShadowPoll contract to ${network} with question: "${POLL_QUESTION}"...`);
  const api = await ShadowPollAPI.deploy(providers, POLL_QUESTION, logger);
  logger.info(`✅ Deployed contract at address: ${api.deployedContractAddress}`);

  const ledgerState = await getShadowPollLedgerState(providers, api.deployedContractAddress);
  logger.info(`Ledger state right after deploy: ${JSON.stringify(ledgerState)}`);

  await walletProvider.stop();
  logger.info('Done.');
  process.exit(0);
};
