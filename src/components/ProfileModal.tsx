import React, { useState, useRef } from 'react';
import {
  User as UserIcon,
  Camera,
  Trash2,
  Check,
  AlertCircle,
  LogOut,
  Mail,
  Shield,
  KeyRound,
  Sparkles,
} from 'lucide-react';
import { BottomSheet } from './BottomSheet';
import { api } from '../lib/api';
import { User, UserProfile } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  profile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
  onLogout: () => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  profile,
  onProfileUpdated,
  onLogout,
  onShowToast,
}) => {
  const [displayName, setDisplayName] = useState(profile.display_name || user.username);
  const [username, setUsername] = useState(profile.username || user.username);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Resize and compress avatar image
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPG, PNG, WebP).');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Image file is too large (max 8MB).');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          // Resize to max 256x256 square for fast avatar loading
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            // Center crop square
            const minDim = Math.min(img.width, img.height);
            const sx = (img.width - minDim) / 2;
            const sy = (img.height - minDim) / 2;
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);

            const base64Data = canvas.toDataURL('image/jpeg', 0.85);
            try {
              const res = await api.uploadAvatar(base64Data);
              onProfileUpdated(res.profile);
              onShowToast('Profile photo updated', 'success');
            } catch (err: any) {
              setError(err.message || 'Failed to upload photo.');
            } finally {
              setLoading(false);
            }
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Could not process avatar image.');
      setLoading(false);
    }
  };

  const handleRemoveAvatar = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.removeAvatar();
      onProfileUpdated(res.profile);
      onShowToast('Profile photo removed', 'info');
    } catch (err: any) {
      setError(err.message || 'Failed to remove photo.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError('Username cannot be blank.');
      return;
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      setError('Username may only contain letters, numbers, and underscores.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.updateProfile({
        display_name: displayName,
        username,
      });
      onProfileUpdated(res.profile);
      onShowToast('Profile saved successfully', 'success');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const initial = (profile.display_name || user.username || 'U')[0].toUpperCase();

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="User Profile"
      description="Manage your account identity and photo"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-start gap-2 text-left">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-xs text-rose-800 font-medium">{error}</span>
          </div>
        )}

        {/* Avatar Section */}
        <div className="flex flex-col items-center justify-center pt-1 pb-2">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-zinc-200/80 bg-zinc-950 flex items-center justify-center text-white shadow-md">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="font-black text-2xl font-mono text-emerald-400">
                  {initial}
                </span>
              )}
            </div>

            {/* Hidden File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarFileChange}
              className="hidden"
            />

            {/* Camera Overlay Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 bg-zinc-900 hover:bg-black text-white rounded-full shadow-md transition-transform active:scale-90"
              title="Upload photo"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-bold text-zinc-800 hover:text-black py-1 px-2 rounded-lg hover:bg-zinc-100"
            >
              Change photo
            </button>
            {profile.avatar_url && (
              <>
                <span className="text-zinc-300">·</span>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="text-xs text-rose-600 hover:text-rose-700 py-1 px-2 rounded-lg hover:bg-rose-50"
                >
                  Remove
                </button>
              </>
            )}
          </div>
        </div>

        {/* Profile Details Form */}
        <form onSubmit={handleSaveProfile} className="space-y-3 text-left">
          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="alexm"
              className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono text-[13px]"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">
              Email Address
            </label>
            <div className="w-full px-3 py-2.5 bg-zinc-100 border border-zinc-200/60 rounded-xl text-xs sm:text-sm text-zinc-600 flex items-center gap-2">
              <Mail className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span className="truncate">{user.email}</span>
            </div>
            <span className="text-[10px] text-zinc-400 mt-1 block">
              Email can be updated in Settings &gt; Account
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-zinc-950 hover:bg-zinc-800 text-white font-bold text-xs sm:text-sm rounded-xl transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 mt-2"
          >
            {loading ? 'Saving...' : 'SAVE CHANGES'}
          </button>
        </form>

        {/* Log Out Button */}
        <div className="pt-2 border-t border-zinc-100">
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full py-2.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out of account</span>
          </button>
        </div>
      </div>
    </BottomSheet>
  );
};
