import React from 'react';
import { ArrowLeft, Sparkles, ShieldCheck, User as UserIcon } from 'lucide-react';
import { User, UserProfile } from '../types';

interface HeaderProps {
  onBack?: () => void;
  showBack?: boolean;
  title?: string;
  showTagline?: boolean;
  user?: User | null;
  profile?: UserProfile | null;
  onOpenProfile?: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onBack,
  showBack = false,
  title,
  showTagline = true,
  user,
  profile,
  onOpenProfile,
  onOpenAuth,
}) => {
  const initial = (profile?.display_name || user?.username || 'U')[0]?.toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200/90 transition-all text-zinc-900 shadow-2xs">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {showBack && onBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 text-zinc-800 hover:text-zinc-950 active:scale-95 transition-transform rounded-xl hover:bg-zinc-100"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-900" />
            </button>
          ) : (
            <div className="flex items-center gap-2.5">
              {/* Brand Logo Container */}
              <div className="w-8 h-8 rounded-xl bg-zinc-950 text-white flex items-center justify-center font-black text-sm shadow-xs tracking-tight shrink-0">
                <span className="font-mono text-xs font-black">DO</span>
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-zinc-950 block leading-none">
                  {title || 'DO THIS'}
                </span>
                {showTagline && !title && (
                  <span className="text-[11px] text-zinc-700 font-bold tracking-normal block leading-tight mt-0.5 font-mono">
                    Know what to do next
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Action: User Avatar / Sign In */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 p-1 pl-2.5 pr-1 rounded-full bg-zinc-100 border border-zinc-300 shadow-2xs hover:bg-zinc-200 transition-colors"
              title="View Profile & Account"
            >
              <span className="text-xs font-bold text-zinc-900 max-w-[80px] truncate hidden sm:inline">
                {profile?.display_name || user.username}
              </span>
              <div className="w-7 h-7 rounded-full overflow-hidden bg-zinc-950 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-zinc-800">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-emerald-400 font-mono text-[11px]">{initial}</span>
                )}
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 bg-white hover:bg-zinc-50 border border-zinc-300 text-zinc-900 font-black text-xs rounded-xl shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <UserIcon className="w-3.5 h-3.5 text-zinc-700" />
              <span>Sign in</span>
            </button>
          )}

          {/* Privacy badge */}
          <div className="hidden xs:flex items-center gap-1 text-[11px] font-bold text-zinc-700 pl-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
        </div>
      </div>
    </header>
  );
};
