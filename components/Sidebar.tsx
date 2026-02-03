
import React from 'react';
import { ViewMode, TeamMember } from '../types';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  ShieldCheck, 
  History, 
  Users,
  LogOut,
  CheckCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onGoHome: () => void;
  onSwitchProfile: () => void;
  selectedProfile: TeamMember | null;
  hasFullAccess: boolean;
  syncStatus: SyncStatus;
  onLogout: () => void;
}

const getInitials = (name?: string): string => {
  if (!name) return 'AR';
  const nameParts = name.split(' ');
  if (nameParts.length > 1 && nameParts[1]) {
    return (nameParts[0][0] + nameParts[1][0]).toUpperCase();
  }
  return name[0].toUpperCase();
};

const SyncIndicator: React.FC<{ status: SyncStatus }> = ({ status }) => {
  const statusConfig = {
    synced: { text: 'Sincronizado', icon: <CheckCircle size={14} />, color: 'text-emerald-400' },
    syncing: { text: 'Sincronizando...', icon: <Loader2 size={14} className="animate-spin" />, color: 'text-amber-400' },
    error: { text: 'Erro na Sincronização', icon: <AlertTriangle size={14} />, color: 'text-red-400' },
    idle: { text: 'Aguardando', icon: <Loader2 size={14} />, color: 'text-slate-500' },
  };
  const current = statusConfig[status];
  return (
    <div className={`flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest ${current.color}`}>
      {current.icon}
      <span>{current.text}</span>
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onGoHome,
  onSwitchProfile,
  selectedProfile,
  hasFullAccess,
  syncStatus,
  onLogout
}) => {
  return (
    <aside className="w-64 bg-slate-800 text-white fixed h-full flex flex-col z-50">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-16 cursor-pointer group" onClick={onGoHome}>
          <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-white font-black text-sm shadow-sm transition-transform group-hover:scale-105">
            {getInitials(selectedProfile?.name)}
          </div>
          <div>
            <h2 className="text-white font-black text-sm leading-tight uppercase">CTVACINAS</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regulatório</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarButton active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarButton active={currentView === 'tasks'} onClick={() => onViewChange('tasks')} icon={<ListTodo size={18} />} label="Atividades" />
          <SidebarButton active={currentView === 'projects'} onClick={() => onViewChange('projects')} icon={<FolderKanban size={18} />} label="Projetos" />
          {hasFullAccess && (
            <>
              <SidebarButton active={currentView === 'quality'} onClick={() => onViewChange('quality')} icon={<ShieldCheck size={18} />} label="Gestão de Acesso" />
              <SidebarButton active={currentView === 'traceability'} onClick={() => onViewChange('traceability')} icon={<History size={18} />} label="Rastreabilidade" />
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <SyncIndicator status={syncStatus} />
        <div className="flex items-center gap-2">
          <button onClick={onSwitchProfile} className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-slate-700 hover:bg-slate-600 transition text-xs font-bold uppercase tracking-wider text-slate-300">
            <Users size={16} /> Trocar Perfil
          </button>
           <button onClick={onLogout} title="Sair" className="p-3 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/40 transition">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

const SidebarButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center text-left gap-4 px-4 py-3 rounded-lg transition-all duration-200 font-bold text-xs uppercase tracking-wider ${active ? 'bg-slate-600 text-white' : `text-slate-400 hover:bg-slate-600 hover:text-white`}`}
  >
    {React.cloneElement(icon, { strokeWidth: active ? 3 : 2 })}
    {label}
  </button>
);

export default Sidebar;
