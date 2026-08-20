import React, { useState, useEffect } from 'react';
import { Task, Priority, Status, TaskNote, ReportStage, TeamMember } from '../types';
import { X, Plus, ChevronDown, ChevronUp, Users, ShieldCheck, FileText, Info, UserCheck, Link as LinkIcon, PlusCircle, Check } from 'lucide-react';
import { DossierContributionSection } from './DossierContributionSection';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  projects: string[];
  initialData?: Task | null;
  teamMembers: TeamMember[];
  hasFullAccess: boolean;
  currentProfileName?: string;
}

const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  projects, 
  initialData, 
  teamMembers, 
  hasFullAccess, 
  currentProfileName 
}) => {
  const [formData, setFormData] = useState<Partial<Task>>({
    activity: '',
    project: projects[0] || 'Geral',
    description: '',
    projectLead: currentProfileName || teamMembers[0]?.name || 'Usuário',
    collaborators: [],
    priority: 'Média',
    status: 'Planejada',
    requestDate: new Date().toISOString().split('T')[0],
    plannedStartDate: new Date().toISOString().split('T')[0],
    actualStartDate: '',
    completionDate: '',
    progress: 0,
    nextStep: '',
    isReport: false,
    reportStage: 'Em Elaboração',
    elaboratorName: '',
    collaboratorReviewerName: '',
    committeeReviewerName: '',
    fileLocation: '',
    updates: [],
    generatesRegulatoryContent: false
  });

  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [note, setNote] = useState('');
  const [isCollaboratorDropdownOpen, setIsCollaboratorDropdownOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      // If editing an existing task that has optional details populated, expand by default
      const hasOptionalContent = Boolean(
        initialData.description ||
        (initialData.collaborators && initialData.collaborators.length > 0) ||
        initialData.priority !== 'Média' ||
        initialData.status !== 'Planejada' ||
        initialData.progress > 0 ||
        initialData.isReport ||
        initialData.nextStep ||
        (initialData.updates && initialData.updates.length > 0) ||
        initialData.generatesRegulatoryContent
      );
      setShowOptionalDetails(hasOptionalContent);
    } else {
      setFormData({
        activity: '',
        project: projects[0] || 'Geral',
        description: '',
        projectLead: currentProfileName || teamMembers[0]?.name || 'Usuário',
        collaborators: [],
        priority: 'Média',
        status: 'Planejada',
        requestDate: new Date().toISOString().split('T')[0],
        plannedStartDate: new Date().toISOString().split('T')[0],
        actualStartDate: '',
        completionDate: '',
        progress: 0,
        nextStep: '',
        isReport: false,
        reportStage: 'Em Elaboração',
        elaboratorName: '',
        collaboratorReviewerName: '',
        committeeReviewerName: '',
        fileLocation: '',
        updates: [],
        generatesRegulatoryContent: false
      });
      setShowOptionalDetails(false);
    }
  }, [initialData, isOpen, teamMembers, projects, currentProfileName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity?.trim()) {
      alert('Por favor, informe o nome da atividade.');
      return;
    }

    const taskToSave: Task = {
      ...(formData as Task),
      id: formData.id || Math.random().toString(36).substring(2, 11),
      updates: formData.updates || []
    };
    onSave(taskToSave);
  };

  const addNote = () => {
    if (!note.trim()) return;
    const newNote: TaskNote = {
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString(),
      user: currentProfileName || 'Usuário',
      note: note.trim()
    };
    setFormData({ ...formData, updates: [...(formData.updates || []), newNote] });
    setNote('');
  };

  const startEditingNote = (n: TaskNote) => {
    setEditingNoteId(n.id);
    setEditingNoteText(n.note);
  };

  const saveEditedNote = () => {
    if (!editingNoteId) return;
    const updatedUpdates = (formData.updates || []).map(u => 
      u.id === editingNoteId ? { ...u, note: editingNoteText } : u
    );
    setFormData({ ...formData, updates: updatedUpdates });
    setEditingNoteId(null);
    setEditingNoteText('');
  };

  const deleteNote = (id: string) => {
    setFormData({ ...formData, updates: (formData.updates || []).filter(u => u.id !== id) });
  };

  const toggleCollaborator = (name: string) => {
    const current = formData.collaborators || [];
    if (current.includes(name)) {
      setFormData({ ...formData, collaborators: current.filter(c => c !== name) });
    } else {
      setFormData({ ...formData, collaborators: [...current, name] });
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-5xl my-auto overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150"
        onClick={() => {
          if (isCollaboratorDropdownOpen) setIsCollaboratorDropdownOpen(false);
        }}
      >
        {/* Modal Header */}
        <header className="bg-[#008779] px-6 sm:px-8 py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-lg sm:text-xl font-black uppercase tracking-tight">
              {initialData ? 'Editar Atividade' : 'Nova Atividade Setorial'}
            </h2>
            <p className="text-[9px] sm:text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-0.5">
              Garantindo a integridade dos dados regulatórios
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-9 h-9 flex items-center justify-center bg-white/15 hover:bg-white/25 rounded-full text-white transition-colors"
            title="Fechar"
          >
            <X size={20} />
          </button>
        </header>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {/* Main Essential Fields Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
            {/* Nome da Atividade */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                Nome da Atividade <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.activity}
                onChange={e => setFormData({ ...formData, activity: e.target.value })}
                placeholder="Ex.: Atualização de procedimento"
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#008779] focus:border-transparent transition"
              />
            </div>

            {/* Projeto Relacionado */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                Projeto Relacionado <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.project}
                onChange={e => setFormData({ ...formData, project: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] focus:border-transparent transition cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Data de Solicitação */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                Data de Solicitação <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.requestDate}
                onChange={e => setFormData({ ...formData, requestDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] focus:border-transparent transition"
              />
            </div>

            {/* Data Prevista */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                Data Prevista <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.completionDate}
                onChange={e => setFormData({ ...formData, completionDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] focus:border-transparent transition"
              />
            </div>
          </div>

          {/* Optional Details Trigger Button (when collapsed) */}
          {!showOptionalDetails ? (
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowOptionalDetails(true)}
                className="inline-flex items-center gap-2 px-4 py-2 border-2 border-[#008779] text-[#008779] hover:bg-teal-50/50 rounded-full font-black text-xs uppercase tracking-wider transition active:scale-95"
              >
                <Plus size={15} className="stroke-[3]" />
                Adicionar detalhes opcionais
              </button>
              <p className="text-[11px] font-medium text-slate-400 mt-1.5 ml-1">
                Descrição, responsável, prioridade, fluxo de revisão e mais.
              </p>
            </div>
          ) : (
            /* Expanded Optional Details Section */
            <div className="space-y-6 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
              {/* Optional Section Header */}
              <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                <span className="text-xs font-black text-[#008779] uppercase tracking-wider flex items-center gap-1.5">
                  <ChevronDown size={16} className="stroke-[2.5]" /> Detalhes Opcionais
                </span>
                <button
                  type="button"
                  onClick={() => setShowOptionalDetails(false)}
                  className="text-xs font-black text-slate-500 hover:text-slate-700 uppercase tracking-wider flex items-center gap-1 transition"
                >
                  Ocultar Detalhes <ChevronUp size={16} />
                </button>
              </div>

              {/* Row 1 of Optional Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 items-start">
                {/* Descrição */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Descrição
                  </label>
                  <input
                    type="text"
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o objetivo da atividade..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#008779] transition"
                  />
                </div>

                {/* Responsável pela Atividade */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Responsável pela Atividade
                  </label>
                  <div className="relative">
                    <select
                      value={formData.projectLead}
                      onChange={e => setFormData({ ...formData, projectLead: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] cursor-pointer appearance-none"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#008779] text-white flex items-center justify-center text-[9px] font-black pointer-events-none">
                      {getInitials(formData.projectLead)}
                    </div>
                  </div>
                </div>

                {/* Nível de Prioridade */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Nível de Prioridade
                  </label>
                  <select
                    value={formData.priority}
                    onChange={e => setFormData({ ...formData, priority: e.target.value as Priority })}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] cursor-pointer"
                  >
                    <option value="Baixa">Baixa</option>
                    <option value="Média">Média</option>
                    <option value="Alta">Alta</option>
                    <option value="Urgente">Urgente</option>
                  </select>
                </div>

                {/* Status Atual */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Status Atual
                  </label>
                  <select
                    value={formData.status}
                    onChange={e => {
                      const newStatus = e.target.value as Status;
                      const updates: any = { status: newStatus };
                      if (newStatus === 'Concluída') {
                        updates.progress = 100;
                      }
                      setFormData({ ...formData, ...updates });
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#008779] cursor-pointer"
                  >
                    <option value="Planejada">Planejada</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluída">Concluída</option>
                    <option value="Pausado">Pausado</option>
                    <option value="Não Aplicável">Não Aplicável</option>
                  </select>
                </div>

                {/* % de Progresso */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                      % de Progresso
                    </label>
                    <span className="text-xs font-black text-[#008779]">
                      {formData.progress || 0}%
                    </span>
                  </div>
                  <div className="py-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formData.progress || 0}
                      onChange={e => setFormData({ ...formData, progress: parseInt(e.target.value) })}
                      className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#008779]"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2 of Optional Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                {/* Equipe de Apoio */}
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Equipe de Apoio
                  </label>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCollaboratorDropdownOpen(!isCollaboratorDropdownOpen);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300"
                  >
                    <span className="truncate">
                      {formData.collaborators && formData.collaborators.length > 0
                        ? `${formData.collaborators.length} selecionado(s)`
                        : 'Selecione os integrantes'}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
                  </div>

                  {/* Dropdown Menu for Collaborators */}
                  {isCollaboratorDropdownOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-50 left-0 right-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar space-y-1 animate-in fade-in zoom-in-95 duration-100"
                    >
                      {teamMembers.map(m => {
                        const isSelected = (formData.collaborators || []).includes(m.name);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleCollaborator(m.name)}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                              isSelected ? 'bg-teal-50 text-[#008779]' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black">
                                {getInitials(m.name)}
                              </span>
                              {m.name}
                            </span>
                            {isSelected && <Check size={14} className="text-[#008779]" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Fluxo de Revisão Toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Fluxo de Revisão
                  </label>
                  <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50/70 border border-slate-200 rounded-xl h-[42px]">
                    <span className="text-xs font-bold text-slate-700">Ativar controle de etapas</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.isReport || false}
                        onChange={e => setFormData({ ...formData, isReport: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-[#008779] after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4"></div>
                    </label>
                  </div>
                </div>

                {/* Próximo Passo Estratégico */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Próximo Passo Estratégico
                  </label>
                  <input
                    type="text"
                    value={formData.nextStep || ''}
                    onChange={e => setFormData({ ...formData, nextStep: e.target.value })}
                    placeholder="Defina a próxima ação..."
                    className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#008779] transition"
                  />
                </div>

                {/* Notas de Atualização */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Notas de Atualização
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={note}
                      onChange={e => setNote(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addNote();
                        }
                      }}
                      placeholder="Adicione uma nota..."
                      className="w-full px-3.5 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[#008779] transition"
                    />
                    {note.trim() && (
                      <button
                        type="button"
                        onClick={addNote}
                        className="px-3 bg-[#008779] text-white rounded-xl hover:bg-[#007367] transition shrink-0 flex items-center justify-center"
                        title="Adicionar nota"
                      >
                        <Plus size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Sub-Panel: Review Details if isReport is true */}
              {formData.isReport && (
                <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-4 animate-in slide-in-from-top-2">
                  <div className="flex items-center gap-2 text-xs font-black text-[#008779] uppercase tracking-wide">
                    <FileText size={16} /> Detalhes do Fluxo de Revisão
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                        <Info size={12} /> Etapa da Revisão
                      </label>
                      <select
                        value={formData.reportStage}
                        onChange={e => {
                          const newStage = e.target.value as ReportStage;
                          const updates: any = { reportStage: newStage };
                          if (newStage === 'Concluído' || newStage === 'Concluído e Assinado') {
                            updates.status = 'Concluída';
                            updates.progress = 100;
                          }
                          setFormData({ ...formData, ...updates });
                        }}
                        className="w-full px-3.5 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-[#008779] outline-none"
                      >
                        <option value="Em Elaboração">Em Elaboração</option>
                        <option value="Próximo Revisor (equipe AR)">Próximo Revisor (equipe AR)</option>
                        <option value="Revisão Colaboradores">Em Revisão (Colaboradores)</option>
                        <option value="Revisão Comitê Gestor">Em Revisão (Comitê Gestor)</option>
                        <option value="Concluído">Concluído</option>
                        <option value="Concluído e Assinado">Concluído e Assinado</option>
                      </select>
                    </div>

                    {formData.reportStage === 'Em Elaboração' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                          <UserCheck size={12} /> Responsável pela Elaboração
                        </label>
                        <input
                          type="text"
                          value={formData.elaboratorName || ''}
                          onChange={e => setFormData({ ...formData, elaboratorName: e.target.value })}
                          placeholder="Nome de quem está elaborando..."
                          className="w-full px-3.5 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    )}

                    {formData.reportStage === 'Próximo Revisor (equipe AR)' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                          <UserCheck size={12} /> Revisor (Equipe AR)
                        </label>
                        <select
                          value={formData.currentReviewer || ''}
                          onChange={e => setFormData({ ...formData, currentReviewer: e.target.value })}
                          className="w-full px-3.5 py-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-amber-800 outline-none"
                        >
                          <option value="">Selecione um revisor...</option>
                          {teamMembers.map(m => (
                            <option key={m.id} value={m.name}>{m.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {formData.reportStage === 'Revisão Colaboradores' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                          <UserCheck size={12} /> Revisor (Colaboradores)
                        </label>
                        <input
                          type="text"
                          value={formData.collaboratorReviewerName || ''}
                          onChange={e => setFormData({ ...formData, collaboratorReviewerName: e.target.value })}
                          placeholder="Nome do revisor colaborador..."
                          className="w-full px-3.5 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    )}

                    {formData.reportStage === 'Revisão Comitê Gestor' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                          <UserCheck size={12} /> Revisor (Comitê Gestor)
                        </label>
                        <input
                          type="text"
                          value={formData.committeeReviewerName || ''}
                          onChange={e => setFormData({ ...formData, committeeReviewerName: e.target.value })}
                          placeholder="Nome do revisor do comitê..."
                          className="w-full px-3.5 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                        />
                      </div>
                    )}

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-tight flex items-center gap-1">
                        <LinkIcon size={12} /> Link do Arquivo
                      </label>
                      <input
                        type="text"
                        value={formData.fileLocation || ''}
                        onChange={e => setFormData({ ...formData, fileLocation: e.target.value })}
                        placeholder="Link do SharePoint, Drive, etc."
                        className="w-full px-3.5 py-2 bg-white border border-teal-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Note History List (if any exist) */}
              {formData.updates && formData.updates.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-tight">
                    Histórico de Notas ({formData.updates.length})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto custom-scrollbar">
                    {formData.updates.map(u => (
                      <div key={u.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl group relative">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-[9px] font-black text-[#008779] uppercase">{u.user}</span>
                          <span className="text-[8px] font-bold text-slate-400">{new Date(u.date).toLocaleDateString()}</span>
                        </div>
                        {editingNoteId === u.id ? (
                          <div className="space-y-1">
                            <textarea
                              value={editingNoteText}
                              onChange={e => setEditingNoteText(e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                              rows={2}
                            />
                            <div className="flex justify-end gap-1">
                              <button type="button" onClick={() => setEditingNoteId(null)} className="text-[9px] text-slate-400 hover:text-slate-600">Cancelar</button>
                              <button type="button" onClick={saveEditedNote} className="text-[9px] font-bold text-[#008779]">Salvar</button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <p className="text-xs text-slate-700 font-medium">{u.note}</p>
                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button type="button" onClick={() => startEditingNote(u)} className="text-slate-400 hover:text-[#008779]" title="Editar"><FileText size={11} /></button>
                              <button type="button" onClick={() => deleteNote(u.id)} className="text-slate-400 hover:text-red-500" title="Excluir"><X size={11} /></button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Row 3 of Optional Details: Regulatory Checkbox Card */}
              <DossierContributionSection
                activityId={formData.id || 'new_task'}
                activityName={formData.activity || 'Nova Atividade'}
                projectName={formData.project || 'Geral'}
                generatesRegulatoryContent={formData.generatesRegulatoryContent || false}
                onToggleGeneratesRegulatoryContent={(val) => setFormData({ ...formData, generatesRegulatoryContent: val })}
                contribution={formData.dossierContribution}
                onSaveContribution={(contrib) => setFormData({ ...formData, dossierContribution: contrib, generatesRegulatoryContent: true })}
                currentUser={currentProfileName}
              />
            </div>
          )}

          {/* Modal Footer / Action Buttons */}
          <div className="pt-4 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-slate-500 hover:text-slate-800 font-black uppercase text-xs tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-8 py-3 bg-[#008779] hover:bg-[#007367] text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2"
            >
              {initialData ? 'Atualizar Atividade' : 'Publicar Atividade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
