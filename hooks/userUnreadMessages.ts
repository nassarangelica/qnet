// hooks/useUnreadMessages.ts
"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUnreadMessages(uid: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    // Listen to all conversations for this user
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", uid)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      let total = 0;

      await Promise.all(
        snapshot.docs.map(async (convDoc) => {
          const convId = convDoc.id;
          const messagesRef = collection(
            db,
            "conversations",
            convId,
            "messages"
          );

          // Count unread messages not sent by current user
          const unreadQuery = query(
            messagesRef,
            where("read", "==", false),
            where("senderId", "!=", uid)
          );

          return new Promise<void>((resolve) => {
            onSnapshot(unreadQuery, (msgSnap) => {
              total += msgSnap.size;
              resolve();
            });
          });
        })
      );

      setUnreadCount(total);
    });

    return () => unsub();
  }, [uid]);

  return unreadCount;
}