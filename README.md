# AGAP
### Advance Guidance & Assistance Platform

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)](#)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![SDG 11](https://img.shields.io/badge/SDG-11-orange)](#)
[![SDG 13](https://img.shields.io/badge/SDG-13-green)](#)

> **AGAP (Advance Guidance & Assistance Platform)** is an AI-powered Progressive Web Application (PWA) that enhances disaster preparedness and emergency response for Santa Rosa City through offline-first technology, real-time communication, geospatial intelligence, and explainable artificial intelligence.

---

# Overview

The City of Santa Rosa is highly vulnerable to natural hazards, including prolonged coastal inundation along Laguna de Bay, flash flooding across the Silang–Santa Rosa River Basin, and widespread power and communication outages during severe weather events.

During disasters, residents often struggle to access reliable emergency information, communicate with responders, or locate safe evacuation routes. Emergency management teams also face fragmented reports and limited situational awareness, delaying critical response efforts.

AGAP addresses these challenges by providing a resilient Progressive Web Application that continues operating even during unstable or unavailable internet connectivity. By combining offline capabilities, real-time communication, geospatial mapping, and artificial intelligence, AGAP strengthens disaster preparedness before, during, and after emergencies.

---

# Problem Statement

Santa Rosa City faces several challenges in disaster preparedness and emergency response:

- Limited access to localized emergency preparedness information.
- Communication failures during disasters due to power and network outages.
- Delayed reporting and coordination between citizens and emergency responders.
- Manual processing of community reports, resulting in slower response times.
- Lack of predictive tools that support emergency decision-making.
- Limited situational awareness for local government units during critical events.

---

# Proposed Solution

AGAP is a Progressive Web Application designed to improve disaster resilience by providing an accessible and reliable emergency response platform for both citizens and local government units.

The platform integrates:

- One-Tap Emergency SOS reporting with offline background sync
- Weather monitoring and alerts with multi-tier caching
- Interactive evacuation and flood zone maps
- Disaster preparedness guides (offline-accessible)
- Anonymous community reporting with AI classification
- Explainable AI advisory recommendations (Aegis)
- Predictive Flow Engine for route risk assessment
- Operational insight dashboard with trend detection

By leveraging cloud services, geospatial technologies, and artificial intelligence, AGAP enables faster emergency response, improves coordination, and supports data-driven disaster management.

---

# Core Features

## Citizen Application

| Feature | Description |
|---------|-------------|
| Weather Alerts | Displays real-time weather data with rainfall rate and risk severity. |
| One-Tap Emergency SOS | Instantly reports emergencies with GPS coordinates; offline dispatch via Workbox BackgroundSync. |
| Interactive Evacuation Map | Displays evacuation routes and flood zone overlays filtered by risk level. |
| Flow Engine | Predictive routing dashboard with rainfall-to-severity thresholds and live ticker. |
| Disaster Preparedness Guides | Offline-accessible SOPs for flood, typhoon, and earthquake scenarios. |
| Anonymous Community Reporting | Enables residents to submit disaster-related concerns with AI triage. |
| Offline Mode | Cached maps, guides, GPS coordinates, and SOS queue remain operational without internet. |

---

## Admin Dashboard

| Feature | Description |
|---------|-------------|
| Live SOS Monitoring | Receives emergency reports in real time via Supabase Realtime with atomic claim/resolve. |
| SOS Cluster Detection | Automatically groups 3+ SOS in same barangay within 30 minutes. |
| Community Reports Table | Multi-filter triage table with inline status and plausibility editing. |
| Hotspot Map | Incident density visualization per barangay with severity legend. |
| Aegis AI Advisory Panel | Gemini-powered recommendations that are advisory-only and human-gated. |
| Insight Dashboard | Operational metrics, category/priority breakdowns, resolution rates, and AI-generated 30-day summaries. |
| Stale Claim Reversion | Automatically reverts SOS claims older than 10 minutes. |

---

# Artificial Intelligence

AGAP integrates **Google Gemini 2.0 Flash** through secure Supabase Edge Functions to provide intelligent decision support while protecting API credentials.

Current AI capabilities include:

- Automatic disaster report classification (category, priority, department, plausibility)
- Aegis advisory recommendation engine (advisory-only, never auto-acts)
- 30-day community insight summarization and trend detection
- Explainable reasoning with step-by-step justification

Unlike traditional AI systems, AGAP provides transparent reasoning behind every recommendation, enabling emergency responders to understand why specific actions are suggested. AI is never on the critical path for SOS dispatch.

---

# Technology Stack

## Frontend

- Vue 3 (Composition API, `<script setup>`)
- Vite 5
- Progressive Web App (Vite Plugin PWA)
- Tailwind CSS 3
- Pinia (state management)
- Vue Router 4
- Leaflet.js + OpenStreetMap tiles
- Workbox (BackgroundSync, CacheFirst tiles)
- idb (IndexedDB wrapper)

## Backend

- Supabase
- PostgreSQL (7 tables, RLS, Realtime)
- Supabase Authentication (email/password)
- Supabase Realtime (WebSocket subscriptions)
- Supabase Edge Functions (Deno/TypeScript)

## Artificial Intelligence

- Google Gemini 2.0 Flash
- Prompt Engineering
- Explainable AI

## External Services

- OpenWeatherMap API
- OpenStreetMap Tiles

---

# Offline-First Architecture

AGAP is designed with disaster resilience as its primary objective.

Even when internet connectivity becomes unavailable, users can continue accessing essential emergency services, including:

- Disaster preparedness guides (bundled markdown)
- Cached evacuation maps and flood zones (bundled GeoJSON)
- Cached GPS location (IndexedDB)
- SOS queue (Workbox BackgroundSync, 24-hour retention)
- Progressive Web App installation
- Offline navigation interface

Workbox handles caching of application assets and Leaflet map tiles (30-day TTL, 1000-entry limit). IndexedDB securely stores the user's latest GPS coordinates, ensuring SOS messages remain useful during communication outages.

---

# System Architecture

```
+-------------------------+    +-------------------------+
|   Citizen Application   |    |   Admin Dashboard       |
|   (Vue 3 PWA)           |    |   (Vue 3 PWA)           |
|   /app/* routes         |    |   /admin/* routes       |
+-----------+-------------+    +------------+------------+
            |                               |
            v                               v
+-------------------------------------------------------+
|                  Supabase Backend                       |
|  ┌──────────┐ ┌──────────┐ ┌────────────────────────┐ |
|  │PostgreSQL │ │   Auth   │ │    Edge Functions       │ |
|  │ 7 tables  │ │  Email/  │ │  ┌──────────────────┐  │ |
|  │ RLS +     │ │  Password│ │  │ classify-report  │  │ |
|  │ Realtime  │ │          │ │  │ aegis-advisor    │  │ |
|  │           │ │          │ │  │ generate-insight │  │ |
|  └──────────┘ └──────────┘ │  └────────┬─────────┘  │ |
+----------------------------+-----------+--------------+
                              ┌──────────┴──────────┐
                              │  Gemini 2.0 Flash AI │
                              └─────────────────────┘
```

---

# Development Roadmap

## Milestone 1-3 (Completed)

- Progressive Web Application shell
- Weather alerts with multi-tier caching
- One-Tap SOS with BackgroundSync
- Disaster Preparedness Guides (3 bundled markdown SOPs)
- Evacuation Maps with route overlays
- Anonymous Community Reports with AI classification
- Live Admin Dashboard with real-time subscriptions
- Aegis AI Advisory engine (advisory-only, outcome-logged)
- Insight Dashboard with computed metrics

## Milestone 4-6 (Completed)

- Aegis fallback/outcome logging hardened
- Flow Engine predictive routing (rainfall -> severity -> route risk)
- Explicit Workbox worker for SOS BackgroundSync, tile caching, GPS refresh
- Production build passing with clean smoke tests
- PWA manifest, icons, service worker installable

## Future

- Live Supabase/Edge Function verification with real secrets
- Installed-PWA verification on device
- Enhanced flood simulation scenarios
- Push notifications
- Multi-language support

---

# Project Structure

```
AGAP/
│
├── src/                   # Vue 3 Application
│   ├── main.js            # App entry point
│   ├── App.vue            # Root component
│   ├── lib/               # Supabase client
│   ├── router/            # Vue Router config
│   ├── stores/            # 7 Pinia stores
│   ├── composables/       # 4 Vue composables
│   ├── components/        # Reusable components
│   ├── layouts/           # Citizen + Admin layouts
│   ├── views/
│   │   ├── citizen/       # 7 citizen pages
│   │   └── admin/         # 6 admin pages
│   ├── data/              # Bundled GeoJSON
│   ├── guides/            # Markdown disaster guides
│   └── assets/            # Global CSS
├── supabase/
│   ├── functions/         # 3 Edge Functions (Deno)
│   └── migrations/        # DB schema + RLS + Realtime
├── document/              # Documentation
├── dist/                  # Production build output
├── .env.example           # Environment template
├── vite.config.js         # Build config + PWA
├── tailwind.config.js     # Tailwind theme
└── README.md
```

---

# Installation

## Prerequisites

- Node.js 18+
- npm

## Clone the repository

```bash
git clone https://github.com/your-organization/agap.git
```

## Navigate into the project

```bash
cd agap
```

## Install dependencies

```bash
npm install
```

## Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase project credentials and API keys.

## Start the development server

```bash
npm run dev
```

## Production build

```bash
npm run build
npm run preview
```

---

# Future Enhancements

The following features are planned for future releases:

- Live Supabase Edge Function verification with real secrets
- Installed-PWA end-to-end verification
- Push notifications for critical alerts
- Advanced flood simulation scenarios
- Barangay-level disaster analytics
- Multi-language support
- Enhanced offline mapping with vector tiles

---

# Sustainable Development Goals

This project supports the following United Nations Sustainable Development Goals:

- SDG 11 — Sustainable Cities and Communities
- SDG 13 — Climate Action

---

# Youth Participation

AGAP encourages youth participation in disaster resilience through innovation, technology, governance, and environmental stewardship. The platform empowers young developers and community members to contribute ideas that strengthen local disaster preparedness and emergency response.

---

# Contributing

Contributions are welcome.

To contribute:

1. Fork the repository.
2. Create a feature branch.

```bash
git checkout -b feature/new-feature
```

3. Commit your changes.

```bash
git commit -m "Add new feature"
```

4. Push your branch.

```bash
git push origin feature/new-feature
```

5. Open a Pull Request.

Please ensure that your code follows the project's coding standards and includes appropriate documentation.

---

# License

This project is licensed under the MIT License.

See the **LICENSE** file for more information.

---

# Acknowledgements

The AGAP team extends its appreciation to:

- City Government of Santa Rosa
- City Disaster Risk Reduction and Management Office (CDRRMO)
- PAGASA
- OpenStreetMap Contributors
- Supabase
- Google Gemini
- The AGAP Development Team

---

## AGAP

**Advance Guidance & Assistance Platform**

Preparedness Today. Resilience Tomorrow.

An AI-powered, offline-first disaster preparedness platform that empowers citizens and supports emergency responders through reliable communication, intelligent decision support, and resilient technology.
