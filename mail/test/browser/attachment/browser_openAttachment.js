/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, you can obtain one at http://mozilla.org/MPL/2.0/. */

const {
  add_message_to_folder,
  be_in_folder,
  create_folder,
  create_message,
  select_click_row,
} = ChromeUtils.import(
  "resource://testing-common/mozmill/FolderDisplayHelpers.jsm"
);

const mimeService = Cc["@mozilla.org/mime;1"].getService(Ci.nsIMIMEService);
const handlerService = Cc[
  "@mozilla.org/uriloader/handler-service;1"
].getService(Ci.nsIHandlerService);

const { MockFilePicker } = SpecialPowers;
MockFilePicker.init(window);

let tmpD;
let savePath;

let folder;

let mockedHandlerApp;
let mockedHandlers = new Set();

function pathToNsFile(path) {
  let file = Cc["@mozilla.org/file/local;1"].createInstance(Ci.nsIFile);
  file.initWithPath(path);
  return file;
}

add_task(async function setupModule(module) {
  folder = await create_folder("OpenAttachment");
  be_in_folder(folder);

  // @see logic for tmpD in msgHdrView.js
  tmpD = PathUtils.join(
    Services.dirsvc.get("TmpD", Ci.nsIFile).path,
    "pid-" + Services.appinfo.processID
  );

  savePath = PathUtils.join(tmpD, "saveDestination");
  await IOUtils.makeDirectory(savePath);
  Services.prefs.setStringPref("browser.download.dir", savePath);

  Services.prefs.setIntPref("browser.download.folderList", 2);
  Services.prefs.setBoolPref("browser.download.useDownloadDir", true);
  Services.prefs.setIntPref("security.dialog_enable_delay", 0);

  let mockedExecutable = FileUtils.getFile("TmpD", ["mockedExecutable"]);
  if (!mockedExecutable.exists()) {
    mockedExecutable.create(Ci.nsIFile.NORMAL_FILE_TYPE, 0o755);
  }

  mockedHandlerApp = Cc[
    "@mozilla.org/uriloader/local-handler-app;1"
  ].createInstance(Ci.nsILocalHandlerApp);
  mockedHandlerApp.executable = mockedExecutable;
  mockedHandlerApp.detailedDescription = "Mocked handler app";
  registerCleanupFunction(() => {
    if (mockedExecutable.exists()) {
      mockedExecutable.remove(true);
    }
  });
});

registerCleanupFunction(async function() {
  MockFilePicker.cleanup();

  await IOUtils.remove(savePath, { recursive: true });

  Services.prefs.clearUserPref("browser.download.dir");
  Services.prefs.clearUserPref("browser.download.folderList");
  Services.prefs.clearUserPref("browser.download.useDownloadDir");
  Services.prefs.clearUserPref("security.dialog.dialog_enable_delay");

  for (let type of mockedHandlers) {
    let handlerInfo = mimeService.getFromTypeAndExtension(type, null);
    if (handlerService.exists(handlerInfo)) {
      handlerService.remove(handlerInfo);
    }
  }

  // Remove created folders.
  folder.deleteSelf(null);
});

function createMockedHandler(type, preferredAction, alwaysAskBeforeHandling) {
  info(`Creating handler for ${type}`);

  let handlerInfo = mimeService.getFromTypeAndExtension(type, null);
  handlerInfo.preferredAction = preferredAction;
  handlerInfo.alwaysAskBeforeHandling = alwaysAskBeforeHandling;

  handlerInfo.description = mockedHandlerApp.detailedDescription;
  handlerInfo.possibleApplicationHandlers.appendElement(mockedHandlerApp);
  handlerInfo.hasDefaultHandler = true;
  handlerInfo.preferredApplicationHandler = mockedHandlerApp;

  handlerService.store(handlerInfo);
  mockedHandlers.add(type);
}

let messageIndex = -1;
function createAndLoadMessage(type, filename) {
  messageIndex++;

  if (!filename) {
    filename = `attachment${messageIndex}.test${messageIndex}`;
  }

  add_message_to_folder(
    folder,
    create_message({
      subject: `${type} attachment`,
      body: {
        body: "I'm an attached email!",
      },
      attachments: [
        {
          contentType: type,
          body: `${type}Attachment`,
          filename,
        },
      ],
    })
  );
  select_click_row(messageIndex);
}

