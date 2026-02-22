# SubTracker — Subscription Management Platform

Track every subscription, save every riyal. Free, open-source, bilingual (Arabic/English) subscription management platform.

## Tech Stack

- **Frontend:** HTML5 + CSS3 + Vanilla JavaScript (ES6+)
- **Backend:** Firebase (Auth, Firestore, Cloud Functions, FCM)
- **Design:** CSS Custom Properties + BEM, Mobile-first responsive
- **PWA:** Installable, offline-capable

## Getting Started

1. Clone the repository
2. Serve with any static server (e.g., `npx serve .` or VS Code Live Server)
3. Firebase is pre-configured — authentication and database are ready

## Project Structure

```text
subscriptionsAI/
├── index.html              # Main entry point
├── manifest.json           # PWA manifest
├── firebase.json           # Firebase hosting config
├── firestore.rules         # Firestore security rules
├── firestore.indexes.json  # Firestore composite indexes
├── css/
│   ├── variables.css       # Design tokens (colors, spacing, typography)
│   ├── reset.css           # CSS reset
│   ├── base.css            # Global styles
│   ├── components.css      # Reusable components (buttons, inputs, etc.)
│   ├── layout.css          # App shell layout (header, sidebar, nav)
│   ├── auth.css            # Authentication page styles
│   ├── responsive.css      # Breakpoint-based responsive rules
│   └── animations.css      # Keyframes and transitions
├── js/
│   ├── app.js              # Main application entry point
│   ├── config/
│   │   └── firebase.js     # Firebase initialization
│   ├── modules/
│   │   ├── i18n.js         # Internationalization (AR/EN)
│   │   ├── theme.js        # Dark/Light/Auto theme
│   │   ├── router.js       # Hash-based page router
│   │   └── toast.js        # Toast notifications
│   └── services/
│       └── auth.js         # Firebase Auth service
├── locales/
│   ├── en.json             # English translations
│   └── ar.json             # Arabic translations
├── assets/
│   ├── icons/              # App icons and favicons
│   └── images/             # Static images
└── docs/
    └── SubTracker-PRD.md   # Product Requirements Document
```

## License

Free & Open Source
