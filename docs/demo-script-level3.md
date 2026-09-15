# Level 3 demo video script (~1 minute)

Needs Lace installed with a Preview-funded account (see the README's "Why Preview, not Preprod"). Tight and fast - this is the 1-minute "full functionality" video, not the longer Level 2 walkthrough in [`demo-script.md`](demo-script.md).

1. **(0:00–0:10) Open the live demo.** Point at the live question and tally - note it's reading directly from the indexer, no wallet needed to see this.
2. **(0:10–0:25) Connect wallet, cast a vote.** Click Connect, approve in Lace, pick Yes or No, approve the transaction. Let the tally update live.
3. **(0:25–0:35) Show the privacy property.** Try voting again from the same wallet - "You've already voted," with no indication anywhere of what you voted or who you are.
4. **(0:35–0:50) Show the creator control.** If recording as the wallet that deployed this contract, show the "Close poll" button appearing (only visible to the creator identity) and click it - the poll flips to "Closed," voting stops.
5. **(0:50–1:00) Disconnect**, and pan across the README's privacy-model section or the CI badge/passing tests if time allows, to underline this is tested and production-hardened, not just a demo.

Full functionality in under a minute: live public state → wallet connect → private circuit call (vote) → observable privacy guarantee → creator-only circuit call (close) → disconnect.
