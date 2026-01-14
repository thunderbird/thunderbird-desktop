# Thunderbird Storage Format Research

This document captures research findings for implementing the mailbox reader (Phase 3) of the AI Integration project.

## Overview

Thunderbird stores email locally using a per-folder model with two file types per folder:
1. **Message Database File** (`.msf`) - Contains metadata about each message
2. **Message Store File** (mbox or maildir) - Contains the raw message content

## Profile Directory Locations

Thunderbird stores profiles in platform-specific locations:

| Platform | Default Location |
|----------|------------------|
| Linux | `~/.thunderbird/` |
| macOS | `~/Library/Thunderbird/` |
| Windows | `%APPDATA%\Thunderbird\` (typically `C:\Users\<username>\AppData\Roaming\Thunderbird\`) |

### Profile Structure

```
~/.thunderbird/
├── profiles.ini                    # Profile registry
├── installs.ini                    # Installation registry
└── <profile_id>.default-release/   # Profile directory
    ├── prefs.js                    # User preferences
    ├── Mail/                       # Local mail storage
    │   └── Local Folders/          # Local folder account
    │       ├── Inbox               # mbox file
    │       ├── Inbox.msf           # Message database (Mork format)
    │       ├── Inbox.sbd/          # Subdirectory for subfolders
    │       │   ├── Subfolder       # mbox file
    │       │   └── Subfolder.msf   # Message database
    │       ├── Sent                # mbox file
    │       └── Sent.msf            # Message database
    └── ImapMail/                   # IMAP accounts
        └── imap.example.com/       # IMAP server folder
            ├── INBOX               # mbox file (cached messages)
            ├── INBOX.msf           # Message database
            └── ...
```

### `profiles.ini` Format

```ini
[Profile0]
Name=default-release
IsRelative=1
Path=xxxxxxxx.default-release
Default=1

[Profile1]
Name=secondary
IsRelative=1
Path=yyyyyyyy.secondary
```

### `prefs.js` Account Information

Account settings in `prefs.js` contain server configurations:

```javascript
user_pref("mail.account.account1.server", "server1");
user_pref("mail.server.server1.directory", "/home/user/.thunderbird/profile/Mail/Local Folders");
user_pref("mail.server.server1.hostname", "Local Folders");
user_pref("mail.server.server1.type", "none");  // Local folders
user_pref("mail.server.server2.type", "imap");  // IMAP
user_pref("mail.server.server2.hostname", "imap.gmail.com");
```

## mbox Format

Thunderbird uses the **Berkeley mbox format** (also known as mboxrd variant) by default.

### Message Delimiter

Each message in an mbox file begins with a "From " line (note the space):

```
From sender@example.com Tue Dec 09 15:30:45 2014
```

This line format is:
- `From ` (literal "From " with trailing space)
- Email address of envelope sender
- Unix ctime-style timestamp

### Message Structure

```
From sender@example.com Tue Dec 09 15:30:45 2014
X-Mozilla-Status: 0001
X-Mozilla-Status2: 00000000
X-Mozilla-Keys:
Return-Path: <sender@example.com>
From: Sender Name <sender@example.com>
To: recipient@example.com
Subject: Example Message
Date: Tue, 09 Dec 2014 15:30:45 -0500
Message-ID: <unique-id@example.com>
Content-Type: text/plain; charset=UTF-8

This is the message body.
Multiple lines are supported.

From lines in the body are escaped as >From.
>From is how "From " at line start appears.

