import { Link } from 'react-router-dom';
import { Hero } from '../components/Hero';
import { HowItWorks } from '../components/HowItWorks';
import { PrivacyModel } from '../components/PrivacyModel';
import { Footer } from '../components/Footer';

export const Landing = () => (
  <>
    <nav className="topnav">
      <span className="wordmark">ShadowPoll</span>
      <Link className="btn-ghost topnav-live" to="/app">
        Launch app
      </Link>
    </nav>

    <main>
      <Hero />
      <HowItWorks />
      <PrivacyModel />
    </main>

    <Footer />
  </>
);
