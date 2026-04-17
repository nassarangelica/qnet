// lib/messages.ts
import {
  collection,
  addDoc,
  query,
  orderBy,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";
import { db } from "./firebase";
import { Conversation, Message } from "@/types";

export async function getOrCreateConversation(
  uid1: string,
  uid2: string
): Promise<string> {
  const sorted = [uid1, uid2].sort();
  const convId = sorted.join("_");
  const convRef = doc(db, "conversations", convId);

  try {
    const convSnap = await getDoc(convRef);
    if (!convSnap.exists()) {
      await setDoc(convRef, {
        participants: sorted,
        lastMessage: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }
    return convId;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string
): Promise<void> {
  try {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    await addDoc(messagesRef, {
      senderId,
      text,
      createdAt: serverTimestamp(),
      read: false,
    });

    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      lastMessage: text,
      lastMessageAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

// Mark all messages in a conversation as read
export async function markMessagesAsRead(
  conversationId: string,
  currentUserId: string
): Promise<void> {
  try {
    const messagesRef = collection(db, "conversations", conversationId, "messages");
    const unreadQuery = query(
      messagesRef,
      where("read", "==", false),
      where("senderId", "!=", currentUserId)
    );
    const snapshot = await getDocs(unreadQuery);
    if (snapshot.empty) return;

    const batch = writeBatch(db);
    snapshot.docs.forEach((d) => {
      batch.update(d.ref, { read: true });
    });
    await batch.commit();
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}

export function subscribeMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
) {
  const q = query(
    collection(db, "conversations", conversationId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
      })) as Message[];
      callback(messages);
    },
    (error) => {
      console.error("Messages error:", error);
    }
  );
}

export function subscribeConversations(
  uid: string,
  callback: (conversations: Conversation[]) => void
) {
  const q = query(
    collection(db, "conversations"),
    where("participants", "array-contains", uid),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(
    q,
    (snapshot) => {
      const convs = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        lastMessageAt: d.data().lastMessageAt?.toDate(),
      })) as Conversation[];
      callback(convs);
    },
    (error) => {
      console.error("Conversations error:", error);
    }
  );
}