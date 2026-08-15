import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set,get,update,onValue ,push, remove, onDisconnect } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

 const testRef = ref(db, "test");
let currentUserId;
let currentUsername;
let currentRoomCode;
let isHost = false;

const adjectives = [
    "Ambitious",
    "Curious",
    "Brave",
    "Silent",
    "Creative",
    "Lucky",
    "Clever",
    "Chill"
];

const animals = [
    "Goat",
    "Panda",
    "Wolf",
    "Fox",
    "Lynx",
    "Otter",
    "Tiger",
    "Bear"
];
  function generateUsername() {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const number = Math.floor(Math.random() * 1000);

    return adjective + "-" + animal + number;
}
function usernameTaken(members, username) {
    for (const memberId in members) {
        if (members[memberId] === username) {
            return true;
        }
    }

    return false;
}
signInAnonymously(auth)
    .then((userCredential) => {
        console.log("Anonymous login successful");
        currentUserId = userCredential.user.uid;
       currentUsername = generateUsername();
console.log(currentUsername);
 
        console.log(currentUserId );
        set(testRef,{user_id: currentUserId ,
            message:"Heyyyy firebaseee"
        }) .then(()=>{console.log("Data saved Successfully")})
           .catch((error)=>{console.log(error)})
    })
    .catch((error) => {
        console.log(error);
    });

const createRoomButton = document.getElementById("create-room-btn");
const joinRoomButton = document.getElementById("join-room-btn");
const joinRoomInput=document.getElementById("join-room-input");
const landingPage = document.getElementById("landing-page");
const roomPage = document.getElementById("room-page");
const roomCodeDisplay = document.getElementById("room-code-display");
const leaveRoomButton = document.getElementById("leave-room-btn");
const youtubeUrlInput = document.getElementById("youtube-url-input");
const setVideoButton = document.getElementById("set-video-btn");
const resyncButton = document.getElementById("resync-btn");
const chatMessages = document.getElementById("chat-messages");
const chatInput = document.getElementById("chat-input");
const sendChatButton = document.getElementById("send-chat-btn");
const playerEmptyState = document.getElementById("player-empty-state");
const guestControlsButton = document.getElementById("guest-controls-btn");
const reactionOverlay = document.getElementById("reaction-overlay");

let guestFollowsHost = false;
let suppressGuestSync = false;
const seenReactionIds = new Set();

roomPage.style.display = "none";

function showPlayerEmptyState(message) {
    if (!playerEmptyState) {
        return;
    }

    const title = playerEmptyState.querySelector("h3");
    const text = playerEmptyState.querySelector("p");

    if (title) {
        title.textContent = message.title || "Waiting for the host to pick a movie";
    }

    if (text) {
        text.textContent = message.text || "Paste a YouTube URL and click “Set Video” to begin the room.";
    }

    playerEmptyState.style.display = "flex";
}

function hidePlayerEmptyState() {
    if (playerEmptyState) {
        playerEmptyState.style.display = "none";
    }
}

function showReactionBurst(emoji) {
    const overlayTarget = reactionOverlay || document.getElementById("player");

    if (!overlayTarget) {
        return;
    }

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

    setTimeout(() => {
        burst.remove();
    }, 2000);
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

    const reactionPayload = {
        emoji,
        username: currentUsername || "Guest",
        timestamp: Date.now()
    };

    set(newReactionRef, reactionPayload)
        .catch((error) => {
            console.log("Reaction send failed:", error);
            seenReactionIds.delete(newReactionRef.key);
        });
}

document.addEventListener("click", (event) => {
    const reactionButton = event.target.closest(".reaction-btn");

    if (!reactionButton) {
        return;
    }

    const emoji = reactionButton.dataset.emoji;
    if (!emoji) {
        return;
    }

    sendReaction(emoji);
});

function listenForReactions() {
    if (!currentRoomCode) {
        return;
    }

    const reactionsRef = ref(db, "rooms/" + currentRoomCode + "/reactions");

    onValue(reactionsRef, (snapshot) => {
        const reactions = snapshot.val() || {};

        for (const reactionId in reactions) {
            if (!reactions[reactionId] || !reactions[reactionId].emoji) {
                continue;
            }

            if (seenReactionIds.has(reactionId)) {
                continue;
            }

            seenReactionIds.add(reactionId);
            showReactionBurst(reactions[reactionId].emoji);
        }
    });
}