async function clickWithDialog(
  { mode = "save", rememberExpected = true, remember } = {},
  button = "cancel"
) {
  let dialogPromise = BrowserTestUtils.promiseAlertDialog(
    undefined,
    "chrome://mozapps/content/downloads/unknownContentType.xhtml",
    {
      async callback(dialogWindow) {
        await new Promise(resolve => dialogWindow.setTimeout(resolve));
        await new Promise(resolve => dialogWindow.setTimeout(resolve));

        let dialogDocument = dialogWindow.document;
        let rememberChoice = dialogDocument.getElementById("rememberChoice");
        Assert.equal(
          dialogDocument.getElementById("mode").selectedItem.id,
          mode,
          "correct action is selected"
        );
        Assert.equal(
          rememberChoice.checked,
          rememberExpected,
          "remember choice checkbox checked/not checked as expected"
        );
        if (remember !== undefined && remember != rememberExpected) {
          EventUtils.synthesizeMouseAtCenter(rememberChoice, {}, dialogWindow);
          Assert.equal(
            rememberChoice.checked,
            remember,
            "remember choice checkbox changed"
          );
        }

        dialogDocument
          .querySelector("dialog")
          .getButton(button)
          .click();
      },
    }
  );
  info(document.getElementById("attachmentName").value);
  EventUtils.synthesizeMouseAtCenter(
    document.getElementById("attachmentName"),
    {},
    window
  );
  await dialogPromise;
}

async function clickWithoutDialog() {
  info(document.getElementById("attachmentName").value);
  EventUtils.synthesizeMouseAtCenter(
    document.getElementById("attachmentName"),
    {},
    window
  );
}

async function checkFileSaved(parentPath = savePath, leafName) {
  let expectedFile = pathToNsFile(parentPath);
  if (leafName) {
    expectedFile.append(leafName);
  } else {
    expectedFile.append(`attachment${messageIndex}.test${messageIndex}`);
  }
  await TestUtils.waitForCondition(
    () => expectedFile.exists(),
    `attachment was not saved to ${expectedFile.path}`
  );
  Assert.ok(expectedFile.exists(), `${expectedFile.path} exists`);
  // Wait a moment in case the file is still locked for writing.
  // eslint-disable-next-line mozilla/no-arbitrary-setTimeout
  await new Promise(resolve => setTimeout(resolve, 250));
  return expectedFile;
}

function checkHandler(type, preferredAction, alwaysAskBeforeHandling) {
  let handlerInfo = mimeService.getFromTypeAndExtension(type, null);
  Assert.equal(
    handlerInfo.preferredAction,
    preferredAction,
    `preferredAction of ${type}`
  );
  Assert.equal(
    handlerInfo.alwaysAskBeforeHandling,
    alwaysAskBeforeHandling,
    `alwaysAskBeforeHandling of ${type}`
  );
}

function promiseFileOpened() {
  let __openTemporaryFile = window.AttachmentInfo.prototype._openTemporaryFile;
  return new Promise(resolve => {
    window.AttachmentInfo.prototype._openTemporaryFile = function(
      mimeInfo,
      tempFile
    ) {
      window.AttachmentInfo.prototype._openTemporaryFile = __openTemporaryFile;
      resolve({ mimeInfo, tempFile });
    };
  });
}

/**
 * Check that the directory for saving is correct.
 * If not, we're gonna have a bad time.
 */
add_task(async function sanityCheck() {
  Assert.equal(
    await Downloads.getPreferredDownloadsDirectory(),
    savePath,
    "sanity check: correct downloads directory"
  );
});

// First, check content types we have no saved information about.

/**
 * Open a content type we've never seen before. Save, and remember the action.
 */
add_task(async function noHandler() {
  createAndLoadMessage("test/foo");
  await clickWithDialog({ rememberExpected: false, remember: true }, "accept");
  let file = await checkFileSaved();
  file.remove(false);
  checkHandler("test/foo", Ci.nsIHandlerInfo.saveToDisk, false);
});

/**
 * Open a content type we've never seen before. Save, and DON'T remember the
 * action (except that we do remember it, but also remember to ask next time).
 */
add_task(async function noHandlerNoSave() {
  createAndLoadMessage("test/bar");
  await clickWithDialog({ rememberExpected: false, remember: false }, "accept");
  let file = await checkFileSaved();
  file.remove(false);
  checkHandler("test/bar", Ci.nsIHandlerInfo.saveToDisk, true);
});

/**
 * The application/octet-stream type is handled weirdly. Check that opening it
 * still behaves in a useful way.
 */
add_task(async function applicationOctetStream() {
  createAndLoadMessage("application/octet-stream");
  await clickWithDialog({ rememberExpected: false }, "accept");
  await checkFileSaved();
});

// Now we'll test the various states that handler info objects might be in.
// There's two fields: preferredAction and alwaysAskBeforeHandling. If the
// latter is true, we MUST get a prompt. Check that first.

