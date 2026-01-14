# Ralph Loop Tasks: Phases 2.7-5

## Instructions
- Complete ONE task per session
- Update status: `pending` → `in_progress` → `completed`
- After completing each task:
  1. Validate: Run tests, verify syntax, or perform manual verification as appropriate
  2. Document: Update inline comments or relevant docs if the task warrants it (use judgment)
  3. Commit: Create LOCAL git commit (DO NOT push): `[AI-Integration] Task X.Y: <title>`
  4. Mark complete: Update status to `completed` and add brief completion notes
- When ALL tasks show `completed`, return ONLY: `<completion-promise>RALPH_LOOP_COMPLETE: All AI Integration tasks finished</completion-promise>`

---

## Phase 2: Backend API Layer (Completion)

### Task 2.7: Implement Email Query Endpoints
**Status:** completed
**Repo:** email-poc
**Goal:** Create REST endpoints for email/message queries

**Context:**
- EmailRepository exists in `packages/db/src/db/repositories/email.py`
- ContentRepository exists for email body text
- Pydantic models already created in `packages/api/src/api/models/email.py`
- Follow patterns from existing routes (accounts, entities, relationships)

**Steps:**
1. Create `packages/api/src/api/routes/emails.py`
2. Implement `GET /emails` - list emails with filters:
   - Required: `account_id`
   - Optional: `from_address`, `subject_search`, `date_from`, `date_to`, `classification`
   - Pagination: `limit` (default=50, max=100), `offset`
   - Sort: `sort_by` (date_sent, subject), `sort_order` (asc, desc)
3. Implement `GET /emails/{id}` - get single email with full metadata
4. Implement `GET /emails/{id}/content` - get email body (text_plain, text_html)
5. Implement `GET /emails/thread/{provider_thread_id}` - get conversation thread
6. Add `get_email_repository` to `dependencies.py`
7. Add `get_content_repository` to `dependencies.py`
8. Register router in `main.py`
9. Create `tests/test_emails.py` with:
   - List emails with various filters
   - Get single email (success, not found)
   - Get email content
   - Get thread
   - Pagination and validation tests

**Success Criteria:** All email endpoints work and tests pass

**Completion Notes:** Implemented all 4 email endpoints with full test coverage (16 tests). Added EmailContentResponse model, get_content_repository dependency. All 47 API tests pass.

---

### Task 2.8: Implement Dashboard Aggregation Endpoints
**Status:** completed
**Repo:** email-poc
**Goal:** Create "Today" dashboard endpoint aggregating relevant data for the Life Dashboard

**Context:**
- This is what the Thunderbird Life tab will primarily display
- Need to aggregate data from multiple repositories
- Consider performance - may need optimized queries

**Steps:**
1. Create `packages/api/src/api/routes/dashboard.py`
2. Create `packages/api/src/api/models/dashboard.py` with:
   - `DashboardTodayResponse` - today's summary
   - `DashboardSummaryResponse` - overall statistics
   - `RecentActivityItem` - recent email/event
   - `UpcomingItem` - deadline/event
   - `ContactSummary` - frequent contact info
3. Implement `GET /dashboard/today` returning:
   - `recent_emails`: Last 10 emails received today
   - `top_contacts`: Most frequent contacts (last 7 days)
   - `entity_counts`: Count by entity type
   - `recent_activity`: Combined activity feed
4. Implement `GET /dashboard/summary` returning:
   - `total_emails`: Total emails in account
   - `total_entities`: Count of canonical entities by type
   - `total_relationships`: Relationship counts by type
   - `date_range`: Earliest and latest email dates
   - `last_sync`: Last sync timestamp
5. Register router in `main.py`
6. Create `tests/test_dashboard.py` with comprehensive tests

**Success Criteria:** Dashboard endpoints return aggregated, useful data

**Completion Notes:** Implemented both dashboard endpoints with full test coverage (13 tests). Created Pydantic models for responses. All 60 API tests pass.

---

### Task 2.9: Add Rate Limiting and Request Logging
**Status:** completed
**Repo:** email-poc
**Goal:** Add production-ready middleware for rate limiting and observability

**Context:**
- CORS already configured in main.py
- Need rate limiting to prevent abuse
- Request logging for debugging and monitoring

