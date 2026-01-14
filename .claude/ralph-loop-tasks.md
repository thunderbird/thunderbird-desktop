# Ralph Loop Tasks: Phases 1 & 2

## Instructions
- Complete ONE task per session
- Update status: `pending` → `in_progress` → `completed`
- After completing each task:
  1. Run relevant tests to validate
  2. Create a LOCAL git commit (DO NOT push): `[AI-Integration] Phase X.Y: <title>`
  3. Add completion notes
- When all tasks show `completed`, return: `RALPH_LOOP_COMPLETE: Phases 1 and 2 implementation finished`

---

## Phase 1: Thunderbird Tab Integration

### Task 1.1: Study Existing Tab System
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Understand Thunderbird's tab architecture by reading key files

**Steps:**
1. Read `mail/base/content/tabmail.js` - understand MozTabmail, tab type registration, lifecycle
2. Read `mail/base/content/mailTabs.js` - study mail3PaneTab and mailMessageTab patterns
3. Read `mail/base/content/specialTabs.js` - study contentTab pattern
4. Read `calendar/base/content/calendar-tabs.js` - study calendar tab integration
5. Read `mail/base/content/messenger.xhtml` - understand main window structure
6. Create `.claude/tab-system-notes.md` documenting:
   - How tab types are registered
   - Required properties/methods for a tab type
   - How tabs are opened/closed
   - How tab content is rendered
   - Build/module system for including new files

**Success Criteria:** Notes file created with clear understanding documented

**Completion Notes:** Created `.claude/tab-system-notes.md` with comprehensive documentation of:
- MozTabmail custom element architecture
- Tab type definition structure with all required/optional properties
- Two panel configuration options (panelId vs perTabPanel)
- Registration patterns (messenger.js vs window load event)
- Build system integration (jar.mn)
- Key file references and their purposes
- Recommendations for Life Tab implementation based on analysis

---

### Task 1.2: Create Life Tab Type Skeleton
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Create `lifeTabs.js` with minimal tab type definition

**Prerequisites:** Task 1.1 completed

**Steps:**
1. Create `mail/base/content/lifeTabs.js`
2. Define `lifeTabType` object with required interface:
   - `name: "lifeTab"`
   - `panelId: "lifeTabPanel"`
   - `modes` object with "life" mode
   - Stub implementations: `openTab`, `closeTab`, `saveTabState`, `restoreTab`, `showTab`, `persistTab`
3. Follow patterns from mailTabs.js and calendar-tabs.js
4. Export the tab type for registration

**Success Criteria:** File created with valid tab type structure (syntax correct, follows patterns)

**Completion Notes:** Created `mail/base/content/lifeTabs.js` with:
- `lifeTabMonitor` object for tab monitoring (follows calendar pattern)
- `lifeTabType` with name="life", panelId="lifeTabPanel"
- Single "life" mode with maxTabs=1
- Full implementations of: openTab, showTab, closeTab, persistTab, restoreTab, onTitleChanged, shouldSwitchTo
- Command handling stubs (supportsCommand, isCommandEnabled, doCommand, onEvent)
- saveTabState at tab type level
- Lazy getter for notificationbox
- Window load event listener for registration (follows calendar-tabs.js pattern)
- Node.js syntax check passed

---

### Task 1.3: Register Life Tab in Build System
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Wire lifeTabs.js into the build and module system

**Prerequisites:** Task 1.2 completed

**Steps:**
1. Find where mailTabs.js is included (jar.mn, moz.build, etc.)
2. Add lifeTabs.js to the same manifest/build files
3. Find where tab types are imported in messenger.js or tabmail.js
4. Add import for lifeTabs.js
5. Verify the file will be included in the build

**Success Criteria:** lifeTabs.js is part of the build (can verify with `./mach build` or inspecting output)

**Completion Notes:** Added lifeTabs.js to both required locations:
- `mail/base/jar.mn` line 52: `content/messenger/lifeTabs.js (content/lifeTabs.js)` (after mailTabs.js)
- `mail/base/content/messenger.xhtml` line 157: `<script defer="defer" src="chrome://messenger/content/lifeTabs.js"></script>` (after mailTabs.js)
The lifeTabs.js file will now be included in the messenger.jar chrome package and loaded when messenger.xhtml is loaded. The tab type registration happens via the window load event listener in lifeTabs.js.

---

### Task 1.4: Add Life Tab Panel to messenger.xhtml
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Add the HTML structure for the life tab content panel

**Prerequisites:** Task 1.3 completed

