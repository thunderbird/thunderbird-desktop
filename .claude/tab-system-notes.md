# Thunderbird Tab System Architecture Notes

This document summarizes the Thunderbird tab system architecture based on analysis of key source files.

## Core Components

### MozTabmail (`mail/base/content/tabmail.js`)

The `MozTabmail` custom element is the core tab management engine. Key properties:

- **`tabTypes`**: Dictionary of registered tab types (keyed by tab type name)
- **`tabModes`**: Dictionary of all modes across all tab types (keyed by mode name)
- **`tabInfo`**: Array of currently open tabs (tab info objects)
- **`currentTabInfo`**: The currently selected tab
- **`panelContainer`**: The `<tabpanels>` element that contains tab content

Key methods:
- `registerTabType(aTabType)`: Registers a new tab type
- `openTab(aTabModeName, aArgs)`: Opens a new tab of the specified mode
- `closeTab(aTab)`: Closes a tab
- `switchToTab(aTab)`: Switches to the specified tab
- `persistTab(tab)` / `restoreTab(state)`: Session persistence

## Tab Type Definition Structure

A tab type definition must include:

```javascript
var myTabType = {
  // Required: unique name for this tab type
  name: "myTab",

  // Panel configuration (one of these two):
  panelId: "myTabPanel",        // For single shared panel (like calendar)
  // OR
  perTabPanel: "vbox",          // For per-tab panels - XUL element name or function

  // Mode definitions (required)
  modes: {
    modeName: {
      // CSS type for styling
      type: "modeName",

      // Optional: mark as default tab
      isDefault: false,

      // Optional: limit number of tabs of this mode
      maxTabs: 1,

      // Tab lifecycle methods
      openTab(tab, args) { },
      closeTab(tab) { },
      saveTabState(tab) { },
      showTab(tab) { },

      // Session persistence
      persistTab(tab) { return { /* state */ }; },
      restoreTab(tabmail, state) { tabmail.openTab("modeName", state); },

      // Optional: Tab title handling
      onTitleChanged(tab) { tab.title = "My Tab"; },

      // Optional: Decide whether to switch to existing tab
      shouldSwitchTo(args) { return -1; /* or index of existing tab */ },

      // Optional: Command handling
      supportsCommand(command, tab) { },
      isCommandEnabled(command, tab) { },
      doCommand(command, tab) { },

      // Optional: Get browser element for this tab
      getBrowser(tab) { return tab.browser; }
    }
  },

  // Optional: Shared methods at tab type level (modes can defer to these)
  openTab(tab, args) { },
  closeTab(tab) { },
  saveTabState(tab) { },
  showTab(tab) { }
};
```

## Tab Info Object

When a tab is opened, a tab info object is created with:

```javascript
{
  mode: /* reference to mode definition */,
  tabId: /* unique numeric ID */,
  tabNode: /* the <tab> DOM element */,
  panel: /* the tab panel DOM element (if perTabPanel) */,
  title: /* tab title string */,
  busy: false,
  thinking: false,
  canClose: true,
  first: /* true for first tab only */,
  _ext: { /* extension data storage */ }
}
```

## Registration Patterns

### Pattern 1: Register in messenger.js (primary tabs)

Mail tabs are registered in `messenger.js`:

```javascript
const tabmail = document.getElementById("tabmail");
tabmail.registerTabType(mailTabType);  // from mailTabs.js
tabmail.registerTabType(glodaFacetTabType);
tabmail.openFirstTab();

specialTabs.openSpecialTabsOnStartup(); // registers contentTabType
tabmail.registerTabType(addressBookTabType);
tabmail.registerTabType(preferencesTabType);
```

### Pattern 2: Register on window load (addons/calendar)

Calendar tabs register on `DOMContentLoaded`:

```javascript
// In calendar-tabs.js
window.addEventListener("load", () => {
  const tabmail = document.getElementById("tabmail");
  tabmail.registerTabType(calendarTabType);
  tabmail.registerTabType(calendarItemTabType);
  tabmail.registerTabMonitor(calendarTabMonitor);
});
```

## Build/Module System Integration

Files are added to `mail/base/jar.mn`:

```
content/messenger/myTabs.js  (content/myTabs.js)
```

