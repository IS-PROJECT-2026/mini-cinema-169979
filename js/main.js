import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set, get, update, onValue, push, remove, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

let currentUserId;
let currentUsername;
let currentRoomCode;
let isHost = false;

// --- Server time correction -------------------------------------------
let serverTimeOffset = 0;
onValue(ref(db, ".info/serverTimeOffset"), (snapshot) => {
    serverTimeOffset = snapshot.val() || 0;
});

function serverNow() {
    return Date.now() + serverTimeOffset;
}
// ------------------------------------------------------------------------

const adjectives = ["Ambitious", "Curious", "Brave", "Silent", "Creative", "Lucky", "Clever", "Chill"];
const animals = ["Goat", "Panda", "Wolf", "Fox", "Lynx", "Otter", "Tiger", "Bear"];

function generateUsername() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);
    return adjective + "-" + animal + number;
}

function usernameTaken(members, username) {
    for (const memberId in members) {
        if (members[memberId] === username) return true;
    }
    return false;
}

// --- Session persistence (survives page refresh) ----------------------
// We store the room session in sessionStorage so that when the user
// refreshes, we can silently rejoin the same room instead of leaving it.
// sessionStorage is cleared when the tab is fully closed, which is the
// correct behaviour — closing the tab should count as leaving the room.
//
// We also record the moment the session was saved (mc_leftAt). On
// reload, if more than RECONNECT_GRACE_PERIOD_MS has passed since then,
// we treat the user as fully disconnected instead of silently rejoining.
const RECONNECT_GRACE_PERIOD_MS = 7 * 60 * 1000; // 7 minutes

function saveSession() {
    if (!currentRoomCode || !currentUserId || !currentUsername) return;
    sessionStorage.setItem("mc_roomCode", currentRoomCode);
    sessionStorage.setItem("mc_isHost", isHost ? "1" : "0");
    sessionStorage.setItem("mc_username", currentUsername);
    sessionStorage.setItem("mc_leftAt", String(serverNow()));
}

function clearSession() {
    sessionStorage.removeItem("mc_roomCode");
    sessionStorage.removeItem("mc_isHost");
    sessionStorage.removeItem("mc_username");
    sessionStorage.removeItem("mc_leftAt");
}

function getSavedSession() {
    const roomCode = sessionStorage.getItem("mc_roomCode");
    const savedIsHost = sessionStorage.getItem("mc_isHost") === "1";
    const username = sessionStorage.getItem("mc_username");
    const leftAt = Number(sessionStorage.getItem("mc_leftAt")) || 0;
    if (roomCode && username) {
        return { roomCode, isHost: savedIsHost, username, leftAt };
    }
    return null;
}
// ----------------------------------------------------------------------

// --- Disconnect / presence --------------------------------------------
// Instead of removing the member immediately on disconnect (which also
// fires on page refresh), we write a "lastSeen" heartbeat timestamp
// every 30 s. A cleanup interval (already in the code) checks rooms
// whose host has been missing for 10 min or whose member list has been
// empty for 15 min and then deletes them.
//
// onDisconnect is still used, but now only to mark the user as
// "disconnected" (sets a flag) rather than deleting them outright.
// On reconnect/rejoin we clear that flag. This way a refresh does not
// trigger a member removal — only a genuine long-term disconnection
// (tab closed, network lost for >threshold) eventually causes cleanup
// via the server-side interval.
//
// The simplest reliable approach without Cloud Functions:
//   • Keep onDisconnect remove() — BUT cancel it on beforeunload
//     (refresh fires beforeunload; closing the tab may not in all
//     browsers, which is fine because sessionStorage is also cleared
//     on tab close, so the session won't be restored anyway).
//   • On beforeunload: cancel the onDisconnect, save session.
//   • On load: if saved session exists, rejoin silently.
//
// This means a genuine disconnection (no beforeunload, e.g. network
// cut) still removes the member via onDisconnect — as intended — but
// a refresh does not, because we cancel onDisconnect first.

let memberDisconnectRef = null;  // the ref we registered onDisconnect on

function registerDisconnect(roomCode, userId) {
    // Cancel any previous registration first
    cancelDisconnect();

    memberDisconnectRef = ref(db, "rooms/" + roomCode + "/members/" + userId);
    onDisconnect(memberDisconnectRef).remove();
}

function cancelDisconnect() {
    if (memberDisconnectRef) {
        onDisconnect(memberDisconnectRef).cancel();
        memberDisconnectRef = null;
    }
}

// Before the page unloads (refresh / navigation), cancel the
// onDisconnect removal and save the session so we can rejoin.
window.addEventListener("beforeunload", () => {
    cancelDisconnect();
    saveSession();
});
// ----------------------------------------------------------------------

// --- Host resume-on-refresh state --------------------------------------
// When the host refreshes, listenForVideo() would otherwise call
// loadVideoById(videoId) with no start time, which always restarts the
// video at 0:00. To avoid that, attemptRejoin() computes where playback
// should resume and stashes it here; listenForVideo() consumes it once
// (for the matching videoId) and then clears it so later video changes
// still load fresh from 0 as expected.
let rejoinPlaybackState = null; // { videoId, time, state } | null
// ----------------------------------------------------------------------

