import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDsMDdDlReXi9sz15nVSf4QQQ6IJ1mMzoA",
  authDomain: "blood-donor-app-377da.firebaseapp.com",
  projectId: "blood-donor-app-377da",
  storageBucket: "blood-donor-app-377da.firebasestorage.app",
  messagingSenderId: "468695500599",
  appId: "1:468695500599:web:21bb2955fc4e73bbf03cb2",
  measurementId: "G-5PKMKYPRZS"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);