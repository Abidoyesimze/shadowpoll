export const PrivacyModel = () => (
  <section className="section">
    <h2>What's public, what's private</h2>
    <p className="section-lead">
      Every poll splits its data into two kinds of state, and the contract only ever lets one direction cross:
    </p>

    <div className="privacy-columns">
      <div className="privacy-col privacy-col-public">
        <p className="privacy-col-label">Public ledger state</p>
        <p className="privacy-col-desc">Anyone reading the chain or indexer can see this - that's the point of a poll.</p>
        <ul>
          <li>The poll question</li>
          <li>Running Yes / No totals</li>
          <li>A set of opaque nullifier hashes (proof someone voted - not who)</li>
        </ul>
      </div>
      <div className="privacy-arrow" aria-hidden="true">
        →
      </div>
      <div className="privacy-col privacy-col-private">
        <p className="privacy-col-label">Private witness</p>
        <p className="privacy-col-desc">Resolved locally in your wallet. Never transmitted, never stored on-chain.</p>
        <ul>
          <li>Your persistent voter secret</li>
          <li>Your actual Yes/No choice</li>
          <li>Any link between the two</li>
        </ul>
      </div>
    </div>

    <div className="callout">
      <p className="callout-label">The privacy claim, observable</p>
      <p>
        Connect a wallet, cast one vote, then try voting again from that same wallet. The second attempt is rejected
        - the contract proves you already voted - but nothing in the UI, the transaction, or the public ledger ever
        reveals <em>what</em> you voted or <em>which</em> identity you are. The only thing that changes publicly is
        one of two counters.
      </p>
    </div>
  </section>
);
