import { initializeApp, getApps, getApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth, getAuth } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyA4UFwNeVkY4SMhinUP5SH2fZdhdiOkx5I",
  authDomain: "plannie-app-a28bc.firebaseapp.com",
  projectId: "plannie-app-a28bc",
  storageBucket: "plannie-app-a28bc.firebasestorage.app",
  messagingSenderId: "147011410264",
  appId: "1:147011410264:web:dccbb2344594b6867e6d2d"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch (e) {
  auth = getAuth(app);
}

export { auth };