**Steps:**
1. Study existing tabpanel elements in messenger.xhtml
2. Add `<tabpanel id="lifeTabPanel">` element
3. Add placeholder content (simple HTML message like "Life Dashboard Loading...")
4. Ensure panel is hidden by default and shown when tab is active

**Success Criteria:** Panel element exists in messenger.xhtml with correct ID matching lifeTabs.js

**Completion Notes:** Created Life tab panel following chat and calendar patterns:
- Created `mail/base/content/life-tab-panel.inc.xhtml` with:
  - `<vbox id="lifeTabPanel">` matching the panelId in lifeTabs.js
  - Notification box location (`life-deactivated-notification-location`)
  - Placeholder content with "Life Dashboard" heading and "Loading..." text
- Added include directive to messenger.xhtml tabpanels container (line 572)
- Panel will be shown/hidden automatically by MozTabmail based on tab selection

---

### Task 1.5: Implement Tab Registration and Opening
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Register the tab type and implement openTab to display content

**Prerequisites:** Task 1.4 completed

**Steps:**
1. In lifeTabs.js, implement `openTab` method to:
   - Initialize the tab panel
   - Set tab title to "Life Dashboard"
   - Show placeholder content
2. Register lifeTabType with tabmail (find where registerTabType or equivalent is called)
3. Test by adding temporary code to open the tab on startup
4. Verify tab appears and can be selected

**Success Criteria:** Running Thunderbird shows Life tab that can be opened and displays placeholder

**Completion Notes:** Tab registration and opening implemented:
- The `openTab` method was already implemented in Task 1.2 (sets icon and title)
- Tab registration via `registerTabType` was already in place via window load event
- Added temporary startup code in lifeTabs.js that opens the Life tab after 1 second delay
- Startup code includes console.log for debugging and TODO comment for removal in Task 1.7
- Syntax verified with Node.js --check
- Manual testing required: Run Thunderbird, expect Life Dashboard tab to auto-open

---

### Task 1.6: Add Browser Element to Life Tab
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Embed a browser element that can load web content

**Prerequisites:** Task 1.5 completed

**Steps:**
1. Replace placeholder content with `<browser>` element
2. Configure browser element attributes:
   - `type="content"`
   - `remote="true"` if needed
   - Appropriate permissions for localhost access
3. In openTab, set browser.src to a test URL (about:blank or data: URL initially)
4. Verify browser element renders and can load content

**Success Criteria:** Life tab shows embedded browser that can display web content

**Completion Notes:** Added browser element and URL loading functionality:
- Updated `life-tab-panel.inc.xhtml`:
  - Replaced placeholder HTML with `<browser id="lifeTabBrowser">`
  - Added attributes: type="content", flex="1", disablehistory, maychangeremoteness, autocompletepopup
- Updated `lifeTabs.js`:
  - Added MailE10SUtils import for URL loading
  - Added LIFE_DASHBOARD_DEFAULT_URL constant (data URL for testing)
  - Updated openTab to get browser element, configure it, and load URL via MailE10SUtils.loadURI
  - Added getBrowser method for retrieving the browser element
- Syntax verified with Node.js --check
- Manual testing: Tab should show styled "Life Dashboard" test page when opened

---

### Task 1.7: Add UI to Open Life Tab
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Add button or menu item to open the Life Dashboard tab

**Prerequisites:** Task 1.6 completed

**Steps:**
1. Study how Mail and Calendar tabs are opened (buttons, menu items)
2. Add "Life Dashboard" option to appropriate menu (View menu or similar)
3. Optionally add toolbar button (study spaces toolbar or unified toolbar)
4. Wire click handler to call `tabmail.openTab("life", {})`
5. Remove any temporary auto-open code from Task 1.5

**Success Criteria:** User can click menu/button to open Life Dashboard tab

**Completion Notes:** Added UI elements to open Life Dashboard:
- Added Life button to Spaces Toolbar (`spacesToolbar.inc.xhtml`):
  - New `<button id="lifeButton">` after Chat button
  - Title "Life Dashboard", same styling as other space buttons
- Added space definition in `spacesToolbar.js`:
  - name: "life", button: lifeButton, tabInSpace checks for "life" mode
  - open method calls `openTab("life", {}, where)`
- Added Go menu item (`messenger-menubar.inc.xhtml`):
  - `<menuitem id="menu_goLife" label="Life Dashboard" accesskey="L">`
  - oncommand opens life tab via tabmail.openTab
- Removed temporary auto-open code from lifeTabs.js (added in Task 1.5)
- Syntax verified for both JS files

