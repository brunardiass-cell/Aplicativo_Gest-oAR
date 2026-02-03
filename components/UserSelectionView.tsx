
import React from 'react';
import { TeamMember } from '../types';
import { Crown, LogOut, Users, Eye } from 'lucide-react';

interface UserSelectionViewProps {
  teamMembers: TeamMember[];
  onSelectUser: (user: TeamMember) => void;
  onSelectTeamView: () => void;
  onLogout: () => void;
}

const getInitials = (name: string): string => {
  const parts = name.split(' ');
  if (parts.length > 1 && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const UserSelectionView: React.FC<UserSelectionViewProps> = ({ teamMembers, onSelectUser, onSelectTeamView, onLogout }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="absolute top-6 right-6">
        <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-500 text-xs font-bold uppercase tracking-widest transition">
          <LogOut size={16}/> Sair
        </button>
      </div>
      
      <div className="w-full max-w-2xl text-center animate-in-slow">
        <h1 className="text-xl font-black text-slate-800 uppercase tracking-widest">Quem está acessando?</h1>
        <p className="text-sm text-slate-500 mt-1">Selecione seu perfil para continuar</p>

        <div className="mt-12 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {teamMembers.filter(m => m.status === 'active').map(member => (
              <button 
                key={member.id} 
                onClick={() => onSelectUser(member)}
                className="group flex flex-col items-center gap-3 p-4 rounded-2xl hover:bg-slate-50 transition"
              >
                <div className="relative">
                  <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-2xl font-black text-brand-primary group-hover:scale-105 transition-transform">
                    {getInitials(member.name)}
                  </div>
                  {member.role === 'Admin' && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 p-1.5 rounded-full text-white border-2 border-white">
                      <Crown size={12} />
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="font-bold text-slate-800">{member.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{member.jobTitle}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <button 
          onClick={onSelectTeamView}
          className="mt-8 w-full py-5 bg-brand-primary text-white rounded-2xl font-bold uppercase text-sm tracking-widest flex items-center justify-center gap-3 hover:bg-brand-accent transition shadow-lg shadow-teal-500/20"
        >
          <Eye size={20} /> Visão Geral da Equipe
        </button>
      </div>
    </div>
  );
};

export default UserSelectionView;