// --- Room-scoped listener cleanup ---------------------------------------
// Every onValue() call below is bound, at the moment it's created, to
// whatever room code was current at the time — it does NOT track future
// changes to currentRoomCode. If we never unsubscribe, leaving room A and
// joining room B leaves A's listeners alive; if room A's data changes
// later (e.g. its async cleanup/remove finishing after you've already
// joined B), those stale callbacks still fire and mutate the *same*
// shared `player` / DOM, bleeding room A's video, chat, etc. into room B.
//
// Fix: every onValue() we care about is wrapped in trackListener(), and
// detachRoomListeners() is called before we attach a new room's listeners
// (create/join/rejoin) and when we leave a room.
let unsubscribeFns = [];

function trackListener(unsubscribeFn) {
    if (typeof unsubscribeFn === "function") unsubscribeFns.push(unsubscribeFn);
}

function detachRoomListeners() {
    unsubscribeFns.forEach((fn) => {
        try { fn(); } catch (error) { console.log("Listener detach failed:", error); }
    });
    unsubscribeFns = [];
}
// ----------------------------------------------------------------------

signInAnonymously(auth)
    .then((userCredential) => {
        console.log("Anonymous login successful");
        currentUserId = userCredential.user.uid;

        // Check if there's a saved session from a previous page load
        const saved = getSavedSession();
        if (saved) {
            currentUsername = saved.username;
            attemptRejoin(saved.roomCode, saved.isHost, saved.leftAt);
        } else {
            currentUsername = generateUsername();
        }
    })
    .catch((error) => {
        console.log(error);
    });

// --- Rejoin after refresh ---------------------------------------------
function attemptRejoin(savedRoomCode, savedIsHost, leftAt) {
    // Been away longer than the grace period? Treat it as a full
    // disconnect instead of silently rejoining — drop any lingering
    // presence and send them back to a clean landing page.
    const timeAway = serverNow() - (leftAt || 0);
    if (timeAway > RECONNECT_GRACE_PERIOD_MS) {
        if (savedIsHost) {
            update(ref(db, "rooms/" + savedRoomCode), { hostId: null }).catch(() => {});
        } else {
            update(ref(db, "rooms/" + savedRoomCode + "/members"), { [currentUserId]: null }).catch(() => {});
        }
        pruneInactiveRoom(savedRoomCode);
        clearSession();
        currentUsername = generateUsername();
        return;
    }

    const roomRef = ref(db, "rooms/" + savedRoomCode);
    get(roomRef).then((snapshot) => {
        if (!snapshot.exists()) {
            // Room no longer exists — clear session and stay on landing
            clearSession();
            return;
        }

        // Defensive: make sure nothing from a previous room is still
        // listening before we attach this room's listeners.
        detachRoomListeners();

        const roomData = snapshot.val();

        currentRoomCode = savedRoomCode;
        isHost = savedIsHost;
        guestFollowsHost = true;

        // Host: figure out where playback should resume instead of
        // restarting the video at 0:00 when listenForVideo() re-fires.
        if (isHost && roomData.videoId && roomData.playback) {
            const playback = roomData.playback;
            const hostTime = playback.time || 0;
            const updatedAt = playback.updatedAt || serverNow();
            const elapsedSinceUpdate = (serverNow() - updatedAt) / 1000;
            let estimatedTime = hostTime;
            if (playback.state === "playing") estimatedTime = hostTime + elapsedSinceUpdate;

            rejoinPlaybackState = {
                videoId: roomData.videoId,
                time: Math.max(0, estimatedTime),
                state: playback.state
            };
        }

        const roomPath = "rooms/" + savedRoomCode;

        // Re-register our presence in the members list
        const membersFolder = ref(db, roomPath + "/members");
        update(membersFolder, {
            [currentUserId]: currentUsername
        });

        // Re-register the disconnect handler
        registerDisconnect(savedRoomCode, currentUserId);

        touchRoomActivity(savedRoomCode);
        updateGuestControlsButton();
        updateVideoControlsVisibility();
        trackListener(onValue(membersFolder, displayMembers));

        resetChatScrollState();
        listenForMessages();
        listenForReactions();
        listenForVideo();

        if (!isHost) {
            listenForPlayback();
            handleGuestReconnectSync();
        }

        // Switch to room page
        landingPage.style.display = "none";
        roomPage.style.display = "block";
        roomCodeDisplay.textContent = savedRoomCode;
    }).catch((error) => {
        console.log("Rejoin failed:", error);
        clearSession();
    });
}
// ----------------------------------------------------------------------

