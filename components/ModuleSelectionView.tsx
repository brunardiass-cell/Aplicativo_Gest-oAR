import React, { useState } from 'react';
import { 
  FolderKanban, 
  ShieldCheck, 
  Syringe, 
  LogOut, 
  Layers, 
  Building2, 
  UserCheck, 
  ChevronRight, 
  Shield, 
  Users, 
  HelpCircle, 
  CheckCircle2, 
  Database, 
  Lock, 
  Settings, 
  Info,
  BookOpen,
  Sliders,
  Sparkles,
  X
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
  const [activeTabAdmin, setActiveTabAdmin] = useState<'permissions' | 'modules' | 'audit'>('permissions');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between p-4 sm:p-8 font-sans selection:bg-teal-600 selection:text-white">
      {/* Header Superior Limpo */}
      <header className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-700 flex items-center justify-center text-white font-black text-lg shadow-md shadow-teal-700/20">
            CTV
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-700 block">SISTEMA CTVACINAS</span>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">Portal Multimódulos</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-700 font-bold text-xs border border-teal-100">
              <UserCheck size={16} />
            </div>
            <div className="text-left hidden sm:block">
              <p className="text-xs font-bold text-slate-800 leading-none">{accountName || 'Usuário Autenticado'}</p>
              {accountEmail && <p className="text-[10px] text-slate-500 mt-0.5 leading-none">{accountEmail}</p>}
            </div>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1"></div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-red-600 transition uppercase tracking-wider"
            title="Sair da Conta Microsoft"
          >
            <LogOut size={16} />
            <span className="hidden md:inline">Sair</span>
          </button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="max-w-6xl w-full mx-auto my-auto py-8 sm:py-12">
        {/* Título do Portal */}
        <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-800 text-xs font-bold uppercase tracking-widest mb-3">
            <Layers size={14} /> Seleção de Ambiente de Trabalho
          </div>
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight uppercase">
            Escolha o Módulo do CTVacinas
          </h2>
          <p className="mt-2 text-slate-600 text-xs sm:text-sm leading-relaxed">
            Selecione o módulo que deseja acessar. Cada módulo opera de forma independente com suas próprias regras, permissões e dados isolados.
          </p>
        </div>

        {/* Grid dos Módulos Principais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-12">
          {/* Módulo 1: Gestão de Atividades e Projetos */}
          <div 
            onClick={() => onSelectModule('activities_projects')}
            className="group relative bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-teal-500 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-6 right-6">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                Acesso com Perfil
              </span>
            </div>

            <div>
              <div className="w-13 h-13 rounded-2xl bg-teal-600/10 text-teal-700 border border-teal-200 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <FolderKanban size={26} />
              </div>

              <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition mb-2">
                Gestão de Atividades e Projetos
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Painel central de controle das atividades da equipe, prazos, acompanhamento de projetos, cronogramas e atribuição de responsabilidades.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black uppercase tracking-wider text-teal-700 group-hover:text-teal-800">
              <span>Acessar Módulo</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* Módulo 2: Normas Regulatórias */}
          <div 
            onClick={() => onSelectModule('regulatory_standards')}
            className="group relative bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-emerald-500 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-6 right-6">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                Regulatório • ANVISA
              </span>
            </div>

            <div>
              <div className="w-13 h-13 rounded-2xl bg-emerald-600/10 text-emerald-700 border border-emerald-200 flex items-center justify-center mb-5 group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <ShieldCheck size={26} />
              </div>

              <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-700 transition mb-2">
                Módulo de Normas Regulatórias
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Consulta, cadastro e acompanhamento de RDCs, Instruções Normativas, ISO e diretrizes de conformidade técnico-científica.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black uppercase tracking-wider text-emerald-700 group-hover:text-emerald-800">
              <span>Acessar Módulo</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>

          {/* Módulo 3: Vacinas e Componentes */}
          <div 
            onClick={() => onSelectModule('vaccines_components')}
            className="group relative bg-white hover:bg-slate-50/80 border border-slate-200/90 hover:border-teal-500 rounded-3xl p-6 sm:p-7 transition-all duration-300 flex flex-col justify-between cursor-pointer shadow-sm hover:shadow-xl hover:shadow-teal-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-6 right-6">
              <span className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider bg-teal-50 text-teal-700 border border-teal-200">
                P&D • Biotecnologia
              </span>
            </div>

            <div>
              <div className="w-13 h-13 rounded-2xl bg-teal-600/10 text-teal-700 border border-teal-200 flex items-center justify-center mb-5 group-hover:bg-teal-600 group-hover:text-white transition-all duration-300 shadow-sm">
                <Syringe size={26} />
              </div>

              <h3 className="text-lg font-black text-slate-900 group-hover:text-teal-700 transition mb-2">
                Módulo de Vacinas e Componentes
              </h3>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Gestão de candidatos vacinais em desenvolvimento, antígenos, adjuvantes, vetores e controle de lotes de formulação.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-black uppercase tracking-wider text-teal-700 group-hover:text-teal-800">
              <span>Acessar Módulo</span>
              <div className="w-8 h-8 rounded-xl bg-slate-100 group-hover:bg-teal-600 group-hover:text-white flex items-center justify-center transition-all">
                <ChevronRight size={18} />
              </div>
            </div>
          </div>
        </div>

        {/* PARTE DE ADMINISTRADOR / GOVERNANÇA */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-lg mb-12 border border-slate-700/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-black uppercase tracking-widest">
              <Shield size={13} /> Área de Administração do Sistema
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
              Gestão de Acessos e Níveis de Permissão
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Administre os perfis cadastrados, controle quais membros têm permissão para criar, editar ou excluir registros em cada um dos módulos do CTVacinas.
            </p>
          </div>

          <button
            onClick={() => setIsAdminModalOpen(true)}
            className="px-5 py-3 bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl transition flex items-center gap-2.5 shadow-md shrink-0"
          >
            <Settings size={16} />
            <span>Painel de Administração</span>
          </button>
        </div>

        {/* PARTE DE ENSINAMENTO / GUIA RÁPIDO DE USO DO SITE */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100">
              <BookOpen size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 block">GUIA E TUTORIAL</span>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                Como utilizar o Sistema CTVacinas
              </h3>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-600 mb-8 leading-relaxed">
            Siga os passos abaixo para entender o funcionamento integrado e independente dos módulos do portal:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Passo 1 */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-sm">
                  1
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <Layers size={15} className="text-teal-600" />
                  Escolha o Módulo
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Selecione no menu principal o módulo de acordo com sua demanda: <strong>Projetos</strong>, <strong>Normas ANVISA</strong> ou <strong>Vacinas/Insumos</strong>.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Módulos Isolados
              </div>
            </div>

            {/* Passo 2 */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-sm">
                  2
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <UserCheck size={15} className="text-teal-600" />
                  Selecione seu Perfil
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  No módulo de Atividades, informe seu nome/perfil e senha. Isso define quais tarefas e relatórios pertencem à sua liderança ou equipe.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Acesso Seguro
              </div>
            </div>

            {/* Passo 3 */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-sm">
                  3
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <Sliders size={15} className="text-teal-600" />
                  Gerencie Registros
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Crie tarefas com prioridades, adicione componentes biológicos, controle lotes de formulação ou consulte legislações com filtros rápidos.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Ações em Tempo Real
              </div>
            </div>

            {/* Passo 4 */}
            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/60 flex flex-col justify-between">
              <div>
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white font-black text-xs flex items-center justify-center mb-3 shadow-sm">
                  4
                </div>
                <h4 className="text-sm font-bold text-slate-900 mb-1.5 flex items-center gap-2">
                  <Database size={15} className="text-teal-600" />
                  Salva & Sincroniza
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Suas atualizações são mantidas automaticamente na nuvem. Você também pode exportar e carregar arquivos de backup JSON no menu lateral.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200/60 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Backup Integrado
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DO PAINEL DE ADMINISTRAÇÃO */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-teal-50 text-teal-700 rounded-2xl border border-teal-100">
                <Shield size={24} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-700 block">PAINEL DE CONTROLE</span>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  Administração & Permissões dos Módulos
                </h3>
              </div>
            </div>

            {/* Abas do Admin Modal */}
            <div className="flex border-b border-slate-200 mb-6 gap-4">
              <button
                onClick={() => setActiveTabAdmin('permissions')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTabAdmin === 'permissions'
                    ? 'text-teal-700 border-b-2 border-teal-700 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Permissões dos Módulos
              </button>
              <button
                onClick={() => setActiveTabAdmin('modules')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTabAdmin === 'modules'
                    ? 'text-teal-700 border-b-2 border-teal-700 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Status dos Módulos
              </button>
              <button
                onClick={() => setActiveTabAdmin('audit')}
                className={`pb-3 text-xs font-bold uppercase tracking-wider transition ${
                  activeTabAdmin === 'audit'
                    ? 'text-teal-700 border-b-2 border-teal-700 font-black'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                Segurança & Logs
              </button>
            </div>

            {/* Conteúdo das Abas */}
            {activeTabAdmin === 'permissions' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-600 mb-3">
                  Configuração de regras de acesso independente para cada um dos módulos cadastrados:
                </p>
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Gestão de Atividades e Projetos</p>
                      <p className="text-[11px] text-slate-500">Exige login e seleção de perfil (Graziella, Bruna, Ester, etc.)</p>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[10px] font-bold uppercase">
                      Perfil Requerido
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Módulo de Normas Regulatórias</p>
                      <p className="text-[11px] text-slate-500">Consulta aberta / Edição restrita ao comitê gestor e líderes</p>
                    </div>
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold uppercase">
                      Liderança / Leitura
                    </span>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Módulo de Vacinas e Componentes</p>
                      <p className="text-[11px] text-slate-500">Acesso a formulários biológicos e de formulações de lotes</p>
                    </div>
                    <span className="px-2.5 py-1 bg-teal-100 text-teal-800 rounded-lg text-[10px] font-bold uppercase">
                      P&D / Científico
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTabAdmin === 'modules' && (
              <div className="space-y-4 text-xs text-slate-600">
                <div className="p-4 bg-teal-50/60 rounded-2xl border border-teal-200 space-y-2">
                  <div className="flex items-center gap-2 text-teal-900 font-bold">
                    <CheckCircle2 size={16} className="text-teal-700" />
                    <span>Módulos Ativos e Operacionais</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Todos os 3 módulos estão integrados ao sistema de backup local e à conta autenticada do Microsoft Graph.
                  </p>
                </div>
              </div>
            )}

            {activeTabAdmin === 'audit' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Sincronização em Tempo Real</span>
                  <span className="font-bold text-emerald-700">Ativa</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span className="text-slate-700 font-medium">Autenticação Corporativa Microsoft</span>
                  <span className="font-bold text-teal-700">Ok</span>
                </div>
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setIsAdminModalOpen(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Limpo */}
      <footer className="max-w-6xl w-full mx-auto pt-6 border-t border-slate-200 text-center flex flex-col sm:flex-row items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-widest gap-2">
        <div className="flex items-center gap-2">
          <Building2 size={14} className="text-teal-700" />
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
