import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyAobm4j4HvayZlG6dzamM9Q1UYqqMCfadY",
    authDomain: "freemarket-mvp.firebaseapp.com",
    projectId: "freemarket-mvp",
    storageBucket: "freemarket-mvp.firebasestorage.app",
    messagingSenderId: "611654591250",
    appId: "1:611654591250:web:3a0115a01fa699340289cb",
    measurementId: "G-G906J39CM9"
};

const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);