**Steps:**
1. Add `slowapi` to dependencies in `pyproject.toml`
2. Create `packages/api/src/api/middleware.py` with:
   - Rate limiter configuration (e.g., 100 requests/minute per IP)
   - Request logging middleware (method, path, duration, status)
3. Update `main.py` to register middleware
4. Add rate limit headers to responses
5. Create custom exception handler for rate limit exceeded
6. Update `config.py` with rate limiting settings (configurable)
7. Add structured logging with timestamps
8. Document rate limiting in API README

**Success Criteria:** Rate limiting active, requests logged, configurable via environment

**Completion Notes:** Implemented rate limiting with slowapi (100/min per IP), request logging middleware, custom 429 handler, configurable settings. Added X-RateLimit-* and X-Request-Duration-Ms headers. All 60 tests pass.

---

### Task 2.10: End-to-End Integration Test
**Status:** completed
**Repo:** both (email-poc primary)
**Goal:** Verify complete flow from Thunderbird to FastAPI to database

**Context:**
- Thunderbird tab already configured to load from localhost:8000
- Need to serve a basic HTML page for visual verification
- Document the full testing procedure

**Steps:**
1. Create `packages/api/src/api/static/` directory
2. Create simple test HTML page `static/index.html`:
   - Show "Life Dashboard Connected" heading
   - Display current time (proves page loaded)
   - Button to test `/health` endpoint via fetch
   - Show API status
3. Update `main.py` to serve static files at root
4. Create `packages/api/tests/test_integration.py`:
   - Test static file serving
   - Test all endpoints in sequence
   - Test error handling
5. Document manual test procedure in `.claude/AI_INTEGRATION_STATUS.md`:
   - How to start backend
   - How to run Thunderbird
   - Expected behavior
6. Run full manual test and document results

**Success Criteria:** Documented procedure verified working, integration test passes

**Completion Notes:** Created test HTML page with real-time clock, API status indicator, and endpoint tester. Added 17 integration tests covering static files, health checks, endpoint sequence, error handling, headers, and content types. Updated AI_INTEGRATION_STATUS.md with test procedure. All 77 API tests pass.

---

## Phase 3: Mailbox Reader

### Task 3.1: Research Thunderbird Storage Format
**Status:** completed
**Repo:** thunderbird-desktop (research), email-poc (implement)
**Goal:** Document Thunderbird's local mail storage format for the mailbox reader

**Context:**
- Thunderbird stores mail locally in profile directory
- Uses mbox format by default
- Need to understand folder structure, message format, metadata

**Steps:**
1. Locate sample Thunderbird profile directory structure
2. Document the profile directory layout:
   - `Mail/` directory structure
   - Account folder organization
   - mbox file format
   - `.msf` index files (if relevant)
3. Research mbox format specifics:
   - Message delimiter format
   - Header parsing requirements
   - Encoding handling
4. Document maildir alternative (if Thunderbird supports it)
5. Research existing Python libraries:
   - `mailbox` standard library
   - Third-party mbox parsers
6. Create `.claude/thunderbird-storage-notes.md` with findings
7. Identify key challenges:
   - Large file handling
   - Incremental reading
   - File locking considerations

**Success Criteria:** Comprehensive documentation of storage format and parsing approach

**Completion Notes:** Created comprehensive `.claude/thunderbird-storage-notes.md` documenting:
- Profile directory locations (Linux/macOS/Windows)
- profiles.ini and prefs.js parsing for account discovery
- mbox format details including "From " delimiter, message structure, and body escaping
- Thunderbird-specific headers (X-Mozilla-Status, X-Mozilla-Status2, X-Mozilla-Keys) with bitmask values
- .msf Mork database format and storeToken usage
- maildir alternative format
- Python mailbox library usage with code examples
- Key challenges identified: large files, incremental reading, locking, encoding, deleted messages
- Recommended implementation approach for phases 1-4

---

### Task 3.2: Create Mailbox Package Structure
**Status:** completed
**Repo:** email-poc
**Goal:** Scaffold packages/mailbox with core interfaces

**Prerequisites:** Task 3.1 completed

**Steps:**
1. Create `packages/mailbox/` directory
2. Create `packages/mailbox/pyproject.toml`:
   - Dependencies: email-poc-core
   - Optional: python-dateutil, chardet
