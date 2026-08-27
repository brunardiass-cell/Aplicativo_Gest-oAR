
import React from 'react';
import { ViewMode, SyncInfo, TeamMember, Project } from '../types';
import { 
  LayoutDashboard, 
  ListTodo, 
  FolderKanban, 
  ShieldCheck, 
  History, 
  LogOut, 
  Users,
  Cloud,
  CloudOff,
  Clock,
  Database,
  Download,
  Upload,
  Syringe,
  FileText,
  FileSpreadsheet,
  FileUp,
  Compass,
  AlertTriangle,
  Layers,
  ArrowRightLeft,
  BookOpen,
  Calendar,
  RefreshCw,
  LogIn,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  currentModule?: 'activities_projects' | 'regulatory_standards' | 'vaccines_components';
  onSwitchModule?: () => void;
  currentView: ViewMode;
  onViewChange: (view: ViewMode) => void;
  vaccineTab?: 'dashboard' | 'manual_inclusion' | 'import_spreadsheet' | 'import_pdf' | 'explorer' | 'catalog' | 'impurities';
  onVaccineTabChange?: (tab: 'dashboard' | 'manual_inclusion' | 'import_spreadsheet' | 'import_pdf' | 'explorer' | 'catalog' | 'impurities') => void;
  onGoHome: () => void;
  onLogout: () => void;
  onSwitchProfile: () => void;
  selectedProfile: TeamMember | null;
  hasFullAccess: boolean;
  lastSync: SyncInfo | null;
  onSaveBackup: () => void;
  onLoadBackup: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  
  // New props for project sub-navigation
  activeProjects: Project[];
  selectedProjectId: string | 'Todos' | null;
  onSelectProjectId: (id: string | 'Todos') => void;
  visualizationMode: 'gantt' | 'kanban' | 'phases' | 'map';
  onSelectVisualizationMode: (mode: 'gantt' | 'kanban' | 'phases' | 'map') => void;
  projectSubView: 'visual' | 'management';
  onSelectProjectSubView: (view: 'visual' | 'management') => void;
  onOpenExcelReports?: () => void;

  // Cloud Sync & MSAL props
  isMsalAuthenticated?: boolean;
  onConnectMsal?: () => void;
  onForceCloudSync?: () => void;
  isSyncingSharePoint?: boolean;
}

const getInitials = (name?: string): string => {
  if (!name) return 'G';
  const nameParts = name.split(' ');
  return nameParts[0][0].toUpperCase();
};

