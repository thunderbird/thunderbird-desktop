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
      },

      /**
       * Called when the tab is shown/activated.
       *
       * @param {object} tab - The tab info object.
       */
      showTab(tab) {
        // Placeholder for any actions needed when showing the tab
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
       *
       * @param {object} tab - The tab info object.
       * @returns {object} State object to be persisted.
       */
      persistTab(tab) {
        const tabmail = document.getElementById("tabmail");
        return {
          // Store whether this tab was in the background
          background: tab !== tabmail.currentTabInfo,
        };
      },

      /**
       * Restores a tab from persisted state.
       *
       * @param {object} tabmail - The tabmail element.
       * @param {object} state - The persisted state object.
       */
      restoreTab(tabmail, state) {
        tabmail.openTab("life", state);
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
   *
   * @param {object} tab - The tab info object.
   */
  saveTabState(tab) {
    // Placeholder for saving any tab-specific state
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
