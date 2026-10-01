/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var { NetUtil } = ChromeUtils.importESModule(
  "resource://gre/modules/NetUtil.sys.mjs"
);
var { NntpUtils } = ChromeUtils.importESModule(
  "resource:///modules/NntpUtils.sys.mjs"
);
var { PromiseTestUtils } = ChromeUtils.importESModule(
  "resource://testing-common/mailnews/PromiseTestUtils.sys.mjs"
);
var { ServerTestUtils } = ChromeUtils.importESModule(
  "resource://testing-common/mailnews/ServerTestUtils.sys.mjs"
);

let server;

add_setup(function setup() {
  const daemon = setupNNTPDaemon();
  server = new nsMailServer(() => {
    const handler = new NNTP_RFC977_handler(daemon);
    // Test NntpClient works with 201 response.
    handler.onStartup = () => {
      return "201 posting prohibited";
    };
    return handler;
  }, daemon);
  server.start(NNTP_PORT);
  registerCleanupFunction(() => {
    server.stop();
  });

  setupLocalServer(NNTP_PORT);
});

/**
 * Test a ?list-ids news url will trigger LISTGROUP request.
 */
add_task(async function test_listIds() {
  // Init the uri and streamListener.
  const uri = Services.io.newURI(
    `news://localhost:${NNTP_PORT}/test.filter?list-ids`
  );
  const streamListener = new PromiseTestUtils.PromiseStreamListener();

  // Run the uri with NntpChannel.
  const channel = NetUtil.newChannel({ uri, loadUsingSystemPrincipal: true });
  channel.asyncOpen(streamListener);
  await streamListener.promise;

  // Test LISTGROUP request was sent correctly.
  const transaction = server.playTransaction();
  do_check_transaction(transaction, ["MODE READER", "LISTGROUP test.filter"]);
});

/**
 * Test a ?group=name&key=x news url will trigger ARTICLE request.
 */
add_task(async function test_fetchArticle() {
  _server.closeCachedConnections();

  // Init the uri and streamListener.
  const uri = Services.io.newURI(
    `news://localhost:${NNTP_PORT}?group=test.filter&key=1`
  );
  const streamListener = new PromiseTestUtils.PromiseStreamListener();

  // Run the uri with NntpChannel.
  const channel = NetUtil.newChannel({ uri, loadUsingSystemPrincipal: true });
  channel.asyncOpen(streamListener);
  await streamListener.promise;

  // Test ARTICLE request was sent correctly.
  const transaction = server.playTransaction();
  do_check_transaction(transaction, [
    "MODE READER",
    "GROUP test.filter",
    "ARTICLE 1",
  ]);
});

/**
 * Test that a server created for an snews: URI with no port uses TLS on the
 * default port.
 */
add_task(async function test_unknownServerSnews() {
  const tlsServer = await ServerTestUtils.createServer(
    ServerTestUtils.serverDefs.nntp.tls
  );
  tlsServer.daemon.addArticle(
    new NewsArticle(
      "Newsgroups: test.snews\nMessage-ID: <snews@nntp.invalid>\n\nThis article was fetched over TLS.\n"
    )
  );

  const channel = NetUtil.newChannel({
    uri: "snews://test.test/snews%40nntp.invalid",
    loadUsingSystemPrincipal: true,
  });
  const streamListener = new PromiseTestUtils.PromiseStreamListener();
  channel.asyncOpen(streamListener);
  const data = await streamListener.promise;
  Assert.stringContains(
    data,
    "This article was fetched over TLS.",
    "article should be fetched"
  );

  const newServer = NntpUtils.findServer("test.test");
  Assert.ok(newServer, "server should be created for the unknown host");
  Assert.equal(
    newServer.socketType,
    Ci.nsMsgSocketType.SSL,
    "server should use TLS"
  );
  Assert.equal(
    newServer.port,
    Ci.nsINntpUrl.DEFAULT_NNTPS_PORT,
    "server should use the default NNTPS port"
  );
  newServer.closeCachedConnections();
  MailServices.accounts.removeIncomingServer(newServer, false);
  tlsServer.close();
});

/**
 * @returns {string[]} All commands the server has received.
 */
function receivedCommands() {
  return [server.playTransaction()].flat().flatMap(t => t.them);
}

/**
 * Test that a news uri with line breaks in the message id or article number
 * is refused, so the rest of it can't be sent as separate commands.
 */
add_task(function test_lineBreakInUri() {
  _server.closeCachedConnections();
  for (const spec of [
    `news://localhost:${NNTP_PORT}/x%0D%0AINJECTED%3Ca%40b`,
    `news://localhost:${NNTP_PORT}/x%0AINJECTED%40b`,
    `news://localhost:${NNTP_PORT}?group=test.filter&key=1%0D%0AINJECTED`,
  ]) {
    const channel = NetUtil.newChannel({
      uri: spec,
      loadUsingSystemPrincipal: true,
    });
    Assert.throws(
      () => channel.asyncOpen(new PromiseTestUtils.PromiseStreamListener()),
      /NS_ERROR_MALFORMED_URI/,
      `opening ${spec} should fail`
    );
  }
});

/**
 * Test that NntpClient refuses to send a command containing line breaks.
 */
add_task(async function test_lineBreakInCommand() {
  _server.closeCachedConnections();
  const status = await new Promise(resolve => {
    _server.wrappedJSObject.withClient(client => {
      client.startRunningUrl(null, null);
      client.onOpen = () => {
        client._sendCommand("ARTICLE <x\r\nINJECTED@b>");
      };
      client.onDone = resolve;
    });
  });
  Assert.equal(
    status,
    Cr.NS_ERROR_ILLEGAL_VALUE,
    "request should fail with NS_ERROR_ILLEGAL_VALUE"
  );
  Assert.ok(
    !receivedCommands().some(command => command.includes("INJECTED")),
    "no part of the command should be sent"
  );
});
