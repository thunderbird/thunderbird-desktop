/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var EXPORTED_SYMBOLS = ["GTalkProtocol"];

var { XPCOMUtils, l10nHelper } = ChromeUtils.import(
  "resource:///modules/imXPCOMUtils.jsm"
);
var { GenericAccountPrototype, GenericProtocolPrototype } = ChromeUtils.import(
  "resource:///modules/jsProtoHelper.jsm"
);

XPCOMUtils.defineLazyGetter(this, "_", () =>
  l10nHelper("chrome://chat/locale/xmpp.properties")
);

function GTalkAccount(aProtoInstance, aImAccount) {
  this._init(aProtoInstance, aImAccount);
}
GTalkAccount.prototype = {
  __proto__: GenericAccountPrototype,
  connect() {
    this.WARN(
      "As Google deprecated its XMPP gateway, it is currently not " +
        "possible to connect to Google Talk. See bug 1645217."
    );
    this.reportDisconnecting(
      Ci.prplIAccount.ERROR_OTHER_ERROR,
      _("connection.error.XMPPNotSupported")
    );
    this.reportDisconnected();
  },

  // Nothing to do.
  unInit() {},
  remove() {},
};

function GTalkProtocol() {}
GTalkProtocol.prototype = {
  __proto__: GenericProtocolPrototype,
  get normalizedName() {
    return "gtalk";
  },
  get name() {
    return _("gtalk.protocolName");
  },
  get iconBaseURI() {
    return "chrome://prpl-gtalk/skin/";
  },
  getAccount(aImAccount) {
    return new GTalkAccount(this, aImAccount);
  },
};
