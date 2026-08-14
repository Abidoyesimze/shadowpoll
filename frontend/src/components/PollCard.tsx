import type { PollState } from '../hooks/usePollState';

export const PollCard = ({ poll }: { poll: PollState }) => {
  const total = poll.yesVotes + poll.noVotes;
  const yesPct = total > 0n ? Number((poll.yesVotes * 100n) / total) : 0;

  return (
    <div className="poll-card">
      <h2>{poll.question}</h2>
      <div className="tally">
        <div className="bar">
          <div className="bar-yes" style={{ width: `${yesPct}%` }} />
        </div>
        <div className="tally-numbers">
          <span>Yes: {poll.yesVotes.toString()}</span>
          <span>No: {poll.noVotes.toString()}</span>
        </div>
      </div>
      <p className="hint">
        This tally is the only thing anyone can see. Individual votes stay private - see the README for how.
      </p>
    </div>
  );
};
