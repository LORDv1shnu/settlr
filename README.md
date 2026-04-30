# Splittr

> **Split expenses offline. No internet. No servers. No limits.**

[![Platform](https://img.shields.io/badge/Platform-Android-green?style=for-the-badge&logo=android)](https://android.com)
[![Built With](https://img.shields.io/badge/Built_With-Flutter-blue?style=for-the-badge&logo=flutter)](https://flutter.dev)
[![Status](https://img.shields.io/badge/Status-Pre--Development-orange?style=for-the-badge)]()
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

---

## What is Splittr?

Splittr is an **offline-first, open-source Android app** for splitting expenses in a group — built specifically for situations where internet doesn't exist or can't be relied on.

You're on a road trip. A trek. A camping trip. A week in Hampi. Five of you, one group, zero signal. Someone pays for petrol. Someone else buys food. By day 3, nobody knows who owes what. You open Splitwise — and it's asking you to upgrade.

**That's the problem Splittr solves.**

No cloud. No subscriptions. No internet required. Just open the app, add the expense, and sync with everyone nearby over WiFi Direct. Your data stays on your devices. Settlements are calculated on the spot.

---

## The Core Idea

Splittr is built around one principle: **the group is the server.**

- One person in the group acts as the **master device** (typically whoever organized the trip)
- Others connect to the master over **WiFi Direct** when they need to add or sync expenses
- Everyone is physically together anyway — so syncing is just a matter of turning on WiFi for 10 seconds
- Each person's own expenses **live on their own device** and are treated as source of truth
- The master holds the full picture for settlement calculation

No account creation. No login. No phone number. Just names.

---

## Aimed At

- Friend groups on trips, treks, or travel with unreliable internet
- Roommates who want a simple, private, no-cloud expense tracker
- Anyone who's been burned by Splitwise's limits or privacy concerns
- People who just want a tool that works offline, always

---

## Planned Features

### Core (Phase 1)

- **Group Management** — Create a trip/group, give it a name, add members by name
- **Add Expenses** — Amount, who paid, who it's split between, category, note
- **Split Methods** — Equal split, custom amounts, percentage-based
- **Balances View** — Who owes whom, simplified to minimum transactions
- **Settlement Summary** — Clean end-of-trip view: "Rahul pays Meera ₹340, Arjun pays Rahul ₹210"
- **Expense History** — Full log, filterable by person, category, date
- **Offline by Default** — 100% functional without any internet connection, always

### Sync (Phase 2)

- **WiFi Direct Sync** — Master device creates a local network, others join and sync instantly
- **Sync Queue** — If someone's phone was off, they get all missed expenses on next connect
- **Conflict Handling** — Timestamp-based, your own expenses are always preserved
- **Read-Only Relay** — Master relays others' expenses but cannot modify them; each person's data is editable only by them

### Nice to Have (Phase 3)

- **Receipt Scanning (OCR)** — Point camera at a receipt, auto-fill amount and merchant
- **Analytics** — Spending breakdown by category, by person, over time (FL Chart)
- **Export** — Share a summary as PDF or plain text at end of trip
- **Multi-currency** — For international trips, with manual exchange rate input
- **BLE Fallback** — Lightweight sync over Bluetooth LE when WiFi Direct isn't practical

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Flutter (Android) |
| Language | Dart |
| State Management | Riverpod |
| Local Storage | Drift (SQLite) |
| P2P Sync | WiFi Direct (android_wifi_direct) |
| Charts | FL Chart |
| OCR (Phase 3) | Google ML Kit Text Recognition |

---

## Architecture Overview

```
Each Device
├── Local DB (Drift/SQLite)
│   ├── Own expenses      ← created here, never overwritten by sync
│   └── Others' expenses  ← received from master, read-only
│
├── Sync Layer (WiFi Direct)
│   ├── Master mode       ← advertises, receives, relays
│   └── Client mode       ← connects, pushes own, pulls others
│
└── Business Logic
    ├── Debt calculator   ← minimize transactions algorithm
    ├── Split engine      ← equal / custom / percentage
    └── Sync queue        ← handles missed syncs
```

### Data Ownership Rule

```
You created it → you own it → only you can edit it
Master receives it → relays it → cannot modify it
Everyone else receives it → displays it → read-only
```

This means no one can tamper with your expenses, even without cryptography — the app simply doesn't allow edits to expenses that didn't originate on your device.

---

## Debt Settlement Algorithm

At the end of a trip, Splittr calculates the minimum number of payments needed to settle all debts:

1. Calculate each person's **net balance** (total paid − total owed across all expenses)
2. Separate into **creditors** (net positive) and **debtors** (net negative)
3. Greedily match largest debtor to largest creditor — settle, repeat
4. Result: fewest possible transactions to zero everyone out

---

## Why Not Just Use Splitwise / Splitpro?

| | Splitwise | Splittr |
|---|---|---|
| Works offline | ❌ | ✅ |
| Free, no limits | ❌ (paid plan) | ✅ Always |
| No account needed | ❌ | ✅ |
| Data on your device | ❌ (cloud) | ✅ |
| Open source | ❌ | ✅ |
| Works in Hampi | ❌ | ✅ |

---

## Project Status

Splittr is currently in **pre-development / planning phase.**

- [x] Concept defined
- [x] Architecture planned
- [x] Tech stack decided
- [ ] Data models
- [ ] Core UI
- [ ] Expense logic + debt algorithm
- [ ] WiFi Direct sync
- [ ] OCR (Phase 3)

---

## Contributing

Splittr is open source and contributions are welcome. If you've been annoyed by Splitwise on a trip, you already understand why this needs to exist.

1. Fork the repo
2. Create your branch (`git checkout -b feature/your-feature`)
3. Commit your changes
4. Open a PR

For bigger changes, open an issue first so we can discuss.

---

## License

MIT — do whatever you want with it.

---

*Built out of frustration in Hampi. For everyone who's been there.*