# OAMP Web Admin Dashboard

Frontend dashboard for the OAMP cognitive and motoric assessment platform using robotics. Supports real-time leaderboard, competition session management, AI health analysis, tournament brackets, 1v1 duel match spectating, and report exports.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite 8 |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui (Radix UI) |
| HTTP Client | Axios |
| Charts | Recharts |
| Routing | React Router v7 |
| Data Fetching | TanStack React Query |
| Icons | Lucide React |
| Toast | Sonner |
| Payment | Midtrans Snap |

## Prerequisites

- **Node.js** >= 18
- **OAMP Backend** running (CORS configured `AllowAllOrigins`)

## Getting Started

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173` in browser.

## Environment Variables

```env
VITE_API_URL=http://localhost:8080/api/v1
VITE_MIDTRANS_CLIENT_KEY=SB-Mid-client-xxxxxxx
```

## Pages & Routes

| Route | Page | Description |
|-------|------|-------------|
| `/event` | EventDisplay | **Outside Layout** — big-screen event display for projectors |
| `/` | Dashboard | CTF-style leaderboard (training mode), podium, timeline graph, session selector |
| `/duel` | Competitif | Competition-mode leaderboard, live duel stats |
| `/admin` | Admin | Read-only monitoring: stat cards, active rooms, tournaments, registrations |
| `/participants` | Participants | All participants, search, sort, download rapor |
| `/register` | Register | Registration form + RFID scanner → redirect to Paywall |
| `/paywall/:uid` | Paywall | Payment via Midtrans Snap popup |
| `/analytics/:uid` | Analytics | Profile, sessions, charts, AI analysis (premium gate) |
| `/export` | Export | Download Excel + PDF reports |
| `/tournaments` | Tournaments | Tournament list, create tournament |
| `/tournament/:id` | TournamentDetail | Bracket view, match management, admin result submission |
| `/match/:room_id` | MatchDashboard | Live match spectator (outside Layout — full page) |

All routes except `/match/:room_id` and `/event` are wrapped in `<Layout />` (top bar navigation).

## User Flow

```
Register → /paywall/:uid → Pay (Midtrans/simulate) → LUNAS → Dashboard / Analytics
```

Non-premium: vital signs, emotions, AI analysis blurred. Premium: full access.

## Features

### Paywall
- `POST /api/v1/payment/checkout/:uid` → `snap_token` → `window.snap.pay()`
- Fallback: `POST /api/v1/payment/simulate-success/:uid` if `VITE_MIDTRANS_CLIENT_KEY` not set
- `participant.is_premium` gates premium data display

### Session Management
- Session Selector on Dashboard: choose active or past session
- Read-only mode (amber banner) when viewing old sessions; auto-refresh disabled
- API: `GET/POST /api/v1/batches`

### AI Health Consultant
- AI analysis per participant via `GET /api/v1/participants/analysis/:uid`
- Supports `success` and `fallback` response statuses
- Toast notifications for each state; disclaimer shown
- Cached server-side: repeated requests return previous result

### Leaderboard
- Dashboard: training-mode leaderboard (mode=`training`)
- Competitif: competition-mode leaderboard (mode=`competition`)
- CTF-style with podium visuals for top 3
- Gradient rows for rank 1/2/3
- Live score timeline graph (3-layer: area fill, glow, main line)
- Auto-refresh every 5 seconds

### Duel Match Spectator
- WebSocket connection to `/ws/match/:room_id?role=spectator`
- Real-time events: `match_start`, `score_update`, `GAME_OVER`, `match_result`
- Displays player names, live scores, winner announcement

### Tournament
- Single-elimination bracket view
- Create tournament, register players, start cup, manage matches
- Admin can submit match results directly

### Score Formula

```
score = (level_reached × 1000) - (total_time × 10)
```

| Component | Description |
|-----------|-------------|
| `level_reached` | Count of completed levels (task_time > 0), 1-8 |
| `total_time` | Sum of all 8 task times in seconds |
| Score range | ~0-8000 (capped min 0) |

Level is the primary factor; time breaks ties among the same level. One entry per participant per session (best score kept).

### Admin Mode
- PIN-protected (configurable via `VITE_ADMIN_PIN` env var, default `7890`)
- Destructive actions (delete participant, start cup, create room, register players) hidden until unlocked
- `/admin` page is read-only monitoring regardless of admin mode

### Dark/Light Theme
- Toggle in the top navigation bar
- CSS variables (`:root` + `.dark` class) for Merah Putih branding
- All components use `bg-card`/`text-foreground`/`border-border` CSS vars

### EventDisplay
- `/event` — full-screen big-screen view for projectors, no Layout wrapper
- Auto-refreshing tabs: Training leaderboard, Duel rooms + competition ranking, Tournament bracket live
- Station health panel in header
- WebSocket connection to `/ws/event-display` for live score/level updates

## API Endpoints Used

| Method | Endpoint | Used In |
|--------|----------|---------|
| GET | `/health` | Health check banner (30s polling) |
| GET | `/api/v1/leaderboard` | Dashboard + Competitif leaderboard |
| GET | `/api/v1/leaderboard/timeline` | Score timeline graph |
| POST | `/api/v1/participants` | Registration form |
| GET | `/api/v1/participants/uid/:uid` | RFID UID lookup |
| GET | `/api/v1/participants/uid/:uid/sessions` | Analytics — sessions |
| GET | `/api/v1/participants/analysis/:uid` | AI Health Consultant |
| GET | `/api/v1/participants/uid/:uid/results` | Analytics — per-level game result |
| GET | `/api/v1/participants/lookup/:nickname` | Participant search |
| GET | `/api/v1/stats` | Aggregate stats (KPI cards, per-level, gender, timeline) |
| GET | `/api/v1/stations` | Station health panel |
| DELETE | `/api/v1/participants/:id` | Delete participant (admin) |
| POST | `/api/v1/payment/checkout/:uid` | Midtrans checkout |
| POST | `/api/v1/payment/simulate-success/:uid` | Test payment |
| GET | `/api/v1/batches` | Session selector |
| POST | `/api/v1/batches` | Create session |
| GET | `/api/v1/rooms` | Active room list |
| POST | `/api/v1/rooms` | Create room |
| GET | `/api/v1/tournaments` | Tournament list |
| POST | `/api/v1/tournaments` | Create tournament |
| GET | `/api/v1/tournaments/:id` | Tournament detail + bracket |
| DELETE | `/api/v1/tournaments/:id` | Delete tournament |
| POST | `/api/v1/tournaments/:id/start` | Start cup |
| POST | `/api/v1/tournaments/:id/matches/:mid/result` | Submit match result |
| GET | `/api/v1/export/excel` | Download Excel (4 sheets incl. GameResults) |
| GET | `/api/v1/export/pdf` | Download PDF leaderboard |
| GET | `/api/v1/export/rapor/:uid` | Download rapor PDF |
| GET | `/api/v1/export/csv` | Download full data CSV |
| POST | `/api/v1/export/telegram` | Send Excel report to Telegram |

## Project Structure

```
src/
  lib/
    axios.js                  # Axios instance, unwraps { status, message, data }
    utils.js                  # cn() utility (clsx + tailwind-merge)
  hooks/
    useHealthCheck.js         # Polling GET /health every 30s
    useMatchWebSocket.js       # WebSocket hook for live match spectator
  contexts/                   # React context providers
  pages/
    Dashboard.jsx             # / — leaderboard + score graph + session management
    Competitif.jsx            # /duel — competition leaderboard + duel stats
    Admin.jsx                 # /admin — read-only monitoring
    Participants.jsx          # /participants — all participants
    Register.jsx              # /register — RFID-aware form → paywall redirect
    Paywall.jsx               # /paywall/:uid — Midtrans payment gate
    Analytics.jsx             # /analytics/:uid — analytics + AI (premium blur)
    Export.jsx                # /export — download Excel/PDF
    Tournaments.jsx           # /tournaments — tournament list
    TournamentDetail.jsx      # /tournament/:id — bracket + match management
    MatchDashboard.jsx         # /match/:room_id — live match spectator
  components/
    Layout.jsx                # Navbar + header + Outlet
    ErrorBoundary.jsx         # Error boundary wrapper
    LeaderboardTable.jsx      # Ranking table + podium top 3
    ParticipantCard.jsx       # Participant profile card
    SessionBarChart.jsx       # Bar chart + level line
    StatusBanner.jsx          # Online/offline indicator
    ui/                       # shadcn/ui components
