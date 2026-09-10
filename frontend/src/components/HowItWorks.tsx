const STEPS = [
  {
    title: 'Connect your wallet',
    body: 'Connect a Midnight-compatible wallet (e.g. Lace). Nothing is shared with ShadowPoll except your address - no signup, no account.',
  },
  {
    title: 'Cast your vote privately',
    body: "Your wallet builds and proves the vote on your device. Your choice, and who you are, never leave your wallet as plain data - only a zero-knowledge proof does.",
  },
  {
    title: 'Tally updates, you stay hidden',
    body: "The contract checks the proof, updates the public Yes/No count, and records that your identity has voted - without ever learning what you voted, or who you are.",
  },
];

export const HowItWorks = () => (
  <section className="section">
    <h2>How it works</h2>
    <p className="section-lead">Three steps, all of it enforced by the contract itself - not by trusting a server.</p>
    <ol className="steps">
      {STEPS.map((step, i) => (
        <li key={step.title} className="step">
          <span className="step-number">{i + 1}</span>
          <div>
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  </section>
);
