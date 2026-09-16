import { useCallback, useEffect, useState } from 'react';
import { ShadowPollAPI } from '@shadowpoll/api';
import { useLaceWallet } from './useLaceWallet';

export type WalletConnectionState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; address: string; api: ShadowPollAPI }
  | { status: 'error'; message: string };

// Connects to the wallet, then joins the specific poll at contractAddress.
export const useWallet = (contractAddress: string) => {
  const { state: laceState, connect: connectLace, disconnect: disconnectLace } = useLaceWallet();
  const [state, setState] = useState<WalletConnectionState>({ status: 'disconnected' });

  useEffect(() => {
    let cancelled = false;
    if (laceState.status === 'connecting') {
      setState({ status: 'connecting' });
    } else if (laceState.status === 'disconnected') {
      setState({ status: 'disconnected' });
    } else if (laceState.status === 'error') {
      setState({ status: 'error', message: laceState.message });
    } else if (laceState.status === 'connected') {
      setState({ status: 'connecting' });
      ShadowPollAPI.join(laceState.providers, contractAddress)
        .then((api) => {
          if (!cancelled) setState({ status: 'connected', address: laceState.address, api });
        })
        .catch((error) => {
          if (!cancelled) setState({ status: 'error', message: error instanceof Error ? error.message : String(error) });
        });
    }
    return () => {
      cancelled = true;
    };
  }, [laceState, contractAddress]);

  const connect = useCallback(() => connectLace(), [connectLace]);
  const disconnect = useCallback(() => disconnectLace(), [disconnectLace]);

  return { state, connect, disconnect };
};