```

## Scripts

```bash
npm run dev       # Dev server (Vite) → http://localhost:5173
npm run build     # Production build
npm run lint      # ESLint (no typecheck — no TypeScript)
npx playwright test  # E2E tests (auto-starts dev server; Chromium only)
```

## Notes

- **Axios interceptor** unwraps responses: components access `.data`, `.status`, `.message` directly (not `res.data.data`).
- **RFID Scanner**: USB scanner acts as keyboard HID. UID field auto-focuses, detects scanner input via Enter key.
- **React Router v7** (not v6). `react-router-dom@^7.14.0`.
- **Path alias**: `@/` → `src/`.
- **Tailwind CSS v4**: no `tailwind.config.js`; uses `@import "tailwindcss"` in `src/index.css`.
- **Admin PIN**: hardcoded `7890` — destructive buttons only visible in admin mode.
- **CORS**: backend is `AllowAllOrigins`, no proxy needed.
- **Score fallback**: if `score` is null in session data, computed as `level_reached × 1000 - total_time × 10`.
- **E2E tests**: Playwright in `e2e/`. Backend must be running for full E2E flows; `test.skip()` when offline.

## Related Repositories

- **`oamp-backend/`** — Go/Gin REST API + WebSocket server (this monorepo)
- **`oamp-bdt-dekstop-app-python/`** — Python desktop game client (this monorepo)