function updateGuestControlsButton() {
    if (!guestControlsButton) {
        return;
    }

    if (isHost) {
        guestControlsButton.style.display = "none";
        guestControlsButton.classList.remove("is-off");
        resyncButton.style.display = "none";
        return;
    }

    guestControlsButton.style.display = "inline-flex";
    guestControlsButton.textContent = guestFollowsHost
        ? "Host controls my screen"
        : "I control my screen";

    guestControlsButton.classList.toggle("is-off", !guestFollowsHost);
    resyncButton.style.display = "inline-flex";
}

const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function touchRoomActivity(roomCodeValue = currentRoomCode) {
    if (!roomCodeValue) {
        return;
    }

    const roomRef = ref(db, "rooms/" + roomCodeValue);
    update(roomRef, {
        lastActivity: Date.now()
    }).catch((error) => {
        console.log("Room activity update failed:", error);
    });
}

function pruneInactiveRoom(roomCodeValue) {
    if (!roomCodeValue) {
        return;
    }

    const membersRef = ref(db, "rooms/" + roomCodeValue + "/members");

    get(membersRef).then((snapshot) => {
        const members = snapshot.val() || {};

        if (Object.keys(members).length === 0) {
            const roomRef = ref(db, "rooms/" + roomCodeValue);
            remove(roomRef).catch((error) => {
                console.log("Room prune failed:", error);
            });
        }
    }).catch((error) => {
        console.log("Prune room check failed:", error);
    });
}

function cleanupRoom(roomCodeValue) {
    if (!roomCodeValue) {
        return;
    }

    const roomRef = ref(db, "rooms/" + roomCodeValue);
    remove(roomRef).catch((error) => {
        console.log("Room cleanup failed:", error);
    });
}

setInterval(() => {
    const rootRoomsRef = ref(db, "rooms");

    get(rootRoomsRef).then((snapshot) => {
        const rooms = snapshot.val() || {};
        const now = Date.now();

        for (const roomCodeValue in rooms) {
            const room = rooms[roomCodeValue] || {};
            const members = room.members || {};
            const hostId = room.hostId;
            const hasVideo = !!room.videoId;
            const lastActivity = room.lastActivity || room.createdAt || 0;
            const memberCount = Object.keys(members).length;

            const hostMissingTooLong = !!hostId && !members[hostId] && (now - lastActivity > 7 * 60 * 1000);
            const emptyRoomTooLong = memberCount === 0 && !hasVideo && (now - lastActivity > 15 * 60 * 1000);

            if (hostMissingTooLong || emptyRoomTooLong) {
                cleanupRoom(roomCodeValue);
            }
        }
    }).catch((error) => {
        console.log("Inactive room cleanup failed:", error);
    });
}, 60000);
 
