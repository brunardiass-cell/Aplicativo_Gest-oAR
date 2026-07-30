import React, { useState } from 'react';
import { Meeting, MeetingAgendaItem, MeetingActionItem, Project, TeamMember, RegulatoryStandard, DossierContribution } from '../types';
import { X, Plus, Trash2, Calendar, Clock, MapPin, Users, ShieldCheck, CheckCircle2, FileText, ArrowRight, Layers, Sparkles, MessageSquare, AlertCircle, Link as LinkIcon, Check } from 'lucide-react';

interface MeetingModalProps {
  meeting?: Meeting | null;
  projects: Project[];
  teamMembers: TeamMember[];
  regulatoryStandards: RegulatoryStandard[];
  onClose: () => void;
  onSave: (meeting: Meeting, createdContributions?: DossierContribution[]) => void;
  onConvertToActivity: (projectId: string, macroActivityId: string, actionItem: MeetingActionItem) => void;
  onOpenMinutes: (meeting: Meeting) => void;
}

export const MeetingModal: React.FC<MeetingModalProps> = ({
  meeting,
  projects,
  teamMembers,
  regulatoryStandards,
  onClose,
  onSave,
  onConvertToActivity,
  onOpenMinutes
}) => {
  const isEditing = Boolean(meeting);

  const [projectId, setProjectId] = useState(meeting?.projectId || (projects[0]?.id || ''));
  const [title, setTitle] = useState(meeting?.title || '');
  const [date, setDate] = useState(meeting?.date || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(meeting?.time || '10:00');
  const [location, setLocation] = useState(meeting?.location || 'MS Teams / CTVacinas');
  const [type, setType] = useState<Meeting['type']>(meeting?.type || 'Técnica');
  const [status, setStatus] = useState<Meeting['status']>(meeting?.status || 'Agendada');
  const [moderator, setModerator] = useState(meeting?.moderator || (teamMembers[0]?.name || ''));
  const [participants, setParticipants] = useState<string[]>(meeting?.participants || []);
  const [newParticipant, setNewParticipant] = useState('');
  const [generalConclusions, setGeneralConclusions] = useState(meeting?.generalConclusions || '');
  const [agendaItems, setAgendaItems] = useState<MeetingAgendaItem[]>(meeting?.agendaItems || []);
  const [activeTab, setActiveTab] = useState<'info' | 'pautas' | 'encaminhamentos' | 'conclusoes'>('info');

  const selectedProject = projects.find(p => p.id === projectId);

  const handleAddParticipant = (name: string) => {
    if (name && !participants.includes(name)) {
      setParticipants([...participants, name]);
    }
  };

  const handleRemoveParticipant = (name: string) => {
    setParticipants(participants.filter(p => p !== name));
  };

  const handleAddAgendaItem = () => {
    const newItem: MeetingAgendaItem = {
      id: 'pauta_' + Math.random().toString(36).substring(2, 9),
      title: 'Nova Pauta de Discussão',
      description: '',
      phase: selectedProject?.phases?.[0] || '',
      macroActivityId: selectedProject?.macroActivities?.[0]?.id || '',
      discussions: '',
      decisions: '',
      hasRegulatoryImpact: false,
      regulatoryImpactDetails: '',
      actionItems: []
    };
    setAgendaItems([...agendaItems, newItem]);
  };

  const handleUpdateAgendaItem = (id: string, updates: Partial<MeetingAgendaItem>) => {
    setAgendaItems(agendaItems.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleDeleteAgendaItem = (id: string) => {
    setAgendaItems(agendaItems.filter(item => item.id !== id));
  };

  const handleAddActionItem = (agendaId: string) => {
    const newAct: MeetingActionItem = {
      id: 'act_' + Math.random().toString(36).substring(2, 9),
      action: 'Nova ação/encaminhamento',
      responsible: moderator || teamMembers[0]?.name || '',
      dueDate: date,
      status: 'Pendente',
      convertedToActivity: false
    };

    setAgendaItems(agendaItems.map(ag => {
      if (ag.id === agendaId) {
        return {
          ...ag,
          actionItems: [...(ag.actionItems || []), newAct]
        };
      }
      return ag;
    }));
  };

  const handleUpdateActionItem = (agendaId: string, actionId: string, updates: Partial<MeetingActionItem>) => {
    setAgendaItems(agendaItems.map(ag => {
      if (ag.id === agendaId) {
        return {
          ...ag,
          actionItems: (ag.actionItems || []).map(act => act.id === actionId ? { ...act, ...updates } : act)
        };
      }
      return ag;
    }));
  };

  const handleDeleteActionItem = (agendaId: string, actionId: string) => {
    setAgendaItems(agendaItems.map(ag => {
      if (ag.id === agendaId) {
        return {
          ...ag,
          actionItems: (ag.actionItems || []).filter(act => act.id !== actionId)
        };
      }
      return ag;
    }));
  };

  const handleConvertActionToActivity = (agenda: MeetingAgendaItem, actionItem: MeetingActionItem) => {
    if (!projectId) {
      alert('Selecione um projeto para vincular a atividade.');
      return;
    }

    const targetMacroId = agenda.macroActivityId || selectedProject?.macroActivities?.[0]?.id;
    if (!targetMacroId) {
      alert('Nenhuma macroatividade foi encontrada no projeto para receber a nova atividade.');
      return;
    }

    onConvertToActivity(projectId, targetMacroId, actionItem);
    handleUpdateActionItem(agenda.id, actionItem.id, { convertedToActivity: true });
  };

  const handleSaveMeeting = () => {
    if (!title.trim()) {
      alert('Por favor, informe o título da reunião.');
      return;
    }

    const createdContributions: DossierContribution[] = [];

    // Automatically generate DossierContributions for agenda items with regulatory impact
    agendaItems.forEach(agenda => {
      if (agenda.hasRegulatoryImpact) {
        const contrib: DossierContribution = {
          id: `contrib_mtg_${meeting?.id || Date.now()}_${agenda.id}`,
          projectId: projectId,
          projectName: selectedProject?.name || 'Projeto',
          macroActivityId: agenda.macroActivityId,
          macroActivityName: selectedProject?.macroActivities.find(m => m.id === agenda.macroActivityId)?.name,
          activityId: agenda.id,
          activityName: `[Reunião: ${title}] ${agenda.title}`,
          chapterId: (agenda.regulatoryDocId as any) || 'cap_1',
          chapterTitle: 'Registro de Decisão de Reunião com Impacto Regulatório',
          type: 'texto',
          content: `Decisão tomada na reunião "${title}" em ${date}:\n\n${agenda.decisions || agenda.description || ''}\n\nDetalhes Regulatórios: ${agenda.regulatoryImpactDetails || ''}`,
          status: 'Em Revisão',
          version: 1,
          author: moderator || 'Moderador',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        createdContributions.push(contrib);
      }
    });

    const updatedMeeting: Meeting = {
      id: meeting?.id || 'mtg_' + Date.now(),
      title: title.trim(),
      projectId: projectId,
      projectName: selectedProject?.name || 'Geral',
      date: date,
      time: time,
      location: location,
      type: type,
      status: status,
      moderator: moderator,
      participants: participants,
      agendaItems: agendaItems,
      generalConclusions: generalConclusions,
      minutesTemplate: meeting?.minutesTemplate,
      minutesDocument: meeting?.minutesDocument,
      createdAt: meeting?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(updatedMeeting, createdContributions);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/75 backdrop-blur-md z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-300">
              <Calendar size={24} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
                {isEditing ? 'Edição de Reunião' : 'Nova Reunião Técnica / Regulatória'}
              </span>
              <h2 className="text-lg font-black uppercase tracking-tight">
                {title || 'Nova Reunião'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {meeting && (
              <button
                type="button"
                onClick={() => onOpenMinutes(meeting)}
                className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 text-white rounded-2xl font-bold text-xs flex items-center gap-1.5 transition border border-indigo-400/30 shadow-md"
              >
                <FileText size={16} />
                <span>Gerar / Ver Ata</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-2xl text-slate-300 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Tab Navigation Bar */}
        <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'info' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              1. Dados Principais
            </button>
            <button
              onClick={() => setActiveTab('pautas')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5 ${
                activeTab === 'pautas' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>2. Pautas & Decisões</span>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-extrabold">
                {agendaItems.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('encaminhamentos')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'encaminhamentos' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              3. Encaminhamentos
            </button>
            <button
              onClick={() => setActiveTab('conclusoes')}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition ${
                activeTab === 'conclusoes' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              4. Conclusões
            </button>
          </div>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          
          {/* TAB 1: DADOS PRINCIPAIS */}
          {activeTab === 'info' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Projeto Vinculado *</label>
                  <select
                    value={projectId}
                    onChange={e => setProjectId(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Título da Reunião *</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Ex: Alinhamento de Especificações do Dossiê DIFA"
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tipo de Reunião</label>
                  <select
                    value={type}
                    onChange={e => setType(e.target.value as any)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="Técnica">Técnica</option>
                    <option value="Regulatória">Regulatória</option>
                    <option value="Desenvolvimento">Desenvolvimento</option>
                    <option value="Alinhamento">Alinhamento</option>
                    <option value="Comitê Gestor">Comitê Gestor</option>
                    <option value="Qualidade">Qualidade</option>
                    <option value="Submissão">Submissão</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    <option value="Agendada">Agendada</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Cancelada">Cancelada</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Data</label>
                  <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Horário</label>
                  <input
                    type="time"
                    value={time}
                    onChange={e => setTime(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Local / Canal</label>
                  <input
                    type="text"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    placeholder="Ex: Sala de Reuniões CTVacinas / Microsoft Teams"
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Moderador</label>
                  <select
                    value={moderator}
                    onChange={e => setModerator(e.target.value)}
                    className="w-full p-3 bg-white border border-slate-300 rounded-2xl font-bold text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-sm"
                  >
                    {teamMembers.map(tm => (
                      <option key={tm.id} value={tm.name}>{tm.name} ({tm.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Participants chips */}
              <div className="p-5 bg-white border border-slate-200 rounded-3xl space-y-3 shadow-sm">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  Participantes ({participants.length})
                </label>

                <div className="flex items-center gap-2">
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAddParticipant(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs text-slate-700 outline-none"
                  >
                    <option value="">+ Selecionar da Equipe...</option>
                    {teamMembers.map(tm => (
                      <option key={tm.id} value={tm.name}>{tm.name}</option>
                    ))}
                  </select>

                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newParticipant}
                      onChange={e => setNewParticipant(e.target.value)}
                      placeholder="Outro participante..."
                      className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newParticipant.trim()) {
                          handleAddParticipant(newParticipant.trim());
                          setNewParticipant('');
                        }
                      }}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition"
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {participants.map(p => (
                    <span 
                      key={p} 
                      className="px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm"
                    >
                      <span>{p}</span>
                      <button 
                        onClick={() => handleRemoveParticipant(p)}
                        className="hover:text-rose-600 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                  {participants.length === 0 && (
                    <p className="text-xs text-slate-400 italic">Nenhum participante adicionado ainda.</p>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: PAUTAS E DECISÕES */}
          {activeTab === 'pautas' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Pautas Pré-cadastradas e Discussões</h3>
                  <p className="text-xs text-slate-500 font-medium">Cadastre as pautas e registre as decisões tomadas durante a reunião.</p>
                </div>

                <button
                  type="button"
                  onClick={handleAddAgendaItem}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-md"
                >
                  <Plus size={16} />
                  <span>Nova Pauta</span>
                </button>
              </div>

              {agendaItems.length === 0 ? (
                <div className="bg-white p-12 text-center rounded-3xl border border-dashed border-slate-200 space-y-3">
                  <Layers size={40} className="mx-auto text-slate-300" />
                  <h4 className="text-slate-700 font-black text-sm uppercase">Nenhuma Pauta Cadastrada</h4>
                  <p className="text-slate-400 text-xs font-medium max-w-sm mx-auto">
                    Clique no botão acima para adicionar a primeira pauta desta reunião.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {agendaItems.map((agenda, index) => (
                    <div key={agenda.id} className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm space-y-4">
                      
                      {/* Pauta Header */}
                      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="w-7 h-7 rounded-xl bg-indigo-100 text-indigo-900 font-black text-xs flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <input
                            type="text"
                            value={agenda.title}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { title: e.target.value })}
                            placeholder="Título da Pauta..."
                            className="w-full text-sm font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 outline-none px-1 py-0.5"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleDeleteAgendaItem(agenda.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                          title="Remover Pauta"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      {/* Links Grid (Fase, Macro, Doc Regulatório) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Fase do Projeto</label>
                          <select
                            value={agenda.phase || ''}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { phase: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                          >
                            <option value="">Selecione...</option>
                            {selectedProject?.phases?.map(ph => (
                              <option key={ph} value={ph}>{ph}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Macroatividade Relacionada</label>
                          <select
                            value={agenda.macroActivityId || ''}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { macroActivityId: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                          >
                            <option value="">Selecione...</option>
                            {selectedProject?.macroActivities.map(m => (
                              <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Documento Regulatório (Capítulo)</label>
                          <select
                            value={agenda.regulatoryDocId || ''}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { regulatoryDocId: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 outline-none"
                          >
                            <option value="">Nenhum / Selecione...</option>
                            <option value="cap_1">Capítulo 1 - Informações Gerais</option>
                            <option value="cap_2">Capítulo 2 - Matéria-Prima & Biológicos</option>
                            <option value="cap_3">Capítulo 3 - Processo & Produção</option>
                            <option value="cap_4">Capítulo 4 - Controle & Estabilidade</option>
                            <option value="cap_5">Capítulo 5 - Estudos Não-Clínicos</option>
                            <option value="cap_6">Capítulo 6 - Protocolo Clínico</option>
                          </select>
                        </div>
                      </div>

                      {/* Description input */}
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Descrição / Contexto Prévia</label>
                        <input
                          type="text"
                          value={agenda.description || ''}
                          onChange={e => handleUpdateAgendaItem(agenda.id, { description: e.target.value })}
                          placeholder="Objetivo ou questão técnica a ser tratada..."
                          className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none"
                        />
                      </div>

                      {/* Discussions & Decisions Textareas */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-slate-500 block flex items-center gap-1">
                            <MessageSquare size={12} className="text-indigo-600" /> Discussões Durante a Reunião
                          </label>
                          <textarea
                            rows={3}
                            value={agenda.discussions || ''}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { discussions: e.target.value })}
                            placeholder="Anotações de debate, observações dos técnicos e divergências..."
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase text-emerald-800 block flex items-center gap-1 font-bold">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Decisão e Conclusão Final
                          </label>
                          <textarea
                            rows={3}
                            value={agenda.decisions || ''}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { decisions: e.target.value })}
                            placeholder="O que ficou decidido, aprovado ou recomendado para esta pauta..."
                            className="w-full p-3 bg-emerald-50/40 border border-emerald-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>

                      {/* Regulatory Impact Box */}
                      <div className="p-4 bg-amber-50/80 border border-amber-200/90 rounded-2xl space-y-2">
                        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={Boolean(agenda.hasRegulatoryImpact)}
                            onChange={e => handleUpdateAgendaItem(agenda.id, { hasRegulatoryImpact: e.target.checked })}
                            className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-amber-300 cursor-pointer"
                          />
                          <span className="text-xs font-black uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                            <ShieldCheck size={16} className="text-amber-600" /> Possui Impacto Regulatório Directo
                          </span>
                        </label>

                        {agenda.hasRegulatoryImpact && (
                          <div className="space-y-2 pl-6 animate-in slide-in-from-top-1 duration-200">
                            <p className="text-[11px] text-amber-900 font-medium">
                              Ao marcar esta opção, ao salvar a reunião o sistema registrará automaticamente uma <strong>contribuição pendente no módulo Documentos Regulatórios</strong>.
                            </p>
                            <input
                              type="text"
                              value={agenda.regulatoryImpactDetails || ''}
                              onChange={e => handleUpdateAgendaItem(agenda.id, { regulatoryImpactDetails: e.target.value })}
                              placeholder="Especifique o detalhe do impacto regulatório (ex: inclusão no capítulo 3 do DDCM)..."
                              className="w-full p-2.5 bg-white border border-amber-300 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </div>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>
          )}

          {/* TAB 3: ENCAMINHAMENTOS */}
          {activeTab === 'encaminhamentos' && (
            <div className="max-w-4xl mx-auto space-y-6">
              
              <div>
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Plano de Ação e Encaminhamentos</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Cadastre tarefas decorrentes de cada pauta. Você pode converter qualquer encaminhamento diretamente em uma atividade do projeto!
                </p>
              </div>

              {agendaItems.map((agenda, index) => (
                <div key={agenda.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                  
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-black uppercase text-indigo-900">
                      Pauta {index + 1}: {agenda.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleAddActionItem(agenda.id)}
                      className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs flex items-center gap-1 border border-indigo-200 transition"
                    >
                      <Plus size={14} /> Novo Encaminhamento
                    </button>
                  </div>

                  {(!agenda.actionItems || agenda.actionItems.length === 0) ? (
                    <p className="text-xs text-slate-400 italic py-2">Nenhum encaminhamento cadastrado para esta pauta.</p>
                  ) : (
                    <div className="space-y-3">
                      {agenda.actionItems.map(act => (
                        <div 
                          key={act.id}
                          className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3"
                        >
                          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                            <div className="sm:col-span-5">
                              <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Ação / Descrição</label>
                              <input
                                type="text"
                                value={act.action}
                                onChange={e => handleUpdateActionItem(agenda.id, act.id, { action: e.target.value })}
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none"
                              />
                            </div>

                            <div className="sm:col-span-3">
                              <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Responsável</label>
                              <select
                                value={act.responsible}
                                onChange={e => handleUpdateActionItem(agenda.id, act.id, { responsible: e.target.value })}
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none"
                              >
                                {teamMembers.map(tm => (
                                  <option key={tm.id} value={tm.name}>{tm.name}</option>
                                ))}
                              </select>
                            </div>

                            <div className="sm:col-span-2">
                              <label className="text-[9px] font-black uppercase text-slate-400 block mb-0.5">Prazo</label>
                              <input
                                type="date"
                                value={act.dueDate}
                                onChange={e => handleUpdateActionItem(agenda.id, act.id, { dueDate: e.target.value })}
                                className="w-full p-2 bg-white border border-slate-200 rounded-xl font-bold text-xs text-slate-800 outline-none"
                              />
                            </div>

                            <div className="sm:col-span-2 flex items-center justify-end gap-1 pt-3 sm:pt-0">
                              <button
                                type="button"
                                onClick={() => handleDeleteActionItem(agenda.id, act.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                                title="Excluir"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Action Conversion Option */}
                          <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                            {act.convertedToActivity ? (
                              <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg flex items-center gap-1">
                                <Check size={12} /> Convertida em Atividade do Projeto
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleConvertActionToActivity(agenda, act)}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-[10px] uppercase tracking-wider flex items-center gap-1 transition shadow-sm"
                              >
                                <ArrowRight size={12} /> Converter em Atividade do Projeto
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

          {/* TAB 4: CONCLUSÕES */}
          {activeTab === 'conclusoes' && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              <div className="space-y-2">
                <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Conclusões Gerais e Próximos Passos</h3>
                <p className="text-xs text-slate-500 font-medium">
                  Sintetize os resultados da reunião. Este texto figurará na seção de encerramento da Ata.
                </p>

                <textarea
                  rows={6}
                  value={generalConclusions}
                  onChange={e => setGeneralConclusions(e.target.value)}
                  placeholder="Insira as conclusões gerais, encaminhamentos institucionais ou data prevista para o próximo alinhamento..."
                  className="w-full p-4 bg-white border border-slate-300 rounded-3xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                />
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <footer className="p-5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-500 font-medium hidden sm:block">
            Preencha os campos e salve para registrar a reunião na linha do tempo do projeto.
          </p>

          <div className="flex items-center gap-3 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSaveMeeting}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/20"
            >
              Salvar Reunião
            </button>
          </div>
        </footer>

      </div>
    </div>
  );
};
