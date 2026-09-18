# Axelo Safari Suite — Operations & Fleet Intelligence System

[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-purple.svg)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Auth%20%7C%20Firestore%20%7C%20Functions-orange.svg)](https://firebase.google.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-cyan.svg)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)](https://web.dev/progressive-web-apps/)

**Axelo Safari Suite** is an enterprise-grade tour operations, fleet telematics, and field safety intelligence platform built specifically for safari operators, destination management companies (DMCs), and wilderness excursion providers across East Africa.

Developed in collaboration with premier safari operators including Eastern Vacations, the platform replaces fragmented spreadsheets, manual radio dispatch, and disconnected paper manifests with a real-time, mission-critical operations dashboard.

---

## 🌍 The Problem Tour Operators Face

Safari and expedition operators manage complex, high-stakes logistics across harsh and remote terrains. Traditional operations suffer from severe operational friction:

1. **Logistics & Dispatch Blind Spots:**
   Fleet controllers rely on manual calls or WhatsApp to locate safari cruisers and guides across vast national reserves with patchy cellular coverage.
2. **Pre-Departure Vulnerabilities:**
   Safaris depart with unassigned 4x4 vehicles, unverified driver schedules, or uncollected client balances because reservations and dispatch live in separate silos.
3. **Severe Weather & Terrain Hazards:**
   Flash floods, muddy black-cotton soil, and sudden storms can trap vehicles and jeopardize guest safety without localized, park-specific environmental forecasting.
4. **Emergency Telemetry Vacuum:**
   When mechanical breakdowns, wildlife encounters, or medical emergencies occur in the bush, drivers lack a one-touch emergency channel that broadcasts precise GPS coordinates to the operations base.
5. **Vehicle Compliance & Maintenance Risks:**
   Lapses in PSV insurance, commercial inspection certificates, or routine servicing lead to impounded cruisers and stranded high-value itineraries.

---

## ⚡ How Axelo Software Solves It

Axelo Safari Suite bridges reservation management, field fleet telematics, and autonomous operational safeguards into a single, cohesive command center.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          AXELO COMMAND CENTER                          │
├───────────────────┬────────────────────┬───────────────────────────────┤
│  RESERVATIONS     │  FLEET TELEMETRY   │     AI WATCHDOG & WEATHER     │
│  • Booking Engine │  • Live GPS Map    │  • 10-Park Weather Intel      │
│  • Guest Manifest │  • Status Ticker   │  • Terrain Safari Advisories  │
│  • Vouchers & Invs│  • Driver Roster   │  • Automated 7/3/1 Day Sweeps │
│  • Payment Ledger │  • Maintenance Log │  • Real-time SOS Dispatch     │
└───────────────────┴────────────────────┴───────────────────────────────┘
```

---

## 🚀 Key Features

### 1. 🌦️ Park-Specific Weather Intelligence & Safari Advisories
* **Real-time Monitoring across 10 National Parks:**
  Dedicated tracking for *Aberdare, Amboseli, Lake Nakuru, Maasai Mara, Meru, Mount Kenya, Nairobi National Park, Samburu, Tsavo East, and Tsavo West*.
* **Rule-Based Safari Advisory Engine:**
  Translates ambient heat, precipitation, wind gusts, and cloud cover into actionable safari guidance:
  * 4x4 diff-lock and recovery gear advisories on slick black-cotton tracks.
  * Pop-up roof management and predator photography diffuse lighting recommendations.
  * Early sunrise cold weather notices in high-altitude zones (Mount Kenya, Aberdares).
* **Automated & Scheduled Sync:**
  Dual-engine ingestion (OpenWeatherMap API with automated Open-Meteo fallback) powered by Firebase Cloud Functions.

### 2. 🗺️ Live Fleet Tracking & Dispatch Control
* **Real-Time Vehicle Coordinates:** Interactive map displaying cruiser locations, current heading, driver assignments, and vehicle health statuses.
* **Driver Roster & Shift Management:** Driver certification records, language proficiencies, current trip assignments, and shift availability.
* **Vehicle Maintenance & Compliance Watchdog:** Real-time auditing of vehicle mileage, routine service milestones, and PSV insurance validity.

### 3. 🚨 Instant SOS & Crisis Management Command
* **One-Touch Emergency Protocol:** Field drivers can trigger instant SOS alerts directly from the mobile interface.
* **Geotagged Crisis Feeds:** Captures vehicle coordinates, emergency severity (`CRITICAL`, `HIGH`, `INFO`), and emergency category (Mechanical, Medical, Security, Weather).
* **Command Center Resolution Workflow:** Operations team can assign recovery teams, track incident resolution, and archive audit logs.

### 4. 🤖 Autonomous Operations Watchdog (AI Engine)
* **Pre-Departure Readiness Sweeps:** Scheduled background sweeps audit all upcoming trips:
  * **7 Days Before Departure:** Early verification of logistics requirements.
  * **3 Days Before Departure:** Flags unassigned drivers, unallocated vehicles, or incomplete payments.
  * **24 Hours Before Departure:** Generates high-priority alerts with departure times and pickup manifests.
* **Insurance Expiry Watchdog:** Alerts management 7 days before PSV insurance expires and triggers lockdown alerts on day of expiry.

### 5. 📋 End-to-End Booking & Manifest Engine
* **Complete Safari Lifecycle:** Draft $\rightarrow$ Confirmed $\rightarrow$ In Progress $\rightarrow$ Completed $\rightarrow$ Cancelled.
* **Guest Manifests & Rooming Lists:** Group allocations, dietary restrictions, passport tracking, and emergency contacts.
* **Financial Ledger:** Track deposits, balances, and multi-channel payment statuses.

### 6. 🔐 Enterprise Security & Granular RBAC
* **Role-Based Access Control:** Strict authorization boundaries enforced at the database level:
  * **Administrators:** Full system configuration, fleet management, and overrides.
  * **Reservation Agents:** Booking creation, guest communications, and itinerary scheduling.
  * **Field Personnel / Drivers:** Mobile dashboard, manifest access, and SOS signaling.
* **Multi-Tier Firebase Security Rules:** Fine-grained document security preventing cross-role data leaks.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Core** | React 18, Vite 6 | Lightning-fast reactive interface with hot module replacement |
| **Styling & Design** | TailwindCSS, Lucide Icons | Safari luxury palette (Gold, Deep Emerald, Rich Dark Surface) |
| **State & Navigation** | React Router v6, React Context | Uncluttered state management with route guards |
| **Backend & Database** | Firebase Cloud Firestore | Low-latency real-time synchronization across devices |
| **Authentication** | Firebase Auth | Secure identity with custom claims and token refresh guards |
| **Serverless Engine** | Firebase Cloud Functions (v2) | Automated cron jobs, operations sweeps, and callable endpoints |
| **Offline & PWA** | Vite PWA Plugin, Workbox | Offline manifest support for low-connectivity safari camps |
| **Mapping & Analytics** | Leaflet, Recharts | Geo-spatial fleet tracking and 12-month historical climate trends |

---

## 📂 Project Structure

```
axelo-software/
├── functions/                  # Firebase Cloud Functions (Node.js)
│   └── index.js                # Scheduled syncs, Operations Watchdog & manual sweeps
├── public/                     # PWA assets, icons, and audio telemetry alerts
├── src/
│   ├── components/             # Reusable UI cards, badges, modals, and navbars
│   ├── config/                 # Firebase SDK singletons (db, auth, functions)
│   ├── contexts/               # Auth, Data, Theme, and AI Manager contexts
│   ├── pages/
│   │   ├── admin/              # Fleet, Drivers, Bookings, SOS Alerts, Settings
│   │   ├── auth/               # Secure Login & Password Recovery
│   │   ├── reservations/       # Booking intake and agent portal
│   │   └── shared/             # Weather Intelligence & upcoming itineraries
│   ├── services/               # Weather and telematics integration services
│   └── utils/                  # Safe date parsers, rate limiters, logging tools
├── firestore.rules             # Production Firestore security and RBAC logic
└── vite.config.js              # Vite bundler, PWA setup, and build configuration
```

---

## 🏁 Getting Started

### Prerequisites
* **Node.js**: v18.x or v20.x
* **npm**: v9.x or higher
* **Firebase CLI**: `npm install -g firebase-tools`

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Manukyalo/Axelo-software.git
   cd Axelo-software
   ```

2. **Install frontend dependencies:**
   ```bash
   npm install
   ```

3. **Install Cloud Functions dependencies:**
   ```bash
   cd functions && npm install && cd ..
   ```

4. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_OPENWEATHER_API_KEY=your_openweather_api_key
   ```

5. **Start Local Development Server:**
   ```bash
   npm run dev
   ```

6. **Build for Production:**
   ```bash
   npm run build
   ```

---

## 🛡️ Security & Compliance

* **Database Rules:** Strict Firestore rules enforce role checks on every read and write operation.
* **Audit Trail:** Immutable append-only operational event logs for compliance and incident tracking.
* **Environment Protection:** No sensitive secrets or private API keys committed to version control.

---

## 📜 License & Ownership

Proprietary enterprise software developed by **Axelo Software** for **Eastern Vacations System**. All rights reserved.
