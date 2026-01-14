/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Life Dashboard Tab Type
 *
 * This module defines a tab type for the AI-powered "Life Dashboard" feature.
 * The Life tab embeds a browser element that loads a React dashboard served
 * by a FastAPI backend, providing an intelligent overview of email-derived
 * information including contacts, events, deliveries, and action items.
 *
 * @module lifeTabs
 */

/* globals MozElements */

var { MailE10SUtils } = ChromeUtils.importESModule(
  "resource:///modules/MailE10SUtils.sys.mjs"
);

/**
 * Configuration for the Life Dashboard backend connection.
 *
 * The Life Dashboard loads a React frontend served by a FastAPI backend.
 * By default, it connects to localhost:8000 where the backend should be running.
 *
 * To change the URL, you can:
 * 1. Pass a custom URL when opening the tab: tabmail.openTab("life", { url: "http://..." })
 * 2. Modify LIFE_DASHBOARD_API_URL below for a different default
 *
 * The backend should serve:
 * - GET / - The main dashboard HTML/React application
 * - GET /health - Health check endpoint (returns {"status": "ok"})
 * - Various API endpoints for entities, relationships, emails, etc.
 */

/**
 * Default API URL for the Life Dashboard backend.
 * This should point to the FastAPI server serving the dashboard frontend.
 * @type {string}
 */
const LIFE_DASHBOARD_API_URL = "http://localhost:8000";

/**
 * Fallback page shown when the backend is not available.
 * This data URL provides a user-friendly error message with instructions.
 * @type {string}
 */
const LIFE_DASHBOARD_ERROR_PAGE = `data:text/html,
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Life Dashboard - Backend Unavailable</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, %231a1a2e 0%25, %2316213e 100%25);
      color: %23e0e0e0;
      padding: 20px;
    }
    .container {
      background: %232d2d44;
      border-radius: 12px;
      padding: 40px;
      max-width: 550px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      text-align: center;
    }
    h1 {
      color: %23667eea;
      margin-bottom: 16px;
      font-size: 24px;
    }
    .status {
      background: %23453a2e;
      border: 1px solid %23b8860b;
      border-radius: 8px;
      padding: 16px;
      margin: 20px 0;
    }
    .status-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }
    p {
      color: %23aaa;
      line-height: 1.6;
      margin-bottom: 12px;
    }
    .instructions {
      text-align: left;
      background: %23252538;
      border-radius: 8px;
      padding: 16px;
      margin-top: 20px;
    }
    .instructions h3 {
      color: %23e0e0e0;
      margin-bottom: 12px;
      font-size: 16px;
    }
    .instructions ol {
      padding-left: 20px;
    }
    .instructions li {
      margin-bottom: 10px;
      color: %23bbb;
    }
    code {
      background: %231a1a2e;
      padding: 2px 8px;
      border-radius: 4px;
      font-family: 'SF Mono', Monaco, 'Courier New', monospace;
      font-size: 13px;
      color: %2398d8c8;
    }
    .retry-btn {
      background: %23667eea;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      margin-top: 20px;
      transition: background 0.2s;
    }
    .retry-btn:hover {
      background: %235563d9;
    }
    .troubleshoot {
      text-align: left;
      background: %231e1e30;
      border-radius: 8px;
      padding: 16px;
      margin-top: 16px;
      border: 1px solid %23333;
    }
    .troubleshoot h3 {
      color: %23e0e0e0;
      margin-bottom: 10px;
      font-size: 14px;
    }
    .troubleshoot ul {
      padding-left: 18px;
      margin: 0;
    }
    .troubleshoot li {
      margin-bottom: 6px;
      color: %23999;
      font-size: 13px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Life Dashboard</h1>
    <div class="status">
      <div class="status-icon">%E2%9A%A0%EF%B8%8F</div>
      <strong>Backend Server Not Available</strong>
    </div>
    <p>The Life Dashboard backend is not running at <code>${LIFE_DASHBOARD_API_URL}</code></p>
    <div class="instructions">
      <h3>Quick Start:</h3>
      <ol>
        <li>Open a terminal in the <code>email-poc/v1</code> directory</li>
        <li>Build the dashboard: <code>./packages/api/scripts/build-dashboard.sh</code></li>
        <li>Start the server: <code>uv run uvicorn api.main:app</code></li>
        <li>Wait for "Application startup complete"</li>
        <li>Click <strong>Retry Connection</strong> below</li>
      </ol>
    </div>
    <div class="troubleshoot">
      <h3>Troubleshooting:</h3>
      <ul>
        <li>Verify the server is running: <code>curl ${LIFE_DASHBOARD_API_URL}/health</code></li>
        <li>Check if port 8000 is available or in use</li>
        <li>Ensure PostgreSQL database is running and accessible</li>
        <li>Check terminal for error messages</li>
        <li>Review logs in the API package directory</li>
      </ul>
    </div>
    <button class="retry-btn" onclick="window.location.reload()">
      Retry Connection
    </button>
  </div>
</body>
</html>`.replace(/\n/g, "").replace(/\s{2,}/g, " ");

