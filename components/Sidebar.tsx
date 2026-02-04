
import React from 'react';
import { ViewMode, SyncInfo, TeamMember } from '../types';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  ShieldCheck, 
  History, 
  LogOut, 
  Users,
  Cloud,
  CloudOff,
  Clock,
  Database,
  Download,
  Upload
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onGoHome: () => void;
  onLogout: () => void;
  onSwitchProfile: () => void;
  selectedProfile: TeamMember | null;
  hasFullAccess: boolean;
  lastSync: SyncInfo | null;
  onSaveBackup: () => void;
  onLoadBackup: () => void;
}

const getInitials = (name?: string): string => {
  if (!name || name.trim() === '') return 'G';
  const nameParts = name.trim().split(' ');
  const firstInitial = nameParts[0]?.[0];
  return firstInitial ? firstInitial.toUpperCase() : 'G';
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onGoHome,
  onLogout,
  onSwitchProfile,
  selectedProfile,
  hasFullAccess,
  lastSync,
  onSaveBackup,
  onLoadBackup
}) => {

  const formatSyncTime = (timestamp: string) => {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString('pt-BR');
  };

  return (
    <aside className="w-64 bg-slate-800 text-white fixed h-full flex flex-col z-50">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={onGoHome}>
          <div className="w-10 h-10 bg-brand-primary rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg transition-transform group-hover:scale-105">
            {getInitials(selectedProfile?.name)}
          </div>
          <div>
            <h2 className="text-white font-black text-sm leading-tight uppercase">GESTÃO</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regulatória</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarButton active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarButton active={currentView === 'tasks'} onClick={() => onViewChange('tasks')} icon={<ListTodo size={18} />} label="Atividades" />
          <SidebarButton active={currentView === 'projects'} onClick={() => onViewChange('projects')} icon={<FolderKanban size={18} />} label="Projetos" />
          {hasFullAccess && (
            <>
              <SidebarButton active={currentView === 'quality'} onClick={() => onViewChange('quality')} icon={<ShieldCheck size={18} />} label="Acessos" />
              <SidebarButton active={currentView === 'traceability'} onClick={() => onViewChange('traceability')} icon={<History size={18} />} label="Auditoria" />
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-700 space-y-4">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Database size={12}/> Backup Local
            </p>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={onSaveBackup} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-[9px] font-bold uppercase flex items-center justify-center gap-2 transition"><Download size={12}/> Salvar</button>
                <button onClick={onLoadBackup} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 text-[9px] font-bold uppercase flex items-center justify-center gap-2 transition"><Upload size={12}/> Subir</button>
            </div>
        </div>
        
        <div className={`p-4 rounded-xl border transition-all ${
          lastSync?.status === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-slate-900/50 border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Cloud</p>
            <div className={`w-2 h-2 rounded-full ${
              lastSync?.status === 'syncing' ? 'bg-amber-400 animate-pulse' : 
              lastSync?.status === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`} />
          </div>
          <div className="flex items-center gap-2 mb-2">
             {lastSync?.status === 'error' ? <CloudOff size={12} className="text-red-400" /> : <Cloud size={12} className="text-emerald-400" />}
             <span className={`text-[9px] font-black uppercase truncate ${
                lastSync?.status === 'error' ? 'text-red-400' : 'text-slate-300'
             }`}>
               {lastSync?.status === 'syncing' ? 'Sincronizando...' : lastSync?.status === 'error' ? 'Erro de Conexão' : 'SharePoint OK'}
             </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
             <Clock size={12}/>
             <span className="text-[9px] font-bold">
                {lastSync?.status === 'synced' ? formatSyncTime(lastSync.timestamp) : '--:--:--'}
             </span>
          </div>
        </div>

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
    className={`w-full flex items-center text-left gap-4 px-4 py-3 rounded-lg transition-all duration-200 font-bold text-xs uppercase tracking-wider ${active ? 'bg-brand-primary/80 text-white' : `text-slate-400 hover:bg-slate-700 hover:text-white`}`}
  >
    {React.cloneElement(icon, { strokeWidth: active ? 3 : 2 })}
    {label}
  </button>
);

export default Sidebar;
