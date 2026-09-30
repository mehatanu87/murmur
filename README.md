# Murmur
![CI](https://github.com/YOUR_USERNAME/murmur/actions/workflows/ci.yml/badge.svg)
> Single-question anonymous pulse checks. Built on Midnight.

## Live Demo
[LIVE URL — add after deploying, e.g. Vercel/Netlify]

## Contract Address
| Network  | Address                          |
|----------|-----------------------------------|
| Preprod  | [`b8e3ad1dedd7ef53c22545ba10b3e6a3dae01041ff72429d9fe85f59a520430b`](https://preprod.midnightexplorer.com/contracts/0xb8e3ad1dedd7ef53c22545ba10b3e6a3dae01041ff72429d9fe85f59a520430b) |

## What This Does
Murmur asks one question at a time and takes a 1-5 response from any
eligible, un-reused respondent. It's built for the moment right after
a talk, workshop, or meeting — quick enough to answer in five seconds,
with nothing that traces the answer back to whoever gave it.

## No mock data — architecture note
This build has **no local ledger simulator**. `src/lib/contractClient.ts`
refuses to fabricate a transaction result: every action either goes
through a connected wallet against a real deployed contract, or the UI
tells you plainly that nothing is deployed yet. See docs/USAGE.md for
the exact steps to wire it up to a live Preprod deployment.

## Privacy Model
- **PUBLIC:** the pulse question, the aggregate 1-5 tally, the set of
  spent nullifiers, open/closed status.
- **PRIVATE:** the respondent's secret, and which respondent gave which
  answer.
- **PROVED without revealing:** that the caller is eligible to respond
  and hasn't answered this pulse before — without revealing who they
  are or what they picked.

## Privacy Claim
An on-chain observer can see the exact 1-5 breakdown at any moment and
confirm no respondent answered twice (the nullifier set only grows).
What they cannot see, at any point, is who gave which answer.

## Tech Stack
- **Contract:** Compact (`contracts/murmur.compact`)
- **Frontend:** React + TypeScript + Vite + Tailwind CSS — a full-screen,
  one-question-at-a-time neo-brutalist flow, not a dashboard
- **Wallet:** Midnight DApp Connector API (multi-wallet detection)
- **Tests:** Vitest, covering the pure witness-derivation helpers
- **CI/CD:** GitHub Actions

## Prerequisites
- Node.js v22+, npm
- [Midnight `compact` CLI](https://docs.midnight.network)
- A Midnight-compatible wallet (Lace or 1AM), funded on Preprod

## Setup & Run Locally
```bash
npm install
npm run compact:compile   # requires the Midnight toolchain
npm run dev
```
Until `deployed_contract.json` has a real address and
`src/lib/contractClient.ts`'s live-call section is wired to your
compiled `managed/murmur` bindings (see docs/USAGE.md), the app runs
but honestly reports that no contract is deployed rather than
simulating one.

## Run Tests
```
npm test
```

## CI/CD
On every push and pull request to `main`, the GitHub Actions pipeline
checks out the code, installs dependencies on Node 22, compiles the
Compact contract when the toolchain is present, lints, runs the full
Vitest suite, and produces a production build.

## Product Proposal
See [PROPOSAL.md](./PROPOSAL.md).