createRoomButton.addEventListener("click", () => {
    if (!currentUserId) {
    console.log("User is not authenticated yet.");
    return;
}
const roomCode=generateRoomCode();
console.log(roomCode);
currentRoomCode = roomCode;
isHost = true;
guestFollowsHost = true;
updateGuestControlsButton();
 const roomPath = "rooms/" + roomCode;
 const roomRef=ref(db,roomPath);
 set(roomRef, {
   roomCode: roomCode ,
    hostId: currentUserId,
    createdAt:Date.now(),
    lastActivity: Date.now(),
    playback: {
        state: "paused",
        time: 0,
        updatedAt: Date.now()
    },
    members:{
         [currentUserId]: currentUsername
    } 
})
.then(() => {
    console.log("Room data saved");

    onDisconnect(roomRef).remove();
    onDisconnect(ref(db, roomPath + "/members/" + currentUserId)).remove();

    const membersFolder = ref(db, roomPath + "/members");

    onValue(membersFolder, displayMembers);
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
})
.catch((error)=>{console.log(error)});

console.log(roomPath);
console.log(currentUserId);
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
joinRoomButton.addEventListener("click",()=>{console.log("You have joined the room :",joinRoomInput.value);
    const roomPath = "rooms/" +joinRoomInput.value;
    currentRoomCode = joinRoomInput.value;
    isHost = false;
    guestFollowsHost = false;
    updateGuestControlsButton();
    const roomRef=ref(db,roomPath);
    get(roomRef)
    .then((snapshot) => {
  if (snapshot.exists()) {
    console.log("Room Found!");
    const membersFolder = ref(db, roomPath + "/members");
get(membersFolder).then((snapshot) => {
    const members = snapshot.val() || {};
    let username = generateUsername();
    while (usernameTaken(members, username)) {
    username = generateUsername();

}
update(membersFolder, {
    [currentUserId]: username
});
});
    onValue(membersFolder, displayMembers);
    onDisconnect(ref(db, roomPath + "/members/" + currentUserId)).remove();

    roomCodeDisplay.textContent = joinRoomInput.value;
    landingPage.style.display = "none";
roomPage.style.display = "block";
showPlayerEmptyState({
    title: "Joining the room",
    text: "Syncing to the host’s current movie and playback position..."
});

update(roomRef, { lastActivity: Date.now() });
syncGuestToHost({ applyFollowMode: false });
listenForPlayback();
listenForVideo();
listenForMessages();
listenForReactions();
  }
})
.catch((error) => {
    console.error("Error checking room: " + error);
});
});
 



function generateRoomCode() {
   let roomCode = "";

 for(let i=0;i<5;i++){
        const randomIndex= Math.floor(Math.random() * characters.length) ;
        roomCode = roomCode + characters[randomIndex];
 }
    return roomCode;
}

 leaveRoomButton.addEventListener("click", () => {
    if (!currentRoomCode) {
        return;
    }

    if (isHost) {
        const roomRef = ref(db, "rooms/" + currentRoomCode);
        update(roomRef, {
            hostId: null,
            lastActivity: Date.now()
        }).then(() => {
            cleanupRoom(currentRoomCode);
        }).catch((error) => {
            console.log("Host leave cleanup failed:", error);
        });
    } else {
        const membersFolder = ref(db, "rooms/" + currentRoomCode + "/members");

        update(membersFolder, {
            [currentUserId]: null
        })
        .then(() => {
            pruneInactiveRoom(currentRoomCode);
            console.log("You left room" + currentRoomCode);
        })
        .catch((error) => {
            console.log(error);
        });
    }

    if (player) {
        player.stopVideo();
    }

    landingPage.style.display = "block";
    roomPage.style.display = "none";
    currentRoomCode = null;
    isHost = false;
    guestFollowsHost = false;
    updateGuestControlsButton();
});
 
 let player;
 let playerReady = false;
 let lastTime = 0;
let checkingTime = false;

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("player", {
        height: "390",
        width: "640",
        playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0
        },
        events: {
            onReady: onPlayerReady,
            onStateChange: onPlayerStateChange
        }
    });
};
function onPlayerStateChange(event) {

    if (!isHost) {
        return;
    }

    const playbackRef = ref(
        db,
        "rooms/" + currentRoomCode + "/playback"
    );

    const currentTime = player.getCurrentTime();

    if (event.data === YT.PlayerState.PLAYING) {

        set(playbackRef, {
            state: "playing",
            time: currentTime,
            updatedAt: Date.now()
        });

    }

    if (event.data === YT.PlayerState.PAUSED) {

        set(playbackRef, {
            state: "paused",
            time: currentTime,
            updatedAt: Date.now()
        });

    }
}
function syncGuestToHost({ applyFollowMode = false } = {}) {
    if (isHost || !player || !currentRoomCode) {
        return;
    }

    const videoRef = ref(db, "rooms/" + currentRoomCode + "/videoId");

    get(videoRef).then((videoSnapshot) => {
        const videoId = videoSnapshot.val();

        if (!videoId) {
            showPlayerEmptyState({
                title: "Waiting for the host to pick a movie",
                text: "The host hasn’t selected a video yet."
            });
            return;
        }

        if (applyFollowMode) {
            guestFollowsHost = true;
            updateGuestControlsButton();
        }

        const playbackRef = ref(db, "rooms/" + currentRoomCode + "/playback");

        get(playbackRef).then((snapshot) => {
            const playback = snapshot.val();

            if (!playback) {
                return;
            }

        const hostTime = playback.time || 0;
        const updatedAt = playback.updatedAt || Date.now();
        const elapsedSinceUpdate = (Date.now() - updatedAt) / 1000;
        let estimatedHostTime = hostTime;

        if (playback.state === "playing") {
            estimatedHostTime = hostTime + elapsedSinceUpdate;
        }

        suppressGuestSync = true;
        player.seekTo(estimatedHostTime, true);

        if (playback.state === "playing") {
            player.playVideo();
        }

        if (playback.state === "paused") {
            player.pauseVideo();
        }

            setTimeout(() => {
                suppressGuestSync = false;
            }, 300);
        });
    }).catch(() => {
        showPlayerEmptyState({
            title: "Waiting for the host to pick a movie",
            text: "The host hasn’t selected a video yet."
        });
    });
}

