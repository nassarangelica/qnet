"use client";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { subscribeMessages, sendMessage, markMessagesAsRead } from "@/lib/messages";
import { getUserById } from "@/lib/users";
import { Message, User } from "@/types";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import { ArrowLeftIcon, PaperAirplaneIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user || !conversationId) return;
    const uids = conversationId.split("_");
    const otherUid = uids.find((u) => u !== user.uid);
    if (otherUid) getUserById(otherUid).then(setOtherUser);
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId || !user) return;
    markMessagesAsRead(conversationId, user.uid);
    const unsub = subscribeMessages(conversationId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
      markMessagesAsRead(conversationId, user.uid);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
    return () => unsub();
  }, [conversationId, user]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !user || sending) return;
    setSending(true);
    setError("");
    try {
      await sendMessage(conversationId, user.uid, text.trim());
      setText("");
    } catch (err: any) {
      setError("Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend(e as any);
    }
  }

  return (
    <div className="flex flex-col h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-neutral-800 bg-neutral-950 sticky top-0 z-10">
        <Link href="/messages" className="text-neutral-400 hover:text-white transition">
          <ArrowLeftIcon className="w-5 h-5" />
        </Link>
        {otherUser ? (
          <Link href={`/profile/${otherUser.uid}`} className="flex items-center gap-3">
            <Avatar user={otherUser} size="sm" />
            <div>
              <p className="text-sm font-semibold text-white">{otherUser.displayName}</p>
              <p className="text-xs text-neutral-500">@{otherUser.username}</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-neutral-800 animate-pulse" />
            <div className="h-4 w-24 bg-neutral-800 rounded animate-pulse" />
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading && (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-4xl">👋</p>
            <p className="text-neutral-400 text-sm font-medium">Say hello!</p>
            <p className="text-neutral-600 text-xs">Start the conversation</p>
          </div>
        )}
        {messages.map((msg) => {
          const isMe = msg.senderId === user?.uid;
          return (
            <div key={msg.id} className={`flex items-end gap-2 ${isMe ? "justify-end" : "justify-start"}`}>
              {!isMe && <Avatar user={otherUser} size="xs" />}
              <div className={`max-w-xs lg:max-w-sm px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                isMe
                  ? "bg-violet-600 text-white rounded-br-sm"
                  : "bg-neutral-800 text-neutral-100 rounded-bl-sm"
              }`}>
                <p className="break-words">{msg.text}</p>
                <div className="flex items-center justify-between gap-2 mt-1">
                  <p className={`text-xs ${isMe ? "text-violet-300" : "text-neutral-500"}`}>
                    {msg.createdAt
                      ? new Date(msg.createdAt).toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                          hour12: true,
                        })
                      : ""}
                  </p>
                  {isMe && (
                    <p className="text-xs text-violet-300">{msg.read ? "✓✓" : "✓"}</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-red-500/10 border-t border-red-500/20">
          <p className="text-red-400 text-xs">{error}</p>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex items-center gap-3 px-4 py-4 border-t border-neutral-800 bg-neutral-950 sticky bottom-0"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={sending}
          className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!text.trim() || sending}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white p-2.5 rounded-xl transition shrink-0"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <PaperAirplaneIcon className="w-5 h-5" />
          )}
        </button>
      </form>
    </div>
  );
}