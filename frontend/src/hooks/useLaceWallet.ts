import { useCallback, useState } from 'react';
import { LaceWalletBridge } from '../lib/wallet-bridge';
import { buildShadowPollProviders } from '../lib/providers';
import type { ShadowPollProviders } from '@shadowpoll/api';

export type LaceConnectionState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; address: string; providers: ShadowPollProviders }
  | { status: 'error'; message: string };

// Handles connecting to the injected wallet and building the provider bundle
// any contract interaction needs (deploy, join, or vote) - without assuming
// which contract, if any, the caller is about to talk to. useWallet.ts
// builds on this for "join and interact with one specific poll"; the
// create-poll flow builds on it for "deploy a brand new one" instead.
export const useLaceWallet = () => {
  const [state, setState] = useState<LaceConnectionState>({ status: 'disconnected' });

  const connect = useCallback(async () => {
    setState({ status: 'connecting' });
    try {
      const wallet = await LaceWalletBridge.connect();
      const providers = await buildShadowPollProviders(wallet);
      setState({ status: 'connected', address: wallet.unshieldedAddress, providers });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({ status: 'disconnected' });
  }, []);

  return { state, connect, disconnect };
};
