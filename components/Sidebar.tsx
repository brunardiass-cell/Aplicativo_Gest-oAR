
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
  Cloud,
  CloudOff,
  RefreshCw,
  Clock,
  Download,
  Upload,
  Database
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onGoHome: () => void;
  onLogout: () => void;
  currentUser: AppUser | null;
  notificationCount: number;
  lastSync: SyncInfo | null;
  onRetrySync?: () => void;
  onDownloadBackup: () => void;
  onRestoreBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onGoHome,
  onLogout,
  currentUser,
  notificationCount,
  lastSync,
  onRetrySync,
  onDownloadBackup,
  onRestoreBackup
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <aside className="w-64 bg-white text-slate-500 fixed h-full flex flex-col shadow-xl z-50 border-r border-slate-200">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={onGoHome}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-100 transition-transform group-hover:scale-110">
            AR
          </div>
          <div>
            <h2 className="text-slate-900 font-black text-sm leading-tight uppercase tracking-tight">CTVACINAS</h2>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Regulatório</p>
          </div>
        </div>

        <nav className="space-y-2">
          <SidebarButton 
            active={currentView === 'dashboard'} 
            onClick={() => onViewChange('dashboard')} 
            icon={<LayoutDashboard size={18} />} 
            label="Dashboard" 
          />
          <SidebarButton 
            active={currentView === 'tasks'} 
            onClick={() => onViewChange('tasks')} 
            icon={<ListTodo size={18} />} 
            label="Atividades" 
          />
          <SidebarButton 
            active={currentView === 'projects'} 
            onClick={() => onViewChange('projects')} 
            icon={<FolderKanban size={18} />} 
            label="Projetos" 
          />
          {currentUser?.role === 'admin' && (
             <SidebarButton 
              active={currentView === 'quality'} 
              onClick={() => onViewChange('quality')} 
              icon={<ShieldCheck size={18} />} 
              label="Gerenciar Equipe" 
            />
          )}
          {currentUser?.role === 'admin' && (
            <SidebarButton 
              active={currentView === 'traceability'} 
              onClick={() => onViewChange('traceability')} 
              icon={<History size={18} />} 
              label="Rastreabilidade" 
            />
          )}
        </nav>
      </div>

      <div className="mt-auto px-6 py-6 border-t border-slate-100 space-y-4 bg-slate-50/30">
        
        {/* Backup Local Section */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-1.5">
                <Database size={12} className="text-slate-400" />
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Backup Local</p>
             </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={onDownloadBackup}
              className="flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition group"
              title="Baixar Backup JSON"
            >
              <Download size={14} className="group-hover:translate-y-0.5 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Salvar</span>
            </button>
            <button 
              onClick={triggerFileSelect}
              className="flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition group"
              title="Restaurar Backup JSON"
            >
              <Upload size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              <span className="text-[9px] font-black uppercase tracking-widest">Subir</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={onRestoreBackup} 
              accept=".json" 
              className="hidden" 
            />
          </div>
        </div>

        {/* Indicador de Sincronização */}
        <div className={`p-4 rounded-2xl border transition-all ${
          lastSync?.status === 'error' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Status Cloud</p>
            <div className={`w-2 h-2 rounded-full ${
              lastSync?.status === 'syncing' ? 'bg-amber-400 animate-pulse' : 
              lastSync?.status === 'error' ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
            }`} />
          </div>
          
          <div className="flex items-center gap-2 mb-1">
             {lastSync?.status === 'syncing' ? <RefreshCw size={12} className="animate-spin text-blue-600" /> : 
              lastSync?.status === 'error' ? <CloudOff size={12} className="text-red-500" /> :
              <Cloud size={12} className="text-emerald-500" />}
             <span className="text-[9px] font-black text-slate-700 uppercase tracking-tight truncate">
               {lastSync?.status === 'syncing' ? 'Sincronizando...' : 
                lastSync?.status === 'error' ? 'Erro SharePoint' : 'SharePoint OK'}
             </span>
          </div>

          {lastSync?.status === 'error' && onRetrySync && (
            <button 
              onClick={onRetrySync}
              className="mt-2 w-full flex items-center justify-center gap-2 py-1.5 bg-red-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-700 transition shadow-lg shadow-red-100 animate-bounce"
            >
              <RefreshCw size={10} /> Sincronizar Agora
            </button>
          )}

          {lastSync && (
            <div className="space-y-1 mt-2 pt-2 border-t border-slate-200/50">
               <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-400">
                  <Clock size={10} />
                  <span>{new Date(lastSync.timestamp).toLocaleTimeString('pt-BR')}</span>
               </div>
            </div>
          )}
        </div>

        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition text-[10px] font-black uppercase tracking-widest text-red-600">
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
};

const SidebarButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center text-left gap-3 px-4 py-3.5 rounded-xl transition font-bold text-[10px] uppercase tracking-[0.15em] ${active ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : `hover:bg-slate-50 text-slate-500 hover:text-slate-700`}`}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;
