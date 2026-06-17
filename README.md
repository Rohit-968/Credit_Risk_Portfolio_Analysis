# Credit Risk Portfolio Optimization — Executive Analytics Dashboard

**A retail banking credit portfolio was losing $2.4M annually with no underwriting controls in place. This dashboard identifies a two-rule policy change that converts that loss into a $1.1M+ gain — a $3.5M swing — and lets a decision-maker test it interactively before touching a live book.**

[**▶ View Live Dashboard**](./index.html) — single HTML file, opens in any browser, no install required.

---

## The Business Problem

A retail lender's credit book had no minimum underwriting thresholds: any applicant, regardless of credit score, delinquency history, or debt load, could be approved. The result was a portfolio where **76.6% of accounts sat in high-risk tiers**, and the book ran at a net loss.

The question this project answers: **which underwriting rules, applied to which thresholds, turn this portfolio profitable — and what's the trade-off between approval volume and portfolio margin?**

## The Approach

I reconstructed a realistic 5,000-account retail credit portfolio (synthetic data, seeded for reproducibility) and built an interactive tool to answer that question empirically rather than by assumption:

1. **Segmented the portfolio** across the variables that actually drive default risk — credit score band, late payment count, debt-to-income ratio, age, and employment status — to find where risk concentrates.
2. **Built a live policy simulator** so any combination of underwriting thresholds (credit score floor, max late payments, max DTI) immediately recalculates approval rate, risk exposure, and net portfolio margin. This turns "what if we tightened underwriting" from a hypothetical into a number.
3. **Mapped a risk cohort matrix** (35 segments) to identify which specific cohorts contribute disproportionately to losses, so policy changes target the right population instead of blunt across-the-board tightening.
4. **Stress-tested thresholds** against the full 5,000-record dataset to find the policy combination that maximizes margin without over-restricting approval volume — the actual trade-off any credit committee has to weigh.

## What the Analysis Found

| Underwriting Control | Baseline (No Policy) | Recommended Policy |
|---|---|---|
| Minimum credit score | None | 580 |
| Maximum late payments | None | 3 |
| Maximum debt-to-income | None | 45% |
| High-risk exposure | 76.6% of book | ~22% of book |
| **Net portfolio margin** | **–$2,414,000** | **+$1,100,000** |

Two targeted rules — not a wholesale rewrite of underwriting policy — move the portfolio by **$3.5M+ in net margin**. The dashboard makes this result interactively verifiable: any reviewer can move the sliders, land on the same thresholds, and watch the math confirm itself in real time, rather than taking the conclusion on faith.

## Try It Yourself

The live demo includes:

- **Executive summary view** — five headline KPIs and risk breakdowns by credit score, late payments, age, and employment status, for a fast read on portfolio health.
- **Policy simulator** — three sliders driving live recalculation of approval rate, risk exposure, and margin, with a recommendation engine that flags whether a given configuration improves or worsens the baseline.
- **Risk cohort matrix** — a 35-cell heat map of where risk concentrates; clicking a cell loads that cohort's thresholds directly into the simulator.
- **Portfolio explorer** — the full 5,000-record dataset with search, filtering, sorting, pagination, and CSV export, for anyone who wants to verify the numbers against the underlying data.

## Why This Matters for Credit Risk / Portfolio Analytics Roles

This project mirrors the actual workflow of a credit risk or portfolio analyst: take an unconstrained or under-controlled book, identify where risk concentrates, quantify the financial impact of specific policy levers, and present a recommendation that a non-technical stakeholder (credit committee, executive) can interrogate and trust. The emphasis throughout is on **answer-first communication** — every view leads with the number that matters, not the methodology.

## Technical Notes

Built as a single dependency-free HTML file (43KB) so it's trivially shareable and deployable — no build step, no server, works offline. The dataset is generated via a seeded Mulberry32 PRNG for full reproducibility, and all charts are hand-built with SVG and CSS rather than a charting library, keeping the file self-contained.

**Stack:** Vanilla HTML / CSS / JavaScript. No frameworks, no external dependencies.

