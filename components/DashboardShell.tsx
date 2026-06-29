'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function DashboardShell({
  role,
  children,
}: {
  role: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden text-gray-800">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar — fixed overlay on mobile, static on desktop */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40 transition-transform duration-300 ease-in-out
        ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar role={role} onClose={() => setOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Topbar role={role} onMenuOpen={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
