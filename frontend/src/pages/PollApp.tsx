import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { usePollState } from '../hooks/usePollState';
import { useWallet } from '../hooks/useWallet';
import { PollCard } from '../components/PollCard';
import { ConnectButton } from '../components/ConnectButton';
import { VoteButtons } from '../components/VoteButtons';
import { CreatorControls } from '../components/CreatorControls';
import { CONTRACT_ADDRESS, NETWORK } from '../lib/env';

export const PollApp = () => {
  // /app shows the default poll from env; /app/:contractAddress shows any
  // other deployed ShadowPoll contract, e.g. one just created via /create.
  const { contractAddress: routeAddress } = useParams<{ contractAddress?: string }>();
  const contractAddress = routeAddress ?? CONTRACT_ADDRESS;

  const pollStatus = usePollState(contractAddress);
  const { state: walletState, connect, disconnect } = useWallet(contractAddress);
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
          Contract on {NETWORK}: <code>{contractAddress}</code>
        </p>
        <p className="app-footnote">
          <Link to="/create">Create your own poll →</Link>
        </p>
      </main>
    </div>
  );
};