3. Create package structure:
   - `src/mailbox/__init__.py`
   - `src/mailbox/reader.py` - abstract reader interface
   - `src/mailbox/mbox.py` - mbox format implementation
   - `src/mailbox/profile.py` - Thunderbird profile discovery
   - `src/mailbox/models.py` - internal message models
4. Define `MailboxReader` protocol/interface:
   - `discover_accounts()` - find accounts in profile
   - `list_folders(account)` - list mail folders
   - `read_messages(folder, since=None)` - read messages
   - `get_message(message_id)` - get single message
5. Install package in editable mode and verify imports

**Success Criteria:** Package structure created, interfaces defined, imports work

**Completion Notes:** Created packages/mailbox with:
- pyproject.toml (dependencies: email-poc-core, pydantic, python-dateutil)
- src/mailbox_reader/ with 5 modules (__init__, models, reader, profile, mbox)
- Data models: ThunderbirdAccount, MailFolder, ParsedMessage, SyncState, AccountType
- Abstract MailboxReader with 5 methods + exception classes
- MboxReader and ThunderbirdProfile stubs for Tasks 3.3-3.4
- 14 unit tests for models (all pass)
- Package installed with uv, all imports verified working

---

### Task 3.3: Implement Thunderbird Profile Discovery
**Status:** completed
**Repo:** email-poc
**Goal:** Auto-detect Thunderbird profile location and account structure

**Prerequisites:** Task 3.2 completed