const createRoomButton = document.getElementById("create-room-btn");
const joinRoomButton = document.getElementById("join-room-btn");
const joinRoomInput = document.getElementById("join-room-input");
const landingPage = document.getElementById("landing-page");
const roomPage = document.getElementById("room-page");
const roomCodeDisplay = document.getElementById("room-code-display");
const leaveRoomButton = document.getElementById("leave-room-btn");
const youtubeUrlInput = document.getElementById("youtube-url-input");
const setVideoButton = document.getElementById("set-video-btn");
const resyncButton = document.getElementById("resync-btn");
const chatMessages = document.getElementById("chat-messages");
const newMessageBadge = document.getElementById("new-message-badge");
const chatInput = document.getElementById("chat-input");
const sendChatButton = document.getElementById("send-chat-btn");
const playerEmptyState = document.getElementById("player-empty-state");
const guestControlsButton = document.getElementById("guest-controls-btn");
const reactionOverlay = document.getElementById("reaction-overlay");
const syncToast = document.getElementById("sync-toast");
const syncToastDismissBtn = document.getElementById("sync-toast-dismiss");
const syncToastSyncBtn = document.getElementById("sync-toast-sync-btn");
const fullscreenToggleBtn = document.getElementById("fullscreen-toggle-btn");
const moviePanel = document.querySelector(".movie-panel");
const videoControls = document.querySelector(".video-controls");

let guestFollowsHost = false;
let suppressGuestSync = false;
let syncToastDismissed = false;
const seenReactionIds = new Set();

// --- Hide host-only video controls for guests -------------------------
// The URL input and Set Video button are only meaningful for the host.
// We hide them for guests immediately when their role is established,
// and restore them if the same user later creates a room in the same tab.
function updateVideoControlsVisibility() {
    if (!youtubeUrlInput || !setVideoButton) return;
    if (isHost) {
        youtubeUrlInput.style.display = "";
        setVideoButton.style.display = "";
    } else {
        youtubeUrlInput.style.display = "none";
        setVideoButton.style.display = "none";
    }
}
// ----------------------------------------------------------------------

// --- Chat auto-scroll -------------------------------------------------
let lastRenderedMessageCount = 0;
let hasRenderedMessagesOnce = false;

function isChatNearBottom() {
    const threshold = 40;
    return chatMessages.scrollHeight - chatMessages.scrollTop - chatMessages.clientHeight < threshold;
}

function scrollChatToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function showNewMessageBadge() {
    if (newMessageBadge) newMessageBadge.classList.add("visible");
}

function hideNewMessageBadge() {
    if (newMessageBadge) newMessageBadge.classList.remove("visible");
}

function resetChatScrollState() {
    lastRenderedMessageCount = 0;
    hasRenderedMessagesOnce = false;
    hideNewMessageBadge();
}

if (chatMessages) {
    chatMessages.addEventListener("scroll", () => {
        if (isChatNearBottom()) hideNewMessageBadge();
    });
}

if (newMessageBadge) {
    newMessageBadge.addEventListener("click", () => {
        scrollChatToBottom();
        hideNewMessageBadge();
    });
}
// ----------------------------------------------------------------------

function showSyncToast() {
    if (!syncToast || syncToastDismissed) return;
    syncToast.classList.add("visible");
}

function hideSyncToast() {
    if (!syncToast) return;
    syncToast.classList.remove("visible");
    syncToastDismissed = false;
}

if (syncToastDismissBtn) {
    syncToastDismissBtn.addEventListener("click", () => {
        syncToastDismissed = true;
        if (syncToast) syncToast.classList.remove("visible");
    });
}

if (syncToastSyncBtn) {
    syncToastSyncBtn.addEventListener("click", () => {
        syncGuestToHost({ applyFollowMode: false });
        hideSyncToast();
        if (resyncButton) resyncButton.style.display = "none";
    });
}

roomPage.style.display = "none";

// The overlay div is enough on its own IF it's fully opaque, but we
// don't want to depend on that. Explicitly hide the actual YouTube
// iframe whenever there's no video for the current room, so a stale
// paused frame from a previous room can never show through — opaque
// overlay or not.
function setPlayerIframeVisible(visible) {
    if (!player || typeof player.getIframe !== "function") return;
    const iframe = player.getIframe();
    if (!iframe) return;
    iframe.style.visibility = visible ? "visible" : "hidden";
}

function showPlayerEmptyState(message) {
    setPlayerIframeVisible(false);
    if (!playerEmptyState) return;
    const title = playerEmptyState.querySelector("h3");
    const text = playerEmptyState.querySelector("p");
    if (title) title.textContent = message.title || "Waiting for the host to pick a movie";
    if (text) text.textContent = message.text || "Paste a YouTube URL and click \u201cSet Video\u201d to begin the room.";
    playerEmptyState.style.display = "flex";
}

function hidePlayerEmptyState() {
    setPlayerIframeVisible(true);
    if (playerEmptyState) playerEmptyState.style.display = "none";
}

function showReactionBurst(emoji) {
    const overlayTarget = reactionOverlay || document.getElementById("player");
    if (!overlayTarget) return;

    const burst = document.createElement("div");
    burst.className = "reaction-burst";
    burst.textContent = emoji;

    const startX = 18 + Math.random() * 64;
    const startY = 70 + Math.random() * 18;
    const drift = (Math.random() * 180 - 90).toFixed(1);

    burst.style.left = `${startX}%`;
    burst.style.top = `${startY}%`;
    burst.style.setProperty("--drift", `${drift}px`);
    burst.style.setProperty("--rise", `${(Math.random() * 100 + 80).toFixed(1)}px`);

    overlayTarget.appendChild(burst);
    setTimeout(() => burst.remove(), 2000);
}