Scripts are included in `messenger.xhtml`:

```html
<script defer="defer" src="chrome://messenger/content/myTabs.js"></script>
```

## Panel Configuration Options

### 1. Single Shared Panel (`panelId`)

Used when all tabs of this type share a single panel (like Calendar):

```javascript
var calendarTabType = {
  name: "calendar",
  panelId: "calendarTabPanel", // ID in messenger.xhtml
  modes: { /* ... */ }
};
```

Panel defined in `messenger.xhtml` or included file:
```xml
<tabpanel id="calendarTabPanel">
  <!-- content here -->
</tabpanel>
```

### 2. Per-Tab Panels (`perTabPanel`)

Used when each tab gets its own panel (like mail tabs, content tabs):

```javascript
var mailTabType = {
  name: "mailTab",
  perTabPanel: "vbox", // XUL element to create for each tab
  modes: { /* ... */ }
};
```

Or with a function:
```javascript
perTabPanel: function(tab) {
  // Create and return custom element
  return document.createXULElement("vbox");
}
```

## Example Implementations

### Mail Tabs (mailTabs.js)

- Uses `perTabPanel: "vbox"`
- Clones template from `mail3PaneTabTemplate` in messenger.xhtml
- Embeds browser element that loads `about:3pane`
- Has two modes: `mail3PaneTab` (3-pane) and `mailMessageTab` (single message)

### Calendar Tabs (calendar-tabs.js)

- Uses `panelId: "calendarTabPanel"` - shared panel
- Has two modes: `calendar` and `tasks`
- Also has `calendarItemTabType` with `perTabPanel: "vbox"` for event editing

### Content Tabs (specialTabs.js)

- Uses `perTabPanel: "vbox"` - each tab gets own panel
- Has one mode: `contentTab`
- Clones template from `contentTab` element in messenger.xhtml
- Creates browser element dynamically in `openTab`
- Includes toolbar with back/forward buttons

## Tab Panel Templates in messenger.xhtml

```xml
<!-- Templates for per-tab panels -->
<html:template id="mail3PaneTabTemplate">
  <stack flex="1">
    <browser flex="1" src="about:3pane" ... />
  </stack>
</html:template>

<!-- Hidden template for content tabs -->
<vbox id="contentTab" collapsed="collapsed">
  <vbox flex="1" class="contentTabInstance">
    <vbox class="contentTabToolbox themeable-full">
      <!-- toolbar -->
    </vbox>
    <stack flex="1"><!-- browser inserted here --></stack>
  </vbox>
</vbox>

<!-- Shared panels in tabpanelcontainer -->
<tabpanels id="tabpanelcontainer">
  <!-- Chat panel -->
  <!-- Calendar panel -->
</tabpanels>
```

## Key Files Summary

| File | Purpose |
|------|---------|
| `mail/base/content/tabmail.js` | Core MozTabmail custom element |
| `mail/base/content/mailTabs.js` | Mail tab types (mail3PaneTab, mailMessageTab) |
| `mail/base/content/specialTabs.js` | Content tab type and helpers |
| `calendar/base/content/calendar-tabs.js` | Calendar/Tasks tab types |
| `mail/base/content/messenger.xhtml` | Main window with tabpanels and templates |
| `mail/base/content/messenger.js` | Tab registration and startup logic |
| `mail/base/jar.mn` | Build manifest for including JS files |

## Recommendations for Life Tab Implementation

1. **Create `lifeTabs.js`** following the calendar tab pattern:
   - Use `panelId` for a shared panel approach (simpler)
   - Register on window load event

2. **Add panel to messenger.xhtml** inside `tabpanelcontainer`:
   ```xml
   <tabpanel id="lifeTabPanel">
     <browser type="content" remote="true" ... />
   </tabpanel>
   ```

3. **Register tab type** in `lifeTabs.js`:
   ```javascript
   window.addEventListener("load", () => {
     const tabmail = document.getElementById("tabmail");
     tabmail.registerTabType(lifeTabType);
   });
   ```

4. **Include script** in messenger.xhtml after calendar-tabs.js

5. **Add to build** via jar.mn:
   ```
   content/messenger/lifeTabs.js  (content/lifeTabs.js)
   ```