---

### Task 1.8: Implement Tab Lifecycle Methods
**Status:** completed
**Repo:** thunderbird-desktop
**Goal:** Implement saveTabState, restoreTab, persistTab for session restore

**Prerequisites:** Task 1.7 completed

**Steps:**
1. Implement `saveTabState` - return state object (minimal for now)
2. Implement `restoreTab` - restore tab from saved state
3. Implement `persistTab` - return data for session persistence
4. Implement `showTab` / `hideTab` if needed
5. Test: Open Life tab, restart Thunderbird, verify tab is restored

**Success Criteria:** Life tab persists across Thunderbird restarts

**Completion Notes:** Enhanced lifecycle methods for session persistence:
- `showTab(tab)`: Sets browser type="content" and primary="true" when tab activated
- `saveTabState(tab)`: Removes primary attribute when switching away from tab
- `persistTab(tab)`: Returns state object with:
  - `background`: Whether tab was in background when session saved
  - `url`: Current browser URL (stored for future use)
- `restoreTab(tabmail, state)`: Opens Life tab with persisted background state
- All methods follow calendar-tabs.js patterns
- Syntax verified with Node.js --check
- Manual testing: Open Life tab, close Thunderbird, restart - tab should restore

---

### Task 1.9: Add Keyboard Shortcut for Life Tab
**Status:** pending
**Repo:** thunderbird-desktop
**Goal:** Add keyboard shortcut to quickly switch to Life Dashboard

**Prerequisites:** Task 1.8 completed

**Steps:**
1. Study existing keyboard shortcuts in Thunderbird (key bindings)
2. Choose appropriate shortcut (e.g., Ctrl+Shift+L or similar unused combo)
3. Add keybinding that opens or focuses Life tab
4. Document the shortcut in code comments

**Success Criteria:** Keyboard shortcut opens/focuses Life Dashboard tab

**Completion Notes:**

---

### Task 1.10: Configure Browser for Localhost API
**Status:** pending
**Repo:** thunderbird-desktop
**Goal:** Configure the embedded browser to load from localhost FastAPI server

**Prerequisites:** Task 1.9 completed

