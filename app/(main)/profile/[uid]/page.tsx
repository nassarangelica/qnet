// app/(main)/profile/[uid]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getUserById } from "@/lib/users";
import { subscribeUserPosts, toggleLike } from "@/lib/posts";
import { getOrCreateConversation } from "@/lib/messages";
import { useAuth } from "@/hooks/useAuth";
import { User, Post } from "@/types";
import { HeartIcon, ChatBubbleOvalLeftIcon } from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function ProfilePage() {
  const { uid } = useParams<{ uid: string }>();
  const { user: currentUser } = useAuth();
  const router = useRouter();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserById(uid).then((u) => {
      setProfileUser(u);
      setLoading(false);
    });
    const unsub = subscribeUserPosts(uid, setPosts);
    return () => unsub();
  }, [uid]);

  async function handleMessage() {
    if (!currentUser) return;
    const convId = await getOrCreateConversation(currentUser.uid, uid);
    router.push(`/messages/${convId}`);
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

  async function handleLike(post: Post) {
    if (!currentUser) return;
    await toggleLike(post.id, currentUser.uid, post.likes.includes(currentUser.uid));
  }

  return (
    <div className="max-w-xl mx-auto py-4 md:py-8 px-3 md:px-4">
      {/* Profile header */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold overflow-hidden">
              {profileUser.photoURL ? (
                <img src={profileUser.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                profileUser.displayName?.[0]?.toUpperCase()
              )}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{profileUser.displayName}</h2>
              <p className="text-sm text-neutral-400">@{profileUser.username}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {isOwn ? (
              <Link
                href="/profile/edit"
                className="text-sm bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2 rounded-xl transition font-medium"
              >
                Edit Profile
              </Link>
            ) : (
              <button
                onClick={handleMessage}
                className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl transition font-medium"
              >
                Message
              </button>
            )}
          </div>
        </div>
        {profileUser.bio && (
          <p className="mt-4 text-sm text-neutral-300 leading-relaxed">{profileUser.bio}</p>
        )}
        <p className="mt-3 text-xs text-neutral-500">{posts.length} posts</p>
      </div>

      {/* Timeline posts */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <p className="text-center text-neutral-500 text-sm py-10">No posts yet.</p>
        )}
        {posts.map((post) => {
          const liked = currentUser ? post.likes.includes(currentUser.uid) : false;
          return (
            <div
              key={post.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
            >
              <p className="text-sm text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
              {post.imageURL && (
                <img src={post.imageURL} alt="" className="mt-3 rounded-xl w-full object-cover max-h-80" />
              )}
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-5 text-neutral-500">
                  <button
                    onClick={() => handleLike(post)}
                    className={`flex items-center gap-1.5 text-sm hover:text-red-400 transition ${liked ? "text-red-400" : ""}`}
                  >
                    {liked ? <HeartSolid className="w-5 h-5" /> : <HeartIcon className="w-5 h-5" />}
                    {post.likes.length}
                  </button>
                  <span className="flex items-center gap-1.5 text-sm">
                    <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                    {post.commentsCount}
                  </span>
                </div>
                <span className="text-xs text-neutral-600">
                  {post.createdAt ? formatDistanceToNow(post.createdAt, { addSuffix: true }) : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}