// Firebase Service Module for Shivrudra Taxi / Sahyadri Cabs
// Uses Google Firebase SDK v10 (Auth + Cloud Firestore)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAqJtCy4VMRDUxxZP8fsAzkDIEKoj03MA0",
  authDomain: "aditya-cabs.firebaseapp.com",
  projectId: "aditya-cabs",
  storageBucket: "aditya-cabs.firebasestorage.app",
  messagingSenderId: "883699971264",
  appId: "1:883699971264:web:4ca7fdc7f61efee01de925"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Global Firebase Service Object exposed to window
const FirebaseService = {
  auth,
  db,
  currentUser: null,
  authListeners: [],

  init() {
    onAuthStateChanged(auth, async (user) => {
      this.currentUser = user;
      if (user) {
        // Fetch or sync user profile in Firestore
        try {
          const userDocRef = doc(db, "users", user.uid);
          const snap = await getDoc(userDocRef);
          if (!snap.exists()) {
            await setDoc(userDocRef, {
              uid: user.uid,
              name: user.displayName || "Valued Rider",
              email: user.email || "",
              phone: user.phoneNumber || "",
              createdAt: serverTimestamp(),
              lastLogin: serverTimestamp()
            }, { merge: true });
          } else {
            await setDoc(userDocRef, { lastLogin: serverTimestamp() }, { merge: true });
          }
        } catch (e) {
          console.warn("Firestore user sync warning:", e);
        }
      }
      this.authListeners.forEach(fn => fn(user));
    });
  },

  onAuth(callback) {
    this.authListeners.push(callback);
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
  },

  async loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async signupWithEmail(email, password, profile = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    const name = profile.name || "";
    const phone = profile.phone || "";
    const role = profile.role || "rider"; // "rider" or "driver"

    if (name) {
      await updateProfile(user, { displayName: name });
    }

    const userData = {
      uid: user.uid,
      name: name || user.displayName || (role === "driver" ? "Driver Partner" : "Valued Rider"),
      email: email,
      phone: phone,
      role: role,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    if (role === "driver") {
      userData.city = profile.city || "";
      userData.vehicle = profile.vehicle || "";
      userData.vehicleNo = profile.vehicleNo || "";
      userData.driverStatus = "active_partner";

      // Also log into dedicated drivers collection for easy fleet management
      try {
        await setDoc(doc(db, "drivers", user.uid), userData, { merge: true });
      } catch (e) {
        console.warn("Drivers collection sync warning:", e);
      }
    }

    // Save to Firestore users collection
    await setDoc(doc(db, "users", user.uid), userData, { merge: true });

    return user;
  },

  async loginWithGoogle(role = "rider") {
    const res = await signInWithPopup(auth, googleProvider);
    const user = res.user;
    // Sync to Firestore
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      name: user.displayName || "Google User",
      email: user.email || "",
      phone: user.phoneNumber || "",
      role: role,
      lastLogin: serverTimestamp()
    }, { merge: true });
    return user;
  },

  async logout() {
    await signOut(auth);
  },

  // Add an email + password to the account (phone-account "Complete setup")
  async createEmailPassword(email, password) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    return cred.user;
  },

  async sendPasswordReset(email) {
    return sendPasswordResetEmail(auth, email);
  },

  // Save Booking to Cloud Firestore
  async saveBooking(bookingData) {
    try {
      const bRef = collection(db, "bookings");
      const record = {
        ...bookingData,
        userId: this.currentUser ? this.currentUser.uid : null,
        userEmail: this.currentUser ? this.currentUser.email : null,
        createdAtServer: serverTimestamp()
      };
      const docRef = await addDoc(bRef, record);
      return docRef.id;
    } catch (e) {
      console.error("Firestore booking save error:", e);
      return null;
    }
  },

  // Fetch Rider Bookings from Firestore
  async getRiderBookings(userId, phone) {
    try {
      const list = [];
      const bRef = collection(db, "bookings");
      
      // Query by userId if authenticated
      if (userId) {
        const qUser = query(bRef, where("userId", "==", userId));
        const snap = await getDocs(qUser);
        snap.forEach(d => list.push({ docId: d.id, ...d.data() }));
      }
      
      // If phone provided, also check phone matches (for guest or multi-device)
      if (phone && phone.length >= 10) {
        const cleanPhone = phone.slice(-10);
        const qPhone = query(bRef, where("phone", "==", cleanPhone));
        const snapP = await getDocs(qPhone);
        snapP.forEach(d => {
          if (!list.some(item => item.id === d.data().id)) {
            list.push({ docId: d.id, ...d.data() });
          }
        });
      }

      return list.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch (e) {
      console.warn("Firestore fetch error:", e);
      return [];
    }
  }
};

FirebaseService.init();
window.FirebaseService = FirebaseService;
export default FirebaseService;
