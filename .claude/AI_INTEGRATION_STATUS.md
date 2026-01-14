# AI Integration Status: Life Dashboard

## Overview

The AI Integration project adds a "Life Dashboard" tab to Thunderbird that displays an intelligent overview of email-derived information. The dashboard is served by a FastAPI backend that provides REST API access to the email analysis system, with a React frontend and mailbox reader for Thunderbird's local mail storage.

**Current Status: 96% Complete (23/24 tasks)**

| Phase | Component | Status | Tasks |
|-------|-----------|--------|-------|
| 2 | FastAPI Backend (2.7-2.10) | ✅ Complete | 4/4 |
| 3 | Mailbox Reader | ✅ Complete | 7/7 |
| 4 | Dashboard UI (React) | ✅ Complete | 7/7 |
| 5 | Integration | ✅ Complete | 5/6 |

**Remaining:** Task 5.6 (Performance Optimization) - Optional enhancement

---

## Test Results (2025-01-14)

### API Tests: 77/77 PASSED
```
packages/api/tests/test_accounts.py      10 passed
packages/api/tests/test_dashboard.py     13 passed
packages/api/tests/test_emails.py        16 passed
packages/api/tests/test_entities.py      10 passed
packages/api/tests/test_integration.py   17 passed
packages/api/tests/test_relationships.py 11 passed
```

### Mailbox Tests: 117/117 PASSED
```
packages/mailbox/tests/test_models.py    14 passed
packages/mailbox/tests/test_mbox.py      17 passed
packages/mailbox/tests/test_profile.py   21 passed
packages/mailbox/tests/test_sync.py      21 passed
packages/mailbox/tests/test_ingest.py    15 passed
packages/mailbox/tests/test_watcher.py   29 passed
```

### Dashboard Build: SUCCESS
- TypeScript compilation: Clean (no errors)
- Vite build: 320KB JS + 29KB CSS
- 132 modules transformed

### Thunderbird: VALID
- lifeTabs.js syntax check: Passed

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Thunderbird Desktop                           │
│  Tab Bar: [Mail] [Life Dashboard] [Calendar] [+]                │
│                        │                                         │
│           ┌────────────┴────────────┐                           │
│           │    <browser> element    │ (loads React dashboard)   │
│           │    Click-to-Open: Opens emails in native viewer     │
│           │    Auto-Start: Optionally starts backend           │
│           └────────────┬────────────┘                           │
└────────────────────────│────────────────────────────────────────┘
                         │ HTTP (localhost:8000)
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                               │
│  Static: React Dashboard (/)                                     │
│  API: /accounts, /entities, /relationships, /emails, /dashboard │
│  Features: Rate limiting, request logging, CORS                  │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌─────────────────────┐    ┌──────────────────────────┐
│   Mailbox Reader    │    │    PostgreSQL Database   │
│  (packages/mailbox) │───→│  accounts, emails,       │
│   Reads mbox files  │    │  entities, relationships │
│   Incremental sync  │    └──────────────────────────┘
│   File watching     │
└─────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Thunderbird Profile (~/.thunderbird/)               │
│  Mail/<Account>/Inbox, Sent, etc. (mbox files)                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Start the Backend

```bash
cd /path/to/email-poc/v1

# Build the dashboard (first time)
./packages/api/scripts/build-dashboard.sh

# Start the server
uv run uvicorn api.main:app --reload
```

### 2. Run Thunderbird

```bash
cd /path/to/thunderbird-desktop
./mach run
```

### 3. Open Life Dashboard

- Press `Ctrl+Shift+L` (Windows/Linux) or `Cmd+Shift+L` (Mac)
- Or click the Life Dashboard button in the Spaces toolbar
- Or use Go → Life Dashboard menu

---

## Features

### Dashboard UI (React)
- **Today View**: Recent emails, top contacts, entity statistics, activity feed
- **Entity Explorer**: Browse and search entities with relationship visualization
- **Email Browser**: Filter, search, and read emails with thread view
- **Keyboard Navigation**: `g+t` Today, `g+e` Entities, `g+m` Emails, `/` Search
- **Dark/Light Mode**: Theme support via CSS variables

### Mailbox Reader
- **Profile Discovery**: Auto-detects Thunderbird profiles on Linux/macOS/Windows
- **Mbox Parsing**: Reads standard mbox format with X-Mozilla-Status support
- **Incremental Sync**: Only processes new messages since last sync
- **File Watching**: Real-time updates when mbox files change
- **CLI Tools**: `mailbox-reader list-profiles`, `ingest`, `watch` commands

