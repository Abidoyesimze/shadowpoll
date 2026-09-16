import { useEffect, useState } from 'react';
import { LaceWalletBridge } from '../lib/wallet-bridge';

// Structural subset of both useWallet's WalletConnectionState (which also
// carries a joined ShadowPollAPI) and useLaceWallet's LaceConnectionState
// (which carries providers instead) - this component only ever needs the
// connection status and address, so it accepts either without caring which.
export type WalletUIState =
  | { status: 'disconnected' }
  | { status: 'connecting' }
  | { status: 'connected'; address: string }
  | { status: 'error'; message: string };

export const ConnectButton = ({
  state,
  onConnect,
  onDisconnect,
}: {
  state: WalletUIState;
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  const [walletAvailable, setWalletAvailable] = useState(true);

  useEffect(() => {
    // A wallet extension can inject its API after this page has already
    // loaded, so keep checking briefly rather than only checking once.
    setWalletAvailable(LaceWalletBridge.isWalletAvailable());
    const id = setInterval(() => setWalletAvailable(LaceWalletBridge.isWalletAvailable()), 1000);
    return () => clearInterval(id);
  }, []);

  if (state.status === 'connected') {
    return (
      <div className="wallet-status">
        <span className="wallet-address" title={state.address}>
          {state.address.slice(0, 14)}…{state.address.slice(-6)}
        </span>
        <button className="btn-ghost" onClick={onDisconnect}>
          Disconnect
        </button>
      </div>
    );
  }

  if (state.status === 'connecting') {
    return (
      <button className="btn-primary" disabled>
        Connecting…
      </button>
    );
  }

  if (!walletAvailable) {
    return (
      <div className="wallet-status">
        <a className="btn-primary" href="https://www.lace.io/" target="_blank" rel="noreferrer">
          Install Lace wallet
        </a>
        <span className="hint">No Midnight wallet detected</span>
      </div>
    );
  }

  return (
    <div className="wallet-status">
      <button className="btn-primary" onClick={onConnect}>
        Connect wallet
      </button>
      {state.status === 'error' && <span className="error">{state.message}</span>}
    </div>
  );
};
