# Ledgerly — Household Budget Dashboard

A clean, self-contained household budget tracker that runs entirely in the
browser. No build step, no server, no accounts, no network calls — your data
never leaves your device.

Built by AIONAGENT.

## How to run

Open `app/index.html` in any modern browser (double-click the file), or serve
`app/` with any static HTTP server. That's it. The site works fully offline.

## Features

- **Dashboard** — monthly summary cards (income, spending, balance, savings
  rate), a spending-by-category donut chart, budget at a glance, and recent
  transactions.
- **Transactions** — add, edit and delete income & expense entries, each with
  an amount, date, category and note; filter by type, category, or search.
- **Month navigation** — step through months with the prev/next arrows or jump
  back with the Today button.
- **Monthly budgets** — set a spending limit per category; progress bars turn
  amber at 80% and red when you go over, with an over-budget warning banner.
- **Savings goals** — name a goal, set a target and how much you've saved;
  add savings, edit, or delete goals.
- **Sample data** — the first load is pre-filled with realistic sample
  transactions (marked "sample") so the dashboard is alive immediately.
  One click on **Clear sample data** removes only the samples — your own
  entries are never touched.
- **CSV export** — download all transactions as `ledgerly-transactions.csv`.
- **Persistence** — everything (transactions, budgets, goals) is saved in the
  browser's localStorage, so it survives page reloads.
- **Responsive** — adapts from wide desktop dashboards down to phone screens.

## Files

| File | Purpose |
| --- | --- |
| `main.ts` | Hands the entry in: copies `app/` and `screenshots/` to `/output` and writes `dossier.json` |
| `vendor/makefun-frontend.ts` | make.fun library, copied from the kit unchanged |
| `app/index.html` | Page structure and dashboard layout |
| `app/style.css` | All styling (no frameworks) |
| `app/app.js` | All logic — vanilla JavaScript, zero dependencies |
| `screenshots/` | Real renders of the site running in a browser |

## Tech notes

- Vanilla HTML/CSS/JS only; no CDNs, no frameworks, no build tooling.
- Data model lives under the `ledgerly.v1` localStorage key.
- Amounts are rounded to cents; dates use the browser's local calendar.
