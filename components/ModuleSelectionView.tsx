import React from 'react';
import { FolderKanban, ShieldCheck, Syringe, LogOut, Layers, Building2, UserCheck, ChevronRight } from 'lucide-react';

interface ModuleSelectionViewProps {
  onSelectModule: (module: 'activities_projects' | 'regulatory_standards' | 'vaccines_components') => void;
  onLogout: () => void;
  accountName?: string;
  accountEmail?: string;
}

const ModuleSelectionView: React.FC<ModuleSelectionViewProps> = ({
  onSelectModule,
  onLogout,
  accountName,
  accountEmail
}) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-brand-primary selection:text-white">
      {/* Top Header */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-brand-primary flex items-center justify-center text-white font-black text-lg shadow-lg shadow-teal-500/20">
            CTV
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-400 block">SISTEMA CTVACINAS</span>
            <h1 className="text-lg font-black tracking-tight text-white uppercase">Portal Multimódulos</h1>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-800/80 px-4 py-2 rounded-2xl border border-slate-700/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-teal-400 font-bold text-xs border border-slate-600">
              <UserCheck size={16} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-white leading-none">{accountName || 'Usuário Autenticado'}</p>
              {accountEmail && <p className="text-[10px] text-slate-400 mt-0.5 leading-none">{accountEmail}</p>}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-700 mx-1"></div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-red-400 transition uppercase tracking-wider"
            title="Sair da Conta Microsoft"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl w-full mx-auto my-auto py-10 sm:py-16">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/20 text-teal-400 text-xs font-bold uppercase tracking-widest mb-4">
            <Layers size={14} /> Seleção de Módulo de Trabalho
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase">
            Escolha o Módulo do CTVacinas
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base leading-relaxed">
            Selecione o módulo que deseja acessar para iniciar suas atividades. Você poderá navegar entre os módulos a qualquer momento no menu do sistema.
          </p>
        </div>

        {/* Modules Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1: Gestão de Atividades e Projetos */}
          <div 
            onClick={() => onSelectModule('activities_projects')}
            className="group relative bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 hover:border-brand-primary rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-brand-primary/10 hover:-translate-y-1"
          >
            <div className="absolute top-6 right-6">
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-500/10 text-teal-300 border border-teal-500/20">
                Acesso com Perfil
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-brand-primary/20 text-brand-primary border border-brand-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-brand-primary group-hover:text-white transition-all duration-300 shadow-md">
                <FolderKanban size={28} />
              </div>

              <h3 className="text-xl font-black text-white group-hover:text-teal-300 transition mb-2">
                Gestão de Atividades e Projetos
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Painel central de controle das atividades da equipe, prazos, acompanhamento de projetos, cronogramas e responsabilidades.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-black uppercase tracking-wider text-brand-primary group-hover:text-white">
              <span>Acessar Módulo</span>
              <div className="w-8 h-8 rounded-xl bg-slate-700 group-hover:bg-brand-primary flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* Card 2: Normas Regulatórias */}
          <div 
            onClick={() => onSelectModule('regulatory_standards')}
            className="group relative bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-6 right-6">
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Regulatório • ANVISA
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-md">
                <ShieldCheck size={28} />
              </div>

              <h3 className="text-xl font-black text-white group-hover:text-emerald-300 transition mb-2">
                Módulo de Normas Regulatórias
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Consulta, cadastro e acompanhamento de RDCs, Instruções Normativas, ISO e diretrizes de conformidade técnico-científica.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-400 group-hover:text-white">
              <span>Acessar Módulo</span>
              <div className="w-8 h-8 rounded-xl bg-slate-700 group-hover:bg-emerald-600 flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* Card 3: Vacinas e Componentes */}
          <div 
            onClick={() => onSelectModule('vaccines_components')}
            className="group relative bg-slate-800/60 hover:bg-slate-800/90 border border-slate-700/80 hover:border-teal-400 rounded-3xl p-6 sm:p-8 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-teal-400/10 hover:-translate-y-1"
          >
            <div className="absolute top-6 right-6">
              <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-400/10 text-teal-300 border border-teal-400/20">
                P&D • Biotecnologia
              </span>
            </div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-md">
                <Syringe size={28} />
              </div>

              <h3 className="text-xl font-black text-white group-hover:text-teal-300 transition mb-2">
                Módulo de Vacinas e Componentes
              </h3>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Gestão de candidatos vacinais em desenvolvimento, antígenos, adjuvantes, vetores e controle de lotes de formulação.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-700/60 flex items-center justify-between text-xs font-black uppercase tracking-wider text-teal-300 group-hover:text-white">
              <span>Acessar Módulo</span>
              <div className="w-8 h-8 rounded-xl bg-slate-700 group-hover:bg-teal-600 flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-800 text-center flex flex-col sm:flex-row items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest gap-2">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-slate-400" />
          <span>Centro de Tecnologia em Vacinas • CTVacinas UFMG</span>
        </div>
        <div>
          <span>Ambiente Autenticado Microsoft</span>
        </div>
      </footer>
    </div>
  );
};

export default ModuleSelectionView;
