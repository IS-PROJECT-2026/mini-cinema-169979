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
   