const Sidebar: React.FC<SidebarProps> = ({ 
  currentModule,
  onSwitchModule,
  currentView, 
  onViewChange, 
  vaccineTab,
  onVaccineTabChange,
  onGoHome,
  onLogout,
  onSwitchProfile,
  selectedProfile,
  hasFullAccess,
  lastSync,
  onSaveBackup,
  onLoadBackup,
  isOpen,
  onClose,
  isMobile,
  activeProjects,
  selectedProjectId,
  onSelectProjectId,
  visualizationMode,
  onSelectVisualizationMode,
  projectSubView,
  onSelectProjectSubView,
  onOpenExcelReports,
  isMsalAuthenticated = false,
  onConnectMsal,
  onForceCloudSync,
  isSyncingSharePoint = false
}) => {

  const formatSyncTime = (timestamp?: string) => {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const isVaccinesModule = currentModule === 'vaccines_components';

  const sidebarClasses = isMobile 
    ? `fixed inset-y-0 left-0 w-64 ${isVaccinesModule ? 'bg-[#064e3b]' : 'bg-slate-800'} text-white z-[100] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`
    : `w-64 ${isVaccinesModule ? 'bg-[#064e3b]' : 'bg-slate-800'} text-white fixed h-full flex flex-col z-50 overflow-y-auto shadow-xl`;

  return (
    <>
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[90] transition-opacity"
          onClick={onClose}
        />
      )}
      <aside className={sidebarClasses}>
      <div className="p-4 sm:p-5 flex-1 flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between mb-4 cursor-pointer group" onClick={onGoHome}>
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 ${isVaccinesModule ? 'bg-[#022c22] text-emerald-400 border border-emerald-700/60' : 'bg-brand-primary text-white'} rounded-xl flex items-center justify-center font-black text-sm shadow-md transition-transform group-hover:scale-105 shrink-0`}>
              {isVaccinesModule ? <Syringe size={18} /> : getInitials(selectedProfile?.name)}
            </div>
            <div>
              <h2 className="text-white font-black text-sm leading-tight tracking-tight">CTVacinas</h2>
              <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.2 rounded-md ${isVaccinesModule ? 'bg-emerald-800/80 text-emerald-200' : 'text-slate-400'}`}>
                {isVaccinesModule ? 'VACINAS' : 'Regulatória'}
              </span>
            </div>
          </div>
          {isMobile && (
            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              &laquo;
            </button>
          )}
        </div>

        {/* Option to Switch Module */}
        {onSwitchModule && (
          <button
            onClick={() => { onSwitchModule(); onClose?.(); }}
            className={`w-full mb-5 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center justify-between transition border active:scale-95 ${
              isVaccinesModule
                ? 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-200 border-emerald-700/60'
                : 'bg-slate-700/40 hover:bg-slate-700/80 text-slate-200 border-slate-600/60'
            }`}
            title="Trocar Módulo do Sistema"
          >
            <div className="flex items-center gap-2">
              <Layers size={14} className="text-teal-400" />
              <span>Trocar Módulo</span>
            </div>
            <ArrowRightLeft size={12} className="opacity-60" />
          </button>
        )}

        {/* Navigation Menu */}
        {isVaccinesModule ? (
          <div className="space-y-6 flex-1">
            <nav className="space-y-1">
              <SidebarButton 
                active={vaccineTab === 'dashboard'} 
                onClick={() => { onVaccineTabChange?.('dashboard'); onClose?.(); }} 
                icon={<LayoutDashboard size={16} />} 
                label="Visão Geral" 
                isVaccine
              />
              <SidebarButton 
                active={vaccineTab === 'catalog'} 
                onClick={() => { onVaccineTabChange?.('catalog'); onClose?.(); }} 
                icon={<Syringe size={16} />} 
                label="Vacinas" 
                isVaccine
              />
              <SidebarButton 
                active={vaccineTab === 'explorer'} 
                onClick={() => { onVaccineTabChange?.('explorer'); onClose?.(); }} 
                icon={<Compass size={16} />} 
                label="Componentes" 
                isVaccine
              />
              <SidebarButton 
                active={vaccineTab === 'impurities'} 
                onClick={() => { onVaccineTabChange?.('impurities'); onClose?.(); }} 
                icon={<AlertTriangle size={16} />} 
                label="Impurezas" 
                isVaccine
              />
              <SidebarButton 
                active={vaccineTab === 'import_spreadsheet'} 
                onClick={() => { onVaccineTabChange?.('import_spreadsheet'); onClose?.(); }} 
                icon={<FileSpreadsheet size={16} />} 
                label="Catálogo & Bancos" 
                isVaccine
              />
              <SidebarButton 
                active={vaccineTab === 'import_pdf'} 
                onClick={() => { onVaccineTabChange?.('import_pdf'); onClose?.(); }} 
                icon={<FileUp size={16} />} 
                label="Documentos" 
                isVaccine
              />
            </nav>
          </div>
        ) : (
          <nav className="space-y-2 flex-1">
            <SidebarButton active={currentView === 'dashboard'} onClick={() => { onViewChange('dashboard'); onClose?.(); }} icon={<LayoutDashboard size={18} />} label="Dashboard" />
            {!selectedProfile?.isComiteGestor && (
              <SidebarButton active={currentView === 'tasks'} onClick={() => { onViewChange('tasks'); onClose?.(); }} icon={<ListTodo size={18} />} label="Atividades" />
            )}
            <SidebarButton 
              active={currentView === 'projects'} 
              onClick={() => { 
                onViewChange('projects'); 
                if (selectedProfile?.isComiteGestor) {
                  onSelectProjectSubView('visual'); 
                  onSelectVisualizationMode('phases'); 
                } else {
                  onSelectProjectSubView('management'); 
                }
                onClose?.();
              }} 
              icon={<FolderKanban size={18} />} 
              label="Projetos" 
            />


            <SidebarButton 
              active={currentView === 'meetings'} 
              onClick={() => { onViewChange('meetings'); onClose?.(); }} 
              icon={<Calendar size={18} />} 
              label="Reuniões" 
            />

            {hasFullAccess && !selectedProfile?.isComiteGestor && (
              <>
                <SidebarButton active={currentView === 'quality'} onClick={() => { onViewChange('quality'); onClose?.(); }} icon={<ShieldCheck size={18} />} label="Acessos" />
                <SidebarButton active={currentView === 'traceability'} onClick={() => { onViewChange('traceability'); onClose?.(); }} icon={<History size={18} />} label="Auditoria" />
              </>
            )}
          </nav>
        )}
      </div>

      {/* Sidebar Footer (Sync, Backup, User Profile) */}
      <div className="mt-auto p-4 space-y-3 border-t border-slate-700/50 bg-black/10">
        <div className={`p-3 rounded-xl border transition-all ${
          isVaccinesModule ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-slate-900/50 border-slate-700'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest flex items-center gap-1.5">
              <Database size={11}/> Backup Local
            </p>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={onSaveBackup} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1.5 transition ${isVaccinesModule ? 'bg-emerald-800/60 hover:bg-emerald-800 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><Download size={11}/> Salvar</button>
            <button onClick={onLoadBackup} className={`px-2.5 py-1.5 rounded-lg text-[9px] font-bold uppercase flex items-center justify-center gap-1.5 transition ${isVaccinesModule ? 'bg-emerald-800/60 hover:bg-emerald-800 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-300'}`}><Upload size={11}/> Subir</button>
          </div>
        </div>
        
        {/* SharePoint Cloud Sync Indicator & Action Widget */}
        <div className={`p-3 rounded-xl border transition-all ${
          !isMsalAuthenticated || lastSync?.status === 'disconnected'
            ? 'bg-amber-950/40 border-amber-500/40 text-amber-100'
            : (lastSync?.status === 'syncing' || isSyncingSharePoint)
            ? 'bg-sky-950/50 border-sky-500/50 text-sky-100'
            : lastSync?.status === 'error'
            ? 'bg-red-950/50 border-red-500/40 text-red-100'
            : (isVaccinesModule ? 'bg-emerald-950/60 border-emerald-600/70 text-emerald-100' : 'bg-slate-900/80 border-teal-500/40 text-slate-100')
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {!isMsalAuthenticated || lastSync?.status === 'disconnected' ? (
                <CloudOff size={13} className="text-amber-400 shrink-0" />
              ) : (lastSync?.status === 'syncing' || isSyncingSharePoint) ? (
                <RefreshCw size={13} className="text-sky-400 animate-spin shrink-0" />
              ) : lastSync?.status === 'error' ? (
                <AlertTriangle size={13} className="text-red-400 shrink-0" />
              ) : (
                <Cloud size={13} className="text-emerald-400 shrink-0" />
              )}
              
              <div className="text-left leading-tight">
                <span className="text-[9px] font-black uppercase tracking-wider block">
                  {!isMsalAuthenticated || lastSync?.status === 'disconnected'
                    ? 'Nuvem Desconectada'
                    : (lastSync?.status === 'syncing' || isSyncingSharePoint)
                    ? 'Enviando ao SharePoint...'
                    : lastSync?.status === 'error'
                    ? 'Erro SharePoint'
                    : 'SharePoint OK'}
                </span>
                <span className="text-[8px] opacity-75 block">
                  {!isMsalAuthenticated || lastSync?.status === 'disconnected'
                    ? 'Salvo apenas no navegador'
                    : (lastSync?.status === 'syncing' || isSyncingSharePoint)
                    ? 'Atualizando JSONs...'
                    : lastSync?.status === 'error'
                    ? (lastSync.error || 'Falha ao sincronizar')
                    : `Sincronizado • ${formatSyncTime(lastSync?.timestamp)}`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {isMsalAuthenticated && onForceCloudSync && (
                <button 
                  onClick={onForceCloudSync} 
                  disabled={lastSync?.status === 'syncing' || isSyncingSharePoint}
                  title="Sincronizar com SharePoint agora"
                  className="p-1 rounded bg-black/20 hover:bg-black/40 text-slate-300 hover:text-white transition disabled:opacity-50"
                >
                  <RefreshCw size={10} className={(lastSync?.status === 'syncing' || isSyncingSharePoint) ? 'animate-spin' : ''} />
                </button>
              )}
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                !isMsalAuthenticated || lastSync?.status === 'disconnected'
                  ? 'bg-amber-400'
                  : (lastSync?.status === 'syncing' || isSyncingSharePoint)
                  ? 'bg-sky-400 animate-pulse'
                  : lastSync?.status === 'error'
                  ? 'bg-red-500'
                  : 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]'
              }`} />
            </div>
          </div>

          {/* Botão de conexão rápida caso desconectado */}
          {(!isMsalAuthenticated || lastSync?.status === 'disconnected') && onConnectMsal && (
            <button
              onClick={onConnectMsal}
              className="mt-2 w-full py-1.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <LogIn size={11} /> Conectar Microsoft 365
            </button>
          )}

          {/* Botão de tentar novamente em caso de erro */}
          {isMsalAuthenticated && lastSync?.status === 'error' && onForceCloudSync && (
            <button
              onClick={onForceCloudSync}
              className="mt-2 w-full py-1 px-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-[8px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition"
            >
              <RefreshCw size={10} /> Tentar Novamente
            </button>
          )}
        </div>

        {/* User Profile Bar at Bottom as in Reference Image */}
        <div className="pt-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-white text-emerald-900 font-black text-xs flex items-center justify-center shrink-0 shadow-sm">
              {getInitials(selectedProfile?.name)}
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-bold text-white truncate leading-tight">{selectedProfile?.name || 'Grazielle'}</p>
              <p className="text-[9px] text-emerald-200/80 truncate">Gestão Regulatória</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onSwitchProfile} title="Trocar Perfil" className="p-1.5 hover:bg-emerald-800/60 text-emerald-200 rounded-lg transition">
              <Users size={14} />
            </button>
            <button onClick={onLogout} title="Sair" className="p-1.5 hover:bg-red-500/30 text-red-300 rounded-lg transition">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>
      </aside>
    </>
  );
};

const SidebarButton = ({ active, onClick, icon, label, isVaccine }: any) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center text-left gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 font-bold text-xs uppercase tracking-wider ${
      active 
        ? (isVaccine ? 'bg-[#0d9488] text-white shadow-sm font-black' : 'bg-brand-primary/80 text-white')
        : (isVaccine ? 'text-emerald-100/80 hover:bg-emerald-800/50 hover:text-white' : 'text-slate-400 hover:bg-slate-700 hover:text-white')
    }`}
  >
    {React.cloneElement(icon, { strokeWidth: active ? 2.5 : 2 })}
    {label}
  </button>
);

export default Sidebar;
