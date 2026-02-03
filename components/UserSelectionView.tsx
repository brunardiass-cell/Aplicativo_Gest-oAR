
import React, { useState } from 'react';
import { TeamMember, Task } from '../types';
import { DEFAULT_TEAM_MEMBERS } from '../constants';
import { Crown, Eye, ShieldCheck, Bell, FileText, LogOut } from 'lucide-react';
import ReportView from './ReportView';

interface UserSelectionViewProps {
  tasks: Task[];
  onSelectUser: (user: TeamMember) => void;
  onSelectTeamView: () => void;
  onLogout: () => void;
}

const UserSelectionView: React.FC<UserSelectionViewProps> = ({ tasks, onSelectUser, onSelectTeamView, onLogout }) => {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const teamMembers = DEFAULT_TEAM_MEMBERS; // Esta tela sempre mostra a lista padrão

  return (
    <div className="relative min-h-screen w-full bg-white text-slate-800 p-8 font-sans flex flex-col items-center justify-center">
      <header className="absolute top-8 left-8">
        <h1 className="text-4xl font-black uppercase text-slate-900">
          Gestão <span className="text-teal-500">Regulatória</span>
        </h1>
        <p className="mt-2 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={14} className="text-teal-500" />
          Portal de Atividades • CTVacinas
        </p>
      </header>

      <div className="absolute top-8 right-8 flex items-center gap-6">
        <button onClick={() => setIsReportOpen(true)} title="Gerar Relatório Mensal" className="text-slate-400 cursor-pointer hover:text-slate-600 transition">
          <FileText size={22} />
        </button>
        <button onClick={onLogout} title="Sair" className="text-slate-400 cursor-pointer hover:text-red-500 transition">
          <LogOut size={22}/>
        </button>
      </div>

      <main className="w-full max-w-2xl animate-in fade-in duration-500 mt-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">Quem está acessando?</h2>
          <p className="text-slate-500 font-medium text-sm mt-1">Selecione seu perfil para continuar</p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 w-full">
          {teamMembers.map(member => (
            <button
              key={member.id}
              onClick={() => onSelectUser(member)}
              className="group relative flex flex-col items-center justify-center p-6 bg-gray-50 border border-gray-100 rounded-2xl aspect-square hover:bg-white hover:border-gray-200 hover:-translate-y-1 transition-all duration-300 shadow-sm"
            >
              {member.isLeader && (
                <div className="absolute top-4 right-4 text-yellow-500">
                  <Crown size={16} strokeWidth={2.5} />
                </div>
              )}
              <div className="w-16 h-16 mb-4 bg-teal-500 rounded-full flex items-center justify-center text-3xl font-black text-white group-hover:bg-teal-600 transition-colors">
                {member.name.charAt(0)}
              </div>
              <h2 className="font-bold text-slate-800 uppercase tracking-tight text-sm text-center">{member.name}</h2>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">{member.role}</p>
            </button>
          ))}
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={onSelectTeamView}
            className="mt-12 flex items-center gap-3 px-10 py-4 bg-teal-500 text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20 active:scale-95"
          >
            <Eye size={18} /> Visão Geral da Equipe
          </button>
        </div>
      </main>

      {isReportOpen && (
         <ReportView 
           isOpen={isReportOpen}
           onClose={() => setIsReportOpen(false)}
           tasks={tasks}
           userName="Geral"
         />
      )}
    </div>
  );
};

export default UserSelectionView;
