# Product Proposal — ShadowPoll

**Chosen idea (from the Moonlight Challenges idea list):** Private Voting — anonymous ballots with publicly verifiable tallies.

## 1. What is the product, and who uses it?

ShadowPoll is a minimal private polling primitive for Midnight: anyone can open a yes/no poll, and anyone can cast a vote that gets folded into a public running tally — without ever revealing *who* voted, *how they voted*, or *who created the poll*.

Existing polling and voting tools force a trade-off between transparency and privacy. Public tallies with visible voter identities enable social pressure, coercion, and vote-buying. Fully secret ballots (a sealed box, an opaque backend) require trusting *someone* not to tamper with the count. ShadowPoll resolves that by keeping the ballot private as a Compact witness while the tally itself lives in public ledger state — anyone can audit the result on-chain, no one (not even the contract or its own creator) ever learns an individual's identity or choice.

**Who uses it:** DAOs, online communities, and workplaces that need a quick, tamper-evident, coercion-resistant yes/no vote — a governance proposal, a community sentiment check, a workplace decision — where members want to vote honestly without their choice (or the fact that they created the poll) being attributable to them, while still being able to independently verify the count wasn't rigged. The live frontend ([shadowpoll-frontend.vercel.app](https://shadowpoll-frontend.vercel.app)) lets anyone connect a Lace wallet, create a poll, and vote, with no backend or trusted operator involved.

## 2. Why Midnight specifically?

The core primitive ShadowPoll needs — a value that is *proven* to satisfy a property without being *shown* — is exactly what Compact's `witness`/`disclose()` model is built around, and it's what makes the two central guarantees possible on a public, permissionless chain rather than behind a trusted backend:

- **Anonymous, non-repeatable voting.** A voter's `secretId` witness never leaves their wallet; only a one-way nullifier (`persistentHash(secretId)`) reaches the public `voted` set. This proves "this identity hasn't voted yet" without a central authority holding an identity list, and without the identity itself ever becoming public — something a normal smart-contract chain (where all inputs are public calldata) can't do, and something a purely off-chain private ballot can't make *publicly verifiable*.
- **Publicly verifiable tallies without a trusted counter.** `yesVotes`/`noVotes` live in public ledger state, so anyone can independently confirm the count matches the number of nullifiers without asking anyone to attest to it.

A general-purpose smart-contract chain would force choosing one of these two properties; Midnight's ZK-witness model is what lets ShadowPoll have both at once, which is the entire point of the product.

## 3. Data model: public state / private witness / disclosure

| | Public ledger state | Private witness |
|---|---|---|
| **What** | `question`, `yesVotes`, `noVotes`, `voted` (a set of nullifiers), `creatorNullifier`, `closed` | `mySecretId` (a persistent per-identity secret), `myChoice` (this vote's yes/no) |
| **Who can see it** | Anyone reading the chain / indexer | Only that identity's own wallet — resolved locally, never transmitted |
| **Why** | The whole point of a poll is a publicly verifiable result | The whole point of privacy is that no one can link a person to a vote, or to the fact that they created the poll |

`disclose()` is used at exactly two points in [`contract/src/shadowpoll.compact`](contract/src/shadowpoll.compact), and nowhere else:

- **The nullifier.** `castVote()` derives `persistentHash(secretId)` from the private `mySecretId` witness and discloses only that hash into the public `voted` set — proving "this identity hasn't voted yet" without revealing the identity, since the hash can't be reversed. `closePoll()` applies the identical technique in a separate hash domain (`creatorNullifierFor`) so the creator role can never be linked back to that same identity's voter nullifier.
- **The tally increment.** The `myChoice` witness is disclosed only at the point it decides which counter to increment — never combined with the nullifier or any other identifying data in the same disclosure, so the running totals are the only thing anyone can observe.

Full breakdown of what an observer can and cannot recover from chain data is in the README's [Privacy model](README.md#privacy-model-what-an-observer-can-and-cannot-learn) section.

## 4. Scope and feasibility for Mainnet by Level 6

**What's already Mainnet-shaped:** the contract logic, the privacy properties, and the test suite don't change moving from Preview/Preprod to Mainnet — Compact circuits and the disclosure pattern are network-agnostic, and the 11-test suite already exercises the properties that matter (double-vote rejection, identity non-linkage, creator/voter unlinkability). The frontend's wallet-delegated proving path (Lace, via `dapp-connector-api`) is also network-agnostic; switching networks is a one-line env var change (`VITE_NETWORK`), as noted in the README's [Why Preview, not Preprod](README.md#why-preview-not-preprod) section.

**What has to happen before Mainnet, realistically:**

1. **Preprod first.** Mainnet readiness has to be demonstrated on Preprod before it means anything on Mainnet — and Preprod is currently blocked by a faucet integration bug in the SDK's `FaucetClient` (documented in the README), not a code issue in this repo. That's the immediate blocker for Level 4/5, ahead of any Mainnet work.
2. **Wallet sync time is a real scaling risk, not just an inconvenience.** Full wallet sync on Preview has gone from minutes (Level 1) to multiple hours (Level 3) for the same wallet, and the working theory is that shielded-lane scan cost grows with the *testnet's* cumulative activity over calendar time. Mainnet's activity volume will be higher, not lower — this needs a real fix (e.g., checkpointed/incremental sync, or a lighter-weight proving path) before asking real users to wait hours to vote.
3. **No contract upgradability.** Adding `closePoll` in Level 3 required a fresh deploy with a new address, because Compact ledger schema changes aren't in-place upgrades. A production Mainnet deploy needs either a stable, audited schema locked before launch, or an explicit migration/versioning story (e.g., a registry contract pointing at the current poll-contract address) so users aren't silently left voting against a stale deployment.
4. **Security audit.** The nullifier-domain-separation technique (`nullifierFor` vs. `creatorNullifierFor`) is exactly the kind of cryptographic design decision that needs independent review before real funds and real votes depend on it — an internal test suite proving the intended behavior isn't the same as an audit ruling out unintended ones.
5. **Real DUST economics.** Testnet deploys use faucet-funded throwaway wallets; Mainnet requires a real fee/funding model for whoever pays to deploy a poll and whoever pays to vote, which hasn't been designed yet.
6. **Spam/sybil resistance for poll creation.** Anything permissionless on Mainnet needs a cost or gating story for poll creation (even if just gas) to avoid griefing — not a concern on faucet-funded testnets.

**Net assessment:** the core cryptographic design and application logic are Mainnet-ready in shape; what's missing is testnet validation on Preprod, a fix for the sync-time scaling problem, an explicit schema-migration story, and an audit — all realistic to sequence across Levels 4–6 given the pace so far (Level 1 → Level 3 in about five weeks), but not yet done, and not to be claimed as done before they are.
