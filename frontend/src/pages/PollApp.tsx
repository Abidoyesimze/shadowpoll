import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePollState } from '../hooks/usePollState';
import { useWallet } from '../hooks/useWallet';
import { PollCard } from '../components/PollCard';
import { ConnectButton } from '../components/ConnectButton';
import { VoteButtons } from '../components/VoteButtons';
import { CreatorControls } from '../components/CreatorControls';
import { CONTRACT_ADDRESS, NETWORK } from '../lib/env';

export const PollApp = () => {
  const pollStatus = usePollState();
  const { state: walletState, connect, disconnect } = useWallet();
  const [hasVoted, setHasVoted] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (walletState.status !== 'connected') {
      setHasVoted(false);
      setIsCreator(false);
      return;
    }
    const subscription = walletState.api.state$.subscribe((derived) => {
      setHasVoted(derived.hasVoted);
      setIsCreator(derived.isCreator);
    });
    return () => subscription.unsubscribe();
  }, [walletState]);

  return (
    <div className="app-shell">
      <nav className="topnav">
        <Link className="wordmark" to="/">
          ShadowPoll
        </Link>
        <ConnectButton state={walletState} onConnect={connect} onDisconnect={disconnect} />
      </nav>

      <main className="app-main">
        {pollStatus.status === 'loading' && <p className="hint">Loading poll from the indexer…</p>}
        {pollStatus.status === 'error' && <p className="error">Failed to load poll: {pollStatus.message}</p>}
        {pollStatus.status === 'ready' && (
          <>
            <PollCard poll={pollStatus.poll} />
            {walletState.status === 'connected' ? (
              <>
                <VoteButtons api={walletState.api} hasVoted={hasVoted} closed={pollStatus.poll.closed} />
                {isCreator && <CreatorControls api={walletState.api} closed={pollStatus.poll.closed} />}
              </>
            ) : (
              <p className="hint">Connect a Midnight wallet (e.g. Lace) above to cast a vote.</p>
            )}
          </>
        )}

        <p className="app-footnote">
          Contract on {NETWORK}: <code>{CONTRACT_ADDRESS}</code>
        </p>
      </main>
    </div>
  );
};
