"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserById, updateUserProfile, uploadProfilePhoto } from "@/lib/users";
import { User } from "@/types";
import Avatar from "@/components/Avatar";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

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
  const [error, setError] = useState("");

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
    setError("");
    try {
      await updateUserProfile(user.uid, {
        displayName,
        username: username.toLowerCase(),
        bio,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadProfilePhoto(user.uid, file);
      setProfile((p) => ({ ...p, photoURL: url }));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  const previewUser = {
    ...profile,
    displayName,
    username,
  } as User;

  return (
    <div className="max-w-md mx-auto py-4 md:py-8 px-3 md:px-4">
      <h1 className="text-xl font-bold text-white mb-6">Edit Profile</h1>

      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar user={previewUser} size="xl" />
            {uploading && (
              <div className="absolute inset-0 rounded-full bg-black/60 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-sm text-violet-400 hover:text-violet-300 transition font-medium block"
            >
              Upload custom photo
            </button>
            <p className="text-xs text-neutral-500 mt-1">
              Or keep your generated anime avatar
            </p>
            {profile.photoURL && (
              <button
                onClick={() => {
                  if (!user) return;
                  updateUserProfile(user.uid, {});
                  setProfile((p) => ({ ...p, photoURL: "" }));
                }}
                className="text-xs text-red-400 hover:text-red-300 transition mt-1 block"
              >
                Remove photo
              </button>
            )}
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
              ✅ Profile saved!
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wide">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-violet-500 transition"
            />
          </div>
          <div>
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wide">
              Username
            </label>
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
            <label className="block text-xs text-neutral-400 mb-1.5 uppercase tracking-wide">
              Bio
            </label>
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