**Steps:**
1. Implement profile discovery in `profile.py`:
   - Find Thunderbird profile directory (cross-platform):
     - Linux: `~/.thunderbird/`
     - macOS: `~/Library/Thunderbird/`
     - Windows: `%APPDATA%\Thunderbird\`
   - Parse `profiles.ini` to find default profile
   - Handle multiple profiles
2. Implement account discovery:
   - Parse `prefs.js` for account settings
   - Map to internal account model
   - Extract server settings (IMAP, POP3, local)
3. Create `ThunderbirdProfile` class:
   - `path`: Profile directory path
   - `accounts`: List of discovered accounts
   - `get_mail_directory()`: Path to Mail folder
4. Create tests in `tests/test_profile.py`:
   - Mock profile directory structure
   - Test discovery on different platforms
   - Test prefs.js parsing

**Success Criteria:** Can auto-detect Thunderbird profile and list accounts

**Completion Notes:** Implemented complete ThunderbirdProfile class:
- Cross-platform profile discovery (Linux ~/.thunderbird, macOS ~/Library/Thunderbird, Windows %APPDATA%\Thunderbird)
- profiles.ini parsing with support for default/first profile, relative/absolute paths
- prefs.js parsing with regex for user_pref() (strings, booleans, numbers)
- Account extraction for IMAP, POP3, and local folders with identity email lookup
- 21 new tests covering all functionality (35 total mailbox tests pass)

---

### Task 3.4: Implement Mbox Reader Core
**Status:** completed
**Repo:** email-poc
**Goal:** Read and parse mbox files to extract email messages

**Prerequisites:** Task 3.3 completed

**Steps:**
1. Implement `MboxReader` class in `mbox.py`:
   - Use Python's `mailbox.mbox` as foundation
   - Handle large files efficiently (streaming)
   - Parse message headers (From, To, Subject, Date, Message-ID)
   - Extract body (text/plain, text/html)
   - Handle attachments (metadata only initially)
2. Implement encoding handling:
   - Detect charset from headers
   - Handle common encodings (UTF-8, ISO-8859-1, etc.)
   - Fallback for unknown encodings
3. Map to core domain models:
   - Convert parsed message to `Email` domain model
   - Convert headers to appropriate fields
4. Create tests with sample mbox data:
   - Parse single message
   - Parse multi-message mbox
   - Handle malformed messages gracefully
   - Test encoding edge cases

**Success Criteria:** Can read mbox files and extract structured email data

**Completion Notes:** Implemented full MboxReader class (~590 lines):
- list_folders(): Scans mail directories, handles .sbd subdirectories for nested folders
- read_messages(): Uses Python mailbox module, filters deleted messages via X-Mozilla-Status
- get_message(): Finds message by Message-ID
- get_message_at_offset(): Direct file access at byte offset for incremental sync
- _parse_mailbox_message(): Extracts all headers, body, mozilla status flags
- _extract_body(): Handles multipart messages (text/plain, text/html)
- _decode_payload(): Encoding handling with fallbacks (UTF-8, Latin-1, CP1252)
- 17 new tests covering folder listing, message reading, multipart, encoding, errors
- All 52 mailbox package tests pass

---

### Task 3.5: Implement Incremental Sync Tracking
**Status:** completed
**Repo:** email-poc
**Goal:** Track which messages have been processed to enable incremental updates

**Prerequisites:** Task 3.4 completed

**Steps:**
1. Design sync state storage:
   - Track last processed position per mbox file
   - Store message IDs of processed messages
   - Handle file truncation/modification detection
2. Create `SyncState` model in `models.py`:
   - `file_path`: Path to mbox file
   - `file_size`: Size at last sync
   - `file_mtime`: Modification time at last sync
   - `last_position`: Byte offset of last processed message
   - `processed_ids`: Set of processed Message-IDs
3. Implement `SyncTracker` class:
   - `load_state(path)` - load saved state
   - `save_state(path, state)` - persist state
   - `needs_sync(path)` - check if file changed
   - `get_new_messages(path)` - read only new messages
4. Add state persistence (JSON or SQLite)
5. Create tests:
   - Track new messages
   - Detect file modifications
   - Handle file rotation/truncation

**Success Criteria:** Can incrementally sync only new messages from mbox files

**Completion Notes:** Implemented full SyncTracker class in new sync.py module:
- JSON-based state persistence with hash-based filenames for uniqueness
- load_state/save_state/delete_state for state management
- needs_sync(): Detects file modifications via size and mtime comparison
- was_truncated(): Detects file compaction requiring full rescan
- get_new_messages(): Returns only unprocessed messages using Message-ID tracking
- reset_state(): Forces full resync by deleting state
- get_all_states() and get_sync_summary() for monitoring
- Automatic state save after sync completion
- 21 new tests covering state persistence, change detection, incremental sync, truncation handling
- All 73 mailbox package tests pass

---

### Task 3.6: Integrate Mailbox Reader with Ingestion Pipeline
**Status:** pending
**Repo:** email-poc
**Goal:** Connect mailbox reader to existing email ingestion pipeline

**Prerequisites:** Task 3.5 completed

**Steps:**
1. Create `packages/mailbox/src/mailbox/ingest.py`:
   - `ThunderbirdIngestor` class
   - Coordinates profile discovery, reading, and pipeline
2. Implement ingestion workflow:
   - Discover accounts from Thunderbird profile
   - Create/match accounts in database
   - For each account's mail folders:
     - Check sync state
     - Read new messages
     - Pass through entity extraction pipeline
     - Update sync state
3. Add CLI command for manual ingestion:
   - `python -m mailbox.cli ingest [--profile PATH]`
   - Progress reporting
   - Error handling and logging
4. Create integration tests:
   - Full pipeline test with sample data
   - Verify entities extracted and stored

**Success Criteria:** Can ingest Thunderbird mail into the knowledge graph database

**Completion Notes:**

---

### Task 3.7: Add File Watching for Real-time Updates
**Status:** pending
**Repo:** email-poc
**Goal:** Monitor mbox files for changes and trigger incremental ingestion

**Prerequisites:** Task 3.6 completed

**Steps:**
1. Add `watchdog` to dependencies
2. Create `packages/mailbox/src/mailbox/watcher.py`:
   - `MailboxWatcher` class using watchdog
   - Monitor Mail directory for changes
   - Debounce rapid changes (batch updates)
3. Implement event handling:
   - On file modification: trigger incremental sync
   - On new file: discover and add to watch list
   - On file deletion: mark account inactive
4. Add background service mode:
   - `python -m mailbox.cli watch [--profile PATH]`
   - Graceful shutdown handling
   - Logging of sync events
5. Create tests:
   - Mock file system events
   - Test debouncing
   - Test error recovery

**Success Criteria:** Background service watches mbox files and triggers incremental sync

**Completion Notes:**

---

## Phase 4: Dashboard UI (React)

### Task 4.1: Scaffold React Dashboard Application
**Status:** pending
**Repo:** email-poc
**Goal:** Create React app structure for the Life Dashboard UI

**Context:**
- Will be served by FastAPI or embedded in Thunderbird
- Modern React with TypeScript
- Consider Thunderbird's theming (dark mode support)

**Steps:**
1. Create `packages/dashboard/` directory
2. Initialize with Vite + React + TypeScript:
   - `npm create vite@latest dashboard -- --template react-ts`
3. Configure project:
   - Add `pyproject.toml` for workspace integration
   - Configure build output to `dist/`
   - Set base URL for serving from FastAPI
4. Install dependencies:
   - `@tanstack/react-query` - data fetching
   - `react-router-dom` - routing
   - CSS framework (Tailwind or similar)
5. Create basic structure:
   - `src/components/` - reusable components
   - `src/pages/` - page components
   - `src/api/` - API client functions
   - `src/types/` - TypeScript types
6. Create placeholder pages:
   - `Today.tsx` - main dashboard
   - `Entities.tsx` - entity explorer
   - `Settings.tsx` - configuration
7. Verify build works: `npm run build`

**Success Criteria:** React app scaffolded, builds successfully

**Completion Notes:**

---

### Task 4.2: Implement API Client Layer
**Status:** pending
**Repo:** email-poc
**Goal:** Create TypeScript API client for backend communication

**Prerequisites:** Task 4.1 completed

**Steps:**
1. Create `src/api/client.ts`:
   - Base API client with fetch wrapper
   - Error handling
   - Base URL configuration
2. Create typed API functions in `src/api/`:
   - `accounts.ts` - account endpoints
   - `entities.ts` - entity endpoints
   - `relationships.ts` - relationship endpoints
   - `emails.ts` - email endpoints
   - `dashboard.ts` - dashboard endpoints
3. Generate TypeScript types from Pydantic models:
   - Create `src/types/api.ts` matching backend models
   - Or use OpenAPI generator if available
4. Create React Query hooks in `src/hooks/`:
   - `useAccounts()`, `useAccount(id)`
   - `useEntities(accountId, filters)`
   - `useDashboardToday(accountId)`
   - etc.
5. Add loading and error states
6. Test API calls against running backend

**Success Criteria:** Type-safe API client with React Query hooks

**Completion Notes:**

---

### Task 4.3: Build Today Dashboard View
**Status:** pending
**Repo:** email-poc
**Goal:** Implement the main "Today" dashboard page

**Prerequisites:** Task 4.2 completed

**Steps:**
1. Design Today page layout:
   - Header with date and account selector
   - Recent emails section
   - Top contacts section
   - Entity statistics
   - Activity feed
2. Create components:
   - `EmailCard.tsx` - email preview card
   - `ContactCard.tsx` - contact summary
   - `StatCard.tsx` - statistic display
   - `ActivityFeed.tsx` - timeline of activity
3. Implement `Today.tsx` page:
   - Fetch data using dashboard hooks
   - Display loading states
   - Handle errors gracefully
   - Responsive layout
4. Add interactivity:
   - Click email to see details
   - Click contact to see related emails
   - Refresh button
5. Style with dark mode support:
   - CSS variables for theming
   - Match Thunderbird's look where possible

**Success Criteria:** Today page displays real data from API attractively

**Completion Notes:**

---

### Task 4.4: Build Entity Explorer View
**Status:** pending
**Repo:** email-poc
**Goal:** Implement entity browsing and search functionality

**Prerequisites:** Task 4.3 completed

**Steps:**
1. Design Entity Explorer layout:
   - Search bar with type filter
   - Entity list with pagination
   - Entity detail panel (side or modal)
   - Relationship visualization
2. Create components:
   - `EntityList.tsx` - paginated entity list
   - `EntityCard.tsx` - entity summary card
   - `EntityDetail.tsx` - full entity view
   - `RelationshipList.tsx` - entity relationships
   - `SearchBar.tsx` - search with filters
3. Implement `Entities.tsx` page:
   - Type filter (Person, Organization, etc.)
   - Full-text search
   - Click entity for details
   - Show related entities
4. Add relationship visualization:
   - Simple list view initially
   - Consider graph view (future enhancement)
5. Implement pagination:
   - Infinite scroll or page buttons
   - Loading indicators

**Success Criteria:** Can browse, search, and explore entities and relationships

**Completion Notes:**

---

### Task 4.5: Build Email Browser View
**Status:** pending
**Repo:** email-poc
**Goal:** Implement email browsing within the dashboard

**Prerequisites:** Task 4.4 completed

**Steps:**
1. Design Email Browser layout:
   - Email list (sender, subject, date)
   - Email detail view
   - Thread view for conversations
   - Filters (date, sender, classification)
2. Create components:
   - `EmailList.tsx` - paginated email list
   - `EmailRow.tsx` - email list item
   - `EmailViewer.tsx` - full email display
   - `ThreadView.tsx` - conversation thread
   - `EmailFilters.tsx` - filter controls
3. Implement `Emails.tsx` page:
   - Date range filter
   - Sender/subject search
   - Classification filter
   - Sort options
4. Implement email detail:
   - Headers display
   - Body rendering (text/html)
   - Entity highlights
   - Related entities sidebar
5. Implement thread view:
   - Group by thread ID
   - Chronological ordering
   - Collapsed/expanded states

**Success Criteria:** Can browse emails, view details, and see threads

**Completion Notes:**

---

### Task 4.6: Add Navigation and Layout
**Status:** pending
**Repo:** email-poc
**Goal:** Implement app-wide navigation and consistent layout

**Prerequisites:** Task 4.5 completed

**Steps:**
1. Create layout components:
   - `AppLayout.tsx` - main layout wrapper
   - `Sidebar.tsx` - navigation sidebar
   - `Header.tsx` - top header bar
   - `PageContainer.tsx` - content wrapper
2. Implement navigation:
   - Sidebar with page links
   - Active state indicators
   - Collapsible on mobile
3. Add routing:
   - `/` - Today dashboard
   - `/entities` - Entity explorer
   - `/emails` - Email browser
   - `/settings` - Settings page
4. Implement account switching:
   - Account selector in header
   - Persist selection in localStorage
   - Update all queries on change
5. Add keyboard shortcuts:
   - `g t` - go to Today
   - `g e` - go to Entities
   - `g m` - go to Emails
   - `/` - focus search

**Success Criteria:** Cohesive navigation, consistent layout across pages

**Completion Notes:**

---

### Task 4.7: Implement Loading States and Error Handling
**Status:** pending
**Repo:** email-poc
**Goal:** Polish UX with proper loading and error states

**Prerequisites:** Task 4.6 completed

**Steps:**
1. Create UI components:
   - `LoadingSpinner.tsx` - spinner component
   - `Skeleton.tsx` - content skeleton
   - `ErrorBoundary.tsx` - error boundary
   - `ErrorMessage.tsx` - error display
   - `EmptyState.tsx` - no data state
2. Implement loading states:
   - Page-level loading
   - Component-level loading
   - Skeleton placeholders
3. Implement error handling:
   - API error display
   - Retry functionality
   - Error boundaries for crashes
4. Implement empty states:
   - No emails found
   - No entities found
   - No search results
5. Add toast notifications:
   - Success messages
   - Error messages
   - Info messages

**Success Criteria:** Smooth UX with appropriate feedback for all states

**Completion Notes:**

---

## Phase 5: Integration

### Task 5.1: Configure FastAPI to Serve React Dashboard
**Status:** pending
**Repo:** email-poc
**Goal:** Serve built React app from FastAPI

**Context:**
- React builds to static files in `packages/dashboard/dist/`
- FastAPI should serve these at root path
- API endpoints remain at their paths

**Steps:**
1. Update `packages/api/src/api/main.py`:
   - Mount static files for React app
   - Serve `index.html` for client-side routing
   - Ensure API routes take precedence
2. Configure build process:
   - Build dashboard: `cd packages/dashboard && npm run build`
   - Copy to API static directory or reference directly
3. Add build script to API package:
   - `scripts/build.sh` - builds dashboard and copies
4. Update `config.py`:
   - `STATIC_DIR` setting
   - `SERVE_DASHBOARD` toggle
5. Test:
   - Start API server
   - Access root URL
   - Verify React app loads
   - Verify API endpoints still work

**Success Criteria:** FastAPI serves React dashboard at root, API at /api paths

**Completion Notes:**

---

### Task 5.2: Update Thunderbird Tab for Dashboard
**Status:** pending
**Repo:** thunderbird-desktop
**Goal:** Configure Thunderbird Life tab to load React dashboard

**Prerequisites:** Task 5.1 completed

**Steps:**
1. Update `lifeTabs.js`:
   - Change `LIFE_DASHBOARD_API_URL` to correct path
   - Ensure health check works with new setup
2. Test browser permissions:
   - Verify React app loads in embedded browser
   - Check for CORS issues
   - Verify API calls work from embedded context
3. Handle deep linking:
   - Support loading specific pages in tab
   - Handle refresh behavior
4. Update error page:
   - Improve error messaging
   - Add troubleshooting steps
5. Document configuration options

**Success Criteria:** Life tab loads React dashboard successfully

**Completion Notes:**

---

### Task 5.3: Implement Click-to-Open in Thunderbird
**Status:** pending
**Repo:** both
**Goal:** Clicking email in dashboard opens it in Thunderbird's native viewer

**Prerequisites:** Task 5.2 completed

**Steps:**
1. Research Thunderbird message opening:
   - How to open message by ID
   - API for external message opening
   - Protocol handlers
2. Implement message protocol:
   - Register `thunderbird-message://` protocol handler
   - Or use existing `mid:` Message-ID protocol
