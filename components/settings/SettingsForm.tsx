// components/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Calendar, Shield } from "lucide-react";

interface Props {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    createdAt: Date;
  };
}

export function SettingsForm({ user }: Props) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        setMessage("Profile updated successfully");
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
      } else {
        setMessage(data.error ?? "Failed to change password");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile info */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-medium text-ink">Profile</h2>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted">
            <Mail className="w-3.5 h-3.5" />
            <span>{user.email}</span>
          </div>
          <div className="flex items-center gap-2 text-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4 pt-2 border-t border-border">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-accent text-surface px-4 py-2 rounded-lg text-sm font-medium hover:bg-accent-dim transition-colors disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save Profile"}
          </button>
        </form>
      </div>

      {/* Password */}
      <div className="card space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-accent" />
          <h2 className="text-sm font-medium text-ink">Change Password</h2>
        </div>

        <form onSubmit={changePassword} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors"
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={8}
              className="w-full bg-surface-3 border border-border rounded-lg px-3 py-2 text-sm text-ink outline-none focus:border-accent transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-surface-3 text-ink border border-border px-4 py-2 rounded-lg text-sm font-medium hover:border-ink/30 transition-colors disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {message && (
        <p className={`text-sm ${message.includes("success") ? "text-success" : "text-danger"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
