# ShadowPoll

A private voting/polling contract for [Midnight](https://midnight.network), built for the **Moonlight Challenges** — [Level 1: New Moon](#level-1--new-moon) and [Level 2: First Crescent](#level-2--first-crescent).

**Live demo:** [shadowpoll-frontend.vercel.app](https://shadowpoll-frontend.vercel.app)
**Contract (Preview):** [`e5facde142e36093a5430224340c8ebf7675ed90fdfdeb6be7183f895458d34d`](https://indexer.preview.midnight.network/api/v4/graphql) — see [Level 2](#level-2--first-crescent) for why Preview, not Preprod
**Demo video:** [Watch on Loom](https://www.loom.com/share/18e5ca9e383f4834b7000f59e5529621)

## Product idea

ShadowPoll is a minimal private polling primitive for Midnight: anyone can open a yes/no poll, and anyone can cast a vote that gets folded into a public running tally — without ever revealing *who* voted or *how they voted*. Today's DAO and community polling tools force a trade-off between transparency (public tallies, but every vote is doxxed and open to social pressure or vote-buying) and privacy (secret ballots, but no way to verify the count wasn't tampered with). ShadowPoll resolves that by keeping the ballot private as a Compact witness while the tally itself lives in public ledger state, so anyone can audit the result on-chain while no one — not even the contract — ever learns an individual's choice. The long-term idea is to grow this into a lightweight polling widget that DAOs, communities, and workplaces can embed to run quick, tamper-evident, coercion-resistant votes.

## Public state vs. private witness

This is the core privacy pattern the contract demonstrates:

| | Public ledger state | Private witness |
|---|---|---|
| **What** | `question`, `yesVotes`, `noVotes`, `voted` (a set of nullifiers) | `mySecretId` (a persistent per-voter secret), `myChoice` (this vote's yes/no) |
| **Who can see it** | Anyone reading the chain / indexer | Only the voter's own wallet — resolved locally, never transmitted |
| **Why** | The whole point of a poll is a publicly verifiable result | The whole point of privacy is that no one can link a person to a vote |

Concretely, in [`contract/src/shadowpoll.compact`](contract/src/shadowpoll.compact):

- `castVote()` derives a **nullifier** — `persistentHash(secretId)` — from the voter's private `mySecretId` witness and `disclose()`s *only that hash* to the public `voted` set. This proves "this identity hasn't voted yet" without ever revealing the identity itself, since the hash can't be reversed back to the secret.
- The voter's `myChoice` witness (yes/no) is `disclose()`d at the point it's used to decide which counter (`yesVotes` or `noVotes`) to increment. That disclosure is deliberate and unavoidable — the aggregate tally *is* the public output of a poll — but because it's never combined with the nullifier or any other identifying data in the same disclosure, the running totals are the only thing anyone can observe. Nothing on-chain ties a specific increment back to a specific voter.
- Two different people voting the same way produce two different nullifiers (since each has a different `secretId`), so even repeated identical votes never collide or leak linkage.

This mirrors the general Compact pattern: keep everything in `witness` functions by default, and reach for `disclose()` only at the exact point where a value is deliberately meant to become public — never by accident.

### The privacy claim, observable

Level 2 asks for "something proven without being shown." Here it is: **connect a wallet, cast one vote, then try to vote again from that same wallet.** The second attempt is rejected — the contract proves you already voted — but at no point does the UI, the transaction, or the public ledger state ever reveal *what* you voted or *which* on-chain identity you are. The only thing that changes publicly is one of two aggregate counters. Anyone watching the indexer sees a tally move and a nullifier hash appear in a set; no one, including whoever's running the poll, can work backwards from that to a person or a choice. See [`docs/demo-script.md`](docs/demo-script.md) for the exact walkthrough.

## Repo layout

```
contract/   Compact contract, compiled circuits (managed/), and unit tests (vitest)
api/        Thin TypeScript API wrapping the compiled contract (deploy/join/castVote)
cli/        Deployment scripts for Preview/Preprod using a local proof server
frontend/   React/Vite web UI: live poll display + Lace-connected voting
```

## Prerequisites

- [Node.js 22+](https://nodejs.org) (see `.nvmrc`)
- [Docker](https://www.docker.com/) (for the local proof server, only needed for CLI deploys)
- The [Compact compiler](https://docs.midnight.network/develop/tutorial/building/) (`compact` CLI), installed via:
  ```bash
  curl --proto '=https' --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
  compact update
  ```

## Setup — run locally

```bash
# 1. Install dependencies (installs every workspace: contract, api, cli, frontend)
npm install

# 2. Compile the Compact contract into circuits + keys (managed/)
npm run compact --workspace=contract

# 3. Run the contract's test suite
npm run test --workspace=contract

# 4. Build the TypeScript packages
npm run build --workspace=contract
npm run build --workspace=api
```

---

## Level 1 — New Moon

Toolchain set up, first Compact contract written and deployed to Preview.

### Compile output

`npm run compact --workspace=contract` runs `compact compile src/shadowpoll.compact ./src/managed/shadowpoll` and generates:

```
contract/src/managed/shadowpoll/
├── compiler/contract-info.json
├── contract/index.{js,d.ts}     # generated TS bindings (Ledger type, Contract class, pureCircuits)
├── keys/castVote.{prover,verifier}
└── zkir/castVote.{zkir,bzkir}
```

![Successful compile output listing the compiled circuit](docs/screenshots/compile.png)

### Deploying to Preview / Preprod

Deployment uses a local proof server (rather than the ephemeral docker-managed one) for reliability:

```bash
# 1. Start a local proof server
cd cli
docker compose -f proof-server-local.yml up -d

# 2. Deploy (generates a fresh wallet, requests test tokens from the network
#    faucet, registers DUST for fees, then deploys the contract)
npm run preview-direct   # or: npm run preprod-direct
```

Each run logs progress to `logs/<network>-direct/<timestamp>.log`, culminating in the deployed contract address.

![Contract deployed to Preview with address shown, and independently confirmed via the indexer](docs/screenshots/deploy.png)

**Deployed contract (Preview):** [`e5facde142e36093a5430224340c8ebf7675ed90fdfdeb6be7183f895458d34d`](https://indexer.preview.midnight.network/api/v4/graphql) — independently queryable via the Preview indexer's `contract(address: "...")` GraphQL query.

To re-use a specific wallet instead of generating a fresh one, set `WALLET_SEED` (or `WALLET_MNEMONIC`) in the environment before running the deploy script. Never use a seed that holds real funds — this script logs the seed and persists private state to disk.

> **Note on wallet sync:** `waitForUnshieldedFunds`/`syncWallet` wait for a *full* sync (shielded + unshielded + dust lanes), not just a non-zero balance. A wallet with a long prior transaction history can take several minutes to fully resync its DUST-lane merkle/witness state from a fresh local store; building a deploy transaction before that finishes produces a proof the chain rejects (`1010: Invalid Transaction: Custom error: 170` / `InvalidDustSpendProof`), even though the balance already looks ready. A wallet address with *no* prior history on a given network needs a genuinely long first-time sync (many minutes, multiple GB of memory) - see `cli/src/wallet-utils.ts` for how that's made resilient to transient stalls.

---

## Level 2 — First Crescent

Contract wired to a frontend UI, with Lace connected.

### Running the frontend

```bash
# 1. Compile the contract first if you haven't (frontend serves its circuit
#    artifacts as static files, copied from contract/src/managed)
npm run compact --workspace=contract

# 2. Run the frontend
npm run dev --workspace=frontend
```

![ShadowPoll live demo on Vercel, showing the live poll question and real tally](docs/screenshots/live-demo.png)

Live at **[shadowpoll-frontend.vercel.app](https://shadowpoll-frontend.vercel.app)**. It has two independent halves:

- **Live poll display** (`frontend/src/hooks/usePollState.ts`) — reads the deployed contract's public ledger state directly from the indexer, no wallet required.
- **Lace-connected voting** — `frontend/src/lib/wallet-bridge.ts` bridges the injected [dapp-connector](https://www.npmjs.com/package/@midnight-ntwrk/dapp-connector-api) API (e.g. [Lace](https://www.lace.io/)) to the `WalletProvider`/`MidnightProvider` interfaces `@shadowpoll/api`'s `ShadowPollAPI.castVote()` expects - connect, get funds-aware state, call the `castVote` circuit, submit through the wallet, disconnect. Proving is delegated to the wallet itself by default (`getProvingProvider`, see `frontend/src/lib/providers.ts`), not a locally-run proof server, so this works for any visitor with a compatible wallet installed and no Docker setup. Set `VITE_USE_LOCAL_PROOF_SERVER=true` to instead prove against a proof server you run yourself.

### Deploying the frontend

This is an npm-workspaces monorepo, and `frontend/` depends on the sibling `contract/` and `api/` workspaces being built first - Vercel's (or Netlify's) framework auto-detection doesn't know that, and will also misread the top-level `api/` folder as serverless functions if left on defaults. Configure these explicitly rather than relying on auto-detect:

| Setting | Value |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Install Command | `echo skip-default-install` (a no-op - the build command below does its own install) |
| Build Command | `cd .. && npm install && npm run build --workspace=contract && npm run build --workspace=api && cd frontend && npm run build` |
| Output Directory | `dist` |

No environment variables are required - `frontend/src/lib/env.ts`'s defaults already point at the deployed contract below. See that file if you want to override the network or contract address instead.

### Why Preview, not Preprod

Level 2 asks for Preprod specifically, and the frontend/CLI both support it (`VITE_NETWORK=preprod`, `npm run preprod-direct`) - but as of this writing, Preprod's faucet won't fund a deploying wallet, which blocks a fresh deploy there. This isn't a sync-time or memory issue (both of which came up and were fixed along the way, see `cli/src/wallet-utils.ts`) - it's that the SDK's faucet client (`@midnight-ntwrk/testkit-js`'s `FaucetClient`) posts to the wrong endpoint with an outdated request shape. The real Preprod faucet frontend calls `POST https://midnight-tmnight-preprod.nethermind.dev/api/request-tokens` with a `{address, captchaToken}` body gated by Cloudflare Turnstile; the SDK instead posts `{recipientAddress, amount}` straight to the faucet's root URL, which Express's SPA fallback answers with a misleading `200 OK` HTML page - so the deploy script logs "Faucet response: OK" and then waits forever, since no tokens were ever actually requested. Confirmed by replaying the real request manually:

```
$ curl -X POST https://midnight-tmnight-preprod.nethermind.dev/api/request-tokens \
    -H "Content-Type: application/json" \
    -d '{"address":"mn_addr_preprod1...","captchaToken":"x"}'
{"status":"error","message":"Captcha verification failed: invalid-input-response"}
```

A real captcha token only comes from a human completing the challenge in a browser, so this contract is deployed to **Preview** instead - the same address from [Level 1](#deploying-to-preview--preprod) - with the frontend's Lace integration, circuit call, and privacy behavior otherwise identical to what Level 2 asks for on Preprod. Swapping networks once the faucet is fixed is a one-line env var change.

### Privacy claim

See [The privacy claim, observable](#the-privacy-claim-observable) above, and [`docs/demo-script.md`](docs/demo-script.md) for the exact steps the demo video walks through: connect → cast a vote (circuit call) → attempt a second vote from the same wallet (rejected, without revealing why to any observer) → disconnect.

### Demo video

**[Watch on Loom](https://www.loom.com/share/18e5ca9e383f4834b7000f59e5529621)** - recorded by following [`docs/demo-script.md`](docs/demo-script.md) against the live deploy above: connect Lace, cast a vote (the `castVote` circuit call), and the observable privacy behavior.

## License

[MIT](LICENSE)
