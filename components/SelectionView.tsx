
import React from 'react';
import { LogIn, ScrollText } from 'lucide-react';

interface SelectionViewProps {
  onSelect: () => void;
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect }) => {
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

      <div className="w-full max-w-md">
        <button
          onClick={onSelect}
          className="group p-10 bg-[#1a2b4e] rounded-[3rem] shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center border border-white/10 hover:border-blue-400/30 active:scale-95 w-full"
        >
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-blue-400 mb-6 group-hover:scale-110 transition shadow-inner">
            <LogIn size={32} />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tight">Entrar com Microsoft</h3>
          <p className="text-blue-200/50 text-[9px] font-black uppercase tracking-widest mt-3">Sincronizar com SharePoint</p>
        </button>
      </div>

      <div className="mt-20 opacity-30">
        <p className="text-white text-[9px] font-black uppercase tracking-[0.4em]">CTVacinas • Inteligência em Assuntos Regulatórios</p>
      </div>
    </div>
  );
};

export default SelectionView;
