# AGAP  
**Advance Guidance & Assistance Platform**

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![SDG 11](https://img.shields.io/badge/SDG-11-orange)](#)
[![SDG 13](https://img.shields.io/badge/SDG-13-green)](#)

> **AGAP** — the *Advance Guidance & Assistance Platform* — delivers real‑time disaster preparedness tools that connect residents and local government before, during, and after severe weather events.

---

## Overview

Santa Rosa City is regularly battered by severe weather: month-long coastal inundation along Laguna de Bay, flash floods across the Silang–Santa Rosa River Basin, and widespread grid failures. Yet residents often lack localised early warnings, reliable safety-status channels, and transparent information on critical infrastructure like drainage and dikes. Emergency responders operate with incomplete field data, slowing relief and prolonging vulnerability.

AGAP bridges this gap. It’s an **AI‑powered Progressive Web Application** that puts a one‑tap lifeline in every pocket, gives authorities a unified command view, and uses explainable intelligence to turn raw data into life‑saving decisions.

---

## Problem Statement

The City of Santa Rosa is highly vulnerable to severe weather events, including prolonged coastal inundation, flash flooding, and power or communication outages. Residents frequently have no access to localised early warning systems, emergency preparedness tools, or real‑time community information. Limited visibility into drainage and flood‑control projects makes it harder for both citizens and local government to strengthen disaster preparedness, improve coordination, and build resilient communities.

---

## Proposed Solution

AGAP is a Progressive Web Application that improves disaster preparedness and community resilience through:

- Predictive safe routing based on live rainfall, elevation models, and historical flood spots.
- A **1‑Tap Emergency Button** that instantly broadcasts “I Am Safe” or “Need Urgent Assistance” with GPS coordinates.
- Anonymous community reporting that protects the reporter’s identity.
- An **AI‑powered command dashboard** that consolidates citizen signals, sensor data, and predictive insights for local authorities.

By integrating real‑time data, geospatial analytics, and explainable AI, the platform delivers early warnings, supports informed decision‑making, enhances infrastructure transparency, and enables seamless coordination between citizens and the Local Government Unit (LGU).

---

## Core Features

###  Citizen Side (Progressive Web App)

| Feature | Description |
|---------|-------------|
| **1‑Tap Emergency Button** | Two states: *I Am Safe* and *Need Urgent Assistance*. Each tap sends a geotagged signal instantly to the command hub. |
| **Predictive Safe Route Engine** | Analyses live rainfall forecasts, elevation models, and historical flood spots to calculate safe routes *before* water accumulates. |
| **Anonymous & Secure Reporting** | Submit community concerns without fear of retaliation. Reporter identity is cryptographically protected. |

###  Admin Side (City Command Dashboard)

| Feature | Description |
|---------|-------------|
| **Unified City Data Command Hub** | A single operational interface merging live citizen status feeds, rainfall gauges, and traffic sensors. |
| **Explainable AI Recommendation Engine** | Suggests tactical actions and explains step‑by‑step why a specific response was prioritised. |
| **Simulated Evacuation Planner** | Simulate severe rainfall scenarios to design, validate, and publish pre‑approved evacuation corridors. |
| **1‑Tap Emergency Status Receiver** | Automatically ingests and groups signals into a real‑time casualty and safety heatmap for first responders. |
| **AI Community Insight Dashboard** | Generates summaries, detects recurring issues, and predicts emerging community concerns before they escalate. |

---

## Key Functionality

- **Instant distress & safety broadcasting** – The 1‑Tap Emergency Button acts as a critical lifeline, transmitting the user’s status and precise GPS location.
- **AI‑driven report triage** – Incoming community reports are automatically classified, prioritised, and trend‑analysed, giving the LGU actionable intelligence without manual sifting.
- **Explainable decision support** – Every AI recommendation comes with human‑readable reasoning, so officials understand *why* a particular action is suggested.
- **Offline resilience** – As a PWA, core features remain functional even during partial network outages, critical when communication infrastructure is damaged.

---

## Technology Stack *(to be determined)*

The technology choices for the platform are currently under evaluation. They will be selected to ensure:

- **Fast and reliable offline experience** (Progressive Web App standards)
- **Real‑time geospatial processing** and routing
- **Explainable AI/ML** models for risk prediction and recommendation
- **Secure, scalable cloud infrastructure** that can withstand disaster‑area conditions

The final stack will be documented here once prototyping begins.

---

## Getting Started

Setup documentation is under development. The project is currently in its early design and prototyping phase. Detailed environment setup, local development, and deployment instructions will be provided as the codebase matures. For now, please watch this space or reach out to the maintainers for collaboration opportunities.

---

## Project Structure

The repository structure will be established as the project moves into active development. Initially it will be organised into separate modules for the client application, backend services, AI engine, documentation, and deployment scripts. A detailed tree will be added once the foundation is laid.

---

## Contributing

We welcome contributions that improve disaster resilience for vulnerable communities. Please:

1. Fork the repository and create a feature branch.
2. Ensure your code follows our style guides (to be added to the repository).
3. Write tests for new functionality.
4. Open a pull request with a clear description of changes and the problem it solves.

A detailed `CONTRIBUTING.md` will be available soon.

---

## Youth Participation

This project is built with strong youth involvement, focusing on **Governance and Environment**. Young developers, designers, and community organisers are encouraged to contribute, report issues, and help deploy the platform in real‑world drills.

---

## Alignment with Sustainable Development Goals

- **SDG 11** – Sustainable Cities and Communities: Strengthens local resilience and infrastructure transparency.
- **SDG 13** – Climate Action: Provides early warnings and data‑driven tools to adapt to climate‑related hazards.

---

## License

This project is licensed under the MIT License – see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements

- City Government of Santa Rosa for domain guidance and data access.
- PAGASA for real‑time rainfall and flood bulletins.
- OpenStreetMap contributors for base geospatial data.
- All residents and responders whose feedback shapes every feature.

---

*AGAP — because preparedness is everyone’s responsibility.*
