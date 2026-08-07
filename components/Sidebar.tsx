
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
  Calendar
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
  onSelectProjectSubView
}) => {

  const formatSyncTime = (timestamp: string) => {
    if (!timestamp) return '--:--:--';
    return new Date(timestamp).toLocaleTimeString('pt-BR');
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
        
        <div className={`p-2.5 rounded-xl border transition-all ${
          lastSync?.status === 'error' ? 'bg-red-500/10 border-red-500/20' : (isVaccinesModule ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-slate-900/50 border-slate-700')
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {lastSync?.status === 'error' ? <CloudOff size={11} className="text-red-400" /> : <Cloud size={11} className="text-emerald-400" />}
              <span className="text-[9px] font-black uppercase text-slate-200">
                {lastSync?.status === 'syncing' ? 'Sincronizando...' : lastSync?.status === 'error' ? 'Erro' : 'Nuvem OK'}
              </span>
            </div>
            <div className={`w-2 h-2 rounded-full ${
              lastSync?.status === 'syncing' ? 'bg-amber-400 animate-pulse' : 
              lastSync?.status === 'error' ? 'bg-red-500' : 'bg-emerald-400'
            }`} />
          </div>
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
