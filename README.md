# Credit Risk Portfolio — Executive Analytics Dashboard

> An interactive, simulation-driven credit risk analytics platform built for executive decision-making. Reconstructed from a real-world retail banking credit portfolio, modelling **5,000 customer accounts** with full underwriting policy simulation, cohort analysis, and financial impact quantification.

---

## Live Demo

**[▶ Open Dashboard](./index.html)** — Single file. No installation. No internet required. Open in any browser.

---

## Project Overview

A portfolio analytics dashboard for a retail banking credit book. Every chart, metric, and financial projection responds in real-time to underwriting policy changes — enabling analysts to stress-test configurations before applying them to a live portfolio.

---

## Features

- **Executive Dashboard** — 5 live KPI cards, risk breakdowns by credit score, late payments, age, and employment
- **Policy Simulator** — 3 sliders (credit score floor, max late payments, max DTI) with live financial margin calculation and strategic recommendation engine
- **Risk Cohort Matrix** — 35-cell clickable heat map; click any cell to load thresholds into the simulator
- **Portfolio Explorer** — 5,000-record table with search, filters, column sorting, pagination, and CSV export

---

## Optimal Policy Findings

| Control | Baseline | Optimal |
|---|---|---|
| Min Credit Score | None | 580 |
| Max Late Payments | None | 3 |
| Max DTI | None | 45% |
| High-Risk Exposure | 76.6% | ~22% |
| Net Portfolio Margin | –$2,414,000 | +$1,100,000+ |

> A **$3.5M+ swing** in net margin from two targeted underwriting rules.

---

## Tech Stack

- **Pure HTML / CSS / JavaScript** — zero dependencies, zero frameworks
- **Mulberry32 seeded PRNG** — reproducible 5,000-record synthetic dataset
- **Pure CSS + SVG charts** — no canvas library required
- **Single 43KB file** — works offline, shareable by email, deployable on GitHub Pages in one click

---

