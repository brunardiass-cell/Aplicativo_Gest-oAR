import React, { useState } from 'react';
import { 
  FolderKanban, 
  Shield, 
  ShieldCheck,
  Syringe, 
  LogOut, 
  Layers, 
  Building2, 
  UserCheck, 
  ChevronRight, 
  ChevronDown,
  Users, 
  HelpCircle, 
  CheckCircle2, 
  Database, 
  Settings, 
  Sliders,
  BookOpen,
  X,
  ArrowRight
} from 'lucide-react';

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
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isEnvMenuOpen, setIsEnvMenuOpen] = useState(false);
  const [activeTabAdmin, setActiveTabAdmin] = useState<'permissions' | 'modules' | 'audit'>('permissions');

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-800 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-emerald-600 selection:text-white">
      
      {/* 1. Header Superior (Logo CTVacinas + Dropdown Ambiente de Trabalho) */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between py-2">
        {/* Logo CTVacinas */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700 shadow-xs">
            <ShieldCheck size={22} className="text-emerald-600" />
          </div>
          <span className="text-2xl font-black text-slate-900 tracking-tight">
            CTVacinas
          </span>
        </div>

        {/* Menu do Ambiente de Trabalho / Usuário */}
        <div className="relative">
          <button
            onClick={() => setIsEnvMenuOpen(!isEnvMenuOpen)}
            className="flex items-center gap-3 bg-white px-3.5 py-2 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-500/50 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Layers size={15} />
            </div>
            <div className="text-left hidden sm:block">
              <span className="text-[10px] text-slate-400 font-medium leading-none block">Ambiente de trabalho</span>
              <span className="text-xs font-bold text-emerald-700 leading-tight block">Produção</span>
            </div>
            <ChevronDown size={14} className={`text-slate-400 transition-transform ${isEnvMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Menu Dropdown com Logout & Informações da Conta */}
          {isEnvMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-30 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 mb-2">
                <p className="text-xs font-bold text-slate-900">{accountName || 'Usuário Autenticado'}</p>
                {accountEmail && <p className="text-[11px] text-slate-500 truncate">{accountEmail}</p>}
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[10px] font-bold">
                  Sessão Ativa Microsoft
                </span>
              </div>
              <button
                onClick={onLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
              >
                <LogOut size={15} />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* 2. Conteúdo Central */}
      <main className="max-w-5xl w-full mx-auto my-auto py-8 sm:py-12 space-y-8">
        
        {/* Título e Subtítulo */}
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Escolha um módulo para continuar
          </h1>
          <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
            Cada módulo opera de forma independente com suas próprias regras, permissões e dados isolados.
          </p>
        </div>

        {/* Grid de 3 Cards dos Módulos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Gestão de Projetos */}
          <div 
            onClick={() => onSelectModule('activities_projects')}
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <FolderKanban size={22} />
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition">
                Gestão de Projetos
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Gerencie projetos, tarefas, prazos, equipes e responsabilidades.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
              <span className="flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Entrar no módulo <ArrowRight size={15} />
              </span>
            </div>
          </div>

          {/* Card 2: Normas Regulatórias */}
          <div 
            onClick={() => onSelectModule('regulatory_standards')}
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Shield size={22} />
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition">
                Normas Regulatórias
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Consulte e acompanhe RDCs, Instruções Normativas, ISO e diretrizes técnicas.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
              <span className="flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Entrar no módulo <ArrowRight size={15} />
              </span>
            </div>
          </div>

          {/* Card 3: Vacinas e Componentes */}
          <div 
            onClick={() => onSelectModule('vaccines_components')}
            className="group bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs hover:shadow-md hover:border-emerald-500/50 transition-all duration-200 flex flex-col justify-between cursor-pointer"
          >
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                <Syringe size={22} />
              </div>

              <h2 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-emerald-700 transition">
                Vacinas e Componentes
              </h2>

              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Gerencie candidatos vacinais, antígenos, adjuvantes, vetores e lotes de formulação.
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-slate-100 flex items-center text-xs font-bold text-emerald-600 group-hover:text-emerald-700">
              <span className="flex items-center gap-1.5 group-hover:gap-2.5 transition-all">
                Entrar no módulo <ArrowRight size={15} />
              </span>
            </div>
          </div>

        </div>

        {/* 3. Área do Administrador Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Área do administrador
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Gerencie perfis, permissões e níveis de acesso do sistema.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 font-semibold text-xs sm:text-sm hover:bg-emerald-50 transition flex items-center gap-2 shrink-0 self-stretch sm:self-auto justify-center"
          >
            <Settings size={16} />
            <span>Acessar painel administrativo</span>
          </button>
        </div>

        {/* 4. Como utilizar o sistema Accordion */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all">
          <button
            onClick={() => setIsTutorialOpen(!isTutorialOpen)}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-slate-50/50 transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <HelpCircle size={20} />
              </div>
              <span className="font-bold text-base text-slate-900">
                Como utilizar o sistema
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs sm:text-sm">
              <span>{isTutorialOpen ? 'Ocultar tutorial' : 'Mostrar tutorial'}</span>
              <ChevronDown size={16} className={`transition-transform duration-200 ${isTutorialOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Conteúdo do Tutorial Expansível */}
          {isTutorialOpen && (
            <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/40">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Seleção do Módulo</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Escolha no painel o ambiente que corresponde à sua atividade diária. Os dados e permissões são mantidos de forma isolada.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Acesso por Perfil</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    No módulo de projetos, selecione seu nome e informe a senha cadastrada para visualizar suas tarefas e responsabilidades.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Cadastros e Filtros</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Utilize as ferramentas de criação de itens, lote de formulações ou busca por normas regulatórias da ANVISA.
                  </p>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200/70">
                  <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center mb-2.5">
                    4
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">Nuvem e Backup</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Todas as informações são salvas automaticamente na nuvem, com opção de download de cópia de segurança em formato JSON.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* 5. Footer */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
        {/* Esquerda: Centro de Tecnologia em Vacinas - UFMG */}
        <div className="flex items-center gap-2.5">
          <Building2 size={18} className="text-slate-400" />
          <div>
            <p className="text-slate-600 font-medium">Centro de Tecnologia em Vacinas – UFMG</p>
            <p className="font-bold text-emerald-700 leading-none">CTVacinas</p>
          </div>
        </div>

        {/* Direita: Autenticação Microsoft */}
        <div className="flex items-center gap-2.5 text-right">
          <div className="text-left sm:text-right">
            <p className="font-bold text-slate-700 flex items-center gap-1 sm:justify-end">
              <ShieldCheck size={15} className="text-emerald-600 inline" /> Autenticação Microsoft
            </p>
            <p className="text-[11px] text-slate-400">Versão 2.3.1 • Produção</p>
          </div>
        </div>
      </footer>

      {/* MODAL DO PAINEL DE ADMINISTRAÇÃO */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                <Users size={22} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 block">PAINEL ADMINISTRATIVO</span>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  Gestão de Perfis e Níveis de Acesso
                </h3>
              </div>
            </div>

            {/* Abas do Admin Modal */}
            <div className="flex border-b border-slate-200 mb-6 gap-4">
              <button
                onClick={() => setActiveTabAdmin('permissions')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTabAdmin === 'permissions'
                    ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Permissões
              </button>
              <button
                onClick={() => setActiveTabAdmin('modules')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTabAdmin === 'modules'
                    ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Status dos Módulos
              </button>
              <button
                onClick={() => setActiveTabAdmin('audit')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTabAdmin === 'audit'
                    ? 'text-emerald-700 border-b-2 border-emerald-700 font-bold'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Auditoria & Segurança
              </button>
            </div>

            {/* Conteúdo das Abas */}
            {activeTabAdmin === 'permissions' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 mb-3">
                  Configuração de regras de acesso independente para cada módulo cadastrado:
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Gestão de Projetos</p>
                      <p className="text-[11px] text-slate-500">Acesso via login por perfil individual de membro da equipe</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      Perfil Ativo
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Normas Regulatórias</p>
                      <p className="text-[11px] text-slate-500">Consulta livre de RDCs e ISOs com restrição de edição para líderes</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      Leitura / Liderança
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Vacinas e Componentes</p>
                      <p className="text-[11px] text-slate-500">Gestão de bancada P&D e registro de lotes de formulação</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold">
                      Acesso Científico
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTabAdmin === 'modules' && (
              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold">
                    <CheckCircle2 size={16} className="text-emerald-700" />
                    <span>Módulos Operacionais</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Todos os 3 módulos estão salvos na nuvem e integrados à conta Microsoft do CTVacinas.
                  </p>
                </div>
              </div>
            )}

            {activeTabAdmin === 'audit' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Sincronização Nuvem</span>
                  <span className="font-bold text-emerald-700">Ativa</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Autenticação Microsoft Graph</span>
                  <span className="font-bold text-emerald-700">Ok</span>
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ModuleSelectionView;
