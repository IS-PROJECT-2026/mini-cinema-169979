import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set,get } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

 const testRef = ref(db, "test");
let currentUserId;

  
signInAnonymously(auth)
    .then((userCredential) => {
        console.log("Anonymous login successful");
        currentUserId = userCredential.user.uid;
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

const characters = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
 
createRoomButton.addEventListener("click", () => {
const roomCode=generateRoomCode();
console.log(roomCode);
 const roomPath = "rooms/" + roomCode;
 const roomRef=ref(db,roomPath);
 set(roomRef, {
   roomCode: roomCode ,
    hostId: currentUserId,
    createdAt:Date.now() 
})
.then(()=>{console.log("Host id saved")})
.catch((error)=>{console.log(error)});
console.log(roomPath);
console.log(currentUserId);
});



joinRoomButton.addEventListener("click",()=>{console.log("You have joined the room :",joinRoomInput.value);
    const roomPath = "rooms/" +joinRoomInput.value;
    const roomRef=ref(db,roomPath);
    get(roomRef)
    .then((snapshot) => {
  if (snapshot.exists()) {
    console.log("Room Found!");
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
 