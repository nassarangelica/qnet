// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  browserLocalPersistence,
  setPersistence,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export async function registerUser(
  email: string,
  password: string,
  displayName: string,
  username: string
) {
  // Validate inputs
  if (!email || !password || !displayName || !username) {
    throw new Error("All fields are required");
  }
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  if (username.length < 3) {
    throw new Error("Username must be at least 3 characters");
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    throw new Error("Username can only contain letters, numbers and underscores");
  }

  await setPersistence(auth, browserLocalPersistence);
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await updateProfile(user, { displayName });

  await setDoc(doc(db, "users", user.uid), {
    uid: user.uid,
    displayName,
    username: username.toLowerCase(),
    bio: "",
    photoURL: "",
    createdAt: serverTimestamp(),
  });

  return user;
}

export async function loginUser(email: string, password: string) {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  await setPersistence(auth, browserLocalPersistence);
  return signInWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  return signOut(auth);
}