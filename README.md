# SubTracker — اشتراكاتي

**Track Every Subscription, Save Every Riyal**

تتبّع كل اشتراك، وفّر كل ريال

[![Live Demo](https://img.shields.io/badge/Live-Demo-7C3AED?style=for-the-badge)](https://f2lcon01.github.io/subscriptionsAI/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](#license)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen?style=for-the-badge)](https://github.com/F2lcon01/subscriptionsAI/pulls)

---

## About

SubTracker is a **free, open-source** web application for managing and tracking digital subscriptions. It provides a centralized dashboard to monitor recurring expenses, store login credentials securely, receive smart renewal alerts, and gain financial insights — all in **Arabic (RTL) and English (LTR)**.

**Live Demo:** [https://f2lcon01.github.io/subscriptionsAI/](https://f2lcon01.github.io/subscriptionsAI/)

---

## Features

### Core
- **Authentication** — Email/Password + Google Sign-In via Firebase
- **Subscription CRUD** — Add, edit, delete, pause, reactivate subscriptions
- **Quick Select** — 25+ popular services (Netflix, Spotify, ChatGPT, Shahid, etc.)
- **Dashboard** — Monthly/yearly totals, upcoming renewals, category breakdown
- **Bilingual** — Full Arabic (RTL) + English (LTR) with seamless switching
- **Dark/Light Theme** — Auto-detection + manual toggle
- **Responsive** — Works on all screen sizes (320px to 2560px+)
- **PWA** — Installable, offline-capable with Service Worker caching

### Financial
- **Multi-Currency** — SAR, USD, EUR, GBP, AED, KWD, and more (11 currencies)
- **Currency Auto-Conversion** — Real-time exchange rates via open API
- **Family/Shared Subscriptions** — Cost splitting with per-person calculations
- **Free Trial Tracker** — Countdown timer + auto-alerts before conversion
- **Billing Cycles** — Weekly, monthly, quarterly, semi-annual, yearly

### Security
- **Encrypted Credentials** — AES-256-GCM encryption via Web Crypto API
- **Master Password** — PBKDF2 key derivation, never stored in plaintext
- **Panic Mode** — Instant lock (Ctrl+Shift+L) with stealth screen + auto-lock timer

### Analytics & Reports
- **Monthly Reports** — Spending trends, category breakdowns, top subscriptions (Chart.js)
- **Calendar View** — Gregorian + Hijri dual calendar with renewal tracking
- **Smart Insights** — Lifetime costs, spending velocity, cost forecasts
- **Smart Alerts** — Duplicate detection, savings opportunities, unused subscription warnings
- **Yearly Wrapped** — Spotify-style annual subscription report

### Tools
- **Password Health Check** — Analyze stored credential strength
- **Subscription Calculator** — "What if" cancel scenarios
- **Quick Links Hub** — Jump to subscription management pages
- **Expense Splitter** — Shared subscription cost calculator
- **Data Export** — CSV and PDF export
- **CSV Import** — Bulk import subscriptions from spreadsheet

### Social & Sharing
- **Team Sharing** — Read-only share links for collaborators
- **Social Sharing** — Share your subscription stack (costs/credentials hidden)

### AI & Gamification
- **AI Companion (BYOK)** — Bring your own API key (Google Gemini / OpenAI)
- **Gamification** — XP system, 5 levels, 8+ achievement badges, Subscription Score (0-100)
- **Push Notifications** — Browser notifications + FCM for upcoming renewals

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | HTML5, CSS3, Vanilla JavaScript (ES6+) |
| **Backend** | Firebase Auth, Firestore, Cloud Messaging |
| **Encryption** | Web Crypto API (AES-256-GCM + PBKDF2) |
| **Charts** | Chart.js 4.4.1 |
| **PDF Export** | jsPDF 2.5.1 |
| **CSV Import** | PapaParse 5.4.1 |
| **PWA** | Service Worker with cache-first strategy |
| **Hosting** | GitHub Pages |
| **CSS** | BEM methodology, CSS Custom Properties, CSS Logical Properties for RTL |
| **Fonts** | Inter + IBM Plex Sans Arabic |

---

## Project Structure

```
subscriptionsAI/
├── index.html                    # Single-page application entry
├── manifest.json                 # PWA manifest
├── sw.js                         # Service Worker
├── firebase-messaging-sw.js      # FCM background handler
├── css/                          # 18 modular CSS files
│   ├── variables.css             # Design tokens & theming
│   ├── base.css                  # Global styles
│   ├── components.css            # Reusable UI components
│   ├── layout.css                # Grid/flexbox structure
│   ├── responsive.css            # Mobile breakpoints
│   ├── animations.css            # Micro-interactions
│   └── ...                       # Page-specific styles
├── js/
│   ├── config/firebase.js        # Firebase configuration
│   ├── modules/                  # UI modules (15 files)
│   │   ├── i18n.js               # Internationalization
│   │   ├── theme.js              # Dark/light mode
│   │   ├── router.js             # Hash-based SPA routing
│   │   ├── dashboard.js          # Dashboard rendering
│   │   ├── calendar.js           # Calendar view
│   │   ├── reports.js            # Charts & analytics
│   │   ├── settings.js           # User preferences
│   │   ├── panic-mode.js         # Emergency lock
│   │   ├── mini-apps.js          # Tools platform
│   │   ├── yearly-wrapped.js     # Annual report
│   │   └── ...
│   ├── services/                 # Backend services (13 files)
│   │   ├── auth.js               # Authentication
│   │   ├── subscriptions.js      # Firestore CRUD
│   │   ├── crypto.js             # AES-256-GCM encryption
│   │   ├── ai-companion.js       # AI chat integration
│   │   ├── notifications.js      # Push notifications
│   │   ├── gamification.js       # XP, levels, badges
│   │   ├── currency.js           # Exchange rates
│   │   ├── insights.js           # Smart analytics
│   │   ├── alerts.js             # Smart alerts
│   │   └── ...
│   └── app.js                    # Application bootstrap
├── locales/
│   ├── en.json                   # English translations (430+ keys)
│   └── ar.json                   # Arabic translations (430+ keys)
└── docs/
    └── SubTracker-PRD.md         # Product Requirements Document
```

---

## Getting Started

### Prerequisites
- A modern web browser (Chrome, Firefox, Safari, Edge)
- A Firebase project (for authentication and database)

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/F2lcon01/subscriptionsAI.git
   cd subscriptionsAI
   ```

2. **Configure Firebase**

   Update `js/config/firebase.js` with your Firebase project credentials:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT.firebasestorage.app",
     messagingSenderId: "YOUR_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```

3. **Set up Firestore Rules**

   In your Firebase Console, set up security rules to allow authenticated users to read/write their own data.

4. **Serve locally**

   Use any static file server:
   ```bash
   npx serve .
   # or
   python -m http.server 8000
   ```

   Or use **Live Server** in VS Code.

5. **Open in browser** — Navigate to `http://localhost:8000`

> Firebase is pre-configured in the live demo — authentication and database are ready to use.

---

## Architecture

SubTracker follows an **IIFE module pattern** — each module is a self-contained function that exposes a public API:

```javascript
const Module = (function() {
  'use strict';
  // Private state and methods
  function render() { /* ... */ }
  // Public API
  return { render: render };
})();
```

**Key Patterns:**
- **No build tools** — Pure vanilla JS, loaded via `<script>` tags
- **Hash-based routing** — `#/dashboard`, `#/subscriptions`, `#/calendar`, etc.
- **Real-time sync** — Firestore `onSnapshot` listeners for live data updates
- **BEM CSS** — Block-Element-Modifier naming convention
- **CSS logical properties** — `margin-inline-start` for automatic RTL support

---

## Competitor Comparison

| Feature | Wallos | Bobby | Rocket Money | **SubTracker** |
|---------|--------|-------|-------------|----------------|
| Arabic/RTL | - | - | - | Full Support |
| Password Manager | - | - | - | AES-256 Encrypted |
| Team Sharing | - | - | - | Read-only Links |
| Price | Free (self-hosted) | $1.99 | $7-12/mo | **Free Forever** |
| Gamification | - | - | - | Levels + Badges |
| AI Assistant | - | - | - | BYOK |
| Yearly Wrapped | - | - | - | Animated Report |
| Mini-Apps | - | - | - | 4 Tools |
| Panic Mode | - | - | - | Instant Lock |
| Hijri Calendar | - | - | - | Dual Calendar |

---

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with Vanilla JS + Firebase
  <br>
  <strong>اشتراكاتي</strong> — تتبّع كل اشتراك، وفّر كل ريال
</p>