function sendReaction(emoji) {
    if (!currentRoomCode) {
        showReactionBurst(emoji);
        return;
    }

    const reactionsRef = ref(db, "rooms/" + currentRoomCode + "/reactions");
    const newReactionRef = push(reactionsRef);
    seenReactionIds.add(newReactionRef.key);
    showReactionBurst(emoji);

    set(newReactionRef, {
        emoji,
        username: currentUsername || "Guest",
        timestamp: Date.now()
    }).catch((error) => {
        console.log("Reaction send failed:", error);
        seenReactionIds.delete(newReactionRef.key);
    });
}

document.addEventListener("click", (event) => {
    const reactionButton = event.target.closest(".reaction-btn");
    if (!reactionButton) return;
    const emoji = reactionButton.dataset.emoji;
    if (!emoji) return;
    sendReaction(emoji);
});

function listenForReactions() {
    if (!currentRoomCode) return;
    const reactionsRef = ref(db, "rooms/" + currentRoomCode + "/reactions");
    const unsubscribe = onValue(reactionsRef, (snapshot) => {
        const reactions = snapshot.val() || {};
        for (const reactionId in reactions) {
            if (!reactions[reactionId] || !reactions[reactionId].emoji) continue;
            if (seenReactionIds.has(reactionId)) continue;
            seenReactionIds.add(reactionId);
            showReactionBurst(reactions[reactionId].emoji);
        }
    });
    trackListener(unsubscribe);
}

function updateGuestControlsButton() {
    if (!guestControlsButton) return;

    if (isHost) {
        guestControlsButton.style.display = "none";
        guestControlsButton.classList.remove("is-off");
        resyncButton.style.display = "none";
        return;
    }

    guestControlsButton.style.display = "inline-flex";
    guestControlsButton.classList.toggle("is-off", !guestFollowsHost);
    guestControlsButton.setAttribute("aria-pressed", String(guestFollowsHost));
    resyncButton.style.display = "inline-flex";
}

function handleGuestReconnectSync() {
    if (isHost || !currentRoomCode || !player || !playerReady) return;
    setTimeout(() => {
        syncGuestToHost({ applyFollowMode: guestFollowsHost });
    }, 250);
}

window.addEventListener("online", () => {
    if (!currentRoomCode || isHost || !player) return;
    handleGuestReconnectSync();
});

document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") handleGuestReconnectSync();
});

const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function touchRoomActivity(roomCodeValue = currentRoomCode) {
    if (!roomCodeValue) return;
    update(ref(db, "rooms/" + roomCodeValue), {
        lastActivity: serverTimestamp()
    }).catch((error) => {
        console.log("Room activity update failed:", error);
    });
}

function pruneInactiveRoom(roomCodeValue) {
    if (!roomCodeValue) return;
    get(ref(db, "rooms/" + roomCodeValue + "/members")).then((snapshot) => {
        const members = snapshot.val() || {};
        if (Object.keys(members).length === 0) {
            remove(ref(db, "rooms/" + roomCodeValue)).catch((error) => {
                console.log("Room prune failed:", error);
            });
        }
    }).catch((error) => {
        console.log("Prune room check failed:", error);
    });
}

function cleanupRoom(roomCodeValue) {
    if (!roomCodeValue) return;
    remove(ref(db, "rooms/" + roomCodeValue)).catch((error) => {
        console.log("Room cleanup failed:", error);
    });
}

// --- Periodic stale-room cleanup --------------------------------------
// Runs every 60 s. Uses the thresholds requested:
//   • Host missing > 10 min  → close room
//   • Empty room with no video > 15 min → close room
setInterval(() => {
    get(ref(db, "rooms")).then((snapshot) => {
        const rooms = snapshot.val() || {};
        const now = serverNow();

        for (const roomCodeValue in rooms) {
            const room = rooms[roomCodeValue] || {};
            const members = room.members || {};
            const hostId = room.hostId;
            const hasVideo = !!room.videoId;
            const lastActivity = room.lastActivity || room.createdAt || 0;
            const memberCount = Object.keys(members).length;

            // Host has been missing for more than 10 minutes
            const hostMissingTooLong = !!hostId && !members[hostId] && (now - lastActivity > 10 * 60 * 1000);
            // Room empty with no video for more than 15 minutes
            const emptyRoomTooLong = memberCount === 0 && !hasVideo && (now - lastActivity > 15 * 60 * 1000);

            if (hostMissingTooLong || emptyRoomTooLong) {
                cleanupRoom(roomCodeValue);
            }
        }
    }).catch((error) => {
        console.log("Inactive room cleanup failed:", error);
    });
}, 60000);
// ----------------------------------------------------------------------

