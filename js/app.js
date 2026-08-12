import { auth, db } from "./firebase-config.js";
import { signInAnonymously } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { ref, set } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";

 const testRef = ref(db, "test");

signInAnonymously(auth)
    .then((userCredential) => {
        console.log("Anonymous login successful");
        console.log(userCredential.user.uid);
        set(testRef,{user_id: userCredential.user.uid,
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


});
joinRoomButton.addEventListener("click",()=>{console.log("You have joined the room :",joinRoomInput.value)});
 
function generateRoomCode() {
   let roomCode = "";

 for(let i=0;i<5;i++){
        const randomIndex= Math.floor(Math.random() * characters.length) ;
        roomCode = roomCode + characters[randomIndex];
 }
    return roomCode;
}
 