function listenForPlayback() {
    if (isHost) {
        return;
    }

    const playbackRef = ref(
        db,
        "rooms/" + currentRoomCode + "/playback"
    );

    onValue(playbackRef, (snapshot) => {
        const playback = snapshot.val();

        if (!guestFollowsHost) {
            return;
        }

        if (!playback || !player) {
            if (!playback) {
                console.log("No playback state found");
            }
            return;
        }

        const videoRef = ref(db, "rooms/" + currentRoomCode + "/videoId");
        get(videoRef).then((videoSnapshot) => {
            const videoId = videoSnapshot.val();

            if (!videoId) {
                showPlayerEmptyState({
                    title: "Waiting for the host to pick a movie",
                    text: "The host hasn’t selected a video yet."
                });
                return;
            }

            hidePlayerEmptyState();

        const hostTime = playback.time || 0;
        const updatedAt = playback.updatedAt || Date.now();
        const elapsedSinceUpdate = (Date.now() - updatedAt) / 1000;

        let estimatedHostTime = hostTime;

        if (playback.state === "playing") {
            estimatedHostTime = hostTime + elapsedSinceUpdate;
        }

        console.log("Firebase host time:", hostTime);
        console.log("Estimated host time:", estimatedHostTime);
        console.log("Host state:", playback.state);

        if (Math.abs(player.getCurrentTime() - estimatedHostTime) > 0.5 || player.getPlayerState() !== (playback.state === "playing" ? YT.PlayerState.PLAYING : YT.PlayerState.PAUSED)) {
            suppressGuestSync = true;
            player.seekTo(estimatedHostTime, true);

            if (playback.state === "playing") {
                player.playVideo();
            }

            if (playback.state === "paused") {
                player.pauseVideo();
            }

            setTimeout(() => {
                suppressGuestSync = false;
            }, 300);
        }

            console.log("✅ Playback sync complete");
        }).catch(() => {
            showPlayerEmptyState({
                title: "Waiting for the host to pick a movie",
                text: "The host hasn’t selected a video yet."
            });
        });
    });
}

function checkForSeek() {

    if (!isHost) {
        return;
    }

    if (!player) {
        return;
    }

    const currentTime = player.getCurrentTime();

    if (Math.abs(currentTime - lastTime) > 2) {

        const playbackRef = ref(
            db,
            "rooms/" + currentRoomCode + "/playback"
        );

        const currentState = player.getPlayerState();

        let state;

        if (currentState === YT.PlayerState.PLAYING) {
            state = "playing";
        }

        if (currentState === YT.PlayerState.PAUSED) {
            state = "paused";
        }

        // Ignore buffering/loading/unstarted states
        if (!state) {
            lastTime = currentTime;
            return;
        }

        set(playbackRef, {
            state: state,
            time: currentTime,
            updatedAt: Date.now()
        });
    }

    lastTime = currentTime;
}

setInterval(checkForSeek, 1000);
function getYouTubeVideoId(url) {
    if (!url || typeof url !== "string") {
        return null;
    }

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
            if (videoParam) {
                return videoParam;
            }

            const pathParts = urlObject.pathname.split("/").filter(Boolean);
            if (pathParts[0] === "embed" && pathParts[1]) {
                return pathParts[1];
            }

            if ((pathParts[0] === "shorts" || pathParts[0] === "live") && pathParts[1]) {
                return pathParts[1];
            }
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

    console.log("YouTube URL:", youtubeUrl);
    console.log("Video ID:", videoId);

    if (!videoId) {
        console.log("❌ Invalid YouTube URL");
        showPlayerEmptyState({
            title: "Invalid YouTube link",
            text: "Paste a valid YouTube URL and click Set Video."
        });
        return;
    }

    hidePlayerEmptyState();

    const videoRef = ref(
        db,
        "rooms/" + currentRoomCode + "/videoId"
    );

    set(videoRef, videoId)
        .then(() => {
            if (player && typeof player.loadVideoById === "function") {
                try {
                    player.loadVideoById(videoId);
                } catch (error) {
                    console.log("Player load error:", error);
                }
            }
            youtubeUrlInput.value = "";
            console.log("✅ Video saved to Firebase:", videoId);
        })
        .catch((error) => {
            console.log("❌ Error saving video:", error);
        });
});

youtubeUrlInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        setVideoButton.click();
    }
});
function listenForVideo() {
    const videoRef = ref(db, "rooms/" + currentRoomCode + "/videoId");

    onValue(videoRef, (snapshot) => {
        const videoId = snapshot.val();

        if (!videoId) {
            showPlayerEmptyState({
                title: isHost ? "Ready to start the movie" : "Waiting for the host to pick a movie",
                text: isHost
                    ? "Paste a YouTube URL and click Set Video to begin the room."
                    : "The host hasn’t picked a video yet."
            });

            if (player && typeof player.stopVideo === "function") {
                player.stopVideo();
            }
            return;
        }

        if (!player) {
            console.log("YouTube player is not ready yet.");
            return;
        }

        hidePlayerEmptyState();

        try {
            player.loadVideoById(videoId);
        } catch (error) {
            console.log("Video load error:", error);
        }
    });
}
function checkGuestSync() {

    if (isHost || !player) {
        return;
    }

    const playbackRef = ref(
        db,
        "rooms/" + currentRoomCode + "/playback"
    );

    if (!guestFollowsHost) {
        resyncButton.style.display = "block";
        return;
    }

    get(playbackRef).then((snapshot) => {

        const playback = snapshot.val();

        if (!playback) {
            return;
        }

      const hostTime = playback.time || 0;
const updatedAt = playback.updatedAt || Date.now();

const elapsedSinceUpdate = (Date.now() - updatedAt) / 1000;

let estimatedHostTime = hostTime;

if (playback.state === "playing") {
    estimatedHostTime = hostTime + elapsedSinceUpdate;
}

const guestTime = player.getCurrentTime();

const difference = Math.abs(estimatedHostTime - guestTime);

console.log("Firebase host time:", hostTime);
console.log("Estimated host time:", estimatedHostTime);
console.log("Guest time:", guestTime);
console.log("Difference:", difference);

      if (guestFollowsHost) {
            if (difference > 3) {
                console.log("⚠️ You are out of sync!");
                resyncButton.style.display = "block";
            } else {
                resyncButton.style.display = "none";
            }
        } else {
            resyncButton.style.display = "inline-flex";
        }
    });
}

setInterval(checkGuestSync, 1000);
guestControlsButton.addEventListener("click", () => {
    if (isHost || !currentRoomCode) {
        return;
    }

    guestFollowsHost = !guestFollowsHost;
    updateGuestControlsButton();

    if (guestFollowsHost) {
        syncGuestToHost({ applyFollowMode: true });
    }
});

updateGuestControlsButton();

resyncButton.addEventListener("click", () => {
    if (!currentRoomCode || !player || isHost) {
        return;
    }

    syncGuestToHost({ applyFollowMode: false });
    resyncButton.style.display = "none";
    console.log("✅ Resync pressed. Guest remains in manual mode unless they choose host control.");
});
function updateHostTime() {

    if (!isHost || !player) {
        return;
    }

    const state = player.getPlayerState();

    if (state !== YT.PlayerState.PLAYING) {
        return;
    }

    const currentTime = player.getCurrentTime();

    const playbackRef = ref(
        db,
        "rooms/" + currentRoomCode + "/playback"
    );

    set(playbackRef, {
        state: "playing",
        time: currentTime,
        updatedAt: Date.now()
    });
}

setInterval(updateHostTime, 1000);


sendChatButton.addEventListener("click", () => {
    const message = chatInput.value.trim();

    if (message === "") {
        return;
    }

    const messagesRef = ref(
        db,
        "rooms/" + currentRoomCode + "/messages"
    );

    const newMessageRef = push(messagesRef);

    set(newMessageRef, {
        username: currentUsername,
        userId: currentUserId,
        text: message,
        timestamp: Date.now()
    });

    chatInput.value = "";
    chatInput.focus();
});
function listenForMessages() {

    const messagesRef = ref(
        db,
        "rooms/" + currentRoomCode + "/messages"
    );

    onValue(messagesRef, (snapshot) => {

        const messages = snapshot.val() || {};

        chatMessages.innerHTML = "";

        for (const messageId in messages) {

            const message = messages[messageId];

            const messageItem = document.createElement("div");

            const username = document.createElement("strong");
            username.textContent = message.username;

            const text = document.createElement("span");
            text.textContent = message.text;

            const time = document.createElement("small");

            const messageDate = new Date(message.timestamp);

            time.textContent = messageDate.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit"
            });

            messageItem.appendChild(username);
            messageItem.appendChild(text);
            messageItem.appendChild(time);

            chatMessages.appendChild(messageItem);
        }
    });
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
}