createRoomButton.addEventListener("click", () => {
    if (!currentUserId) {
        console.log("User is not authenticated yet.");
        return;
    }

    // Make sure nothing from a previous room is still listening.
    detachRoomListeners();
    rejoinPlaybackState = null;

    const roomCode = generateRoomCode();
    currentRoomCode = roomCode;
    isHost = true;
    guestFollowsHost = true;
    updateGuestControlsButton();
    updateVideoControlsVisibility();

    const roomPath = "rooms/" + roomCode;
    const roomRef = ref(db, roomPath);

    set(roomRef, {
        roomCode,
        hostId: currentUserId,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        playback: {
            state: "paused",
            time: 0,
            updatedAt: serverTimestamp()
        },
        members: {
            [currentUserId]: currentUsername
        }
    }).then(() => {
        console.log("Room data saved");

        // Register disconnect — will be cancelled on refresh (beforeunload)
        // so refresh does not remove the host from the room.
        registerDisconnect(roomCode, currentUserId);

        const membersFolder = ref(db, roomPath + "/members");
        trackListener(onValue(membersFolder, displayMembers));
        resetChatScrollState();
        listenForMessages();
        listenForReactions();
        listenForVideo();

        landingPage.style.display = "none";
        roomPage.style.display = "block";
        roomCodeDisplay.textContent = roomCode;
        showPlayerEmptyState({
            title: "Ready to start the movie",
            text: "Paste a YouTube URL and click Set Video to begin the room."
        });

        saveSession();
    }).catch((error) => {
        console.log(error);
    });
});

const memberList = document.getElementById("member-list");

function displayMembers(snapshot) {
    const members = snapshot.val() || {};
    memberList.innerHTML = "";
    for (const memberId in members) {
        const memberItem = document.createElement("li");
        memberItem.textContent = members[memberId];
        memberList.appendChild(memberItem);
    }
}

joinRoomButton.addEventListener("click", () => {
    const enteredCode = joinRoomInput.value.trim().toUpperCase();
    if (!enteredCode) {
        console.log("No room code entered.");
        return;
    }

    // Make sure nothing from a previous room is still listening.
    detachRoomListeners();
    rejoinPlaybackState = null;

    const roomPath = "rooms/" + enteredCode;
    currentRoomCode = enteredCode;
    isHost = false;
    guestFollowsHost = true;
    updateGuestControlsButton();
    updateVideoControlsVisibility();

    const roomRef = ref(db, roomPath);
    get(roomRef).then((snapshot) => {
        if (snapshot.exists()) {
            console.log("Room found!");
            const membersFolder = ref(db, roomPath + "/members");

            get(membersFolder).then((membersSnap) => {
                const members = membersSnap.val() || {};
                let username = generateUsername();
                while (usernameTaken(members, username)) {
                    username = generateUsername();
                }
                currentUsername = username;
                update(membersFolder, { [currentUserId]: currentUsername });

                // Register disconnect — cancelled on refresh, so guest
                // does not leave the room just by refreshing the page.
                registerDisconnect(enteredCode, currentUserId);

                trackListener(onValue(membersFolder, displayMembers));
            });

            roomCodeDisplay.textContent = enteredCode;
            landingPage.style.display = "none";
            roomPage.style.display = "block";
            showPlayerEmptyState({
                title: "Joining the room",
                text: "Syncing to the host\u2019s current movie and playback position..."
            });

            update(roomRef, { lastActivity: serverTimestamp() });
            listenForPlayback();
            listenForVideo();
            handleGuestReconnectSync();
            resetChatScrollState();
            listenForMessages();
            listenForReactions();
            saveSession();
        } else {
            console.log("Room not found:", enteredCode);
            currentRoomCode = null;
            showPlayerEmptyState({
                title: "Room not found",
                text: "Double-check the room code and try again."
            });
        }
    }).catch((error) => {
        console.error("Error checking room:", error);
    });
});

function generateRoomCode() {
    let roomCode = "";
    for (let i = 0; i < 5; i++) {
        roomCode += characters[Math.floor(Math.random() * characters.length)];
    }
    return roomCode;
}

// --- Leave room -------------------------------------------------------
// Leaving should feel instant: we switch back to the landing page
// immediately and let the Firebase cleanup happen in the background,
// instead of waiting on a network round trip first.
leaveRoomButton.addEventListener("click", () => {
    if (!currentRoomCode) return;

    const roomCodeToLeave = currentRoomCode;
    const wasHost = isHost;

    clearSession();
    cancelDisconnect();

    // Stop every listener bound to this room BEFORE anything else — this
    // is what stops the old room's video/chat/playback from bleeding
    // into whichever room gets joined next.
    detachRoomListeners();
    rejoinPlaybackState = null;

    if (player) player.stopVideo();

    landingPage.style.display = "block";
    roomPage.style.display = "none";
    currentRoomCode = null;
    isHost = false;
    guestFollowsHost = false;
    updateGuestControlsButton();
    updateVideoControlsVisibility();
    hideSyncToast();
    chatMessages.innerHTML = "";
    resetChatScrollState();
    if (youtubeUrlInput) youtubeUrlInput.value = "";
    showPlayerEmptyState({
        title: "Waiting for the host to pick a movie",
        text: "Paste a YouTube URL and click \u201cSet Video\u201d to begin the room."
    });

    if (wasHost) {
        update(ref(db, "rooms/" + roomCodeToLeave), {
            hostId: null,
            lastActivity: serverTimestamp()
        }).then(() => {
            cleanupRoom(roomCodeToLeave);
        }).catch((error) => {
            console.log("Host leave cleanup failed:", error);
        });
    } else {
        update(ref(db, "rooms/" + roomCodeToLeave + "/members"), {
            [currentUserId]: null
        }).then(() => {
            pruneInactiveRoom(roomCodeToLeave);
        }).catch((error) => {
            console.log(error);
        });
    }
});
// ----------------------------------------------------------------------

