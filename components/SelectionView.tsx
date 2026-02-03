
import React from 'react';
import { LogIn, Loader2, AlertTriangle, ScrollText, ShieldCheck, ArrowRight } from 'lucide-react';

interface SelectionViewProps {
  onSelect: () => void;
  isLoading: boolean;
  errorMessage: string | null;
}

const SelectionView: React.FC<SelectionViewProps> = ({ onSelect, isLoading, errorMessage }) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-10 bg-white">
      <div className="w-full max-w-lg text-center">
        {/* Top Section: Icon and Titles */}
        <div className="mb-12 animate-in fade-in zoom-in-95 duration-700">
          <div className="inline-block p-4 bg-blue-50 rounded-2xl shadow-sm mb-6">
            <ScrollText size={32} className="text-blue-600" />
          </div>
          <h1 className="text-5xl font-black uppercase text-slate-800">
            Gestão <span className="text-blue-600">Regulatória</span>
          </h1>
          <p className="mt-4 text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" />
            Portal de Atividades • CTVacinas
          </p>
        </div>

        {/* Bottom Section: Login Card */}
        <div className="bg-slate-50/70 backdrop-blur-sm border border-slate-200/80 rounded-[2.5rem] p-12 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          {isLoading ? (
            <div className="h-[160px] flex flex-col items-center justify-center">
              <Loader2 size={40} className="animate-spin text-blue-600" />
              <p className="text-slate-400 font-bold uppercase text-[9px] tracking-[0.3em] mt-4">AUTENTICANDO...</p>
            </div>
          ) : errorMessage ? (
            <div className="h-[160px] flex flex-col items-center justify-center gap-4">
              <AlertTriangle className="text-red-500" size={32} />
              <p className="text-red-600 text-sm font-semibold">{errorMessage}</p>
              <button onClick={onSelect} className="mt-2 px-6 py-2 bg-slate-800 text-white rounded-lg text-xs font-bold">
                Tentar Novamente
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h2 className="font-bold text-slate-800 tracking-tight">BEM-VINDO AO SISTEMA</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-xs">
                Utilize suas credenciais institucionais para acessar o painel de controle e fluxos estratégicos.
              </p>
              <button
                onClick={onSelect}
                className="mt-8 bg-slate-900 hover:bg-black rounded-2xl p-4 w-full flex items-center gap-4 transition-transform active:scale-[0.98] shadow-xl"
              >
                <div className="bg-blue-600 rounded-lg p-3">
                  <ArrowRight className="text-white" size={20}/>
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-white font-bold uppercase text-sm tracking-wider">Entrar com Microsoft</span>
                  <span className="text-slate-400 text-xs uppercase tracking-wider">Conta corporativa @ctvacinas.org</span>
                </div>
              </button>
              <div className="flex items-center gap-2 mt-8">
                <div className="w-2 h-2 bg-slate-300 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
                <div className="w-2 h-2 bg-slate-200 rounded-full"></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SelectionView;
