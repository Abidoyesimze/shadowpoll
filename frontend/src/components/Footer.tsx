import { CONTRACT_ADDRESS, NETWORK } from '../lib/env';

export const Footer = () => (
  <footer className="site-footer">
    <div>
      <span>Contract on {NETWORK}: </span>
      <code>{CONTRACT_ADDRESS}</code>
    </div>
    <div className="footer-links">
      <a href="https://github.com/Abidoyesimze/shadowpoll" target="_blank" rel="noreferrer">
        GitHub
      </a>
      <a href="https://github.com/Abidoyesimze/shadowpoll/blob/main/README.md" target="_blank" rel="noreferrer">
        README
      </a>
      <a href="https://midnight.network" target="_blank" rel="noreferrer">
        Midnight
      </a>
      <span>MIT License</span>
    </div>
  </footer>
);
