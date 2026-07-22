# AGAP
### Advance Guidance & Assistance Platform

[![PWA Ready](https://img.shields.io/badge/PWA-ready-brightgreen)](#)
[![Vue 3](https://img.shields.io/badge/Vue-3-42b883)](#)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38BDF8)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![SDG 11](https://img.shields.io/badge/SDG-11-orange)](#)
[![SDG 13](https://img.shields.io/badge/SDG-13-green)](#)

> **AGAP (Advance Guidance & Assistance Platform)** is an AI-powered Progressive Web Application (PWA) that enhances disaster preparedness and emergency response through offline-first technology, real-time communication, geospatial intelligence, and explainable artificial intelligence.

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

- One-Tap Emergency SOS reporting
- Offline SMS emergency fallback
- Weather monitoring and alerts
- Interactive evacuation maps
- Disaster preparedness guides
- Anonymous community reporting
- AI-assisted report classification
- Explainable AI recommendations for emergency responders

By leveraging cloud services, geospatial technologies, and artificial intelligence, AGAP enables faster emergency response, improves coordination, and supports data-driven disaster management.

---

# Core Features

## Citizen Application

| Feature | Description |
|---------|-------------|
| Weather Alerts | Displays real-time weather forecasts and severe weather advisories. |
| One-Tap Emergency SOS | Allows users to instantly report emergencies or indicate they are safe while transmitting GPS coordinates. |
| SMS Emergency Fallback | Generates an emergency SMS message automatically when internet connectivity is unavailable. |
| Evacuation Routes | Displays evacuation routes using interactive maps with offline support. |
| Disaster Preparedness Guides | Provides offline-accessible disaster preparedness information. |
| Anonymous Community Reporting | Enables residents to submit disaster-related concerns anonymously. |
| Offline Mode | Core application features remain accessible without an internet connection. |

---

## Admin Dashboard

| Feature | Description |
|---------|-------------|
| Live SOS Monitoring | Receives emergency reports in real time using Supabase Realtime. |
| SOS Map View | Displays active emergency reports on an interactive map. |
| Community Insight Dashboard | Visualizes community reports, trends, and analytics. |
| AI Report Classification | Automatically categorizes reports according to disaster type, urgency, and responsible department. |
| Explainable AI Recommendation Engine (Aegis) | Generates emergency response recommendations with clear reasoning for decision-makers. |
| Trend Detection | Identifies recurring issues and emerging disaster patterns using historical reports. |

---

# Artificial Intelligence

AGAP integrates **Google Gemini 2.0 Flash** through secure Supabase Edge Functions to provide intelligent decision support while protecting API credentials.

Current AI capabilities include:

- Automatic disaster report classification
- Community report summarization
- Trend analysis
- Priority assessment
- Explainable emergency recommendations through the Aegis Recommendation Engine

Unlike traditional AI systems, AGAP provides transparent reasoning behind every recommendation, enabling emergency responders to understand why specific actions are suggested.

---

# Technology Stack

## Frontend

- Vue 3
- Vite
- Progressive Web App (Vite PWA)
- Tailwind CSS
- Pinia
- Vue Router
- Leaflet.js
- Workbox

## Backend

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Realtime
- Supabase Edge Functions
- Supabase Storage

## Artificial Intelligence

- Google Gemini 2.0 Flash
- Prompt Engineering
- Explainable AI

## External Services

- OpenWeatherMap API
- Native SMS Intent

---

# Offline-First Architecture

AGAP is designed with disaster resilience as its primary objective.

Even when internet connectivity becomes unavailable, users can continue accessing essential emergency services, including:

- Disaster preparedness guides
- Cached evacuation maps
- Cached GPS location
- SMS emergency reporting
- Progressive Web App installation
- Offline navigation interface

Workbox handles caching of application assets while IndexedDB securely stores the user's latest GPS coordinates, ensuring emergency messages remain useful during communication outages.

---

# System Architecture

```
Citizen Application (PWA)
            │
            ▼
      Vue 3 + Vite PWA
            │
            ▼
      Supabase Backend
      ├── PostgreSQL
      ├── Authentication
      ├── Realtime
      ├── Storage
      └── Edge Functions
            │
            ▼
     Gemini 2.0 Flash AI
            │
            ▼
      Admin Dashboard
```

---

# Development Roadmap

## Phase 1

- Progressive Web Application
- Weather Alerts
- One-Tap SOS
- SMS Emergency Fallback
- Disaster Preparedness Guides
- Evacuation Maps
- Community Reports
- Live Admin Dashboard

## Phase 2

- AI Report Classification
- Community Insight Dashboard
- Explainable AI Recommendation Engine
- Trend Detection
- Dashboard Analytics

## Phase 3

- Predictive Safe Route Engine
- Dynamic Flood Risk Overlay
- Advanced AI Decision Support
- Enhanced Disaster Simulation

---

# Project Structure

```
AGAP/
│
├── client/                 # Vue 3 Progressive Web Application
├── admin/                  # Admin Dashboard
├── supabase/
│   ├── migrations/
│   ├── edge-functions/
│   └── storage/
├── public/
├── assets/
├── docs/
└── README.md
```

---

# Installation

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

## Start the development server

```bash
npm run dev
```

---

# Future Enhancements

The following features are planned for future releases:

- Predictive Safe Route Engine
- Dynamic Flood Risk Visualization
- AI-powered Resource Allocation
- Push Notifications
- Barangay-level Disaster Analytics
- Multi-language Support
- Disaster Drill Simulation
- Enhanced Offline Mapping

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