```

### Thunderbird-Specific Headers

Thunderbird adds metadata headers at the start of each message:

| Header | Description | Values |
|--------|-------------|--------|
| `X-Mozilla-Status` | Message status flags | Hex number (e.g., `0001`) |
| `X-Mozilla-Status2` | Extended status flags | Hex number (e.g., `00000000`) |
| `X-Mozilla-Keys` | User-assigned keywords/tags | Space-separated keywords |

#### X-Mozilla-Status Flags (Bitmask)

| Bit | Value | Meaning |
|-----|-------|---------|
| 0 | 0x0001 | Read |
| 1 | 0x0002 | Replied |
| 2 | 0x0004 | Marked (flagged/starred) |
| 3 | 0x0008 | Expunged (deleted, pending compaction) |
| 4 | 0x0010 | Has Re: in subject |
| 5 | 0x0020 | Elided |
| 6 | 0x0040 | Offline |
| 7 | 0x0080 | Watched |
| 8 | 0x0100 | Sender authenticated |
| 9 | 0x0200 | Partial (incomplete download) |
| 10 | 0x0400 | Queued |
| 11 | 0x0800 | Forwarded |
| 12-15 | 0xF000 | Priority (0=none, 1=highest, 5=lowest) |

### Body Escaping (mboxrd Format)

When storing messages, any line starting with "From " in the body is escaped by prepending ">":
- Original: `From someone@example.com`
- Stored: `>From someone@example.com`

**Important**: When reading, ">From " at line start should be unescaped back to "From ".

### Message Boundaries

Messages are separated by:
1. Blank line (end of previous message body)
2. "From " line (start of next message)

The end of file indicates the end of the last message.

## .msf Database Files (Mork Format)

The `.msf` files use the **Mork** format, a Mozilla-specific binary format. Key characteristics:

- Contains parsed headers and metadata for each message
- Stores `storeToken` which points to message offset in mbox file
- Tracks read status, tags, spam scores, etc.
- Will be replaced by SQLite (Panorama project - Bug 1572000)

### Key Database Fields

Fields parsed from message headers (from `nsParseMailbox.cpp`):

- `subject` - Subject line
- `sender` - From address
- `recipients` - To/CC addresses
- `date` - Date header timestamp
- `messageId` - Message-ID header
- `references` - References header (for threading)
- `priority` - Priority value
- `storeToken` - Byte offset in mbox file (or filename for maildir)

### storeToken Usage

For mbox format:
- `storeToken` is the byte offset from the start of the mbox file
- Points to the "From " line of the message
- Used to seek directly to a specific message

For maildir format:
- `storeToken` is the filename of the message file

## maildir Alternative

Thunderbird also supports **maildir** format (configurable per account):

```
Mail/
└── Local Folders/
    └── Inbox/              # Directory instead of file
        ├── cur/            # Read messages
        │   ├── 1234567890.M123456.hostname:2,S
        │   └── ...
        ├── new/            # Unread messages
        │   └── ...
        └── tmp/            # In-progress deliveries
```

Maildir advantages:
- One file per message (no escaping needed)
- Better for concurrent access
- No need for compaction

Maildir disadvantages:
- More filesystem overhead (many small files)
- Not the default format

## Python mailbox Library

Python's standard library `mailbox` module provides excellent support for mbox parsing.

### Basic Usage

```python
import mailbox

# Open mbox file
mbox = mailbox.mbox('/path/to/Inbox')

# Iterate over messages
for message in mbox:
    print(f"From: {message['from']}")
    print(f"Subject: {message['subject']}")
    print(f"Date: {message['date']}")

    # Get message body
    if message.is_multipart():
        for part in message.walk():
            if part.get_content_type() == 'text/plain':
                print(part.get_payload(decode=True))
    else:
        print(message.get_payload(decode=True))

mbox.close()
```

### Key Methods

| Method | Description |
|--------|-------------|
| `mbox(path)` | Open mbox file |
| `__iter__()` | Iterate over messages |
| `keys()` | Get message keys (arbitrary identifiers) |
| `get_bytes(key, from_=False)` | Get raw message bytes |
| `get_file(key, from_=False)` | Get file-like object |
| `lock()` / `unlock()` | File locking |
| `close()` | Close mailbox |

### mboxMessage Methods

| Method | Description |
|--------|-------------|
| `get_from()` | Get "From " line envelope sender |
| `set_from(from_, time_=None)` | Set "From " line |
| `get_flags()` | Get standard flags (R, O, D, F, A) |
| `set_flags(flags)` | Set flags |
| `add_flag(flag)` / `remove_flag(flag)` | Modify flags |

### Handling Thunderbird-Specific Headers

```python
import mailbox

