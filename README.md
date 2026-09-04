# Askoquizet

A mobile-first live quiz app. Teams join on their phones with a code, avatar and
name; the quizmaster builds segments/questions (multiple choice or text answer,
with optional images) and drives the quiz live from an admin panel.

Frontend is a static site (React + Vite + Tailwind) deployable to **GitHub
Pages**. Data, realtime sync and auth run on **Firebase** (Firestore +
Anonymous Auth) — no custom backend to host. Question images are linked by
URL rather than uploaded, so Firebase Storage (which now requires a billing
account) isn't needed.

## One-time setup

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and create a project (free Spark plan is enough).
2. **Build → Authentication → Get started → Sign-in method** → enable **Anonymous**.
3. **Build → Firestore Database → Create database** (production mode, any region).
4. **Project settings → General → Your apps → Add app → Web**. Copy the config values.

### 2. Set the quizmaster passcode

In Firestore, manually create a document at **`config/secret`** with a single field:

- `passcode` (string) — whatever passcode you want to use to log into the admin panel.

This document is locked down by the security rules below so teams can never read it.

### 3. Deploy security rules

Install the Firebase CLI once (`npm install -g firebase-tools`), then from this
project folder:

```
firebase login
firebase init firestore   # point at your project, keep the existing firestore.rules file
firebase deploy --only firestore:rules
```

(`firestore.rules` is already written for you at the repo root.)

### 4. Local environment

Copy `.env.example` to `.env` and fill in the Firebase web config values from step 1.5:

```
cp .env.example .env
```

### 5. Run locally

```
npm install
npm run dev
```

### 6. Deploy to GitHub Pages

1. Push this repo to GitHub as `askoquizet` (or update `base` in `vite.config.ts`
   and `basename` in `src/App.tsx` if you name it differently).
2. In the repo, go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**.
3. Add the five Firebase config values as **Settings → Secrets and variables → Actions → New repository secret**:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`,
   `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID`.
4. Push to `main` — the included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically.

## Using it on the night

- Open `/admin`, enter your passcode, and build segments + questions ahead of time (or day-of).
- Share `/join` (plus the join code shown in the admin panel) with teams — they pick a name and avatar.
- From the **Run live** tab: Start quiz → teams answer → Lock answers → Reveal (multiple-choice
  auto-grades; text answers you grade with ✓/✕ per team) → Show scoreboard → Next question.

## Notes & limitations (by design, for a casual event)

- Single quiz session at a time (`sessions/main` in Firestore) — not multi-tenant.
- Correct answers are stored alongside question data (honor system) — a technically
  curious team could find them in devtools before reveal. Fine for a friendly night;
  not meant to survive an actively adversarial audience.
- Joining stays open even after the quiz starts; late teams start from 0 points.
- Team identity persists in `localStorage`, so a refresh/reconnect rejoins the same team.
