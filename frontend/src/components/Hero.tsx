import { Link } from 'react-router-dom';

export const Hero = () => (
  <section className="hero">
    <p className="eyebrow">Built on Midnight · Moonlight Challenges, Level 2</p>
    <h1>
      Vote yes or no.
      <br />
      Prove you voted.
      <br />
      <span className="accent-text">Never reveal how.</span>
    </h1>
    <p className="hero-lead">
      ShadowPoll is a small privacy-first voting contract. Anyone can open a poll; anyone can cast one vote. The
      running tally is public and auditable on-chain - but no one, not even the poll's creator, can ever see which
      way you voted or link a vote back to you.
    </p>
    <div className="hero-actions">
      <Link className="btn-primary" to="/app">
        Launch the app →
      </Link>
      <a className="btn-ghost" href="https://github.com/Abidoyesimze/shadowpoll" target="_blank" rel="noreferrer">
        View source on GitHub
      </a>
    </div>
    <dl className="hero-stats">
      <div>
        <dt>Public</dt>
        <dd>Yes / No tally</dd>
      </div>
      <div>
        <dt>Private</dt>
        <dd>Your identity &amp; choice</dd>
      </div>
      <div>
        <dt>Enforced by</dt>
        <dd>Zero-knowledge proof</dd>
      </div>
    </dl>
  </section>
);