3. Update dashboard email links:
   - Add open button/link
   - Generate appropriate URL
4. Handle communication:
   - Dashboard sends open request
   - Thunderbird receives and opens message
5. Test end-to-end:
   - Click email in dashboard
   - Verify opens in Thunderbird mail view

**Success Criteria:** Clicking email in dashboard opens native Thunderbird viewer

**Completion Notes:**

---

### Task 5.4: Add Backend Auto-Start Capability
**Status:** pending
**Repo:** both
**Goal:** Optionally start backend automatically when opening Life tab

**Prerequisites:** Task 5.3 completed

**Steps:**
1. Research options:
   - Thunderbird starting subprocess
   - System service (systemd, launchd)
   - Bundled executable (PyInstaller)
2. Implement chosen approach:
   - Create startup script
   - Handle graceful shutdown
   - Manage port conflicts
3. Update `lifeTabs.js`:
   - Detect backend not running
   - Attempt to start backend
   - Retry connection after start
4. Add configuration:
   - Enable/disable auto-start
   - Backend path configuration
   - Log file location
5. Handle errors:
   - Start failure messaging
   - Port in use handling
   - Permission issues

**Success Criteria:** Backend can optionally auto-start when Life tab opens

**Completion Notes:**

---

### Task 5.5: Comprehensive End-to-End Testing
**Status:** pending
**Repo:** both
**Goal:** Full integration testing and documentation

