"use client";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function useUnreadMessages(uid: string | undefined) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", uid)
    );

    const unsub = onSnapshot(q, async (snapshot) => {
      let total = 0;
      const counts = await Promise.all(
        snapshot.docs.map((convDoc) => {
          return new Promise<number>((resolve) => {
            const messagesRef = collection(
              db,
              "conversations",
              convDoc.id,
              "messages"
            );
            const unreadQuery = query(
              messagesRef,
              where("read", "==", false),
              where("senderId", "!=", uid)
            );
            onSnapshot(unreadQuery, (msgSnap) => {
              resolve(msgSnap.size);
            });
          });
        })
      );
      total = counts.reduce((a, b) => a + b, 0);
      setUnreadCount(total);
    });

    return () => unsub();
  }, [uid]);

  return unreadCount;
}