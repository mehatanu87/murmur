# Product Proposal

## What is the product, and who uses it?
**Murmur** is a single-question, anonymous pulse-check application. It is used by event organizers, speakers, or workshop hosts who want immediate, honest feedback right after a session. Attendees use the app to submit a 1-5 rating. The anonymity encourages genuine responses without fear of tracing or bias, making it ideal for immediate post-event sentiment capture.

## Why Midnight specifically?
Midnight enables a zero-knowledge polling system that a transparent chain like Ethereum or Cardano cannot do well. On a transparent chain, anyone can look at the transaction history and link a wallet address to a specific vote. Even with token gating, the choice is public. Midnight allows the system to prove that a user is eligible to vote and has not voted before (using nullifiers), while keeping their actual choice and identity completely private. The only public data is the aggregate tally and the question itself.

## Data Model
| Data Point                  | Type            | Disclosed To |
|--------------------------------|-----------------|--------------|
| Pulse question                  | Public ledger   | Everyone     |
| Aggregate 1-5 response tally     | Public ledger   | Everyone     |
| Spent nullifier set              | Public ledger   | Everyone     |
| Respondent's secret              | Private witness | No one       |
| Which respondent gave which answer| Private witness | No one       |
| Wallet address of respondent     | Off-chain       | No one       |

## Mainnet Feasibility
This is highly realistic to reach Mainnet by Level 6. The core contract logic is lightweight, relying on simple state variables (a map for tallies) and a small zero-knowledge circuit for nullifier verification. It does not require complex on-chain storage or high-throughput scaling for a minimum viable product. The current Preprod deployment proves the end-to-end flow is fully functional and ready for production refinement.