/**
 * Open a content type set to save to disk, but always ask.
 */
add_task(async function saveToDiskAlwaysAsk() {
  createMockedHandler(
    "test/saveToDisk-true",
    Ci.nsIHandlerInfo.saveToDisk,
    true
  );
  createAndLoadMessage("test/saveToDisk-true");
  await clickWithDialog({ rememberExpected: false }, "accept");
  await checkFileSaved();
  checkHandler("test/saveToDisk-true", Ci.nsIHandlerInfo.saveToDisk, true);
});

/**
 * Open a content type set to save to disk, but always ask, and with no
 * default download directory.
 */
add_task(async function saveToDiskAlwaysAskPromptLocation() {
  Services.prefs.setBoolPref("browser.download.useDownloadDir", false);

  createMockedHandler(
    "test/saveToDisk-true",
    Ci.nsIHandlerInfo.saveToDisk,
    true
  );
  createAndLoadMessage("test/saveToDisk-true");

  let expectedFile = pathToNsFile(tmpD);
  expectedFile.append(`attachment${messageIndex}.test${messageIndex}`);
  MockFilePicker.showCallback = function(instance) {
    Assert.equal(instance.defaultString, expectedFile.leafName);
    Assert.equal(instance.defaultExtension, `test${messageIndex}`);
  };
  MockFilePicker.setFiles([expectedFile]);
  MockFilePicker.returnValue = Ci.nsIFilePicker.returnOK;

  await clickWithDialog({ rememberExpected: false }, "accept");
  let file = await checkFileSaved(tmpD);
  file.remove(false);
  Assert.ok(MockFilePicker.shown, "file picker was shown");

  MockFilePicker.reset();
  Services.prefs.setBoolPref("browser.download.useDownloadDir", true);
});

/**
 * Open a content type set to always ask in both fields.
 */
add_task(async function alwaysAskAlwaysAsk() {
  createMockedHandler("test/alwaysAsk-true", Ci.nsIHandlerInfo.alwaysAsk, true);
  createAndLoadMessage("test/alwaysAsk-true");
  await clickWithDialog({ mode: "open", rememberExpected: false });
});

/**
 * Open a content type set to use helper app, but always ask.
 */
add_task(async function useHelperAppAlwaysAsk() {
  createMockedHandler(
    "test/useHelperApp-true",
    Ci.nsIHandlerInfo.useHelperApp,
    true
  );
  createAndLoadMessage("test/useHelperApp-true");
  await clickWithDialog({ mode: "open", rememberExpected: false });
});

/**
 * Open a content type set to use the system default app, but always ask.
 */
add_task(async function useSystemDefaultAlwaysAsk() {
  createMockedHandler(
    "test/useSystemDefault-true",
    Ci.nsIHandlerInfo.useSystemDefault,
    true
  );
  createAndLoadMessage("test/useSystemDefault-true");
  // Would be mode: "open" on all platforms except our handler isn't real.
  await clickWithDialog({
    mode: AppConstants.platform == "win" ? "open" : "save",
    rememberExpected: false,
  });
});

// Check what happens with alwaysAskBeforeHandling set to false. We can't test
// the actions that would result in an external app opening the file.

/**
 * Open a content type set to save to disk without asking.
 */
add_task(async function saveToDisk() {
  createMockedHandler("test/saveToDisk-false", saveToDisk, false);
  createAndLoadMessage("test/saveToDisk-false");
  await clickWithoutDialog();
  let file = await checkFileSaved();
  file.remove(false);
});

/**
 * Open a content type set to save to disk without asking, and with no
 * default download directory.
 */
add_task(async function saveToDiskPromptLocation() {
  Services.prefs.setBoolPref("browser.download.useDownloadDir", false);

  createMockedHandler(
    "test/saveToDisk-true",
    Ci.nsIHandlerInfo.saveToDisk,
    false
  );
  createAndLoadMessage("test/saveToDisk-false");

  let expectedFile = pathToNsFile(tmpD);
  expectedFile.append(`attachment${messageIndex}.test${messageIndex}`);
  MockFilePicker.showCallback = function(instance) {
    Assert.equal(instance.defaultString, expectedFile.leafName);
    Assert.equal(instance.defaultExtension, `test${messageIndex}`);
  };
  MockFilePicker.setFiles([expectedFile]);
  MockFilePicker.returnValue = Ci.nsIFilePicker.returnOK;

  await clickWithoutDialog();
  let file = await checkFileSaved(tmpD);
  file.remove(false);
  Assert.ok(MockFilePicker.shown, "file picker was shown");

  MockFilePicker.reset();
  Services.prefs.setBoolPref("browser.download.useDownloadDir", true);
});