/**
 * Tab monitor for Life Dashboard.
 * Monitors tab events and updates state accordingly.
 */
var lifeTabMonitor = {
  monitorName: "lifeTabMonitor",

  // Required tab monitor methods (unused for now, but needed for interface)
  onTabTitleChanged() {},
  onTabOpened() {},
  onTabClosing() {},
  onTabPersist() {},
  onTabRestored() {},

  /**
   * Called when switching between tabs.
   *
   * @param {object} aNewTab - The tab being switched to.
   * @param {object} aOldTab - The tab being switched from.
   */
  onTabSwitched(aNewTab, aOldTab) {
    // Placeholder for any state updates needed when switching to/from Life tab
    if (aOldTab?.mode.name === "life") {
      // Handle switching away from Life tab if needed
    }
    if (aNewTab?.mode.name === "life") {
      // Handle switching to Life tab if needed
    }
  },
};

/**
 * Life Dashboard Tab Type Definition.
 *
 * Uses a shared panel approach (panelId) since we only need one Life tab.
 * The panel will contain an embedded browser element that loads the
 * dashboard UI from a local FastAPI server.
 */
var lifeTabType = {
  name: "life",
  panelId: "lifeTabPanel",
  modes: {
    life: {
      type: "life",
      // Only allow one Life Dashboard tab at a time
      maxTabs: 1,

      /**
       * Opens the Life Dashboard tab.
       *
       * @param {object} tab - The tab info object.
       * @param {object} args - Optional arguments for opening the tab.
       */
      openTab(tab, args) {
        // Set the tab icon
        tab.tabNode.setIcon(
          "chrome://messenger/skin/icons/new/compact/calendar.svg"
        );
        // Set the tab title
        tab.title = "Life Dashboard";

        // Get the browser element from the panel
        tab.browser = document.getElementById("lifeTabBrowser");

        if (tab.browser) {
          // Configure browser for content loading
          tab.browser.setAttribute("type", "content");

          // Determine the URL to load
          const url = args.url || LIFE_DASHBOARD_API_URL;

          // Check if backend is available before loading
          this.checkBackendAndLoad(tab, url);
        }
      },

      /**
       * Checks if the backend is available and loads the appropriate URL.
       * If the backend health check fails, loads an error page instead.
       *
       * @param {object} tab - The tab info object.
       * @param {string} url - The URL to load if backend is available.
       */
      async checkBackendAndLoad(tab, url) {
        try {
          // Try to reach the health endpoint with a short timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);

          const response = await fetch(`${LIFE_DASHBOARD_API_URL}/health`, {
            method: "GET",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            // Backend is available, load the dashboard
            MailE10SUtils.loadURI(tab.browser, url);
          } else {
            // Backend returned an error, show error page
            MailE10SUtils.loadURI(tab.browser, LIFE_DASHBOARD_ERROR_PAGE);
          }
        } catch {
          // Network error or timeout, show error page
          MailE10SUtils.loadURI(tab.browser, LIFE_DASHBOARD_ERROR_PAGE);
        }
      },

      /**
       * Called when the tab is shown/activated.
       * The opposite of saveTabState - restores any visual state.
       *
       * @param {object} tab - The tab info object.
       */
      showTab(tab) {
        // Ensure browser is set to primary type when shown
        if (tab.browser) {
          tab.browser.setAttribute("type", "content");
          tab.browser.setAttribute("primary", "true");
        }
      },

      /**
       * Called when the tab is being closed.
       *
       * @param {object} tab - The tab info object.
       */
      closeTab(tab) {
        // Placeholder for any cleanup needed when closing the tab
      },

      /**
       * Persists the tab state for session restore.
       * Called when Thunderbird is closing to save tab state.
       *
       * @param {object} tab - The tab info object.
       * @returns {object} State object to be persisted.
       */
      persistTab(tab) {
        const tabmail = document.getElementById("tabmail");
        const state = {
          // Store whether this tab was in the background
          background: tab !== tabmail.currentTabInfo,
        };

        // Store the current URL if available (for future use when
        // the dashboard supports different views/states)
        if (tab.browser?.currentURI?.spec) {
          state.url = tab.browser.currentURI.spec;
        }

        return state;
      },

      /**
       * Restores a tab from persisted state.
       * Called when Thunderbird starts and restores the session.
       *
       * @param {object} tabmail - The tabmail element.
       * @param {object} state - The persisted state object.
       */
      restoreTab(tabmail, state) {
        // Open the Life tab, passing the persisted state
        // The background property will be used by tabmail to determine
        // if this tab should be switched to after restoration
        tabmail.openTab("life", {
          background: state.background,
          // Don't restore URL for now - always start fresh with default
          // url: state.url,
        });
      },

      /**
       * Called when the tab title should be updated.
       *
       * @param {object} tab - The tab info object.
       */
      onTitleChanged(tab) {
        tab.title = "Life Dashboard";
      },

      /**
       * Determines if we should switch to an existing tab.
       * Since maxTabs is 1, this returns the index of the existing tab if found.
       *
       * @param {object} args - Arguments for opening the tab.
       * @returns {number} Index of existing tab to switch to, or -1 to open new.
       */
      shouldSwitchTo(args) {
        const tabmail = document.getElementById("tabmail");
        const tabIndex = tabmail.tabModes.life.tabs[0]
          ? tabmail.tabInfo.indexOf(tabmail.tabModes.life.tabs[0])
          : -1;
        return tabIndex;
      },

      /**
       * Returns the browser element for this tab.
       *
       * @param {object} tab - The tab info object.
       * @returns {Element} The browser element.
       */
      getBrowser(tab) {
        return tab.browser || document.getElementById("lifeTabBrowser");
      },

      // Command handling stubs (can be expanded later)
      supportsCommand(aCommand) {
        return false;
      },
      isCommandEnabled(aCommand) {
        return false;
      },
      doCommand(aCommand) {},
      onEvent(aEvent) {},
    },
  },

  /**
   * Saves the tab state when deactivated/hidden.
   * The opposite of showTab - called when switching away from tab.
   *
   * @param {object} tab - The tab info object.
   */
  saveTabState(tab) {
    // When tab is hidden/deactivated, remove primary attribute
    if (tab.browser) {
      tab.browser.setAttribute("type", "content");
      tab.browser.removeAttribute("primary");
    }
  },
};

/**
 * Lazy getter for notification box in the Life tab panel.
 * Creates a notification box for displaying messages to the user.
 */
ChromeUtils.defineLazyGetter(lifeTabType.modes.life, "notificationbox", () => {
  return new MozElements.NotificationBox(element => {
    const container = document.getElementById(
      "life-deactivated-notification-location"
    );
    if (container) {
      container.append(element);
    }
  });
});

/**
 * Register the Life tab type when the window loads.
 * This follows the pattern used by calendar-tabs.js.
 */
window.addEventListener("load", () => {
  const tabmail = document.getElementById("tabmail");
  if (tabmail) {
    tabmail.registerTabType(lifeTabType);
    tabmail.registerTabMonitor(lifeTabMonitor);
  }
});
