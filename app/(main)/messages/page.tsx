"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeConversations, getOrCreateConversation } from "@/lib/messages";
import { getUserById, searchUsers } from "@/lib/users";
import { Conversation, User } from "@/types";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [otherUsers, setOtherUsers] = useState<Record<string, User>>({});
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeConversations(user.uid, async (convs) => {
      setConversations(convs);
      const users: Record<string, User> = { ...otherUsers };
      await Promise.all(
        convs.map(async (c) => {
          const otherUid = c.participants.find((p) => p !== user.uid)!;
          if (!users[otherUid]) {
            const u = await getUserById(otherUid);
            if (u) users[otherUid] = u;
          }
        })
      );
      setOtherUsers({ ...users });
    });
    return () => unsub();
  }, [user]);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!search.trim()) return;
    setSearching(true);
    try {
      const results = await searchUsers(search.trim());
      setSearchResults(results.filter((u) => u.uid !== user?.uid));
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  }

  async function startConversation(otherUid: string) {
    if (!user) return;
    setStarting(otherUid);
    try {
      const convId = await getOrCreateConversation(user.uid, otherUid);
      router.push(`/messages/${convId}`);
    } catch (err) {
      console.error(err);
      setStarting(null);
    }
  }

  function formatDate(date: Date) {
    return new Date(date).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return (
    <div className="max-w-xl mx-auto py-4 md:py-8 px-3 md:px-4">
      <h1 className="text-xl font-bold text-white mb-6">Messages</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by username..."
            className="w-full bg-neutral-900 border border-neutral-800 rounded-xl pl-9 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500 transition"
          />
        </div>
        <button
          type="submit"
          disabled={searching || !search.trim()}
          className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition"
        >
          {searching ? "..." : "Search"}
        </button>
      </form>

      {/* Search results */}
      {searchResults.length > 0 && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl mb-6 overflow-hidden">
          <p className="text-xs text-neutral-500 px-4 py-2 border-b border-neutral-800">Search results</p>
          {searchResults.map((u) => (
            <button
              key={u.uid}
              onClick={() => startConversation(u.uid)}
              disabled={starting === u.uid}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-neutral-800/50 transition text-left disabled:opacity-60"
            >
              <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                {u.photoURL ? (
                  <img src={u.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  u.displayName?.[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">{u.displayName}</p>
                <p className="text-xs text-neutral-500">@{u.username}</p>
              </div>
              <span className="text-xs text-violet-400 font-medium">
                {starting === u.uid ? "Opening..." : "Message"}
              </span>
            </button>
          ))}
        </div>
      )}

      {searchResults.length === 0 && search && !searching && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl mb-6 px-4 py-6 text-center">
          <p className="text-neutral-500 text-sm">No users found for "{search}"</p>
        </div>
      )}

      {/* Conversations */}
      <div className="space-y-2">
        {conversations.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">💬</p>
            <p className="text-neutral-400 text-sm font-medium">No conversations yet</p>
            <p className="text-neutral-600 text-xs mt-1">Search for someone to start messaging!</p>
          </div>
        )}
        {conversations.map((conv) => {
          const otherUid = conv.participants.find((p) => p !== user?.uid)!;
          const otherUser = otherUsers[otherUid];
          return (
            <Link
              key={conv.id}
              href={`/messages/${conv.id}`}
              className="flex items-center gap-3 bg-neutral-900 border border-neutral-800 hover:border-violet-800/50 hover:bg-neutral-800/50 rounded-2xl px-4 py-3 transition"
            >
              <div className="w-11 h-11 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                {otherUser?.photoURL ? (
                  <img src={otherUser.photoURL} alt="" className="w-full h-full object-cover" />
                ) : (
                  otherUser?.displayName?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white truncate">
                    {otherUser?.displayName || "Loading..."}
                  </p>
                  <span className="text-xs text-neutral-600 shrink-0 ml-2">
                    {conv.lastMessageAt ? formatDate(conv.lastMessageAt) : ""}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 truncate mt-0.5">
                  {conv.lastMessage || "No messages yet"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}