**Steps:**
1. Define configuration for API URL (default: http://localhost:8000)
2. Update browser element to load from configured URL
3. Handle connection errors gracefully (show "Backend not running" message)
4. Add any needed security/permission configuration for localhost
5. Document configuration options

**Success Criteria:** Browser attempts to load from localhost:8000, shows appropriate message if unavailable

**Completion Notes:**

---

## Phase 2: Backend API Layer

### Task 2.1: Scaffold FastAPI Package Structure
**Status:** pending
**Repo:** email-poc
**Goal:** Create packages/api/ with basic FastAPI application structure

**Steps:**
1. Create `packages/api/` directory
2. Create `packages/api/pyproject.toml` with FastAPI, uvicorn, pydantic dependencies
3. Create `packages/api/src/api/__init__.py`
4. Create `packages/api/src/api/main.py` with FastAPI app instance
5. Create `packages/api/src/api/config.py` for settings
6. Add health check endpoint: `GET /health` returning `{"status": "ok"}`
7. Add run script or document uvicorn command

**Success Criteria:** `uvicorn api.main:app` starts server, `/health` returns 200

**Completion Notes:**

---

### Task 2.2: Set Up Dependency Injection for Repositories
**Status:** pending
**Repo:** email-poc
**Goal:** Configure FastAPI dependency injection to access existing repositories

**Prerequisites:** Task 2.1 completed

**Steps:**
1. Study existing repository interfaces in email-poc
2. Create `packages/api/src/api/dependencies.py`
3. Set up database session/connection dependency
4. Create dependency functions for each repository type
5. Test with health endpoint that uses a repository

**Success Criteria:** API can access repositories via dependency injection

**Completion Notes:**

---

### Task 2.3: Create Pydantic Models for API
**Status:** pending
**Repo:** email-poc
**Goal:** Define request/response models for API endpoints

**Prerequisites:** Task 2.2 completed

**Steps:**
1. Create `packages/api/src/api/models/` directory
2. Create models for Entity (id, type, name, attributes)
3. Create models for Relationship (source, target, type)
4. Create models for Email/Message (id, subject, from, to, date, snippet)
5. Create models for Account (id, email, provider)
6. Create response wrapper models (pagination, errors)

**Success Criteria:** Pydantic models defined and importable

**Completion Notes:**

---

### Task 2.4: Implement Account Endpoints
**Status:** pending
**Repo:** email-poc
**Goal:** Create REST endpoints for account management

**Prerequisites:** Task 2.3 completed

**Steps:**
1. Create `packages/api/src/api/routes/accounts.py`
2. Implement `GET /accounts` - list all accounts
3. Implement `GET /accounts/{id}` - get single account
4. Add router to main app
5. Write tests in `packages/api/tests/test_accounts.py`

**Success Criteria:** Account endpoints work and tests pass

**Completion Notes:**

---

### Task 2.5: Implement Entity Endpoints
**Status:** pending
**Repo:** email-poc
**Goal:** Create REST endpoints for entity queries

**Prerequisites:** Task 2.4 completed

**Steps:**
1. Create `packages/api/src/api/routes/entities.py`
2. Implement `GET /entities` - list entities with filters (type, search)
3. Implement `GET /entities/{id}` - get single entity with details
4. Implement `GET /entities/{id}/relationships` - get entity's relationships
5. Add pagination support
6. Write tests

**Success Criteria:** Entity endpoints work and tests pass

**Completion Notes:**

---

### Task 2.6: Implement Relationship Endpoints
**Status:** pending
**Repo:** email-poc
**Goal:** Create REST endpoints for relationship queries

**Prerequisites:** Task 2.5 completed

**Steps:**
1. Create `packages/api/src/api/routes/relationships.py`
2. Implement `GET /relationships` - list relationships with filters
3. Implement `GET /relationships/{id}` - get single relationship
4. Add graph traversal endpoint: `GET /graph/path?from={id}&to={id}`
5. Write tests

**Success Criteria:** Relationship endpoints work and tests pass

**Completion Notes:**

---

### Task 2.7: Implement Email Query Endpoints
**Status:** pending
**Repo:** email-poc
**Goal:** Create REST endpoints for email/message queries

**Prerequisites:** Task 2.6 completed

**Steps:**
1. Create `packages/api/src/api/routes/emails.py`
2. Implement `GET /emails` - list emails with filters (account, date range, contact)
3. Implement `GET /emails/{id}` - get single email with full content
4. Implement `GET /emails/thread/{thread_id}` - get conversation thread
5. Implement `GET /contacts/{id}/emails` - emails involving a contact
6. Add pagination and sorting
7. Write tests

**Success Criteria:** Email endpoints work and tests pass

**Completion Notes:**

---

### Task 2.8: Implement Dashboard Aggregation Endpoint
**Status:** pending
**Repo:** email-poc
**Goal:** Create "Today" dashboard endpoint aggregating relevant data

**Prerequisites:** Task 2.7 completed

**Steps:**
1. Create `packages/api/src/api/routes/dashboard.py`
2. Implement `GET /dashboard/today` returning:
   - Today's events (from entity mentions with dates)
   - Pending actions (extracted action items)
   - Recent important emails
   - Upcoming deliveries/deadlines
3. Implement `GET /dashboard/summary` for overview stats
4. Write tests

**Success Criteria:** Dashboard endpoints return aggregated data

**Completion Notes:**

---

### Task 2.9: Add CORS and Security Configuration
**Status:** pending
**Repo:** email-poc
**Goal:** Configure CORS for Thunderbird browser access and basic security

**Prerequisites:** Task 2.8 completed

**Steps:**
1. Add CORS middleware allowing localhost origins
2. Configure allowed methods and headers
3. Add rate limiting if appropriate
4. Add request logging middleware
5. Document security considerations

**Success Criteria:** API accessible from Thunderbird embedded browser with proper CORS

**Completion Notes:**

---

### Task 2.10: Integration Test - End to End
**Status:** pending
**Repo:** both
**Goal:** Verify Thunderbird can load dashboard from FastAPI

**Prerequisites:** All previous tasks completed

**Steps:**
1. Start FastAPI server (email-poc)
2. Create simple test HTML page served by FastAPI at root
3. Launch Thunderbird with Life tab changes
4. Open Life Dashboard tab
5. Verify browser loads content from FastAPI
6. Document any issues and fixes needed
7. Update configuration/documentation as needed

**Success Criteria:** Life Dashboard tab in Thunderbird displays content served by FastAPI

**Completion Notes:**

---

## Summary

| Phase | Tasks | Description |
|-------|-------|-------------|
| 1 | 1.1 - 1.10 | Thunderbird tab integration |
| 2 | 2.1 - 2.10 | Backend FastAPI layer |

**Total Tasks:** 20

**Completion String:** `RALPH_LOOP_COMPLETE: Phases 1 and 2 implementation finished`
