'use client';

import { User, LogOut, Menu } from 'lucide-react';
import { useRouter } from 'next/navigation';

const roleLabel: Record<string, string> = {
  ADMIN:     'Адмін',
  MODERATOR: 'Модератор',
  DOCTOR:    'Лікар',
  PATIENT:   'Пацієнт',
};

export default function Topbar({
  role,
  onMenuOpen,
}: {
  role: string;
  onMenuOpen?: () => void;
}) {
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

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
        <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
          <div className="w-7 h-7 rounded-full bg-brand/10 flex items-center justify-center text-brand">
            <User size={16} />
          </div>
          <span className="text-xs font-bold text-brand uppercase tracking-wider hidden sm:block">
            {roleLabel[role] ?? role}
          </span>
        </div>

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
