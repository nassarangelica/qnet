"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { subscribeFeedPosts, createPost, toggleLike } from "@/lib/posts";
import { addComment, subscribeComments, deleteComment } from "@/lib/comments";
import { getUserById } from "@/lib/users";
import { Post, User, Comment } from "@/types";
import Avatar from "@/components/Avatar";
import Link from "next/link";
import {
  HeartIcon,
  ChatBubbleOvalLeftIcon,
  TrashIcon,
  XMarkIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolid } from "@heroicons/react/24/solid";

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

function CommentSection({
  post,
  currentUser,
  authors,
}: {
  post: Post;
  currentUser: any;
  authors: Record<string, User>;
}) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentAuthors, setCommentAuthors] = useState<Record<string, User>>({});
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsub = subscribeComments(post.id, async (fetchedComments) => {
      setComments(fetchedComments);
      const newAuthors: Record<string, User> = { ...commentAuthors };
      await Promise.all(
        fetchedComments.map(async (c) => {
          if (!newAuthors[c.uid]) {
            const u = await getUserById(c.uid);
            if (u) newAuthors[c.uid] = u;
          }
        })
      );
      setCommentAuthors({ ...newAuthors });
    });
    return () => unsub();
  }, [post.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !currentUser) return;
    setSubmitting(true);
    try {
      await addComment(post.id, currentUser.uid, text.trim());
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    try {
      await deleteComment(post.id, commentId);
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="mt-3 border-t border-neutral-800 pt-3 space-y-3">
      {comments.length === 0 && (
        <p className="text-xs text-neutral-600 text-center py-2">
          No comments yet. Be the first!
        </p>
      )}
      {comments.map((c) => {
        const author = commentAuthors[c.uid];
        const isOwn = currentUser?.uid === c.uid;
        return (
          <div key={c.id} className="flex gap-2">
            <Link href={`/profile/${c.uid}`}>
              <Avatar user={author} size="sm" />
            </Link>
            <div className="flex-1 bg-neutral-800/60 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <Link
                  href={`/profile/${c.uid}`}
                  className="text-xs font-semibold text-white hover:text-violet-300 transition truncate"
                >
                  {author?.displayName || "..."}
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-600 hidden sm:block">
                    {c.createdAt ? formatDate(c.createdAt) : ""}
                  </span>
                  {isOwn && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-neutral-600 hover:text-red-400 transition"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-neutral-300 mt-0.5 break-words">
                {c.content}
              </p>
            </div>
          </div>
        );
      })}

      {/* Add comment */}
      <form onSubmit={handleSubmit} className="flex gap-2 items-center">
        <Avatar user={authors[currentUser?.uid]} size="sm" />
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 bg-neutral-800/60 border border-neutral-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500 transition min-w-0"
          />
          <button
            type="submit"
            disabled={!text.trim() || submitting}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white p-2 rounded-xl transition shrink-0"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default function FeedPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [authors, setAuthors] = useState<Record<string, User>>({});
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeFeedPosts(async (fetchedPosts) => {
      setPosts(fetchedPosts);
      const newAuthors: Record<string, User> = {};
      const uids = [...new Set(fetchedPosts.map((p) => p.uid))];
      await Promise.all(
        uids.map(async (uid) => {
          const u = await getUserById(uid);
          if (u) newAuthors[uid] = u;
        })
      );
      setAuthors((prev) => ({ ...prev, ...newAuthors }));
    });
    return () => unsub();
  }, []);

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setPosting(true);
    try {
      await createPost(user.uid, content.trim());
      setContent("");
    } catch (err) {
      console.error(err);
    } finally {
      setPosting(false);
    }
  }

  async function handleLike(post: Post) {
    if (!user) return;
    await toggleLike(post.id, user.uid, post.likes.includes(user.uid));
  }

  const currentUserProfile = user ? authors[user.uid] : null;

  return (
    <div className="max-w-xl mx-auto py-4 md:py-8 px-3 md:px-4">
      {/* Create post */}
      <form
        onSubmit={handlePost}
        className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 mb-6"
      >
        <div className="flex gap-3">
          <Avatar user={currentUserProfile} size="md" />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind?"
            rows={3}
            className="flex-1 bg-transparent text-white text-sm placeholder:text-neutral-500 resize-none focus:outline-none"
          />
        </div>
        <div className="flex justify-between items-center mt-3 border-t border-neutral-800 pt-3">
          <span className="text-xs text-neutral-600">{content.length}/500</span>
          <button
            type="submit"
            disabled={posting || !content.trim() || content.length > 500}
            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2 rounded-xl transition"
          >
            {posting ? "Posting..." : "Post"}
          </button>
        </div>
      </form>

      {/* Posts */}
      <div className="space-y-4">
        {posts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👋</p>
            <p className="text-neutral-400 text-sm font-medium">No posts yet</p>
            <p className="text-neutral-600 text-xs mt-1">Be the first to post!</p>
          </div>
        )}
        {posts.map((post) => {
          const author = authors[post.uid];
          const liked = user ? post.likes.includes(user.uid) : false;
          const showComments = openComments === post.id;

          return (
            <div
              key={post.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <Link href={`/profile/${post.uid}`}>
                  <Avatar user={author} size="md" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/profile/${post.uid}`}
                    className="text-sm font-semibold text-white hover:text-violet-300 transition block truncate"
                  >
                    {author?.displayName || "Loading..."}
                  </Link>
                  <p className="text-xs text-neutral-500 truncate">
                    @{author?.username} ·{" "}
                    {post.createdAt ? formatDate(post.createdAt) : ""}
                  </p>
                </div>
              </div>

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

              <div className="flex items-center gap-3 mt-4">
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
                <button
                  onClick={() => setOpenComments(showComments ? null : post.id)}
                  className={`flex items-center gap-1.5 text-sm transition px-3 py-1.5 rounded-xl ${
                    showComments
                      ? "text-violet-400 bg-violet-500/10"
                      : "text-neutral-500 hover:text-violet-400 hover:bg-violet-500/10"
                  }`}
                >
                  {showComments ? (
                    <XMarkIcon className="w-5 h-5" />
                  ) : (
                    <ChatBubbleOvalLeftIcon className="w-5 h-5" />
                  )}
                  <span>{post.commentsCount}</span>
                </button>
              </div>

              {showComments && (
                <CommentSection
                  post={post}
                  currentUser={user}
                  authors={authors}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}