// lib/comments.ts
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { Comment } from "@/types";

// Add a comment
export async function addComment(
  postId: string,
  uid: string,
  content: string
): Promise<void> {
  try {
    await addDoc(collection(db, "posts", postId, "comments"), {
      postId,
      uid,
      content,
      createdAt: serverTimestamp(),
    });

    // Increment comment count on post
    await updateDoc(doc(db, "posts", postId), {
      commentsCount: increment(1),
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    throw error;
  }
}

// Delete a comment
export async function deleteComment(
  postId: string,
  commentId: string
): Promise<void> {
  try {
    await deleteDoc(doc(db, "posts", postId, "comments", commentId));
    await updateDoc(doc(db, "posts", postId), {
      commentsCount: increment(-1),
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    throw error;
  }
}

// Subscribe to comments for a post
export function subscribeComments(
  postId: string,
  callback: (comments: Comment[]) => void
) {
  const q = query(
    collection(db, "posts", postId, "comments"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const comments = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      })) as Comment[];
      callback(comments);
    },
    (error) => {
      console.error("Comments error:", error);
    }
  );
}