import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set,get,update,onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

 const testRef = ref(db, "test");
let currentUserId;
let currentUsername;
let currentRoomCode;

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

function onYouTubeIframeAPIReady() {
    player = new YT.Player("player", {
        height: "390",
        width: "640",
        videoId: "M7lc1UVf-VE"
    });
}