# Product Proposal — ShadowPoll

**Chosen idea (from the Moonlight Challenges Level 3 list):** Private Voting — anonymous ballots with publicly verifiable tallies.

## Problem

Existing polling and voting tools force a trade-off between transparency and privacy. Public tallies with visible voter identities enable social pressure, coercion, and vote-buying. Fully secret ballots (a sealed box, an opaque backend) require trusting *someone* not to tamper with the count. Communities, DAOs, and workplaces that want a quick, trustworthy yes/no poll don't have a good option that gives them both properties at once without relying on a trusted third party.

## Proposed solution

ShadowPoll is a minimal voting contract on Midnight where:

- Anyone can open a poll with a public question.
- Anyone can cast exactly one vote (yes/no).
- The running tally is public ledger state, auditable by anyone, at any time, with no special access.
- The voter's identity and their specific choice are never disclosed - only a one-way nullifier (proof "this identity hasn't voted yet") and the aggregate counters ever reach the chain.

This directly matches the "Private Voting" idea: anonymous ballots (nobody can link a vote to a voter), publicly verifiable tallies (anyone can independently confirm the count is correct and hasn't been tampered with).

## Why this is a meaningful use of Midnight's privacy model

The core primitive - a `witness` value (the voter's secret + choice) that's proven-but-not-shown via a ZK circuit, with `disclose()` used deliberately only at the two points where public output is actually intended (the nullifier, and the tally increment) - is exactly the pattern Midnight's Compact language is built around. It isn't privacy for its own sake; the specific things kept private (identity, individual choice) and the specific things made public (question, tally, one-vote-per-identity enforcement) are chosen because that's precisely what a trustworthy anonymous poll requires. See the README's ["Privacy model: what an observer can and cannot learn"](../README.md#privacy-model-what-an-observer-can-and-cannot-learn) section for the exact breakdown.

## What's built (as of Level 3)

- A compiled, tested Compact contract (`contract/`) - 6 tests covering tally correctness, double-vote rejection, and identity non-linkage.
- A TypeScript API layer (`api/`) wrapping deploy/join/castVote.
- CLI deployment tooling (`cli/`) - deployed live to Midnight Preview.
- A React/Vite frontend (`frontend/`) - live poll display (no wallet needed) and Lace-wallet-connected voting, deployed at [shadowpoll-frontend.vercel.app](https://shadowpoll-frontend.vercel.app).
- CI/CD (`.github/workflows/ci.yml`) building and testing every push.

## What's next (beyond Level 3 scope)

- A "create your own poll" flow in the frontend (currently CLI-only) - the underlying `ShadowPollAPI.deploy()` already supports it.
- Resolving the open Lace wallet-delegated-proving issue documented in the README's "Current limitations" section.
- Multi-option polls (beyond yes/no) and poll expiry/closing.
