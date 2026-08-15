import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set,get,update,onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

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

roomPage.style.display = "none";
const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
 
createRoomButton.addEventListener("click", () => {
    if (!currentUserId) {
    console.log("User is not authenticated yet.");
    return;
}
const roomCode=generateRoomCode();
console.log(roomCode);
currentRoomCode = roomCode;
isHost = true;
 const roomPath = "rooms/" + roomCode;
 const roomRef=ref(db,roomPath);
 set(roomRef, {
   roomCode: roomCode ,
    hostId: currentUserId,
    createdAt:Date.now(),
    members:{
         [currentUserId]: currentUsername
    } 
})
.then(() => {
    console.log("Room data saved");

    const membersFolder = ref(db, roomPath + "/members");

    onValue(membersFolder, displayMembers);
    landingPage.style.display = "none";
roomPage.style.display = "block";
roomCodeDisplay.textContent =   roomCode;
roomCodeDisplay.textContent = roomCode;
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
     
    roomCodeDisplay.textContent =  joinRoomInput.value;
    landingPage.style.display = "none";
roomPage.style.display = "block";
listenForPlayback();
     
  } else {
    console.log("No room with that code :(");
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
     const membersFolder = ref(db, "rooms/" + currentRoomCode + "/members");
     update(membersFolder, {
        [currentUserId]: null
    })
    .then(()=>{ console.log("You left room"+currentRoomCode);
        landingPage.style.display="block";
        roomPage.style.display = "none";})

    .catch((error)=>{console.log(error);});
    
});
 
 let player;
 let lastTime = 0;
let checkingTime = false;

window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("player", {
        height: "390",
        width: "640",
        videoId: "8A7i67ZRjG8",

        events: {
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
function listenForPlayback() {

    const playbackRef = ref(
        db,
        "rooms/" + currentRoomCode + "/playback"
    );

    get(playbackRef).then((snapshot) => {

        const playback = snapshot.val();

        if (!playback) {
            console.log("No playback state found");
            return;
        }

        const hostTime = playback.time || 0;
        const updatedAt = playback.updatedAt || Date.now();

        const elapsedSinceUpdate =
            (Date.now() - updatedAt) / 1000;

        let estimatedHostTime = hostTime;

        if (playback.state === "playing") {
            estimatedHostTime = hostTime + elapsedSinceUpdate;
        }

        console.log("Firebase host time:", hostTime);
        console.log("Estimated host time:", estimatedHostTime);
        console.log("Host state:", playback.state);

        // Join at the host's estimated current position
        player.seekTo(estimatedHostTime, true);

        // Join with the host's current state
        if (playback.state === "playing") {
            player.playVideo();
        }

        if (playback.state === "paused") {
            player.pauseVideo();
        }

        console.log("✅ Initial sync complete");
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
    const urlObject = new URL(url);

    if (urlObject.hostname === "youtu.be") {
        return urlObject.pathname.substring(1);
    }

    return urlObject.searchParams.get("v");
}
 setVideoButton.addEventListener("click", () => {
    const youtubeUrl = youtubeUrlInput.value;
    const videoId = getYouTubeVideoId(youtubeUrl);

    console.log("YouTube URL:", youtubeUrl);
    console.log("Video ID:", videoId);

    if (player) {
        player.loadVideoById(videoId);
    }

    const videoRef = ref(db, "rooms/" + currentRoomCode + "/videoId");
    set(videoRef, videoId);
});
function listenForVideo() {
    const videoRef = ref(db, "rooms/" + currentRoomCode + "/videoId");

    onValue(videoRef, (snapshot) => {
        const videoId = snapshot.val();

        if (videoId) {
            player.loadVideoById(videoId);
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

      if (difference > 3) {
            console.log("⚠️ You are out of sync!");
            resyncButton.style.display = "block";
        } else {
            resyncButton.style.display = "none";
        }
    });
}

setInterval(checkGuestSync, 1000);
resyncButton.addEventListener("click", () => {

    const playbackRef = ref(
        db,
        "rooms/" + currentRoomCode + "/playback"
    );

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

        player.seekTo(estimatedHostTime, true);

        if (playback.state === "playing") {
            player.playVideo();
        }

        if (playback.state === "paused") {
            player.pauseVideo();
        }

        resyncButton.style.display = "none";

        console.log("Firebase host time:", hostTime);
        console.log("Estimated host time:", estimatedHostTime);
        console.log("✅ Resynced to host at:", estimatedHostTime);
    });
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