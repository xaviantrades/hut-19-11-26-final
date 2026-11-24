import { initializeApp } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    orderBy,
    query,
    doc,
    setDoc,
    increment,
    serverTimestamp,
    updateDoc,
    arrayUnion,
    getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* =========================================================
 * Config
 * ======================================================= */
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCywqYls2mJfY9maHRhsHRTP6OmPgC1Kf0",
    authDomain: "x-shopping-6611d.firebaseapp.com",
    projectId: "x-shopping-6611d",
    storageBucket: "x-shopping-6611d.firebasestorage.app",
    messagingSenderId: "177602183210",
    appId: "1:177602183210:web:011c708002426b37cb8353",
    measurementId: "G-QKLP9H1N9P"
};

const COLLECTION_NAME = "withdrawals";
const CONTAINER_ID = "withdraw-container";

/* =========================================================
 * Firebase init
 * ======================================================= */
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);
const withdrawalsCollection = collection(db, COLLECTION_NAME);

/* =========================================================
 * GET LOGGED IN USER INFORAMTION
 * ======================================================= */

async function getUserIdAndBalance() {
  const response = await fetch("/api/user-reference", {
    credentials: "include"
  });

  if (!response.ok) {
    throw new Error(`Unable to identify logged-in user (${response.status})`);
  }

  const { userId } = await response.json();
  if (!userId) throw new Error("No userId returned from /api/user-reference");

  // Wait for the first balance value, then stop listening
  return new Promise((resolve) => {
    let unsubscribe = null;
    let done = false;

    unsubscribe = listenToUserAmount(db, userId, (formatted, raw) => {
      if (done) return;
      done = true;
      if (typeof unsubscribe === "function") unsubscribe();
      resolve({ userId, balance: raw, formattedBalance: formatted });
    });
  });
}
const { userId, balance, formattedBalance } = await getUserIdAndBalance();
console.log(userId, balance, formattedBalance);
