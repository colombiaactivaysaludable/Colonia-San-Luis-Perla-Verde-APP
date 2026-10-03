# Security Specification for Colonia San Luis Firestore Database

## 1. Data Invariants
1. **Club Identity & Isolation:** Each player, match, callup, substitution, statistic, and payment must belong to an existing team.
2. **Key Protection:** Injections of unknown fields (ghost keys) are rejected; schema fields must adhere to maximum length and type definitions.
3. **Immutability:** Identity keys (`id`, `teamId`, `matchId`, `playerId`) cannot be altered during updates.
4. **Valid Range Boundaries:** Dorsals, minutes, fees, and goals must be non-negative numbers within sane athletic limits.
5. **Path Security:** Document IDs must be alphanumeric strings between 1 and 128 characters.
6. **Public Confirmation Invariant:** Players confirming attendance can only update their own `confirmationStatus` and `absenceReason`.

## 2. The "Dirty Dozen" Payloads (Designed to Fail)
1. **Payload 1 (Ghost Field Injection):** Create Team with `{ "id": "t1", "name": "Team", "adminBackdoor": true }` -> REJECTED.
2. **Payload 2 (ID Poisoning):** Create Match with 1MB random string as ID -> REJECTED by `isValidId`.
3. **Payload 3 (Negative Dorsal):** Create Player with dorsal `-10` -> REJECTED.
4. **Payload 4 (Orphaned Callup):** Create Callup with empty `matchId` -> REJECTED.
5. **Payload 5 (Immutability Bypass):** Update Match changing its `teamId` -> REJECTED.
6. **Payload 6 (String Overflow in Player Name):** Create Player with `fullName` > 120 chars -> REJECTED.
7. **Payload 7 (Invalid Payment Method):** Create Payment with unvalidated payment method -> REJECTED.
8. **Payload 8 (Negative Referee Fee):** Create Match with `totalRefereeFee: -50000` -> REJECTED.
9. **Payload 9 (Substitution Time Paradox):** Substitution minute `-5` or `> 180` -> REJECTED.
10. **Payload 10 (Stat Counter Tampering):** Set negative goals `-2` or yellow cards `99` -> REJECTED.
11. **Payload 11 (Shadow Update on Callup):** Update Callup attempting to overwrite `matchId` or `playerId` -> REJECTED.
12. **Payload 12 (Blanket Overwrite):** Batch write omitting required keys -> REJECTED.
