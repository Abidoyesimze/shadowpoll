import { useCallback, useRef, useState } from 'react';
import { ShadowPollAPI } from '@shadowpoll/api';
import { LaceWalletBridge } from '../lib/wallet-bridge';
import { buildShadowPollProviders } from '../lib/providers';
import { CONTRACT_ADDRESS } from '../lib/env';

export type WalletConnectionState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; address: string; api: ShadowPollAPI }
  | { status: 'error'; message: string };

export const useWallet = () => {
  const [state, setState] = useState<WalletConnectionState>({ status: 'disconnected' });
  const apiRef = useRef<ShadowPollAPI | null>(null);

  const connect = useCallback(async () => {
    setState({ status: 'connecting' });
    try {
      const wallet = await LaceWalletBridge.connect();
      const providers = buildShadowPollProviders(wallet);
      const api = await ShadowPollAPI.join(providers, CONTRACT_ADDRESS);
      apiRef.current = api;
      setState({ status: 'connected', address: wallet.unshieldedAddress, api });
    } catch (error) {
      setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
    }
  }, []);

  const disconnect = useCallback(() => {
    apiRef.current = null;
    setState({ status: 'disconnected' });
  }, []);

  return { state, connect, disconnect };
};