mbox = mailbox.mbox('/path/to/Inbox')

for message in mbox:
    # Access Thunderbird headers
    mozilla_status = message.get('X-Mozilla-Status', '0000')
    mozilla_status2 = message.get('X-Mozilla-Status2', '00000000')
    mozilla_keys = message.get('X-Mozilla-Keys', '')

    # Parse status flags
    status = int(mozilla_status, 16)
    is_read = bool(status & 0x0001)
    is_replied = bool(status & 0x0002)
    is_flagged = bool(status & 0x0004)
    is_deleted = bool(status & 0x0008)

    if not is_deleted:  # Skip expunged messages
        process_message(message)
```

### Large File Handling

```python
import mailbox

# The mailbox module handles seeking efficiently
mbox = mailbox.mbox('/path/to/large_mbox')

# Iterate without loading entire file into memory
for key in mbox.keys():
    # Access messages individually
    message = mbox[key]
    process_message(message)

# For incremental processing, track position
# (Note: mailbox module doesn't expose file position directly,
# so alternative approaches may be needed for true incremental sync)
```

## Key Challenges for Mailbox Reader

### 1. Large File Handling

- mbox files can be gigabytes in size
- Python's mailbox module indexes on open (can be slow for large files)
- Consider streaming approach for initial scan
- Cache file positions for incremental access

### 2. Incremental Reading

- Track last processed position (byte offset)
- Detect file modifications (size, mtime)
- Handle file truncation/rotation (rare but possible)
- Skip already-processed messages by Message-ID

### 3. File Locking

- Use `lock()`/`unlock()` when Thunderbird might be running
- Consider read-only access to minimize locking needs
- Handle lock failures gracefully

### 4. Encoding Handling

- Messages may use various encodings (UTF-8, ISO-8859-1, etc.)
- Character encoding specified in Content-Type header
- Use `email.policy.default` for Python 3 email handling
- `message.get_payload(decode=True)` handles content-transfer-encoding

### 5. Deleted Messages

- Messages with expunged flag (0x0008) should be skipped
- These remain in mbox until compaction occurs
- Filter by checking `X-Mozilla-Status` header

### 6. IMAP vs Local

- IMAP folders may only have headers (no body) until viewed
- Local folders always have full messages
- Check `X-Mozilla-Status` partial flag (0x0200)

## Recommended Approach for Implementation

### Phase 1: Profile Discovery
1. Locate profile directory by platform
2. Parse `profiles.ini` for default profile
3. Parse `prefs.js` for account server configurations
4. Build list of mail directories per account

### Phase 2: Mbox Reading
1. Use Python `mailbox.mbox` for parsing
2. Filter out expunged messages
3. Extract headers + body for each message
4. Handle encoding via email module
5. Map to domain Email model

### Phase 3: Incremental Sync
1. Store sync state per mbox file:
   - File path
   - File size at last sync
   - File mtime at last sync
   - Set of processed Message-IDs
2. On sync:
   - Check if file modified (size/mtime changed)
   - If modified, scan from beginning (mbox may have been compacted)
   - Use Message-ID to skip already-processed
   - Process new messages only

### Phase 4: File Watching
1. Use `watchdog` library for file system events
2. Monitor Mail directories for mbox file changes
3. Debounce rapid changes
4. Trigger incremental sync on change

## References

- [Thunderbird Folder Storage Architecture](../docs/architecture/folder_storage.md)
- [Thunderbird Folder Compaction](../docs/architecture/folder_compaction.md)
- [Panorama Global Database](../mailnews/db/panorama/docs/index.md)
- [Python mailbox Module](https://docs.python.org/3/library/mailbox.html)
- [mbox Wikipedia](https://en.wikipedia.org/wiki/Mbox)
- [RFC 5322 - Internet Message Format](https://datatracker.ietf.org/doc/html/rfc5322)

---

*Research completed: 2025-01-14*
*Task: 3.1 - Research Thunderbird Storage Format*
