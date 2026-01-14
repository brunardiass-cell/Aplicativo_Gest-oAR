
import React from 'react';
import { Person, ViewMode, AppUser } from '../types';
import { LayoutDashboard, ListTodo, Users, User, FolderKanban, LogOut, Home, ShieldCheck, ChevronDown, History } from 'lucide-react';

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
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  selectedMember, 
  onMemberChange,
  onGoHome,
  onLogout,
  currentUser,
  availableUsers
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const hasGlobalView = currentUser?.role === 'admin' || currentUser?.canViewAll;

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 fixed h-full flex flex-col shadow-2xl z-50 border-r border-slate-800">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 cursor-pointer group" onClick={onGoHome}>
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-105">
            A
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tighter">Assuntos Regulatórios</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Equipe PAR</p>
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

      <div className="px-6 py-4 flex-1">
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-4">
          Visualizar Setor
        </h3>
        
        {hasGlobalView ? (
          <div className="px-4 relative group">
            <select 
              value={selectedMember}
              onChange={(e) => onMemberChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest outline-none appearance-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todos">Toda a Equipe</option>
              {availableUsers.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
        ) : (
          <div className="px-4">
            <div className="w-full bg-slate-800/50 border border-slate-700/50 text-indigo-400 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-3">
              <User size={16} />
              {currentUser?.username}
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-slate-800">
        <button onClick={onGoHome} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition text-[10px] font-black uppercase tracking-widest text-slate-400">
          <Home size={18} /> Início
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition text-[10px] font-black uppercase tracking-widest text-red-500 mt-1">
          <LogOut size={18} /> Sair do Sistema
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
