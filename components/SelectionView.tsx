import React from 'react';
import { LogIn, ScrollText, Loader2, AlertTriangle } from 'lucide-react';

interface SelectionViewProps {
  onSelect: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect, isLoading, errorMessage }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-[#0f172a]">
      <div className="text-center mb-20 animate-in fade-in zoom-in duration-700">
        <div className="inline-block p-6 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl mb-8">
          <ScrollText size={56} className="text-amber-500" />
        </div>
        <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none">
          Gestão de <span className="text-blue-500">Atividades</span>
        </h1>
        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-6">
          Assuntos Regulatórios • CTVacinas
        </p>
      </div>

      <div className="w-full max-w-md h-48 flex items-center justify-center">
        {isLoading ? (
            <div className="text-center animate-in fade-in duration-300">
                <Loader2 size={48} className="animate-spin text-blue-500 mx-auto" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-4">AUTENTICANDO E SINCRONIZANDO...</p>
            </div>
        ) : errorMessage ? (
            <div className="w-full p-6 bg-red-900/50 border-2 border-red-500/30 rounded-2xl text-center animate-in fade-in duration-300 flex flex-col items-center gap-4">
                <AlertTriangle className="text-red-400" size={32} />
                <p className="text-red-300 text-sm font-bold">{errorMessage}</p>
                 <button onClick={onSelect} className="mt-2 px-6 py-2 bg-slate-200 text-slate-900 rounded-lg text-xs font-bold">Tentar Novamente</button>
            </div>
        ) : (
            <button
                onClick={onSelect}
                className="group p-10 bg-white/5 rounded-[3rem] shadow-2xl transition-all hover:-translate-y-2 flex flex-col items-center text-center border border-white/10 hover:border-blue-500/30 active:scale-95 w-full"
            >
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition shadow-lg shadow-blue-500/20">
                    <LogIn size={32} />
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Entrar com Microsoft</h3>
                <p className="text-blue-400/50 text-[9px] font-black uppercase tracking-widest mt-3">Sincronizar com SharePoint</p>
            </button>
        )}
      </div>

      <div className="mt-20 opacity-30">
        <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.4em]">CTVacinas • Inteligência em Assuntos Regulatórios</p>
      </div>
    </div>
  );
};

export default SelectionView;