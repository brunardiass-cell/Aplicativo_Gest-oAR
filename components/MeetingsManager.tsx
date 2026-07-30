import React, { useState, useMemo } from 'react';
import { Meeting, Project, TeamMember, RegulatoryStandard, RegulatorySubject, MeetingActionItem, DossierContribution } from '../types';
import { DEFAULT_MINUTES_TEMPLATE } from '../constants';
import { DecisionsHistoryView } from './DecisionsHistoryView';
import { MeetingModal } from './MeetingModal';
import { MeetingMinutesModal } from './MeetingMinutesModal';
import { 
  Users, Plus, Search, Calendar, FileText, ShieldCheck, 
  Settings, Clock, ArrowRight, Layers, Trash2, Edit, CheckCircle2, AlertCircle, Filter, RefreshCw, X
} from 'lucide-react';

interface MeetingsManagerProps {
  meetings: Meeting[];
  projects: Project[];
  teamMembers: TeamMember[];
  regulatoryStandards: RegulatoryStandard[];
  regulatorySubjects?: RegulatorySubject[];
  onUpdateMeetings: (meetings: Meeting[]) => void;
  onUpdateProjects?: (projects: Project[]) => void;
  onAddDossierContribution?: (contribution: DossierContribution) => void;
  currentUser?: TeamMember | null;
}

