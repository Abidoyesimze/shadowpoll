import { useState } from 'react';
import type { ShadowPollAPI } from '@shadowpoll/api';

export const VoteButtons = ({ api, hasVoted, closed }: { api: ShadowPollAPI; hasVoted: boolean; closed: boolean }) => {
  const [pending, setPending] = useState<'yes' | 'no' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vote = async (choice: boolean) => {
    setError(null);
    setPending(choice ? 'yes' : 'no');
    try {
      await api.castVote(choice);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(null);
    }
  };

  if (hasVoted) {
    return (
      <p className="voted">
        <span aria-hidden="true">✓</span> You've already voted in this poll - one vote per identity, enforced by the
        contract.
      </p>
    );
  }

  if (closed) {
    return <p className="hint">Voting is closed - this poll no longer accepts new votes.</p>;
  }

  return (
    <div className="vote-buttons">
      <button className="btn-vote btn-vote-yes" disabled={pending !== null} onClick={() => vote(true)}>
        {pending === 'yes' ? 'Casting…' : 'Vote Yes'}
      </button>
      <button className="btn-vote btn-vote-no" disabled={pending !== null} onClick={() => vote(false)}>
        {pending === 'no' ? 'Casting…' : 'Vote No'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
