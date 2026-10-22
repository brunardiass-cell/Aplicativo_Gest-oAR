import React, { useState, useEffect } from 'react';
import { Task, Priority, Status, TaskNote, ReportStage, TeamMember, ActivityType, TaskAttachment } from '../types';
import { 
  X, 
  Plus, 
  FileText, 
  Users, 
  Calendar, 
  Clock, 
  Link as LinkIcon, 
  Check, 
  StickyNote, 
  CheckCircle,
  Paperclip,
  Trash2,
  ChevronDown
} from 'lucide-react';
import { DossierContributionSection } from './DossierContributionSection';
import { DateInput } from './DateInput';

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

export const TaskModal: React.FC<TaskModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  projects, 
  initialData, 
  teamMembers, 
  hasFullAccess, 
  currentProfileName 
}) => {
  // Determine initial activity type
  const getInitialType = (): ActivityType => {
    if (initialData?.activityType) return initialData.activityType;
    if (initialData?.isReport) return 'report';
    return 'general';
  };

  const [activeType, setActiveType] = useState<ActivityType>(getInitialType());

  const [formData, setFormData] = useState<Partial<Task>>({
    activity: '',
    project: projects[0] || 'Geral',
    description: '',
    projectLead: currentProfileName || teamMembers[0]?.name || 'Usuário',
    collaborators: [],
    priority: 'Sem prioridade',
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
    generatesRegulatoryContent: false,
    activityType: 'general',
    meetingTime: '',
    meetingParticipants: [],
    meetingLink: '',
    meetingAgenda: '',
    reportType: 'Relatório Técnico',
    attachments: []
  });

  // Notes state
  const [note, setNote] = useState('');
  const [isNoteImportant, setIsNoteImportant] = useState(false);
  const [noteAttachmentName, setNoteAttachmentName] = useState('');
  const [noteAttachmentUrl, setNoteAttachmentUrl] = useState('');
  const [showNoteAttachmentInputs, setShowNoteAttachmentInputs] = useState(false);
  
  // Participants dropdown
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      const type = initialData.activityType || (initialData.isReport ? 'report' : 'general');
      setActiveType(type);
      setFormData({
        ...initialData,
        activityType: type,
        priority: initialData.priority || 'Sem prioridade'
      });
    } else {
      setActiveType('general');
      setFormData({
        activity: '',
        project: projects[0] || 'Geral',
        description: '',
        projectLead: currentProfileName || teamMembers[0]?.name || 'Usuário',
        collaborators: [],
        priority: 'Sem prioridade',
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
        generatesRegulatoryContent: false,
        activityType: 'general',
        meetingTime: '',
        meetingParticipants: [],
        meetingLink: '',
        meetingAgenda: '',
        reportType: 'Relatório Técnico',
        attachments: []
      });
    }
  }, [initialData, isOpen, teamMembers, projects, currentProfileName]);

  // When active type changes on creation
  const handleTypeSelect = (type: ActivityType) => {
    setActiveType(type);
    if (!initialData) {
      if (type === 'note') {
        setFormData(prev => ({
          ...prev,
          activityType: 'note',
          isReport: false,
          status: 'Concluída',
          progress: 100,
          completionDate: ''
        }));
      } else if (type === 'report') {
        setFormData(prev => ({
          ...prev,
          activityType: 'report',
          isReport: true,
          reportStage: prev.reportStage || 'Em Elaboração',
          status: 'Em Andamento',
          progress: prev.progress || 25
        }));
      } else if (type === 'meeting') {
        setFormData(prev => ({
          ...prev,
          activityType: 'meeting',
          isReport: false,
          status: 'Planejada'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          activityType: 'general',
          isReport: false,
          status: 'Planejada'
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        activityType: type,
        isReport: type === 'report'
      }));
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.activity?.trim()) {
      alert('Por favor, informe o título da atividade.');
      return;
    }

    const isNote = activeType === 'note';
    const isReport = activeType === 'report';
    const isMeeting = activeType === 'meeting';
    const now = new Date();
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const taskToSave: Task = {
      ...(formData as Task),
      id: formData.id || Math.random().toString(36).substring(2, 11),
      activity: formData.activity.trim(),
      project: formData.project || 'Geral',
      activityType: activeType,
      isReport: isReport,
      reportReviewer: isReport ? (formData.reportReviewer || formData.currentReviewer) : undefined,
      currentReviewer: isReport ? (formData.currentReviewer || formData.reportReviewer) : undefined,
      status: isNote ? 'Concluída' : (formData.status || 'Planejada'),
      progress: isNote ? 100 : (formData.progress || 0),
      priority: formData.priority || 'Sem prioridade',
      completedAt: isNote ? (formData.completedAt || now.toISOString()) : formData.completedAt,
      showInActivitiesUntil: (isNote || isMeeting) ? (formData.showInActivitiesUntil || sevenDaysFromNow) : formData.showInActivitiesUntil,
      completionDisplayChoice: isNote ? 'keep_7_days' : formData.completionDisplayChoice,
      updates: formData.updates || []
    };

    onSave(taskToSave);
  };

  const addNote = () => {
    if (!note.trim()) return;
    
    const attachments: TaskAttachment[] = [];
    if (noteAttachmentName.trim()) {
      attachments.push({
        id: Math.random().toString(36).substring(2, 11),
        name: noteAttachmentName.trim(),
        url: noteAttachmentUrl.trim() || undefined,
        date: new Date().toISOString()
      });
    }

    const newNote: TaskNote = {
      id: Math.random().toString(36).substring(2, 11),
      date: new Date().toISOString(),
      user: currentProfileName || 'Usuário',
      note: note.trim(),
      isImportant: isNoteImportant,
      acknowledgedBy: isNoteImportant && currentProfileName ? [currentProfileName] : [],
      attachments: attachments.length > 0 ? attachments : undefined
    };

    setFormData(prev => ({
      ...prev,
      updates: [newNote, ...(prev.updates || [])]
    }));

    setNote('');
    setIsNoteImportant(false);
    setNoteAttachmentName('');
    setNoteAttachmentUrl('');
    setShowNoteAttachmentInputs(false);
  };

  const deleteNote = (id: string) => {
    setFormData(prev => ({
      ...prev,
      updates: (prev.updates || []).filter(u => u.id !== id)
    }));
  };

  const toggleParticipant = (name: string) => {
    const current = formData.meetingParticipants || formData.collaborators || [];
    const updated = current.includes(name) 
      ? current.filter(c => c !== name) 
      : [...current, name];
    
    setFormData(prev => ({
      ...prev,
      meetingParticipants: updated,
      collaborators: updated
    }));
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div 
        className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl my-auto overflow-hidden border border-slate-100 flex flex-col max-h-[94vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={() => {
          if (isParticipantsOpen) setIsParticipantsOpen(false);
        }}
      >
        {/* Header */}
        <header className="bg-slate-900 px-5 sm:px-8 py-4 sm:py-5 flex justify-between items-center text-white shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-teal-400"></span>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                {initialData ? 'Editar Atividade' : 'Nova Atividade'}
              </h2>
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-0.5">
              CTVacinas • Gestão e Acompanhamento Estratégico
            </p>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
            title="Fechar"
          >
            <X size={18} />
          </button>
        </header>

        {/* 4 Activity Types Selector */}
        <div className="p-4 sm:p-6 pb-2 border-b border-slate-100 bg-slate-50/70">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 block">
            Selecione o Tipo de Atividade
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {/* 1. Atividade Geral */}
            <button
              type="button"
              onClick={() => handleTypeSelect('general')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                activeType === 'general'
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeType === 'general' ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-700'}`}>
                  <FileText size={16} />
                </div>
                {activeType === 'general' && <Check size={14} className="text-white" />}
              </div>
              <div>
                <span className="text-xs font-black uppercase block tracking-tight">Geral</span>
                <span className={`text-[9px] font-medium leading-tight block mt-0.5 ${activeType === 'general' ? 'text-teal-100' : 'text-slate-400'}`}>
                  Tarefas e planos
                </span>
              </div>
            </button>

            {/* 2. Reunião */}
            <button
              type="button"
              onClick={() => handleTypeSelect('meeting')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                activeType === 'meeting'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeType === 'meeting' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700'}`}>
                  <Users size={16} />
                </div>
                {activeType === 'meeting' && <Check size={14} className="text-white" />}
              </div>
              <div>
                <span className="text-xs font-black uppercase block tracking-tight">Reunião</span>
                <span className={`text-[9px] font-medium leading-tight block mt-0.5 ${activeType === 'meeting' ? 'text-blue-100' : 'text-slate-400'}`}>
                  Pautas e encontros
                </span>
              </div>
            </button>

            {/* 3. Relatório */}
            <button
              type="button"
              onClick={() => handleTypeSelect('report')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                activeType === 'report'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeType === 'report' ? 'bg-white/20 text-white' : 'bg-purple-50 text-purple-700'}`}>
                  <FileText size={16} />
                </div>
                {activeType === 'report' && <Check size={14} className="text-white" />}
              </div>
              <div>
                <span className="text-xs font-black uppercase block tracking-tight">Relatório</span>
                <span className={`text-[9px] font-medium leading-tight block mt-0.5 ${activeType === 'report' ? 'text-purple-100' : 'text-slate-400'}`}>
                  Fluxo de revisão
                </span>
              </div>
            </button>

            {/* 4. Nota */}
            <button
              type="button"
              onClick={() => handleTypeSelect('note')}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                activeType === 'note'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-200'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeType === 'note' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'}`}>
                  <StickyNote size={16} />
                </div>
                {activeType === 'note' && <Check size={14} className="text-white" />}
              </div>
              <div>
                <span className="text-xs font-black uppercase block tracking-tight">Nota</span>
                <span className={`text-[9px] font-medium leading-tight block mt-0.5 ${activeType === 'note' ? 'text-amber-100' : 'text-slate-400'}`}>
                  Registro rápido
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* ======================= 1. ATIVIDADE GERAL FORM ======================= */}
          {activeType === 'general' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Título da Atividade <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.activity || ''}
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="Ex.: Elaboração do protocolo de purificação da SpiN-UTG"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500 transition"
                  />
                </div>

                {/* Projeto */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Projeto <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project}
                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Responsável */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Responsável <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.projectLead}
                      onChange={e => setFormData({ ...formData, projectLead: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer appearance-none"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center text-[9px] font-black pointer-events-none">
                      {getInitials(formData.projectLead)}
                    </div>
                  </div>
                </div>

                {/* Data de Solicitação */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Data de Solicitação <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.requestDate}
                    onChange={e => setFormData({ ...formData, requestDate: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Data Prevista */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Data Prevista (Prazo) <span className="text-red-500">*</span>
                  </label>
                  <DateInput
                    value={formData.completionDate || ''}
                    onChange={val => setFormData({ ...formData, completionDate: val })}
                    className="w-full"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    Descrição Detalhada
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descreva o escopo, requisitos e orientações desta atividade..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                {/* Próximo Passo Estratégico */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    Próximo Passo Estratégico
                  </label>
                  <input
                    type="text"
                    value={formData.nextStep || ''}
                    onChange={e => setFormData({ ...formData, nextStep: e.target.value })}
                    placeholder="Ex.: Submeter para aprovação da liderança técnica"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= 2. REUNIÃO FORM ======================= */}
          {activeType === 'meeting' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Título da Reunião <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.activity || ''}
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="Ex.: Alinhamento Regulatório - Dossiê SpiN-UTG"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500 transition"
                  />
                </div>

                {/* Projeto */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Projeto <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project}
                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Responsável / Organizador */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Responsável (Organizador) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.projectLead}
                      onChange={e => setFormData({ ...formData, projectLead: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer appearance-none"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-black pointer-events-none">
                      {getInitials(formData.projectLead)}
                    </div>
                  </div>
                </div>

                {/* Data da Reunião */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Data da Reunião <span className="text-red-500">*</span>
                  </label>
                  <DateInput
                    value={formData.completionDate || ''}
                    onChange={val => setFormData({ ...formData, completionDate: val })}
                    className="w-full"
                  />
                </div>

                {/* Horário */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    <Clock size={12} /> Horário <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.meetingTime || '14:00'}
                    onChange={e => setFormData({ ...formData, meetingTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Link da Reunião */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    <LinkIcon size={12} /> Link da Reunião (Teams, Google Meet, Zoom)
                  </label>
                  <input
                    type="url"
                    value={formData.meetingLink || formData.fileLocation || ''}
                    onChange={e => setFormData({ ...formData, meetingLink: e.target.value, fileLocation: e.target.value })}
                    placeholder="https://teams.microsoft.com/l/meetup-join/..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Participantes */}
                <div className="space-y-1 sm:col-span-2 relative">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center justify-between">
                    <span>Participantes</span>
                    <span className="text-[10px] text-blue-600 font-bold">
                      {(formData.meetingParticipants || formData.collaborators || []).length} selecionado(s)
                    </span>
                  </label>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsParticipantsOpen(!isParticipantsOpen);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 flex items-center justify-between cursor-pointer hover:border-slate-300"
                  >
                    <span className="truncate">
                      {(formData.meetingParticipants || formData.collaborators || []).length > 0
                        ? (formData.meetingParticipants || formData.collaborators || []).join(', ')
                        : 'Clique para selecionar participantes'}
                    </span>
                    <ChevronDown size={14} className="text-slate-400 shrink-0 ml-1" />
                  </div>

                  {isParticipantsOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute z-50 left-0 right-0 mt-1 p-2 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar space-y-1 animate-in fade-in zoom-in-95 duration-100"
                    >
                      {teamMembers.map(m => {
                        const isSelected = (formData.meetingParticipants || formData.collaborators || []).includes(m.name);
                        return (
                          <div
                            key={m.id}
                            onClick={() => toggleParticipant(m.name)}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs font-bold cursor-pointer transition ${
                              isSelected ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black">
                                {getInitials(m.name)}
                              </span>
                              {m.name}
                            </span>
                            {isSelected && <Check size={14} className="text-blue-600" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Pauta */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    Pauta da Reunião
                  </label>
                  <textarea
                    rows={3}
                    value={formData.meetingAgenda || formData.description || ''}
                    onChange={e => setFormData({ ...formData, meetingAgenda: e.target.value, description: e.target.value })}
                    placeholder="Pontos a serem discutidos, objetivos e deliberações esperadas..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= 3. RELATÓRIO FORM ======================= */}
          {activeType === 'report' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Título do Relatório <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.activity || ''}
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="Ex.: Relatório de Validação de Método Analítico"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500 transition"
                  />
                </div>

                {/* Projeto */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Projeto <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.project}
                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    {projects.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo de Relatório */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Tipo de Relatório <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.reportType || 'Relatório Técnico'}
                    onChange={e => setFormData({ ...formData, reportType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  >
                    <option value="Relatório Técnico">Relatório Técnico</option>
                    <option value="Relatório Mensal">Relatório Mensal</option>
                    <option value="Relatório de Validação">Relatório de Validação</option>
                    <option value="Relatório de Estabilidade">Relatório de Estabilidade</option>
                    <option value="Relatório Regulatório">Relatório Regulatório</option>
                    <option value="Relatório de Qualidade">Relatório de Qualidade</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>

                {/* Responsável */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Responsável <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.projectLead}
                      onChange={e => setFormData({ ...formData, projectLead: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer appearance-none"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[9px] font-black pointer-events-none">
                      {getInitials(formData.projectLead)}
                    </div>
                  </div>
                </div>

                {/* Prazo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Prazo Final <span className="text-red-500">*</span>
                  </label>
                  <DateInput
                    value={formData.completionDate || ''}
                    onChange={val => setFormData({ ...formData, completionDate: val })}
                    className="w-full"
                  />
                </div>

                {/* Descrição */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    Descrição do Relatório
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Finalidade e dados contemplados no documento..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Próximo Passo Estratégico */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    Próximo Passo Estratégico
                  </label>
                  <input
                    type="text"
                    value={formData.nextStep || ''}
                    onChange={e => setFormData({ ...formData, nextStep: e.target.value })}
                    placeholder="Ex.: Enviar para aprovação dos revisores"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Fluxo de Revisão Integrado (Sem botão de ativar, diretamente visível como solicitado) */}
              <div className="p-4 bg-purple-50/70 border border-purple-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText size={15} /> Fluxo de Revisão Regulatório
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-200 text-purple-900">
                    Status Automático: {formData.status || 'Em Revisão'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {/* Etapa */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-900 uppercase tracking-tight">
                      Etapa Atual
                    </label>
                    <select
                      value={formData.reportStage || 'Em Elaboração'}
                      onChange={e => {
                        const newStage = e.target.value as ReportStage;
                        const isDone = newStage === 'Concluído' || newStage === 'Concluído e Assinado';
                        setFormData({
                          ...formData,
                          reportStage: newStage,
                          status: isDone ? 'Concluída' : 'Em Andamento',
                          progress: isDone ? 100 : (formData.progress || 50)
                        });
                      }}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-purple-900 outline-none"
                    >
                      <option value="Em Elaboração">Em Elaboração</option>
                      <option value="Próximo Revisor (equipe AR)">Próximo Revisor (equipe AR)</option>
                      <option value="Revisão Colaboradores">Revisão Colaboradores</option>
                      <option value="Revisão Comitê Gestor">Revisão Comitê Gestor</option>
                      <option value="Concluído">Concluído</option>
                      <option value="Concluído e Assinado">Concluído e Assinado</option>
                    </select>
                  </div>

                  {/* Revisor / Responsável Atual */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-purple-900 uppercase tracking-tight">
                      Com quem está / Revisor Designado
                    </label>
                    <select
                      value={formData.reportReviewer || formData.currentReviewer || ''}
                      onChange={e => setFormData({ ...formData, currentReviewer: e.target.value, reportReviewer: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    >
                      <option value="">Selecione quem está com o relatório...</option>
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Link do Arquivo */}
                  <div className="space-y-1 sm:col-span-2 lg:col-span-1">
                    <label className="text-[10px] font-black text-purple-900 uppercase tracking-tight flex items-center gap-1">
                      <LinkIcon size={12} /> Link do Arquivo
                    </label>
                    <input
                      type="url"
                      value={formData.fileLocation || ''}
                      onChange={e => setFormData({ ...formData, fileLocation: e.target.value })}
                      placeholder="Link do SharePoint ou Drive..."
                      className="w-full px-3 py-2 bg-white border border-purple-300 rounded-xl text-xs font-bold text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ======================= 4. NOTA FORM ======================= */}
          {activeType === 'note' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-bold flex items-center gap-2">
                <CheckCircle size={16} className="text-amber-600 shrink-0" />
                <span>Notas não requerem prazo e são criadas como <strong>Concluídas</strong> por padrão para registro histórico rápido.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Título */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Título da Nota <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.activity || ''}
                    onChange={e => setFormData({ ...formData, activity: e.target.value })}
                    placeholder="Ex.: Registro de deliberação técnica sobre adjuvante"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500 transition"
                  />
                </div>

                {/* Projeto (Opcional) */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                    Projeto (Opcional)
                  </label>
                  <select
                    value={formData.project || 'Geral'}
                    onChange={e => setFormData({ ...formData, project: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="Geral">Geral (Nenhum projeto específico)</option>
                    {projects.filter(p => p !== 'Geral').map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                {/* Responsável */}
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Responsável (Autor) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={formData.projectLead}
                      onChange={e => setFormData({ ...formData, projectLead: e.target.value })}
                      className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer appearance-none"
                    >
                      {teamMembers.map(m => (
                        <option key={m.id} value={m.name}>{m.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-2.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-[9px] font-black pointer-events-none">
                      {getInitials(formData.projectLead)}
                    </div>
                  </div>
                </div>

                {/* Descrição */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[11px] font-black text-slate-700 uppercase tracking-tight flex items-center gap-1">
                    Conteúdo da Nota <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={formData.description || ''}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Escreva a anotação, contexto, decisão técnica ou lembrete importante..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ======================= NOTAS DE ATUALIZAÇÃO (TODOS OS TIPOS) ======================= */}
          <div className="pt-4 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Paperclip size={14} className="text-teal-600" /> Notas de Atualização e Anexos
              </label>
              <label className="flex items-center gap-1.5 text-xs font-bold text-amber-700 cursor-pointer bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <input
                  type="checkbox"
                  checked={isNoteImportant}
                  onChange={e => setIsNoteImportant(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5 cursor-pointer"
                />
                <span>Marcar como importante ⭐</span>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
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
                  placeholder={isNoteImportant ? "⭐ Escreva uma atualização importante..." : "Adicionar nota de atualização..."}
                  className={`flex-1 px-3.5 py-2.5 rounded-xl text-xs font-semibold placeholder-slate-400 outline-none border transition ${
                    isNoteImportant 
                      ? 'bg-amber-50/70 border-amber-300 text-amber-950 focus:ring-2 focus:ring-amber-400' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-2 focus:ring-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowNoteAttachmentInputs(!showNoteAttachmentInputs)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center transition shrink-0 ${
                    showNoteAttachmentInputs || noteAttachmentName
                      ? 'bg-teal-50 border-teal-300 text-teal-700'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                  title="Anexar link ou documento"
                >
                  <Paperclip size={16} />
                </button>
                <button
                  type="button"
                  onClick={addNote}
                  disabled={!note.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
                >
                  <Plus size={15} /> Adicionar
                </button>
              </div>

              {/* Optional Anexo Inputs for Note */}
              {showNoteAttachmentInputs && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-150">
                  <input
                    type="text"
                    value={noteAttachmentName}
                    onChange={e => setNoteAttachmentName(e.target.value)}
                    placeholder="Nome do anexo (ex: Parecer_Tecnico.pdf)"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                  <input
                    type="url"
                    value={noteAttachmentUrl}
                    onChange={e => setNoteAttachmentUrl(e.target.value)}
                    placeholder="Link do anexo (SharePoint/Drive)"
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800"
                  />
                </div>
              )}

              {/* List of existing updates */}
              {formData.updates && formData.updates.length > 0 && (
                <div className="space-y-2 pt-2 max-h-44 overflow-y-auto custom-scrollbar">
                  {formData.updates.map((u) => (
                    <div 
                      key={u.id}
                      className={`p-3 rounded-xl border text-xs relative ${
                        u.isImportant 
                          ? 'bg-amber-50/80 border-amber-300 text-amber-950 ring-1 ring-amber-200' 
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-slate-900 text-[10px] uppercase">
                            {u.user}
                          </span>
                          {u.isImportant && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-200 text-amber-900">
                              Importante
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold text-slate-400">
                            {new Date(u.date).toLocaleDateString('pt-BR')} às {new Date(u.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteNote(u.id)}
                            className="text-slate-400 hover:text-red-500 p-0.5 transition"
                            title="Remover nota"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                      <p className="text-xs leading-relaxed font-medium">{u.note}</p>
                      {u.attachments && u.attachments.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {u.attachments.map(att => (
                            <a
                              key={att.id}
                              href={att.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 hover:border-teal-400 rounded-lg text-[10px] font-bold text-teal-800 transition shadow-2xs"
                            >
                              <Paperclip size={10} /> {att.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Dossier Regulatory Check (Preserved) */}
          <div className="pt-2">
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

          {/* Sticky Modal Footer */}
          <div className="sticky bottom-0 bg-white pt-4 pb-1 border-t border-slate-100 flex justify-end items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-600 hover:text-slate-900 font-bold text-xs uppercase tracking-wider transition rounded-xl"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-7 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition active:scale-95 flex items-center gap-2"
            >
              <Check size={16} />
              {initialData ? 'Atualizar Atividade' : 'Salvar Atividade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
