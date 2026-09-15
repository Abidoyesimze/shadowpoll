import { useEffect, useState } from 'react';
import { usePollState } from './hooks/usePollState';
import { useWallet } from './hooks/useWallet';
import { Hero } from './components/Hero';
import { HowItWorks } from './components/HowItWorks';
import { PrivacyModel } from './components/PrivacyModel';
import { PollCard } from './components/PollCard';
import { ConnectButton } from './components/ConnectButton';
import { VoteButtons } from './components/VoteButtons';
import { CreatorControls } from './components/CreatorControls';
import { Footer } from './components/Footer';

const scrollToPoll = () => document.getElementById('live-poll')?.scrollIntoView({ behavior: 'smooth' });

export const App = () => {
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
    <>
      <nav className="topnav">
        <span className="wordmark">ShadowPoll</span>
        <button className="btn-ghost topnav-live" onClick={scrollToPoll}>
          Try it live
        </button>
      </nav>

      <main>
        <Hero onTryItLive={scrollToPoll} />
        <HowItWorks />
        <PrivacyModel />

        <section id="live-poll" className="section section-live">
          <h2>Try it live</h2>
          <p className="section-lead">This is a real, deployed contract - not a mockup. Connect a wallet and cast an actual vote.</p>

          <div className="live-poll-widget">
            <div className="live-poll-wallet">
              <ConnectButton state={walletState} onConnect={connect} onDisconnect={disconnect} />
            </div>

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
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};
