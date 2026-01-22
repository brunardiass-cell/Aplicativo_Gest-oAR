
import React from 'react';
import { ViewMode, AppUser } from '../types';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  ShieldCheck, 
  History, 
  LogOut, 
  Home 
} from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  onGoHome: () => void;
  onLogout: () => void;
  currentUser: AppUser | null;
  notificationCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onGoHome,
  onLogout,
  currentUser,
  notificationCount
}) => {
  return (
    <aside className="w-64 bg-brand-dark text-slate-400 fixed h-full flex flex-col shadow-2xl z-50 border-r border-white/5">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-12 cursor-pointer group" onClick={onGoHome}>
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-900/40">
            AR
          </div>
          <div>
            <h2 className="text-white font-black text-sm leading-tight uppercase tracking-tight">CTVACINAS</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Regulatório</p>
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
          {currentUser?.username === 'Graziella' && (
             <SidebarButton 
              active={currentView === 'quality'} 
              onClick={() => onViewChange('quality')} 
              icon={<ShieldCheck size={18} />} 
              label="Controle de Acesso" 
            />
          )}
          {currentUser?.username === 'Graziella' && (
            <SidebarButton 
              active={currentView === 'traceability'} 
              onClick={() => onViewChange('traceability')} 
              icon={<History size={18} />} 
              label="Rastreabilidade" 
            />
          )}
        </nav>
      </div>

      <div className="mt-auto px-6 py-6 border-t border-white/5 space-y-2">
        <div className="px-4 py-2 mb-4 bg-white/5 rounded-2xl border border-white/5">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Usuário Atual</p>
          <p className="text-xs font-bold text-white truncate">{currentUser?.username}</p>
        </div>
        <button onClick={onGoHome} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Home size={18} /> Início
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition text-[10px] font-black uppercase tracking-widest text-red-500">
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
};

const SidebarButton = ({ active, onClick, icon, label }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center text-left gap-3 px-4 py-3.5 rounded-xl transition font-bold text-[10px] uppercase tracking-[0.15em] ${active ? 'bg-white/10 text-white border border-white/10 shadow-lg' : `hover:bg-white/5 text-slate-400`}`}
  >
    {icon}
    {label}
  </button>
);

export default Sidebar;