let player;
let playerReady = false;
let lastTime = 0;

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("player", {
        height: "100%",
        width: "100%",
        playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            fs: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
};

window.initializePlayer = function () {
    if (typeof YT !== "undefined" && YT.Player) {
        window.onYouTubeIframeAPIReady();
    }
};

// --- Custom fullscreen -----------------------------------------------
function isFullscreenActive() {
    return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function enterFullscreen() {
    if (!moviePanel) return;
    if (moviePanel.requestFullscreen) {
        moviePanel.requestFullscreen().catch((error) => {
            console.log("Fullscreen request failed:", error);
        });
    } else if (moviePanel.webkitRequestFullscreen) {
        moviePanel.webkitRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
    } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
    }
}

if (fullscreenToggleBtn) {
    fullscreenToggleBtn.addEventListener("click", () => {
        if (isFullscreenActive()) exitFullscreen();
        else enterFullscreen();
    });
}

function updateFullscreenToggleState() {
    if (!fullscreenToggleBtn) return;
    const active = isFullscreenActive();
   fullscreenToggleBtn.textContent = active ? "Exit FS" : "Fullscreen";
    fullscreenToggleBtn.setAttribute("aria-pressed", String(active));
}

document.addEventListener("fullscreenchange", updateFullscreenToggleState);
document.addEventListener("webkitfullscreenchange", updateFullscreenToggleState);
// --------------------------------------------------------------------

if (typeof YT !== "undefined" && YT.Player) {
    window.initializePlayer();
}

function onPlayerStateChange(event) {
    if (!isHost) return;

    const playbackRef = ref(db, "rooms/" + currentRoomCode + "/playback");
    const currentTime = player.getCurrentTime();

    if (event.data === YT.PlayerState.PLAYING) {
        set(playbackRef, { state: "playing", time: currentTime, updatedAt: serverTimestamp() });
    }

    if (event.data === YT.PlayerState.PAUSED) {
        set(playbackRef, { state: "paused", time: currentTime, updatedAt: serverTimestamp() });
    }
}

function syncGuestToHost({ applyFollowMode = false } = {}) {
    if (isHost || !player || !playerReady || !currentRoomCode) return;

    get(ref(db, "rooms/" + currentRoomCode + "/videoId")).then((videoSnapshot) => {
        const videoId = videoSnapshot.val();
        if (!videoId) {
            showPlayerEmptyState({
                title: "Waiting for the host to pick a movie",
                text: "The host hasn\u2019t selected a video yet."
            });
            return;
        }

        if (applyFollowMode) {
            guestFollowsHost = true;
            updateGuestControlsButton();
        }

        get(ref(db, "rooms/" + currentRoomCode + "/playback")).then((snapshot) => {
            const playback = snapshot.val();
            if (!playback) return;

            const hostTime = playback.time || 0;
            const updatedAt = playback.updatedAt || serverNow();
            const elapsedSinceUpdate = (serverNow() - updatedAt) / 1000;
            let estimatedHostTime = hostTime;
            if (playback.state === "playing") estimatedHostTime = hostTime + elapsedSinceUpdate;

            suppressGuestSync = true;

            const loadedVideoId = typeof player.getVideoData === "function"
                ? player.getVideoData().video_id
                : null;

            if (loadedVideoId !== videoId) {
                player.loadVideoById({ videoId, startSeconds: estimatedHostTime });
            } else {
                player.seekTo(estimatedHostTime, true);
            }

            if (playback.state === "playing") player.playVideo();
            if (playback.state === "paused") player.pauseVideo();

            setTimeout(() => { suppressGuestSync = false; }, 300);
        });
    }).catch(() => {
        showPlayerEmptyState({
            title: "Waiting for the host to pick a movie",
            text: "The host hasn\u2019t selected a video yet."
        });
    });
}

function listenForPlayback() {
    if (isHost) return;

    const unsubscribe = onValue(ref(db, "rooms/" + currentRoomCode + "/playback"), (snapshot) => {
        const playback = snapshot.val();
        if (!guestFollowsHost) return;
        if (!playback || !player) return;

        get(ref(db, "rooms/" + currentRoomCode + "/videoId")).then((videoSnapshot) => {
            const videoId = videoSnapshot.val();
            if (!videoId) {
                showPlayerEmptyState({
                    title: "Waiting for the host to pick a movie",
                    text: "The host hasn\u2019t selected a video yet."
                });
                return;
            }

            hidePlayerEmptyState();

            const hostTime = playback.time || 0;
            const updatedAt = playback.updatedAt || serverNow();
            const elapsedSinceUpdate = (serverNow() - updatedAt) / 1000;
            let estimatedHostTime = hostTime;
            if (playback.state === "playing") estimatedHostTime = hostTime + elapsedSinceUpdate;

            const outOfSync = Math.abs(player.getCurrentTime() - estimatedHostTime) > 0.5
                || player.getPlayerState() !== (playback.state === "playing" ? YT.PlayerState.PLAYING : YT.PlayerState.PAUSED);

            if (outOfSync) {
                suppressGuestSync = true;
                player.seekTo(estimatedHostTime, true);
                if (playback.state === "playing") player.playVideo();
                if (playback.state === "paused") player.pauseVideo();
                setTimeout(() => { suppressGuestSync = false; }, 300);
            }
        }).catch(() => {
            showPlayerEmptyState({
                title: "Waiting for the host to pick a movie",
                text: "The host hasn\u2019t selected a video yet."
            });
        });
    });
    trackListener(unsubscribe);
}

function checkForSeek() {
    if (!isHost || !player) return;
    const currentTime = player.getCurrentTime();

    if (Math.abs(currentTime - lastTime) > 2) {
        const playbackRef = ref(db, "rooms/" + currentRoomCode + "/playback");
        const currentState = player.getPlayerState();
        let state;
        if (currentState === YT.PlayerState.PLAYING) state = "playing";
        if (currentState === YT.PlayerState.PAUSED) state = "paused";
        if (!state) { lastTime = currentTime; return; }
        set(playbackRef, { state, time: currentTime, updatedAt: serverTimestamp() });
    }
    lastTime = currentTime;
}

setInterval(checkForSeek, 1000);

function getYouTubeVideoId(url) {
    if (!url || typeof url !== "string") return null;
    const trimmedUrl = url.trim();
    try {
        const urlObject = new URL(trimmedUrl);
        const hostname = urlObject.hostname.replace(/^www\./, "");

        if (hostname === "youtu.be") {
            const pathParts = urlObject.pathname.split("/").filter(Boolean);
            return pathParts[0] || null;
        }

        if (hostname === "youtube.com" || hostname === "m.youtube.com" || hostname === "music.youtube.com") {
            const videoParam = urlObject.searchParams.get("v");
            if (videoParam) return videoParam;
            const pathParts = urlObject.pathname.split("/").filter(Boolean);
            if (pathParts[0] === "embed" && pathParts[1]) return pathParts[1];
            if ((pathParts[0] === "shorts" || pathParts[0] === "live") && pathParts[1]) return pathParts[1];
        }
        return null;
    } catch (error) {
        const fallbackMatch = trimmedUrl.match(/(?:v=|\/)([A-Za-z0-9_-]{11})(?:[?&]|$)/);
        return fallbackMatch ? fallbackMatch[1] : null;
    }
}

setVideoButton.addEventListener("click", () => {
    if (!isHost) {
        console.log("Only the host can change the video.");
        return;
    }
    if (!currentRoomCode) {
        console.log("No room selected yet.");
        return;
    }

    const youtubeUrl = youtubeUrlInput.value.trim();
    const videoId = getYouTubeVideoId(youtubeUrl);

    if (!videoId) {
        showPlayerEmptyState({
            title: "Invalid YouTube link",
            text: "Paste a valid YouTube URL and click Set Video."
        });
        return;
    }

    // A deliberate new video pick always overrides any pending
    // resume-from-refresh state.
    rejoinPlaybackState = null;

    hidePlayerEmptyState();

    set(ref(db, "rooms/" + currentRoomCode + "/videoId"), videoId).then(() => {
        if (player && typeof player.loadVideoById === "function") {
            try {
                player.loadVideoById(videoId);
            } catch (error) {
                console.log("Player load error:", error);
            }
        } else {
            let retries = 0;
            const waitForPlayer = setInterval(() => {
                if (player && typeof player.loadVideoById === "function") {
                    clearInterval(waitForPlayer);
                    player.loadVideoById(videoId);
                }
                retries++;
                if (retries > 20) clearInterval(waitForPlayer);
            }, 250);
        }
        youtubeUrlInput.value = "";
    }).catch((error) => {
        console.log("Error saving video:", error);
    });
});

youtubeUrlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") setVideoButton.click();
});

