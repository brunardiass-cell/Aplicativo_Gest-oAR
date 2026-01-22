
import React from 'react';
import { TeamMember } from '../types';
import { User, Users, ScrollText } from 'lucide-react';

interface SelectionViewProps {
  members: TeamMember[];
  onSelect: (member: TeamMember | 'Todos') => void;
}

const SelectionView: React.FC<SelectionViewProps> = ({ members, onSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#0f172a]">
      <div className="text-center mb-20 animate-in fade-in zoom-in duration-700">
        <div className="inline-block p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl mb-8">
          <ScrollText size={56} className="text-amber-400" />
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
          Gestão de <span className="text-blue-500">Atividades</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.5em] mt-6">
          Assuntos Regulatórios • CTVacinas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-5xl">
        {/* Botão Equipe Geral - Azul Marinho Forte e Ícone Dourado */}
        <button
          onClick={() => onSelect('Todos')}
          className="group p-10 bg-[#1a2b4e] rounded-[3rem] shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center border border-white/10 hover:border-amber-400/30 active:scale-95"
        >
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-amber-400 mb-6 group-hover:scale-110 transition shadow-inner">
            <Users size={32} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Equipe Geral</h3>
          <p className="text-blue-200/50 text-[9px] font-black uppercase tracking-widest mt-3">Visão Estratégica</p>
        </button>

        {/* Mapeamento de Membros */}
        {members.map((member) => {
          const isGold = member.isLeader;
          
          return (
            <button
              key={member.id}
              onClick={() => onSelect(member)}
              className="group p-10 bg-[#1a2b4e] rounded-[3rem] shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center border border-white/10 hover:border-blue-400/30 active:scale-95"
            >
              <div className={`w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center ${isGold ? 'text-amber-400' : 'text-blue-100/30'} mb-6 group-hover:scale-110 transition shadow-inner`}>
                <User size={32} />
              </div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">{member.name}</h3>
              <p className="text-blue-200/50 text-[9px] font-black uppercase tracking-widest mt-3">{member.role}</p>
            </button>
          );
        })}
      </div>

      <div className="mt-20 opacity-30">
        <p className="text-white text-[9px] font-black uppercase tracking-[0.4em]">CTVacinas • Inteligência em Assuntos Regulatórios</p>
      </div>
    </div>
  );
};

export default SelectionView;
