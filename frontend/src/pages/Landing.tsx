import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { PrivacyModel } from '../components/PrivacyModel';
import { Footer } from '../components/Footer';

export const Landing = () => (
  <>
    <nav className="topnav">
      <span className="wordmark">ShadowPoll</span>
      <div className="topnav-actions">
        <Link className="btn-ghost topnav-live" to="/create">
          Create a poll
        </Link>
        <Link className="btn-ghost topnav-live" to="/app">
          Launch app
        </Link>
      </div>
    </nav>

    <main>
      <Hero />
      <HowItWorks />
      <PrivacyModel />
    </main>

    <Footer />
  </>
);
