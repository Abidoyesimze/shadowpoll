import { useEffect, useState } from 'react';
import { usePollState } from './hooks/usePollState';
import { useWallet } from './hooks/useWallet';
import { PollCard } from './components/PollCard';
import { ConnectButton } from './components/ConnectButton';
import { VoteButtons } from './components/VoteButtons';
import { CONTRACT_ADDRESS, NETWORK } from './lib/env';

export const App = () => {
  const pollStatus = usePollState();
  const { state: walletState, connect, disconnect } = useWallet();
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    if (walletState.status !== 'connected') {
      setHasVoted(false);
      return;
    }
    const subscription = walletState.api.state$.subscribe((derived) => setHasVoted(derived.hasVoted));
    return () => subscription.unsubscribe();
  }, [walletState]);

  return (
    <main className="app">
      <header>
        <h1>ShadowPoll</h1>
        <p className="subtitle">Private voting on Midnight - public tallies, private ballots.</p>
        <ConnectButton state={walletState} onConnect={connect} onDisconnect={disconnect} />
      </header>

      {pollStatus.status === 'loading' && <p>Loading poll from the {NETWORK} indexer…</p>}
      {pollStatus.status === 'error' && <p className="error">Failed to load poll: {pollStatus.message}</p>}
      {pollStatus.status === 'ready' && (
        <>
          <PollCard poll={pollStatus.poll} />
          {walletState.status === 'connected' ? (
            <VoteButtons api={walletState.api} hasVoted={hasVoted} />
          ) : (
            <p className="hint">Connect a Midnight wallet (e.g. Lace) to cast a vote.</p>
          )}
        </>
      )}

      <footer>
        <span>
          Contract: <code>{CONTRACT_ADDRESS}</code> on {NETWORK}
        </span>
      </footer>
    </main>
  );
};
