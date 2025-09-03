// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getMessaging } from 'firebase/messaging'


const firebaseConfig = {
    apiKey: "AIzaSyA44NdvoI8MzaRJAZeVc5TjdhMyzii7riw",
    authDomain: "my-chat-app-871bb.firebaseapp.com",
    projectId: "my-chat-app-871bb",
    storageBucket: "my-chat-app-871bb.appspot.com",
    messagingSenderId: "628850930970",
    appId: "1:628850930970:web:4889a95f19e76941e768a3",
    measurementId: "G-KPEJ14VVLZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const dataBase = getFirestore(app);
// Get messaging object.
export const messaging = getMessaging(app);