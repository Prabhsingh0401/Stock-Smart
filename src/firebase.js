// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBOKTVljWfDFcjLlAlsXST7c0VS612Z2tE",
  authDomain: "pantry-tracker-422b4.firebaseapp.com",
  projectId: "pantry-tracker-422b4",
  storageBucket: "pantry-tracker-422b4.appspot.com",
  messagingSenderId: "92856544168",
  appId: "1:92856544168:web:a6da0655b2cb8796234b9d",
  measurementId: "G-RXEG70ZS5K"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

export { firestore };
