// lib/posts.ts
import {
  collection,
  addDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
  doc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Post } from "@/types";

export async function createPost(
  uid: string,
  content: string,
  imageURL?: string
) {
  if (!uid) throw new Error("User not authenticated");
  if (!content.trim()) throw new Error("Post content cannot be empty");
  if (content.length > 500) throw new Error("Post too long (max 500 characters)");

  const postsRef = collection(db, "posts");
  const docRef = await addDoc(postsRef, {
    uid,
    content: content.trim(),
    imageURL: imageURL || "",
    likes: [],
    commentsCount: 0,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function deletePost(postId: string, uid: string) {
  const postRef = doc(db, "posts", postId);
  await deleteDoc(postRef);
}

export function subscribeFeedPosts(callback: (posts: Post[]) => void) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
    })) as Post[];
    callback(posts);
  }, (error) => {
    console.error("Feed error:", error);
  });
}

export function subscribeUserPosts(
  uid: string,
  callback: (posts: Post[]) => void
) {
  const q = query(
    collection(db, "posts"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate(),
    })) as Post[];
    callback(posts);
  }, (error) => {
    console.error("User posts error:", error);
  });
}

export async function toggleLike(
  postId: string,
  uid: string,
  liked: boolean
) {
  if (!uid) throw new Error("User not authenticated");
  const postRef = doc(db, "posts", postId);
  await updateDoc(postRef, {
    likes: liked ? arrayRemove(uid) : arrayUnion(uid),
  });
}