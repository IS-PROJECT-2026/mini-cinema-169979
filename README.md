# Mini Cinema

Mini Cinema is a watch-party web app. It lets people watch a YouTube video together, at the same time, from different places.

## What it does

- Create a room and get a room code, or join a room with a code
- The host picks a YouTube video and controls play, pause, and seek
- Guests watch in sync with the host automatically
- Guests can "resync" or take control of their own playback if they fall behind
- Live chat inside the room
- Emoji reactions that pop up on screen for everyone
- Rooms clean themselves up automatically when they go inactive

## Live Demo

👉 [https://is-project-2026.github.io/mini-cinema-169979/](https://is-project-2026.github.io/mini-cinema-169979/)

## How to Use It

### As a Host

1. Open the site and click **Create Room**.
2. You'll get a room code. Share it with friends so they can join.
3. Paste a YouTube link into the box at the bottom and click **Set Video**.
4. Use the normal YouTube controls to play, pause, or skip. Everyone in the room follows you automatically.
5. Click **Leave Room** when you're done. This closes the room for everyone right away.

### As a Guest

1. Open the site, type in the room code your host gave you, and click **Join Room**.
2. You won't see a video-link box or a "Set Video" button — only the host picks the video.
3. Your video automatically matches the host's — same video, same play/pause, same position.
4. If you fall behind, click **Resync** to jump back to the host's current time.
5. You can flip the switch to "I control" to pause, play, or seek on your own without following the host. Flip it back to "Host controls" to go back to auto-sync.
6. Use the chat box to talk to everyone in the room, and tap the emoji buttons to react.
7. Click **Leave Room** to exit right away.

### Reconnecting

- If your page refreshes or you briefly lose connection, you have **7 minutes** to come back — you'll be placed back in the same room automatically, under the same name.
- If you're away for **longer than 7 minutes**, you're fully disconnected and removed from the room. You'll need to create or join a room again.

## Technologies Used

- **HTML5** – page structure
- **CSS3** – styling and layout
- **JavaScript (ES Modules)** – app logic
- **Firebase Realtime Database** – stores rooms, members, chat, and playback state
- **Firebase Anonymous Authentication** – signs users in without needing an account
- **YouTube IFrame Player API** – plays and controls the video
- **GitHub Pages** – hosts the live site

## How to Run Locally

1. Clone the repository
2. Add your own Firebase project config in `js/firebase-config.js`
3. Open `index.html` in a browser (or serve the folder with a simple local server)

 