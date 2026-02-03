
import React from 'react';
import { LogIn } from 'lucide-react';

interface SelectionViewProps {
  onSelect: () => void;
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-brand-light">
      <div className="w-full max-w-md text-center space-y-12 animate-in-slow">
        <div>
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
              Gestão <span className="text-brand-primary">Regulatória</span>
            </h1>
            <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-4">
              Portal de Atividades • CTVacinas
            </p>
        </div>
        
        <button
            onClick={onSelect}
            className="group w-full p-6 bg-slate-800 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-4 border border-slate-700 hover:bg-black active:scale-95"
        >
            <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition">
                <LogIn size={20} />
            </div>
            <div className="text-left">
                <h3 className="text-sm font-black text-white uppercase tracking-widest">Entrar com Microsoft</h3>
                <p className="text-brand-accent/50 text-[9px] font-black uppercase tracking-widest">Conta Corporativa</p>
            </div>
        </button>
      </div>
    </div>
  );
};

export default SelectionView;
