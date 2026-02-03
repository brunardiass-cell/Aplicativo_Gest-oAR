
import React, { useRef } from 'react';
import { ViewMode, AppUser, SyncInfo } from '../types';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  ShieldCheck, 
  History, 
  LogOut, 
  Home,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Download,
  Upload
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onGoHome: () => void;
  onLogout: () => void;
  currentUser: AppUser | null;
  notificationCount: number;
  lastSync: SyncInfo | null;
  onRetrySync: () => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onGoHome,
  onLogout,
  currentUser,
  lastSync,
  onRetrySync,
  onDownloadBackup,
  onRestoreBackup
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getSyncStatus = () => {
    if (!lastSync) return { icon: <AlertCircle size={14}/>, text: 'Não sincronizado', color: 'text-slate-400' };
    switch (lastSync.status) {
      case 'syncing': return { icon: <RefreshCw size={14} className="animate-spin"/>, text: 'Sincronizando...', color: 'text-blue-500' };
      case 'synced': return { icon: <CheckCircle size={14}/>, text: `Salvo ${new Date(lastSync.timestamp).toLocaleTimeString()}`, color: 'text-emerald-500' };
      case 'error': return { icon: <AlertCircle size={14}/>, text: 'Erro de sincronia', color: 'text-red-500' };
    }
  };
  const syncStatus = getSyncStatus();

  return (
    <aside className="w-72 bg-white text-slate-800 fixed h-full flex flex-col shadow-lg z-50 border-r border-slate-200">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={onGoHome}>
          <div className="w-12 h-12 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:scale-110">
            AR
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-base leading-tight uppercase tracking-tight">CTVACINAS</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regulatório</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarButton active={currentView === 'dashboard'} onClick={() => onViewChange('dashboard')} icon={<LayoutDashboard size={18} />} label="Dashboard" />
          <SidebarButton active={currentView === 'tasks'} onClick={() => onViewChange('tasks')} icon={<ListTodo size={18} />} label="Atividades" />
          <SidebarButton active={currentView === 'projects'} onClick={() => onViewChange('projects')} icon={<FolderKanban size={18} />} label="Projetos" />
          {currentUser?.role === 'admin' && (
             <SidebarButton active={currentView === 'quality'} onClick={() => onViewChange('quality')} icon={<ShieldCheck size={18} />} label="Gestão de Acesso" />
          )}
          {currentUser?.role === 'admin' && (
            <SidebarButton active={currentView === 'traceability'} onClick={() => onViewChange('traceability')} icon={<History size={18} />} label="Rastreabilidade" />
          )}
        </nav>
      </div>

      <div className="mt-auto px-6 py-6 border-t border-slate-200 space-y-2">
        {currentUser?.role === 'admin' && (
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Backup & Restore</h4>
              <div className="grid grid-cols-2 gap-2">
                 <button onClick={onDownloadBackup} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 transition flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                    <Download size={14}/> Baixar
                 </button>
                 <button onClick={() => fileInputRef.current?.click()} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-100 transition flex items-center justify-center gap-2 text-[10px] font-black uppercase">
                    <Upload size={14}/> Restaurar
                 </button>
                 <input type="file" ref={fileInputRef} onChange={onRestoreBackup} accept=".json" className="hidden"/>
              </div>
          </div>
        )}
        
        <div className="px-4 py-3 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-full bg-white ${syncStatus.color}`}>{syncStatus.icon}</div>
            <span className={`text-[10px] font-bold uppercase ${syncStatus.color}`}>{syncStatus.text}</span>
          </div>
          {lastSync?.status === 'error' && (
             <button onClick={onRetrySync} className="p-1 rounded-full text-slate-400 hover:bg-slate-200" title="Tentar novamente"><RefreshCw size={14}/></button>
          )}
        </div>
        
        <div className="px-4 py-3 bg-white rounded-2xl border border-slate-200">
          <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuário Atual</p>
          <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.username}</p>
        </div>
        
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition text-[10px] font-black uppercase tracking-widest text-red-500">
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
};

const SidebarButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center text-left gap-3 px-4 py-3.5 rounded-xl transition font-bold text-[10px] uppercase tracking-[0.15em] ${active ? 'bg-blue-50 text-blue-600' : `hover:bg-slate-100 text-slate-500 hover:text-slate-800`}`}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;