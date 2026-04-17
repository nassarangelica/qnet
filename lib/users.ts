// lib/users.ts
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, auth, storage } from "./firebase";
import { User } from "@/types";

// Get user by UID
export async function getUserById(uid: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) return null;
  return { uid, ...userDoc.data() } as User;
}

// Update profile
export async function updateUserProfile(
  uid: string,
  data: { displayName?: string; bio?: string; username?: string }
) {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, data);
  if (data.displayName && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: data.displayName });
  }
}

// Upload profile photo and save URL
export async function uploadProfilePhoto(uid: string, file: File): Promise<string> {
  const storageRef = ref(storage, `profilePhotos/${uid}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  // Save to Firestore + Firebase Auth
  await updateDoc(doc(db, "users", uid), { photoURL: url });
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, { photoURL: url });
  }
  return url;
}

// Search users by username
export async function searchUsers(username: string): Promise<User[]> {
  const q = query(
    collection(db, "users"),
    where("username", ">=", username),
    where("username", "<=", username + "\uf8ff")
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ uid: d.id, ...d.data() } as User));
}