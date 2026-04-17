// app/(main)/profile/edit/page.tsx
"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserById, updateUserProfile, uploadProfilePhoto } from "@/lib/users";
import { User } from "@/types";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<Partial<User>>({});
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!user) return;
    getUserById(user.uid).then((u) => {
      if (u) {
        setProfile(u);
        setDisplayName(u.displayName || "");
        setUsername(u.username || "");
        setBio(u.bio || "");
      }
    });
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    await updateUserProfile(user.uid, { displayName, username: username.toLowerCase(), bio });
    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const url = await uploadProfilePhoto(user.uid, file);
    setProfile((p) => ({ ...p, photoURL: url }));
    setUploading(false);
  }

  return (
    <div className="max-w-md mx-auto py-4 md:py-8 px-3 md:px-4">
      <h1 className="text-xl font-bold text-white mb-6">Edit Profile</h1>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        {/* Avatar upload */}
        <div className="flex items-center gap-4 mb-6">
          <div
            onClick={() => fileRef.current?.click()}
            className="w-16 h-16 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold overflow-hidden cursor-pointer hover:opacity-80 transition relative"
          >
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              displayName?.[0]?.toUpperCase() || "?"
            )}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-violet-400 hover:text-violet-300 transition font-medium"
            >
              Change photo
            </button>
            <p className="text-xs text-neutral-500 mt-0.5">Click avatar to upload</p>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {success && (
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-3 text-green-400 text-sm">
              Profile saved!
            </div>
          )}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wide">Display Name</label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wide">Username</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">@</span>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl pl-8 pr-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wide">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition resize-none"
              placeholder="Tell people a bit about yourself..."
            />
            <p className="text-xs text-neutral-600 mt-1 text-right">{bio.length}/160</p>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 text-sm bg-neutral-800 hover:bg-neutral-700 text-neutral-300 py-3 rounded-xl transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 text-sm bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl transition font-semibold"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}