import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDV1lOP_YvFhENApXmw--oSo0HOifEVSa4",
  authDomain: "maag-60419.firebaseapp.com",
  projectId: "maag-60419",
  storageBucket: "maag-60419.appspot.com",
  messagingSenderId: "953634001415",
  appId: "1:953634001415:web:c78efc5296109e0757d0a2",
  measurementId: "G-6S16MLZJ8F"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth = getAuth(app);
