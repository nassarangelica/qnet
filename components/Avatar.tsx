// components/Avatar.tsx
"use client";
import { User } from "@/types";

interface AvatarProps {
  user?: User | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

function getAnimeAvatar(seed: string): string {
  const encodedSeed = encodeURIComponent(seed);
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodedSeed}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

export default function Avatar({ user, size = "md" }: AvatarProps) {
  const sizes = {
    xs: "w-6 h-6",
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
    xl: "w-20 h-20",
  };

  const seed = user?.uid || user?.displayName || "default";
  const avatarUrl = user?.photoURL || getAnimeAvatar(seed);

  return (
    <div
      className={`${sizes[size]} rounded-full overflow-hidden shrink-0 bg-violet-900/40 border border-violet-700/30`}
    >
      <img
        src={avatarUrl}
        alt={user?.displayName || "avatar"}
        className="w-full h-full object-cover"
      />
    </div>
  );
}