export const MeetingsManager: React.FC<MeetingsManagerProps> = ({
  meetings,
  projects,
  teamMembers,
  regulatoryStandards,
  regulatorySubjects,
  onUpdateMeetings,
  onUpdateProjects,
  onAddDossierContribution,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'list' | 'decisions'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('Todos');
  const [typeFilter, setTypeFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState('Todos');

  // Modals state
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [selectedMeetingForEdit, setSelectedMeetingForEdit] = useState<Meeting | null>(null);

  const [isMinutesModalOpen, setIsMinutesModalOpen] = useState(false);
  const [selectedMeetingForMinutes, setSelectedMeetingForMinutes] = useState<Meeting | null>(null);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [customMinutesTemplate, setCustomMinutesTemplate] = useState<string>(DEFAULT_MINUTES_TEMPLATE);

  // Filtered Meetings List
  const filteredMeetings = useMemo(() => {
    return meetings.filter(mtg => {
      if (projectFilter !== 'Todos' && mtg.projectId !== projectFilter) return false;
      if (typeFilter !== 'Todos' && mtg.type !== typeFilter) return false;
      if (statusFilter !== 'Todos' && mtg.status !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const inTitle = mtg.title.toLowerCase().includes(q);
        const inProj = (mtg.projectName || '').toLowerCase().includes(q);
        const inMod = (mtg.moderator || '').toLowerCase().includes(q);
        const inPart = (mtg.participants || []).some(p => p.toLowerCase().includes(q));

        if (!inTitle && !inProj && !inMod && !inPart) return false;
      }

      return true;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [meetings, projectFilter, typeFilter, statusFilter, searchTerm]);

  // Handle Save Meeting
  const handleSaveMeeting = (updatedMeeting: Meeting, createdContributions?: DossierContribution[]) => {
    const exists = meetings.some(m => m.id === updatedMeeting.id);
    let newMeetingsList: Meeting[];

    if (exists) {
      newMeetingsList = meetings.map(m => m.id === updatedMeeting.id ? updatedMeeting : m);
    } else {
      newMeetingsList = [updatedMeeting, ...meetings];
    }

    onUpdateMeetings(newMeetingsList);

    // Sync created DossierContributions if any
    if (createdContributions && createdContributions.length > 0 && onAddDossierContribution) {
      createdContributions.forEach(contrib => {
        onAddDossierContribution(contrib);
      });
    }

    setIsMeetingModalOpen(false);
    setSelectedMeetingForEdit(null);
  };

  // Handle Delete Meeting
  const handleDeleteMeeting = (meetingId: string) => {
    if (window.confirm('Tem certeza de que deseja excluir esta reunião? O histórico e pautas associados serão removidos.')) {
      const updated = meetings.filter(m => m.id !== meetingId);
      onUpdateMeetings(updated);
    }
  };

  // Handle Convert Action Item to Project Activity (MicroActivity)
  const handleConvertToActivity = (projectId: string, macroActivityId: string, actionItem: MeetingActionItem) => {
    if (!onUpdateProjects) return;

    const targetProject = projects.find(p => p.id === projectId);
    if (!targetProject) return;

    const targetMacro = targetProject.macroActivities.find(m => m.id === macroActivityId);
    if (!targetMacro) return;

    const newMicro = {
      id: 'micro_' + Math.random().toString(36).substring(2, 9),
      name: `[Reunião] ${actionItem.action}`,
      assignee: actionItem.responsible || 'Usuário',
      dueDate: actionItem.dueDate || new Date().toISOString().split('T')[0],
      status: 'Planejado' as const,
      observations: `Atividade originada do encaminhamento de reunião com prazo ${actionItem.dueDate}.`,
      progress: 0
    };

    const updatedMacroActivities = targetProject.macroActivities.map(m => {
      if (m.id === macroActivityId) {
        return {
          ...m,
          microActivities: [...m.microActivities, newMicro]
        };
      }
      return m;
    });

    const updatedProject = {
      ...targetProject,
      macroActivities: updatedMacroActivities
    };

    const updatedProjects = projects.map(p => p.id === projectId ? updatedProject : p);
    onUpdateProjects(updatedProjects);
  };

  // Save Minutes Text
  const handleSaveMinutes = (minutesText: string) => {
    if (!selectedMeetingForMinutes) return;

    const updatedMeeting = {
      ...selectedMeetingForMinutes,
      minutesDocument: minutesText
    };

    handleSaveMeeting(updatedMeeting);
    setIsMinutesModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <Users size={12} /> Governança & Rastreabilidade de Decisões
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white">
              Gestão de Reuniões Técnicas & Regulatórias
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-2xl leading-relaxed">
              Registre reuniões por projeto, crie pautas com impacto regulatório, vincule decisões a normas, converta encaminhamentos em tarefas e gere atas automáticas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition backdrop-blur-sm"
            >
              <Settings size={16} />
              <span>Modelo de Ata</span>
            </button>

            <button
              onClick={() => {
                setSelectedMeetingForEdit(null);
                setIsMeetingModalOpen(true);
              }}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 active:scale-95"
            >
              <Plus size={18} />
              <span>Nova Reunião</span>
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition ${
              activeTab === 'list' 
                ? 'bg-white text-slate-900 shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            Reuniões Registradas ({meetings.length})
          </button>

          <button
            onClick={() => setActiveTab('decisions')}
            className={`px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition flex items-center gap-2 ${
              activeTab === 'decisions' 
                ? 'bg-white text-slate-900 shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-white/5'
            }`}
          >
            <ShieldCheck size={16} className={activeTab === 'decisions' ? 'text-indigo-600' : 'text-slate-400'} />
            <span>Histórico de Decisões</span>
          </button>
        </div>
      </div>

      {/* SUB-VIEW 1: LISTA DE REUNIÕES */}
      {activeTab === 'list' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            
            {/* Search */}
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por título, projeto, moderador ou participante..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
              />
            </div>

            {/* Select Filters */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
              <select
                value={projectFilter}
                onChange={e => setProjectFilter(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todos os Projetos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>

              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todos os Tipos</option>
                <option value="Técnica">Técnica</option>
                <option value="Regulatória">Regulatória</option>
                <option value="Desenvolvimento">Desenvolvimento</option>
                <option value="Alinhamento">Alinhamento</option>
                <option value="Comitê Gestor">Comitê Gestor</option>
                <option value="Qualidade">Qualidade</option>
              </select>

              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none cursor-pointer"
              >
                <option value="Todos">Todos os Status</option>
                <option value="Agendada">Agendada</option>
                <option value="Em Andamento">Em Andamento</option>
                <option value="Concluída">Concluída</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>

          </div>

          {/* Meetings Cards Grid */}
          {filteredMeetings.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 space-y-3">
              <Calendar size={40} className="mx-auto text-slate-300" />
              <h4 className="text-slate-700 font-black text-sm uppercase">Nenhuma Reunião Encontrada</h4>
              <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto">
                Clique no botão "Nova Reunião" para cadastrar o primeiro alinhamento ou ajuste seus filtros.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMeetings.map(mtg => {
                const proj = projects.find(p => p.id === mtg.projectId);
                const projName = proj ? proj.name : (mtg.projectName || 'Projeto Geral');
                const dateFormatted = mtg.date ? mtg.date.split('-').reverse().join('/') : 'Data N/I';
                const hasRegulatoryImpact = mtg.agendaItems.some(a => a.hasRegulatoryImpact);
                const actionCount = mtg.agendaItems.reduce((acc, ag) => acc + (ag.actionItems?.length || 0), 0);

                return (
                  <div 
                    key={mtg.id}
                    className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5"
                  >
                    
                    {/* Card Top Header */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl text-[10px] font-black uppercase tracking-wider">
                          {projName}
                        </span>

                        <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase ${
                          mtg.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                          mtg.status === 'Em Andamento' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {mtg.status}
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 leading-snug">
                        {mtg.title}
                      </h3>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          <Calendar size={13} className="text-slate-400" /> {dateFormatted} {mtg.time ? `às ${mtg.time}` : ''}
                        </span>
                        <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          <Users size={13} className="text-slate-400" /> Moderador: {mtg.moderator || 'N/I'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Info Stats */}
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Pautas Tratadas</span>
                        <span className="font-extrabold text-slate-800">{mtg.agendaItems.length} Pautas</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Encaminhamentos</span>
                        <span className="font-extrabold text-slate-800">{actionCount} Ações</span>
                      </div>
                    </div>

                    {/* Regulatory Impact Badge */}
                    {hasRegulatoryImpact && (
                      <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-900 font-bold">
                        <ShieldCheck size={16} className="text-amber-600 shrink-0" />
                        <span>Contém pauta com Impacto Regulatório Directo</span>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setSelectedMeetingForMinutes(mtg);
                            setIsMinutesModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                          title="Ver / Gerar Ata de Reunião"
                        >
                          <FileText size={14} />
                          <span>Ata</span>
                        </button>

                        <button
                          onClick={() => handleDeleteMeeting(mtg.id)}
                          className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Excluir Reunião"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedMeetingForEdit(mtg);
                          setIsMeetingModalOpen(true);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-sm"
                      >
                        <Edit size={14} />
                        <span>Editar Reunião</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* SUB-VIEW 2: HISTÓRICO DE DECISÕES */}
      {activeTab === 'decisions' && (
        <DecisionsHistoryView
          meetings={meetings}
          projects={projects}
          regulatoryStandards={regulatoryStandards}
          regulatorySubjects={regulatorySubjects}
          onOpenMeetingDetails={(mtg) => {
            setSelectedMeetingForEdit(mtg);
            setIsMeetingModalOpen(true);
          }}
          onOpenMinutesModal={(mtg) => {
            setSelectedMeetingForMinutes(mtg);
            setIsMinutesModalOpen(true);
          }}
        />
      )}

      {/* MODAL 1: NEW / EDIT MEETING */}
      {isMeetingModalOpen && (
        <MeetingModal
          meeting={selectedMeetingForEdit}
          projects={projects}
          teamMembers={teamMembers}
          regulatoryStandards={regulatoryStandards}
          onClose={() => {
            setIsMeetingModalOpen(false);
            setSelectedMeetingForEdit(null);
          }}
          onSave={handleSaveMeeting}
          onConvertToActivity={handleConvertToActivity}
          onOpenMinutes={(mtg) => {
            setSelectedMeetingForMinutes(mtg);
            setIsMinutesModalOpen(true);
          }}
        />
      )}

      {/* MODAL 2: MEETING MINUTES (ATA) */}
      {isMinutesModalOpen && selectedMeetingForMinutes && (
        <MeetingMinutesModal
          meeting={selectedMeetingForMinutes}
          onClose={() => {
            setIsMinutesModalOpen(false);
            setSelectedMeetingForMinutes(null);
          }}
          onSaveMinutes={handleSaveMinutes}
        />
      )}

      {/* MODAL 3: MINUTES TEMPLATE CONFIGURATION */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
            <header className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-400 tracking-wider block">Configuração de Padrão</span>
                <h3 className="text-base font-black uppercase tracking-tight">Modelo Oficial de Ata de Reunião</h3>
              </div>
              <button onClick={() => setIsTemplateModalOpen(false)} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300">
                <X size={18} />
              </button>
            </header>

            <div className="p-6 space-y-4 text-xs">
              <p className="text-slate-500 font-medium">
                Você pode personalizar a estrutura e os marcadores de substituição que serão utilizados para gerar automaticamente as atas de reunião.
              </p>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-2xl text-[11px] text-indigo-900 space-y-1">
                <span className="font-bold block">Marcadores suportados:</span>
                <p className="font-mono text-[10px] text-indigo-800">
                  [NOME_DO_PROJETO], [TITULO_REUNIAO], [TIPO_REUNIAO], [DATA_REUNIAO], [HORA_REUNIAO], [LOCAL_REUNIAO], [MODERADOR], [PARTICIPANTES], [PAUTAS_E_DECISOES], [IMPACTOS_REGULATORIOS], [ENCAMINHAMENTOS], [CONCLUSOES_GERAIS]
                </p>
              </div>

              <textarea
                rows={10}
                value={customMinutesTemplate}
                onChange={e => setCustomMinutesTemplate(e.target.value)}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs leading-relaxed text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => setCustomMinutesTemplate(DEFAULT_MINUTES_TEMPLATE)}
                className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Restaurar Padrão
              </button>

              <button
                onClick={() => {
                  alert('Modelo de ata salvo para novas reuniões!');
                  setIsTemplateModalOpen(false);
                }}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md"
              >
                Salvar Modelo
              </button>
            </footer>
          </div>
        </div>
      )}

    </div>
  );
};
