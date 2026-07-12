'use client';

import { useEffect, useRef, useState } from 'react';
import { User, LogOut, Menu, ChevronDown, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

const roleLabel: Record<string, string> = {
  ADMIN:     'Адмін',
  MODERATOR: 'Модератор',
  DOCTOR:    'Лікар',
  PATIENT:   'Пацієнт',
};

type ProfileData = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  role: string;
  region: string | null;
};

export default function Topbar({
  role,
  userId,
  onMenuOpen,
}: {
  role: string;
  userId?: number;
  onMenuOpen?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const fetchProfile = async () => {
    if (profile || loading) return;
    setLoading(true);
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleDropdown = () => {
    if (!open) fetchProfile();
    setOpen(v => !v);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const initials = profile
    ? [profile.first_name?.[0], profile.last_name?.[0]].filter(Boolean).join('').toUpperCase() || '?'
    : (roleLabel[role]?.[0] ?? '?');

  return (
    <header className="h-16 bg-white border-b border-gray-200 px-4 md:px-6 flex items-center justify-between sticky top-0 z-20 shrink-0">
      {/* Hamburger — mobile only */}
      <button
        onClick={onMenuOpen}
        className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
        aria-label="Відкрити меню"
      >
        <Menu size={22} />
      </button>

      {/* Spacer on desktop */}
      <div className="hidden md:block" />

      {/* Right section */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Profile area */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={toggleDropdown}
            aria-haspopup="true"
            aria-expanded={open}
            className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand text-xs font-bold">
              {initials}
            </div>
            <span className="text-xs font-bold text-brand uppercase tracking-wider hidden sm:block">
              {roleLabel[role] ?? role}
            </span>
            <ChevronDown size={14} className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>

          {open && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-[0_15px_40px_rgba(0,0,0,0.12)] border border-gray-100 z-50 overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Профіль</p>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Закрити"
                >
                  <X size={16} />
                </button>
              </div>

              {loading && (
                <div className="px-4 py-6 text-center text-sm text-gray-400">Завантаження…</div>
              )}

              {!loading && profile && (
                <div className="px-4 pb-4 space-y-3">
                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center text-brand text-lg font-bold shrink-0">
                      {initials}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 text-sm truncate">
                        {[profile.last_name, profile.first_name].filter(Boolean).join(' ') || '—'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{profile.email}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 rounded-xl p-3 space-y-2 text-xs">
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">Роль</span>
                      <span className="font-medium text-brand">{roleLabel[profile.role] ?? profile.role}</span>
                    </div>
                    {profile.region && (
                      <div className="flex justify-between gap-2">
                        <span className="text-gray-500">Регіон</span>
                        <span className="font-medium text-right">{profile.region}</span>
                      </div>
                    )}
                    <div className="flex justify-between gap-2">
                      <span className="text-gray-500">ID</span>
                      <span className="font-medium text-gray-600">{profile.id}</span>
                    </div>
                  </div>

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                  >
                    <LogOut size={15} />
                    Вийти
                  </button>
                </div>
              )}

              {!loading && !profile && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="pt-1">
                    <p className="font-semibold text-gray-900 text-sm">{roleLabel[role] ?? role}</p>
                  </div>
                  <button
                    type="button"
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors border border-red-100"
                  >
                    <LogOut size={15} />
                    Вийти
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Standalone logout button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 text-gray-500 hover:text-red-500 transition-colors text-sm font-medium px-2 md:px-3 py-1.5 rounded-xl hover:bg-red-50"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Вийти</span>
        </button>
      </div>
    </header>
  );
}
