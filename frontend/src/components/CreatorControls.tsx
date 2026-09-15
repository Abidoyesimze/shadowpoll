import { useState } from 'react';
import type { ShadowPollAPI } from '@shadowpoll/api';

// Only rendered when the connected identity's creator nullifier matches the
// one committed at deploy time (see useWallet's isCreator) - nobody else
// ever sees this control, and closing is rejected on-chain regardless.
export const CreatorControls = ({ api, closed }: { api: ShadowPollAPI; closed: boolean }) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (closed) {
    return <p className="hint creator-hint">You created this poll. It's now closed to further votes.</p>;
  }

  const close = async () => {
    setError(null);
    setPending(true);
    try {
      await api.closePoll();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="creator-controls">
      <p className="hint creator-hint">You created this poll.</p>
      <button className="btn-ghost btn-danger" disabled={pending} onClick={close}>
        {pending ? 'Closing…' : 'Close poll'}
      </button>
      {error && <p className="error">{error}</p>}
    </div>
  );
};