function listenForVideo() {
    const unsubscribe = onValue(ref(db, "rooms/" + currentRoomCode + "/videoId"), (snapshot) => {
        const videoId = snapshot.val();

        if (!videoId) {
            showPlayerEmptyState({
                title: isHost ? "Ready to start the movie" : "Waiting for the host to pick a movie",
                text: isHost
                    ? "Paste a YouTube URL and click Set Video to begin the room."
                    : "The host hasn\u2019t picked a video yet."
            });
            if (player && typeof player.stopVideo === "function") player.stopVideo();
            return;
        }

        // If we just rejoined after a refresh, resume at the stashed
        // playback position instead of restarting the video at 0:00.
        // Consumed once so future video changes still load fresh.
        const doLoad = (p) => {
            hidePlayerEmptyState();

            if (rejoinPlaybackState && rejoinPlaybackState.videoId === videoId) {
                const { time, state } = rejoinPlaybackState;
                rejoinPlaybackState = null;
                try {
                    p.loadVideoById({ videoId, startSeconds: time });
                    if (state === "paused") {
                        setTimeout(() => {
                            try { p.pauseVideo(); } catch (e) {}
                        }, 300);
                    }
                } catch (error) {
                    console.log("Video load error:", error);
                }
                return;
            }

            try {
                p.loadVideoById(videoId);
            } catch (error) {
                console.log("Video load error:", error);
            }
        };

        if (!player) {
            let retries = 0;
            const waitForPlayer = setInterval(() => {
                if (player && typeof player.loadVideoById === "function") {
                    clearInterval(waitForPlayer);
                    doLoad(player);
                }
                retries++;
                if (retries > 20) clearInterval(waitForPlayer);
            }, 250);
            return;
        }

        doLoad(player);
    });
    trackListener(unsubscribe);
}

