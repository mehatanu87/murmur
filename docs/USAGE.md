# Usage notes

## Circuit walkthrough (`contracts/murmur.compact`)

- `openPulse(question, root)` — organizer opens the pulse and publishes
  the Merkle root of every eligible respondent's hashed secret.
- `submitResponse(response)` — a respondent supplies two private
  witnesses (`respondentSecret`, `respondentPath`). The circuit proves
  eligibility, derives a question-scoped nullifier, checks it hasn't
  been spent, then increments only the public tally for that response.
- `closePulse()` — freezes further responses.

## Going from stub to live calls (real on-chain transactions)

This repo ships with **no simulated ledger**. `src/lib/contractClient.ts`
throws until you complete this wiring.

1. Run `npm run compact:compile` to populate `managed/murmur`.
2. Build the eligibility Merkle tree off-chain, deploy with
   `openPulse` against that root, and record the Preprod contract
   address in `deployed_contract.json` and `README.md`.
3. In `src/lib/contractClient.ts`, replace `submitResponse`'s body
   with a real call against `managed/murmur`, using
   `@midnight-ntwrk/midnight-js-contracts`. Mirror Midnight's official
   `example-counter` reference dApp: https://docs.midnight.network
   (see "Examples").
4. Once wired, add a results screen reading the live tally from the
   deployed contract — right now the UI only ever shows the single
   question, by design, since Murmur is meant to be answered in one
   glance rather than browsed as a dashboard.

## Manual steps still required before submission

- [ ] Compile the contract and deploy to Preprod with a real eligibility root
- [ ] Wire `submitResponse` to the generated bindings (step 3 above)
- [ ] Add the real Preprod contract address to `README.md` and `deployed_contract.json`
- [ ] Fill in every `[I WILL FILL THIS IN]` section of `PROPOSAL.md`
- [ ] Submit the chosen idea (Anonymous Feedback / Survey) for approval
- [ ] Record the 1-minute demo video showing a real transaction
- [ ] Make 10+ meaningful, incremental commits
- [ ] Deploy the frontend and add the live URL

## Demo video checklist
1. Full flow: connect a real wallet → generate a respondent secret →
   pick a number → submit → show the transaction on a Preprod explorer
2. Terminal showing `npm test` output (12 passing)
3. README showing the green CI badge
