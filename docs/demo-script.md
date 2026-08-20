# Demo video script

For the Level 2 "wallet connect + successful circuit call" demo video. Needs the Lace wallet extension installed, with a Preview-funded account (see the README's "Why Preview, not Preprod" for why). ~2 minutes.

1. **Open the live demo URL** (or `npm run dev --workspace=frontend` locally). Point out the poll question and the live tally, and note it's reading directly from the indexer.
2. **Click "Connect wallet."** Approve the connection in the Lace popup. Show the connected address appear in the header.
3. **Cast a vote** (Yes or No). Approve the transaction in Lace when prompted (balancing/proving/submission happens through the wallet). Wait for the tally to update live.
4. **Show the observable privacy behavior:** try to vote again from the same connected wallet. The UI shows "You've already voted in this poll" — the contract proved and enforced one-vote-per-identity without ever putting *which* choice you made, or *who* you are, on-chain anywhere the tally itself doesn't already show in aggregate. (Optional: open the indexer/explorer for the contract address and show the public ledger state only ever contains the tally counters and a set of opaque nullifier hashes — never a choice-to-identity link.)
5. **Click "Disconnect."** Show the UI return to the disconnected state.

That's the full loop: connect → circuit call (`castVote`) → observable privacy property → disconnect.