function checkGuestSync() {
    if (isHost || !player || !currentRoomCode) return;

    if (guestFollowsHost) {
        hideSyncToast();
        resyncButton.style.display = "none";
        return;
    }

    resyncButton.style.display = "inline-flex";

    get(ref(db, "rooms/" + currentRoomCode + "/playback")).then((snapshot) => {
        const playback = snapshot.val();
        if (!playback) return;

        const hostTime = playback.time || 0;
        const updatedAt = playback.updatedAt || serverNow();
        const elapsedSinceUpdate = (serverNow() - updatedAt) / 1000;
        let estimatedHostTime = hostTime;
        if (playback.state === "playing") estimatedHostTime = hostTime + elapsedSinceUpdate;

        const difference = Math.abs(estimatedHostTime - player.getCurrentTime());
        if (difference > 2) showSyncToast();
        else hideSyncToast();
    });
}

setInterval(checkGuestSync, 1000);

guestControlsButton.addEventListener("click", () => {
    if (isHost || !currentRoomCode) return;
    guestFollowsHost = !guestFollowsHost;
    updateGuestControlsButton();

    if (guestFollowsHost) {
        hideSyncToast();
        resyncButton.style.display = "none";
        syncGuestToHost({ applyFollowMode: true });
    } else {
        resyncButton.style.display = "inline-flex";
    }
});

updateGuestControlsButton();

resyncButton.addEventListener("click", () => {
    if (!currentRoomCode || !player || isHost) return;
    syncGuestToHost({ applyFollowMode: false });
    resyncButton.style.display = "none";
    hideSyncToast();
});

function updateHostTime() {
    if (!isHost || !player) return;
    if (player.getPlayerState() !== YT.PlayerState.PLAYING) return;

    set(ref(db, "rooms/" + currentRoomCode + "/playback"), {
        state: "playing",
        time: player.getCurrentTime(),
        updatedAt: serverTimestamp()
    });
}

setInterval(updateHostTime, 1000);

sendChatButton.addEventListener("click", () => {
    const message = chatInput.value.trim();
    if (message === "") return;

    push(ref(db, "rooms/" + currentRoomCode + "/messages"), {
        username: currentUsername,
        userId: currentUserId,
        text: message,
        timestamp: Date.now()
    });

    chatInput.value = "";
    chatInput.focus();
});

chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") sendChatButton.click();
});

function listenForMessages() {
    const unsubscribe = onValue(ref(db, "rooms/" + currentRoomCode + "/messages"), (snapshot) => {
        const messages = snapshot.val() || {};
        const messageIds = Object.keys(messages);

        const wasAtBottom = isChatNearBottom();
        const isFirstRender = !hasRenderedMessagesOnce;
        const isNewMessage = messageIds.length > lastRenderedMessageCount;
        const latestMessage = messageIds.length > 0 ? messages[messageIds[messageIds.length - 1]] : null;

        chatMessages.innerHTML = "";

        for (const messageId in messages) {
            const message = messages[messageId];
            const messageItem = document.createElement("div");
            const username = document.createElement("strong");
            username.textContent = message.username;
            const text = document.createElement("span");
            text.textContent = message.text;
            const time = document.createElement("small");
            time.textContent = new Date(message.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
            messageItem.appendChild(username);
            messageItem.appendChild(text);
            messageItem.appendChild(time);
            chatMessages.appendChild(messageItem);
        }

        hasRenderedMessagesOnce = true;
        lastRenderedMessageCount = messageIds.length;

        const sentByMe = !!(latestMessage && latestMessage.userId === currentUserId);

        if (isFirstRender || sentByMe || wasAtBottom) {
            scrollChatToBottom();
            hideNewMessageBadge();
        } else if (isNewMessage) {
            showNewMessageBadge();
        }
    });
    trackListener(unsubscribe);
}

function onPlayerReady() {
    playerReady = true;
    console.log("YouTube player is ready");

    if (!currentRoomCode) {
        showPlayerEmptyState({
            title: "Player ready",
            text: "Create or join a room to start watching together."
        });
        return;
    }

    listenForVideo();
    if (!isHost) {
        syncGuestToHost({ applyFollowMode: true });
    }
}