import type { WalletConnectionState } from '../hooks/useWallet';

export const ConnectButton = ({
  state,
  onConnect,
  onDisconnect,
}: {
  state: WalletConnectionState;
  onConnect: () => void;
  onDisconnect: () => void;
}) => {
  if (state.status === 'connected') {
    return (
      <div className="wallet-status">
        <span className="wallet-address" title={state.address}>
          {state.address.slice(0, 14)}…{state.address.slice(-6)}
        </span>
        <button onClick={onDisconnect}>Disconnect</button>
      </div>
    );
  }

  if (state.status === 'connecting') {
    return (
      <button disabled>
        Connecting…
      </button>
    );
  }

  return (
    <div className="wallet-status">
      <button onClick={onConnect}>Connect wallet</button>
      {state.status === 'error' && <span className="error">{state.message}</span>}
    </div>
  );
};
