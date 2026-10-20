# 🎬 Mini Cinema

Watch YouTube videos together, in sync, from anywhere.

**[Try the live demo →](https://is-project-2026.github.io/mini-cinema-169979/)**

> [!WARNING]
> **Seeing "This site can't be reached. The connection was reset." (`ERR_CONNECTION_RESET`)?** This is usually caused by antivirus or firewall software (Avast, for example) blocking the connection. Add `https://is-project-2026.github.io` to your antivirus exceptions, or turn off its HTTPS scanning. See [Troubleshooting](#troubleshooting) for the full steps.

---

## Features

- **Rooms with codes:** create a room and share its code, or join one with a code
- **Host-controlled playback:** the host picks the video and controls play, pause, and seek
- **Automatic sync:** guests follow the host without doing anything
- **Guest freedom:** guests can resync, or take control of their own playback
- **Live chat** inside every room
- **Emoji reactions** that pop up on everyone's screen
- **Self-cleaning rooms:** inactive rooms are removed automatically

---

## How to Use

### Hosting

1. Open the site and click **Create Room**.
2. Share the room code with your friends.
3. Paste a YouTube link into the box at the bottom and click **Set Video**.
4. Use the normal YouTube controls. Everyone follows you.
5. Click **Leave Room** when you're done. This closes the room for everyone immediately.

### Joining

1. Open the site, enter the room code, and click **Join Room**.
2. Your video matches the host's automatically: same video, same play/pause state, same position. Only the host can set the video.
3. Use the chat box to talk, and tap the emoji buttons to react.
4. Click **Leave Room** to exit at any time.

**Falling behind?** Click **Resync** to jump to the host's current time.

**Want to do your own thing?** Switch to **I control** to play, pause, or seek independently. Switch back to **Host controls** to rejoin the sync.

### Reconnecting

| Situation | What happens |
|---|---|
| Refresh or brief connection loss (under 7 minutes) | You're placed back in the same room, under the same name |
| Away for more than 7 minutes | You're removed from the room and need to create or join again |

---

## Troubleshooting

### Stuck on "Connecting…" or slow to sign in

Usually caused by an ad blocker or privacy extension blocking Firebase or YouTube.

1. Open the app in an **Incognito / Private** window.
2. If it loads fast, an extension is the cause.
3. Disable extensions one at a time to find it, then whitelist this site.

### "This site can't be reached" (ERR_CONNECTION_RESET)

The browser shows: *This site can't be reached. The connection was reset. Try checking the connection, checking the proxy and the firewall, or running Windows Network Diagnostics.*

Usually caused by antivirus or firewall software (Avast, for example) blocking the connection.

1. Try a different network or device. If it loads, your antivirus is the likely cause.
2. Add `https://is-project-2026.github.io` to your antivirus exceptions.
3. If that fails, turn off the antivirus's web/HTTPS scanning temporarily.

**Known issue:** Avast blocks this site. A permanent fix is in progress.

---

## Built With

| Technology | Purpose |
|---|---|
| HTML5, CSS3 | Page structure, styling, and layout |
| JavaScript (ES Modules) | App logic |
| Firebase Realtime Database | Rooms, members, chat, and playback state |
| Firebase Anonymous Authentication | Sign-in without needing an account |
| YouTube IFrame Player API | Video playback and control |
| GitHub Pages | Hosting |
