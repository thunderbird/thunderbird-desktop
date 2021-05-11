/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

"use strict";

var EXPORTED_SYMBOLS = ["uidHelper"];

var EnigmailFuncs = ChromeUtils.import(
  "chrome://openpgp/content/modules/funcs.jsm"
).EnigmailFuncs;

/* Parse a OpenPGP user ID string and split it into its parts.
 * The expected syntax is:
 *    Name (comment) <email>
 * Each part is allowed to be empty.
 */

var uidHelper = {
  // Does the whole name look roughly like an email address?
  // Domain part after @ must not contain space.
  // Local part in front of @ must either be quoted (allows space),
  // or must not contain space.
  // If that condition is true, then conclude it's probably an
  // email address that wasn't enclosed in <>.
  looksLikeEmail(str) {
    return EnigmailFuncs.stringLooksLikeEmailAddress(str);
  },

  getPartsFromUidStr(uid, resultObj) {
    resultObj.name = "";
    resultObj.comment = "";
    resultObj.email = "";

    if (!uid) {
      return false;
    }

    resultObj.email = EnigmailFuncs.getEmailFromUserID(uid);
    if (!resultObj.email) {
      return false;
    }

    resultObj.name = uid.replace(resultObj.email, "");
    resultObj.name = resultObj.name.replace("<>", "").trim();

    return true;
  },
};