### Integration Features
- **Click-to-Open**: Clicking emails in dashboard opens native Thunderbird viewer
- **Auto-Start Backend**: Optionally starts server when opening Life tab
- **Health Checks**: Verifies backend connectivity before loading dashboard

---

## Configuration

### Backend Auto-Start (Optional)

Edit `mail/base/content/lifeTabs.js`:

```javascript
const LIFE_DASHBOARD_AUTO_START = {
  enabled: true,
  backendPath: "/path/to/email-poc/v1/packages/api/scripts",
  maxRetries: 3,
  retryDelay: 2000,
};
```

### Environment Variables

```bash
# Database connection (required)
DATABASE_URL=postgresql://user:password@localhost/email_poc

# Server configuration (optional)
LIFE_DASHBOARD_PORT=8000
LIFE_DASHBOARD_HOST=127.0.0.1
```

---

## Running Tests

### API Tests
```bash
cd /path/to/email-poc/v1
uv run pytest packages/api/tests/ -v
```

### Mailbox Tests
```bash
cd /path/to/email-poc/v1
uv run pytest packages/mailbox/tests/ -v
```

### Dashboard Build
```bash
cd /path/to/email-poc/v1/packages/dashboard
npm run build
npx tsc --noEmit  # Type check
```

### Thunderbird Syntax
```bash
node --check mail/base/content/lifeTabs.js
```

---

## Known Limitations

1. **Database Required**: Backend requires PostgreSQL with email-poc schema
2. **No Real-time Sync to Dashboard**: Mailbox watcher syncs to database, but dashboard doesn't auto-refresh
3. **Single Account Focus**: UI is optimized for single account selection
4. **Graph Traversal**: No path-finding between entities (deferred)

---

## Troubleshooting

### Backend won't start

```
ModuleNotFoundError: No module named 'core'
```
→ Run from v1 workspace: `cd /path/to/email-poc/v1 && uv run uvicorn api.main:app`

```
sqlalchemy.exc.OperationalError: could not connect to server
```
→ Check PostgreSQL is running: `pg_isready`
→ Verify DATABASE_URL in environment

### Life tab shows error page

→ Check backend is running: `curl http://localhost:8000/health`
→ If using auto-start, verify `backendPath` is correct
→ Check Thunderbird console (Ctrl+Shift+J) for errors

### Dashboard won't load

→ Rebuild dashboard: `./packages/api/scripts/build-dashboard.sh`
→ Check assets exist: `ls packages/dashboard/dist/`

### Mailbox reader not finding emails

→ Check profile path: `mailbox-reader list-profiles`
→ Verify mbox files exist in Mail/ directory
→ Check X-Mozilla-Status flags (deleted messages filtered)

---

## File Reference

### Thunderbird (thunderbird-desktop)

| File | Purpose |
|------|---------|
| `mail/base/content/lifeTabs.js` | Tab type, auto-start, click-to-open |
| `mail/base/content/life-tab-panel.inc.xhtml` | Browser element |
| `mail/base/content/life-keys.inc.xhtml` | Keyboard shortcut |

### Backend (email-poc/v1/packages/api)

| File | Purpose |
|------|---------|
| `src/api/main.py` | FastAPI app, routers |
| `src/api/routes/*.py` | Endpoint handlers |
| `src/api/models/*.py` | Pydantic models |
| `scripts/start-server.sh` | Auto-start script |
| `scripts/build-dashboard.sh` | Dashboard builder |

### Mailbox Reader (email-poc/v1/packages/mailbox)

| File | Purpose |
|------|---------|
| `src/mailbox_reader/profile.py` | Profile discovery |
| `src/mailbox_reader/mbox.py` | Mbox parsing |
| `src/mailbox_reader/sync.py` | Incremental sync |
| `src/mailbox_reader/watcher.py` | File watching |
| `src/mailbox_reader/ingest.py` | Database ingestion |
| `src/mailbox_reader/cli.py` | CLI commands |

### Dashboard (email-poc/v1/packages/dashboard)

| File | Purpose |
|------|---------|
| `src/pages/Today.tsx` | Today dashboard |
| `src/pages/Entities.tsx` | Entity explorer |
| `src/pages/Emails.tsx` | Email browser |
| `src/api/*.ts` | API client layer |
| `src/hooks/*.ts` | React Query hooks |
| `src/components/*.tsx` | Reusable components |

---

*Last updated: 2025-01-14*
*Overall Progress: 96% (23/24 tasks) | All phases complete except optional performance optimization*
