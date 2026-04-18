"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserById } from "@/lib/users";
import { subscribeUserPosts, toggleLike } from "@/lib/posts";
import { getOrCreateConversation } from "@/lib/messages";
import { useAuth } from "@/hooks/useAuth";
import { User, Post } from "@/types";
import Avatar from "@/components/Avatar";
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  ChatBubbleLeftRightIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import Link from "next/link";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [messaging, setMessaging] = useState(false);

  useEffect(() => {
    if (!uid) return;
    getUserById(uid).then((u) => {
      setProfileUser(u);
      setLoading(false);
    });
    const unsub = subscribeUserPosts(uid, setPosts);
    return () => unsub();
  }, [uid]);

  async function handleMessage() {
    if (!currentUser || !uid) return;
    setMessaging(true);
    try {
      const convId = await getOrCreateConversation(currentUser.uid, uid);
      router.push(`/messages/${convId}`);
    } catch (error) {
      console.error("Error opening conversation:", error);
      setMessaging(false);
    }
  }

  async function handleLike(post: Post) {
    if (!currentUser) return;
    await toggleLike(
      post.id,
      currentUser.uid,
      post.likes.includes(currentUser.uid)
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="text-center py-20 text-neutral-500">User not found.</div>
    );
  }

  const isOwn = currentUser?.uid === uid;

  return (
    <div className="max-w-xl mx-auto py-4 md:py-8 px-3 md:px-4">
      {/* Profile header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-4">
            <Avatar user={profileUser} size="xl" />
            <div>
              <h2 className="text-xl font-bold text-white">
                {profileUser.displayName}
              </h2>
              <p className="text-sm text-neutral-400">@{profileUser.username}</p>
              <p className="text-xs text-neutral-600 mt-1">{posts.length} posts</p>
            </div>
          </div>

          <div className="shrink-0">
            {isOwn ? (
              <Link
                href="/profile/edit"
                className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition font-medium block"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleMessage}
                disabled={messaging}
                className="flex items-center gap-2 text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-60 text-white px-4 py-2 rounded-xl transition font-medium"
              >
                {messaging ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ChatBubbleLeftRightIcon className="w-4 h-4" />
                )}
                {messaging ? "Opening..." : "Message"}
              </button>
            )}
          </div>
        </div>

        {profileUser.bio && (
          <p className="mt-4 text-sm text-neutral-300 leading-relaxed">
            {profileUser.bio}
          </p>
        )}
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📝</p>
            <p className="text-neutral-400 text-sm font-medium">No posts yet</p>
          </div>
        )}
        {posts.map((post) => {
          const liked = currentUser
            ? post.likes.includes(currentUser.uid)
            : false;
          return (
            <div
              key={post.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
            >
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed break-words">
                {post.content}
              </p>
              {post.imageURL && (
                <img
                  src={post.imageURL}
                  alt=""
                  className="mt-3 rounded-xl w-full object-cover max-h-80"
                />
              )}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 text-sm transition px-3 py-1.5 rounded-xl ${
                      liked
                        ? "text-red-400 bg-red-500/10"
                        : "text-neutral-500 hover:text-red-400 hover:bg-red-500/10"
                    }`}
                  >
                    {liked ? (
                      <HeartSolid className="w-5 h-5" />
                    ) : (
                      <HeartIcon className="w-5 h-5" />
                    )}
                    <span>{post.likes.length}</span>
                  </button>
                  <span className="flex items-center gap-1.5 text-sm text-neutral-500 px-3 py-1.5">
                    <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                    <span>{post.commentsCount}</span>
                  </span>
                </div>
                <span className="text-xs text-neutral-600">
                  {post.createdAt ? formatDate(post.createdAt) : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}