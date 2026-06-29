import Link from 'next/link';
import { Home, Users, Activity, FileText, ShieldCheck, X } from 'lucide-react';

export default function Sidebar({ role, onClose }: { role: string; onClose?: () => void }) {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0">
        <h1 className="text-brand text-xl font-bold tracking-tight">ЗЗК Реєстр</h1>
        {onClose && (
          <button onClick={onClose} className="md:hidden text-gray-400 hover:text-gray-700 p-1">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {role === 'ADMIN' && (
          <>
            <NavItem href="/admin"           icon={<Home size={20} />}       label="Дашборд"        onClose={onClose} />
            <NavItem href="/admin/users"     icon={<ShieldCheck size={20} />} label="Користувачі"   onClose={onClose} />
            <NavItem href="/admin/patients"  icon={<Users size={20} />}       label="Всі пацієнти"  onClose={onClose} />
          </>
        )}

        {role === 'MODERATOR' && (
          <>
            <NavItem href="/moderator"          icon={<Home size={20} />}  label="Дашборд"       onClose={onClose} />
            <NavItem href="/moderator/patients" icon={<Users size={20} />} label="Всі пацієнти"  onClose={onClose} />
          </>
        )}

        {role === 'DOCTOR' && (
          <>
            <NavItem href="/doctor"              icon={<Users size={20} />}    label="Мої пацієнти"  onClose={onClose} />
            <NavItem href="/doctor/pending"      icon={<Activity size={20} />} label="Очікують дії"  onClose={onClose} />
            <NavItem href="/doctor/patients/new" icon={<FileText size={20} />} label="Новий пацієнт" onClose={onClose} />
          </>
        )}

        {role === 'PATIENT' && (
          <>
            <NavItem href="/patient"                  icon={<Home size={20} />}     label="Мій кабінет" onClose={onClose} />
            <NavItem href="/patient/self-assessment"  icon={<Activity size={20} />} label="Самооцінка"  onClose={onClose} />
          </>
        )}
      </nav>
    </aside>
  );
}

function NavItem({
  href, icon, label, onClose,
}: {
  href: string; icon: React.ReactNode; label: string; onClose?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-brand/10 hover:text-brand rounded-xl transition-colors font-medium"
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}
