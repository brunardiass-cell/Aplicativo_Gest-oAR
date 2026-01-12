
import React from 'react';
import { Person, ViewMode, AppUser } from '../types';
import { LayoutDashboard, ListTodo, Users, User, FolderKanban, LogOut, Home, UserPlus, History, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  selectedMember: string | 'Todos';
  onMemberChange: (member: string | 'Todos') => void;
  onGoHome: () => void;
  onLogout: () => void;
  people: Person[];
  currentUser: AppUser | null;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  selectedMember, 
  onMemberChange,
  onGoHome,
  onLogout,
  people,
  currentUser
}) => {
  const isAdmin = currentUser?.role === 'admin';

  return (
    <aside className="w-64 bg-slate-900 text-slate-400 fixed h-full flex flex-col shadow-2xl z-50 border-r border-slate-800">
      <div className="p-8">
        <div className="flex items-center gap-3 mb-10 cursor-pointer group" onClick={onGoHome}>
          <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-105">
            G
          </div>
          <div>
            <h2 className="text-white font-black text-lg leading-tight uppercase tracking-tighter">Gestão 3.0</h2>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">AR CTVacinas</p>
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
          <button 
            onClick={() => onViewChange('people')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition font-bold text-xs uppercase tracking-widest ${currentView === 'people' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/50' : 'hover:bg-white/5'}`}
          >
            <UserPlus size={18} />
            Equipe
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

      <div className="px-6 py-4 flex-1 overflow-y-auto custom-scrollbar">
        <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-4 px-4">
          Visualizar Por
        </h3>
        <div className="space-y-1">
          <button 
            onClick={() => onMemberChange('Todos')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-xs font-bold uppercase tracking-wider ${selectedMember === 'Todos' ? 'text-indigo-400' : 'hover:text-white'}`}
          >
            <Users size={16} className={selectedMember === 'Todos' ? 'text-indigo-400' : 'text-slate-700'} />
            Geral
          </button>
          {people.map(person => (
            <button 
              key={person.id}
              onClick={() => onMemberChange(person.name)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition text-xs font-bold uppercase tracking-wider ${selectedMember === person.name ? 'text-indigo-400' : 'hover:text-white'}`}
            >
              <User size={16} className={selectedMember === person.name ? 'text-indigo-400' : 'text-slate-700'} />
              {person.name}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 border-t border-slate-800">
        <button onClick={onGoHome} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition text-xs font-bold uppercase tracking-widest text-slate-400">
          <Home size={18} /> Painel Início
        </button>
        <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-500/10 transition text-xs font-bold uppercase tracking-widest text-red-500 mt-1">
          <LogOut size={18} /> Sair
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