**Prerequisites:** All previous tasks completed

**Steps:**
1. Create test plan covering:
   - Fresh installation flow
   - First-time setup
   - Normal usage patterns
   - Error scenarios
   - Performance baseline
2. Execute manual testing:
   - Linux (primary)
   - Document results
3. Create automated integration tests:
   - API integration tests
   - Dashboard component tests
   - End-to-end Playwright tests (if feasible)
4. Document known issues and limitations
5. Update all documentation:
   - `.claude/AI_INTEGRATION_STATUS.md` - final status
   - README files in each package
   - User-facing documentation
6. Create troubleshooting guide

**Success Criteria:** Comprehensive testing complete, documentation updated

**Completion Notes:**

---

### Task 5.6: Performance Optimization
**Status:** pending
**Repo:** email-poc
**Goal:** Optimize for large mailboxes and responsive UI

**Prerequisites:** Task 5.5 completed

**Steps:**
1. Profile current performance:
   - API response times
   - Dashboard load time
   - Memory usage
2. Optimize backend:
   - Add database indexes if needed
   - Implement query caching
   - Optimize N+1 queries
3. Optimize frontend:
   - Implement virtual scrolling for long lists
   - Add pagination where missing
   - Optimize re-renders
4. Optimize mailbox reader:
   - Large file handling
   - Memory-efficient parsing
   - Batch database writes
5. Document performance characteristics:
   - Expected mailbox size limits
   - Resource requirements
   - Optimization recommendations

**Success Criteria:** System handles 100k+ emails efficiently

**Completion Notes:**

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 2.7-2.10 | 4 tasks | Complete Backend API Layer |
| 3 | 7 tasks | Mailbox Reader (Thunderbird local mail) |
| 4 | 7 tasks | Dashboard UI (React) |
| 5 | 6 tasks | Integration |

**Total Remaining Tasks:** 24

**Completion String:** `<completion-promise>RALPH_LOOP_COMPLETE: All AI Integration tasks finished</completion-promise>`
