import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShadowPollAPI } from '@shadowpoll/api';
import { useLaceWallet } from '../hooks/useLaceWallet';
import { ConnectButton } from '../components/ConnectButton';

export const CreatePoll = () => {
  const { state: walletState, connect, disconnect } = useLaceWallet();
  const [question, setQuestion] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const createPoll = async (e: FormEvent) => {
    e.preventDefault();
    if (walletState.status !== 'connected' || !question.trim()) return;

    setError(null);
    setDeploying(true);
    try {
      const api = await ShadowPollAPI.deploy(walletState.providers, question.trim());
      navigate(`/app/${api.deployedContractAddress}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeploying(false);
    }
  };

  return (
    <div className="app-shell">
      <nav className="topnav">
        <Link className="wordmark" to="/">
          ShadowPoll
        </Link>
        <ConnectButton state={walletState} onConnect={connect} onDisconnect={disconnect} />
      </nav>

      <main className="app-main">
        <h1 className="create-title">Create a poll</h1>
        <p className="hint">
          Anyone can open a poll. You'll be its creator - the only identity able to close it later, without ever
          revealing that role to anyone else.
        </p>

        {walletState.status !== 'connected' ? (
          <p className="hint">Connect a Midnight wallet (e.g. Lace) above to create a poll.</p>
        ) : (
          <form className="create-form" onSubmit={createPoll}>
            <label htmlFor="question">Poll question</label>
            <input
              id="question"
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Should Midnight ship privacy-first dApps by default?"
              maxLength={280}
              disabled={deploying}
              required
            />
            <button className="btn-primary" type="submit" disabled={deploying || !question.trim()}>
              {deploying ? 'Deploying…' : 'Create poll'}
            </button>
            {deploying && (
              <p className="hint">
                Deploying a new contract to the network - this proves the circuit and submits a real transaction, so
                it can take a while.
              </p>
            )}
            {error && <p className="error">{error}</p>}
          </form>
        )}
      </main>
    </div>
  );
};
