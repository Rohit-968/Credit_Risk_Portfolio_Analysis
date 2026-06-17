# Credit_Risk_Portfolio_Analysis
# Credit Risk Portfolio — Executive Analytics Dashboard
> **An interactive, simulation-driven credit risk analytics platform** built for executive decision-making.  
> Reconstructed from a real-world retail banking credit portfolio, modelling **5,000 customer accounts**  
> with full underwriting policy simulation, cohort analysis, and financial impact quantification.
---
## Live Demo
**[▶ Open Dashboard](./index.html)** — Single file. No installation. No internet required. Open in any browser.
---
## Project Overview
This project presents a **McKinsey-style portfolio analytics dashboard** for a retail banking credit book.  
It goes beyond static reporting — every chart, metric, and financial projection **responds in real-time** to underwriting policy changes, enabling analysts and decision-makers to stress-test configurations before they are applied to a live portfolio.
The analytical framework is grounded in empirically validated credit risk theory:
- **Behavioural signals** (late payment history) as the dominant default predictor
- **FICO score banding** with a structurally identified risk cliff at the 580 threshold
- **Fraud concentration modelling** within high-risk cohorts
- **Net portfolio margin simulation** accounting for yield, default loss, and fraud loss
---
## Features
### Executive Dashboard
- 5 live KPI cards that update dynamically with every policy change
- Risk rate breakdowns by **credit score band**, **late payment count**, **age cohort**, and **employment status**
- Actionable insight panel with portfolio thesis and underwriting recommendations
### Underwriting Policy Simulator
- **3 independent policy levers** — minimum credit score floor, maximum late payments allowed, maximum debt-to-income ratio
- Real-time computation of **approval rate**, **high-risk exposure**, **fraud rate**, and **net operating margin**
- Dynamic strategic recommendation engine — narrative guidance updates with every slider adjustment
- Visual before/after comparison of portfolio composition under baseline vs. simulated policy
### Risk Cohort Matrix
- **35-cell interactive heat map** across 5 credit score bands × 7 late payment buckets
- Colour-coded by risk severity: Low (<30%) → Fair → Elevated → High → Critical (>90%)
- **Clickable cells** — selecting any cohort instantly loads those thresholds into the policy simulator
### Portfolio Data Explorer
- Full **5,000-record** searchable, sortable, filterable data table
- Multi-dimensional filters: risk flag, employment type, simulated approval action
- **One-click CSV export** of any filtered view for offline analysis
- Paginated for performance with column-level sorting
---
## Technical Architecture
```
mckinsey_credit_risk_dashboard/
│
├── index.html       # Entire application — HTML + CSS + JS, ~43KB, zero dependencies
└── README.md        # This file
```
### Design Decisions
|
 Decision 
|
 Rationale 
|
|
---
|
---
|
|
**
Zero external dependencies
**
|
 Works fully offline — no CDN, no framework, no build step 
|
|
**
Seeded synthetic data generator
**
|
 Mulberry32 PRNG produces reproducible 5,000-record datasets matching empirical portfolio statistics 
|
|
**
Pure CSS / SVG charts
**
|
 No canvas library — bars, donuts, and stacked charts via DOM and inline SVG arcs 
|
|
**
Single HTML file
**
|
 Maximally portable — shareable by email, USB, or GitHub Pages with no deployment configuration 
|
|
**
Vanilla JS only
**
|
 Zero runtime overhead, instant load, compatible with any browser since 2015 
|
---
## Analytical Methodology
### Dataset Specification
|
 Parameter 
|
 Value 
|
|
---
|
---
|
|
 Portfolio size 
|
 5,000 customer accounts 
|
|
 High-risk share 
|
 76.6% (3,830 accounts) 
|
|
 Average credit score 
|
 599 — sub-prime dominant book 
|
|
 Average debt-to-income ratio 
|
 29.7% 
|
|
 Fraud incidence 
|
 2.9% (145 accounts, concentrated in high-risk segment) 
|
|
 Credit score distribution 
|
~
48% Poor (<580), 
~
21% Fair, 
~
16% Good, 
~
9% Very Good, ~6% Exceptional 
|
### Risk Classification Logic
An account is classified **High-Risk** if it satisfies either condition:
```
Credit Score < 580     →  Poor band — near-universal default correlation
OR
Late Payments ≥ 4      →  Behavioural delinquency threshold
```
This binary rule mirrors industry-standard underwriting cut-offs used across retail banking and consumer credit globally.
### Financial Impact Model
Net portfolio operating margin is computed as:
```
Margin = (Low-Risk Approvals  × +$1,200  yield per account)
       + (High-Risk Approvals × –$800    default loss per account)
       + (Fraud Approvals     × –$6,000  fraud loss per account)
```
Coefficients are calibrated to representative retail banking unit economics for an unsecured lending book.
### Optimal Policy Configuration — Pareto-Efficient Frontier
Simulation analysis identifies the following as the **risk-return optimal** policy:
|
 Control 
|
 Baseline (No Policy) 
|
 Optimal Configuration 
|
|
---
|
---
|
---
|
|
 Minimum Credit Score 
|
 300 — no filter 
|
**
580
**
|
|
 Max Late Payments 
|
 6 — no filter 
|
**
3
**
|
|
 Max Debt-to-Income 
|
 80% — no filter 
|
**
45%
**
|
|
 Approval Rate 
|
 100% 
|
 ~41% 
|
|
 High-Risk Exposure 
|
 76.6% 
|
 ~22% 
|
|
 Net Portfolio Margin 
|
**
–$2,414,000
**
|
**
+$1,100,000+
**
|
A $3.5M+ swing in net margin from applying two targeted underwriting rules.
---
## Skills Demonstrated
```
Credit & Risk Analytics          Data Engineering                 Frontend Engineering
────────────────────────         ────────────────                 ────────────────────
Credit risk modelling            Seeded PRNG (Mulberry32)         Pure CSS bar/donut/stack charts
Portfolio segmentation           Synthetic dataset generation      Inline SVG arc rendering
Cohort & vintage analysis        Client-side data pipeline         Responsive grid layout
Scenario / what-if modelling     Sort, filter, paginate           Tab navigation & state management
Financial impact quantification  One-click CSV export             Zero-dependency architecture
Executive communication          Reproducible data science         Cross-browser compatibility
```
nalytical rigour and engineering discipline are not mutually exclusive** — the entire platform runs in a single 43KB file with zero dependencies, yet delivers a production-quality interactive experience indistinguishable from a full-stack web application.
---
