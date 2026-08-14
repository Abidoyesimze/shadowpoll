import { useState } from 'react';
import type { ShadowPollAPI } from '@shadowpoll/api';

export const VoteButtons = ({ api, hasVoted }: { api: ShadowPollAPI; hasVoted: boolean }) => {
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
    return <p className="voted">You've already voted in this poll - only one vote per identity is allowed.</p>;
  }

  return (
    <div className="vote-buttons">
      <button disabled={pending !== null} onClick={() => vote(true)}>
        {pending === 'yes' ? 'Casting…' : 'Vote Yes'}
      </button>
      <button disabled={pending !== null} onClick={() => vote(false)}>
        {pending === 'no' ? 'Casting…' : 'Vote No'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
