
import React from 'react';
import { LogIn, ScrollText, ShieldCheck } from 'lucide-react';

interface SelectionViewProps {
  onSelect: () => void;
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-10 bg-white">
      <div className="w-full max-w-lg text-center space-y-12 animate-in fade-in zoom-in duration-700">
        <div className="space-y-6">
            <div className="inline-block p-6 bg-blue-50 rounded-[2.5rem] border border-blue-100 shadow-xl mb-4">
              <ScrollText size={56} className="text-blue-600" />
            </div>
            <div>
                <h1 className="text-5xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                  Gestão <span className="text-blue-600">Regulatória</span>
                </h1>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.5em] mt-6 flex items-center justify-center gap-2">
                  <ShieldCheck size={14} className="text-emerald-500" /> Portal de Atividades • CTVacinas
                </p>
            </div>
        </div>

        <div className="bg-slate-50 p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-8">
            <div className="space-y-2">
                <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">Bem-vindo ao Sistema</h2>
                <p className="text-sm text-slate-500 font-medium">Utilize suas credenciais institucionais para acessar o painel de controle e fluxos estratégicos.</p>
            </div>
            
            <button
                onClick={onSelect}
                className="group w-full p-6 bg-slate-900 rounded-2xl shadow-2xl transition-all hover:-translate-y-1 flex items-center justify-center gap-4 border border-slate-800 hover:bg-black active:scale-95"
            >
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition">
                    <LogIn size={20} />
                </div>
                <div className="text-left">
                    <h3 className="text-sm font-black text-white uppercase tracking-widest">Entrar com Microsoft</h3>
                    <p className="text-blue-300/50 text-[9px] font-black uppercase tracking-widest">Conta Corporativa @ctvacinas.org</p>
                </div>
            </button>

            <div className="pt-4 flex items-center justify-center gap-2 opacity-30">
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full"></span>
            </div>
        </div>

        <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.4em] pt-8">Sincronizado com Microsoft SharePoint 365</p>
      </div>
    </div>
  );
};

export default SelectionView;
