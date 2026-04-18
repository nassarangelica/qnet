"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/lib/auth";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  HomeIcon,
  ChatBubbleLeftRightIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  PencilSquareIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeSolid,
  ChatBubbleLeftRightIcon as ChatSolid,
  UserCircleIcon as UserSolid,
} from "@heroicons/react/24/solid";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Unread messages listener
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", user.uid)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.docs.forEach((convDoc) => {
        const messagesRef = collection(db, "conversations", convDoc.id, "messages");
        const unreadQuery = query(
          messagesRef,
          where("read", "==", false),
          where("senderId", "!=", user.uid)
        );
        onSnapshot(unreadQuery, (msgSnap) => {
          total += msgSnap.size;
          setUnreadCount(total);
        });
      });
      if (snapshot.empty) setUnreadCount(0);
    });
    return () => unsub();
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  async function handleLogout() {
    await logoutUser();
    router.push("/login");
  }

  const navItems = [
    { href: "/feed", label: "Feed", icon: HomeIcon, activeIcon: HomeSolid, badge: 0 },
    { href: "/messages", label: "Messages", icon: ChatBubbleLeftRightIcon, activeIcon: ChatSolid, badge: unreadCount },
    { href: `/profile/${user.uid}`, label: "Profile", icon: UserCircleIcon, activeIcon: UserSolid, badge: 0 },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 flex">

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 border-r border-neutral-800/60 flex-col px-4 py-6 sticky top-0 h-screen">
        <Link href="/feed" className="text-2xl font-bold text-white tracking-tight mb-10 px-2">
          vibe.
        </Link>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ href, label, icon: Icon, activeIcon: ActiveIcon, badge }) => {
            const active = pathname === href || pathname.startsWith(href + "/");
            const I = active ? ActiveIcon : Icon;
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? "bg-violet-600/20 text-violet-300"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800/50"
                }`}
              >
                <div className="relative">
                  <I className="w-5 h-5" />
                  {badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full ring-2 ring-neutral-950" />
                  )}
                </div>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1">
          <Link
            href="/profile/edit"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-all"
          >
            <PencilSquareIcon className="w-5 h-5" />
            Edit Profile
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-neutral-400 hover:text-red-400 hover:bg-red-500/10 transition-all w-full"
          >
            <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
        {/* Mobile top bar */}
        <div className="md:hidden flex items-center justify-between px-4 py-4 border-b border-neutral-800 sticky top-0 bg-neutral-950 z-10">
          <span className="text-xl font-bold text-white tracking-tight">vibe.</span>
          <div className="flex items-center gap-3">
            <Link href="/profile/edit" className="text-neutral-400 hover:text-white transition">
              <PencilSquareIcon className="w-5 h-5" />
            </Link>
            <button onClick={handleLogout} className="text-neutral-400 hover:text-red-400 transition">
              <ArrowLeftOnRectangleIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-neutral-950 border-t border-neutral-800 flex items-center justify-around px-2 py-3 z-20">
        {navItems.map(({ href, label, icon: Icon, activeIcon: ActiveIcon, badge }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const I = active ? ActiveIcon : Icon;
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all ${
                active ? "text-violet-400" : "text-neutral-500 hover:text-white"
              }`}
            >
              <div className="relative">
                <I className="w-6 h-6" />
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 w-2.5 h-2.5 rounded-full ring-2 ring-neutral-950" />
                )}
              </div>
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </nav>

    </div>
  );
}