
import React from 'react';
import { Person, ViewMode, AppUser } from '../types';
import { LayoutDashboard, ListTodo, FolderKanban, LogOut, Home, ShieldCheck, History, Database, Cloud } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedMember: string | 'Todos';
  onMemberChange: (member: string | 'Todos') => void;
  onGoHome: () => void;
  onLogout: () => void;
  people: Person[];
  currentUser: AppUser | null;
  availableUsers: string[];
  isCloudActive: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onGoHome,
  onLogout,
  currentUser,
  isCloudActive
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 fixed h-full flex flex-col shadow-2xl z-50 border-r border-slate-800">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 cursor-pointer group" onClick={onGoHome}>
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-105">
            P
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tighter">Gestão PAR</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Plataforma AR</p>
          </div>
        </div>

        <nav className="space-y-1.5">
          <button 
            onClick={() => onViewChange('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest ${currentView === 'dashboard' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'hover:bg-white/5'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => onViewChange('tasks')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest ${currentView === 'tasks' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'hover:bg-white/5'}`}
          >
            <ListTodo size={18} />
            Atividades
          </button>
          <button 
            onClick={() => onViewChange('projects')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest ${currentView === 'projects' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'hover:bg-white/5'}`}
          >
            <FolderKanban size={18} />
            Projetos
          </button>
          
          <div className="my-4 border-t border-white/5"></div>
          
          {isAdmin && (
            <>
              <button 
                onClick={() => onViewChange('access-control')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest ${currentView === 'access-control' ? 'bg-amber-600 text-white shadow-md shadow-amber-900/50' : 'hover:bg-amber-500/10 text-amber-500/80'}`}
              >
                <ShieldCheck size={18} />
                Controle Acesso
              </button>
              <button 
                onClick={() => onViewChange('logs')}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest ${currentView === 'logs' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'hover:bg-red-500/10 text-slate-500'}`}
              >
                <History size={18} />
                Auditoria
              </button>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto px-6 py-4 border-t border-slate-800">
        <div className={`rounded-xl p-4 mb-4 ${isCloudActive ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/50 border border-slate-700'}`}>
           <div className={`flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] mb-1 ${isCloudActive ? 'text-emerald-500' : 'text-slate-500'}`}>
             {isCloudActive ? <Cloud size={10} /> : <Database size={10} />}
             {isCloudActive ? 'Nuvem Ativa' : 'Modo Local'}
           </div>
           <p className={`text-[10px] font-bold uppercase ${isCloudActive ? 'text-emerald-400' : 'text-slate-400'}`}>
             {isCloudActive ? 'SharePoint Sinc' : 'Banco Offline'}
           </p>
        </div>
        
        <button onClick={onGoHome} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Home size={18} /> Início
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition text-[10px] font-black uppercase tracking-widest text-red-500 mt-1">
          <LogOut size={18} /> Sair do Painel
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
