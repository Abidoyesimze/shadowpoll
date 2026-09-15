import type { PollState } from '../hooks/usePollState';
import { NETWORK } from '../lib/env';

export const PollCard = ({ poll }: { poll: PollState }) => {
  const total = poll.yesVotes + poll.noVotes;
  const yesPct = total > 0n ? Number((poll.yesVotes * 100n) / total) : 50;

  return (
    <div className="poll-card">
      <div className="poll-card-head">
        {poll.closed ? (
          <span className="closed-badge">Closed</span>
        ) : (
          <span className="live-badge">
            <span className="live-dot" /> Live on {NETWORK}
          </span>
        )}
      </div>
      <h2>{poll.question}</h2>
      <div className="tally">
        <div className="bar">
          <div className="bar-yes" style={{ width: `${yesPct}%` }} />
        </div>
        <div className="tally-numbers">
          <span className="tally-yes">Yes · {poll.yesVotes.toString()}</span>
          <span className="tally-no">No · {poll.noVotes.toString()}</span>
        </div>
      </div>
      <p className="hint">
        {poll.closed
          ? `Voting is closed. Final tally: ${total.toString()} vote${total === 1n ? '' : 's'}.`
          : total === 0n
            ? 'No votes yet - be the first. Nobody will ever see how you voted.'
            : `${total.toString()} vote${total === 1n ? '' : 's'} cast. This tally is the only thing anyone can see - individual votes stay private.`}
      </p>
    </div>
  );
};
