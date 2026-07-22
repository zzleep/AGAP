# AGAP  
**Advance Guidance & Assistance Platform**

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![SDG 11](https://img.shields.io/badge/SDG-11-orange)](#)
[![SDG 13](https://img.shields.io/badge/SDG-13-green)](#)

> **AGAP** is an ultra-resilient, zero-install Progressive Web App that turns every smartphone into a lifeline – closing the gap between citizens and first responders when severe weather strikes Santa Rosa City.

---

## Problem Statement

Santa Rosa City faces devastating impacts during severe weather events: month-long coastal inundation along Laguna de Bay, rapid flash flooding across the Silang–Santa Rosa river basin, and frequent power and communication grid failures.  

Most residents remain critically vulnerable. They lack emergency preparedness tools, localized early warning systems, and **offline-capable** communication channels. On the ground, local emergency response units struggle with limited real-time situational awareness – a gap that severely hinders quick, coordinated action when every minute counts.

---

## Solution

Where traditional infrastructure fails, lightweight, accessible technology creates a lifeline.  

AGAP is a **zero-install Progressive Web App (PWA)** that uses local caching and lightweight predictive mapping to function even when networks are down. It bridges the critical gap between citizens and first responders during a disaster – instantly broadcasting safety statuses, guiding people along safe routes, and delivering real-time intelligence to the command center.  

This is not just another disaster app. It’s a digital infrastructure layer that transforms Santa Rosa’s disaster response capabilities and offers a scalable blueprint for climate resilience across vulnerable coastal cities – bringing us one solution closer to becoming an internationally certified smart city.

---

## How It Works

1. **Before the storm** – Citizens receive early weather alerts and can review pre-validated disaster guides and evacuation routes.  
2. **During the emergency** – A single tap broadcasts “I Am Safe” or “Need Urgent Assistance” with GPS coordinates. The app works offline and queues data for when connectivity returns.  
3. **On the command side** – The admin dashboard ingests live citizen signals, rainfall gauges, and sensor data. AI models suggest tactical actions and surface emerging community threats.  
4. **After the event** – Anonymous reporting lets residents flag damaged infrastructure, unsafe areas, or other concerns, helping the LGU prioritize recovery efforts.

---

## Features

### Currently Available (MVP)

| Feature | Description |
|---------|-------------|
| **Weather Alert** | Push notifications for severe weather advisories based on PAGASA bulletins. |
| **SOS Button** | Instant distress signal with location sharing (initial version). |
| **Evacuation Route** | Pre-mapped evacuation corridors and assembly points. |
| **Disaster Guide** | Offline-first emergency preparedness information and checklists. |

### Proposed Features (Roadmap)

#### Citizen Side

| Feature | Phase | Description |
|---------|-------|-------------|
| **1‑Tap Emergency Button** (revamp) | Phase 1 | Dual-state action: *I Am Safe* / *Need Urgent Assistance*. When online, transmits precise geotagged GPS coordinates; offline, queues the signal for automatic send when connectivity resumes. |
| **Predictive Safe Route Engine** (Flow Engine) | Phase 2 | Analyses live rainfall forecasts, elevation models, drainage capacities, and historical flood spots to calculate accessible routes *before* water accumulates on roads. |
| **Anonymous & Secure Reporting** | Phase 2 | Youth and residents can submit community concerns without fear of retaliation. Reporter identity is cryptographically protected. |

#### Admin Side (City Command Dashboard)

| Feature | Phase | Description |
|---------|-------|-------------|
| **AI Community Insight Dashboard** | Phase 1 | Generates summaries, detects recurring issues, and visualizes trends through charts and analytics. Predicts emerging community concerns by analysing historical reports. |
| **AI Smart Report Classification** | Phase 2 | Automatically classifies incoming reports (e.g., bullying, unsafe areas, infrastructure, environment, mental health) and assigns priority levels, recommending the appropriate LGU department. |
| **Explainable AI Recommendation Engine (Aegis)** | Phase 2 | Suggests specific tactical actions (e.g., “Deploy 2 rescue boats to Barangay Sinkang and close Manila South Road at Segment 4”) with step-by-step reasoning explaining why the response was prioritised. |
| **1‑Tap Emergency Status Receiver** | Phase 1 | Ingest and group citizen signals into a real-time safety and casualty heatmap for first responders. |
| **Simulated Evacuation Planner** | Phase 2 | Simulate severe rainfall scenarios to design, validate, and publish pre-approved evacuation corridors. |

---

## Alignment with Sustainable Development Goals

- **SDG 11** – Sustainable Cities and Communities  
  Strengthens local resilience, infrastructure transparency, and inclusive community participation.

- **SDG 13** – Climate Action  
  Delivers early warnings, data-driven adaptation tools, and proactive disaster risk reduction for climate-vulnerable cities.

---

## Youth Participation

This project is driven by youth, with a focus on **Governance and Environment**. Young developers, designers, and community organisers are central to building, testing, and deploying the platform in real-world drills. AGAP empowers youth to shape their city’s disaster preparedness and environmental monitoring.

---

## Technology Stack *(to be determined)*

Tech choices will be evaluated to meet strict requirements:

- **Offline resilience** – PWA with service workers and local caching for use during network outages.
- **Real-time geospatial processing** – Lightweight mapping and routing engines that work on low-bandwidth connections.
- **Explainable AI/ML** – Models that provide transparent, human-readable reasoning for every recommendation.
- **Scalable, secure cloud infrastructure** – Built to survive disaster-area conditions.

The final stack will be documented once prototyping begins.

---

## Getting Started

Setup documentation is under development. The project is currently in its early design and prototyping phase. Detailed environment setup, local development, and deployment instructions will be provided as the codebase matures. For now, please watch this space or reach out to the maintainers for collaboration opportunities.

---

## Project Structure

The repository will be organised into modular components once active development starts:

- Client application (PWA frontend)
- Backend API and real‑time services
- AI/ML pipeline (data processing, model training, explainability)
- Documentation and deployment scripts

A detailed tree will be added when the foundation is laid.

---

## Contributing

We welcome contributions that improve disaster resilience for vulnerable communities. Please:

1. Fork the repository and create a feature branch.
2. Ensure your code follows our style guides (to be added to the repository).
3. Write tests for new functionality.
4. Open a pull request with a clear description of changes and the problem it solves.

A detailed `CONTRIBUTING.md` will be available soon.

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
