import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBIHHg8dcgd8Z2HQheIWV5pM5IWZ1V8l1E",
  authDomain: "plannie-app-f719e.firebaseapp.com",
  projectId: "plannie-app-f719e",
  storageBucket: "plannie-app-f719e.firebasestorage.app",
  messagingSenderId: "632660353942",
  appId: "1:632660353942:web:649976db1ef5f4b86433b7"
};

// ✅ prevent duplicate app error
const app = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

// ✅ THIS IS WHAT YOU WERE MISSING
export const auth = getAuth(app);