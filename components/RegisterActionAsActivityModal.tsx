import React, { useState, useEffect, useMemo } from 'react';
import { Project, TeamMember, MeetingActionItem } from '../types';
import { X, Check, FolderKanban, Layers, ListTodo, Plus, ArrowRight, UserCheck, Calendar, CheckCircle2 } from 'lucide-react';

interface RegisterActionAsActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionItem: MeetingActionItem | null;
  agendaTitle?: string;
  meetingTitle?: string;
  defaultProjectId?: string;
  defaultMacroId?: string;
  projects: Project[];
  teamMembers: TeamMember[];
  onConfirm: (data: {
    projectId: string;
    macroActivityId: string;
    targetMicroId?: string;
    microName: string;
    assignee: string;
    dueDate: string;
    isNewMicro: boolean;
  }) => void;
}

export const RegisterActionAsActivityModal: React.FC<RegisterActionAsActivityModalProps> = ({
  isOpen,
  onClose,
  actionItem,
  agendaTitle,
  meetingTitle,
  defaultProjectId,
  defaultMacroId,
  projects,
  teamMembers,
  onConfirm
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [selectedMacroId, setSelectedMacroId] = useState<string>('');
  const [mode, setMode] = useState<'new' | 'existing'>('new');
  const [selectedMicroId, setSelectedMicroId] = useState<string>('');
  const [microName, setMicroName] = useState<string>('');
  const [assignee, setAssignee] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');

  useEffect(() => {
    if (isOpen && actionItem) {
      const initialProjId = defaultProjectId || (projects[0]?.id || '');
      setSelectedProjectId(initialProjId);

      const proj = projects.find(p => p.id === initialProjId);
      const initialMacroId = defaultMacroId || proj?.macroActivities?.[0]?.id || '';
      setSelectedMacroId(initialMacroId);

      const targetMacro = proj?.macroActivities?.find(m => m.id === initialMacroId);
      const firstMicro = targetMacro?.microActivities?.[0]?.id || '';
      setSelectedMicroId(firstMicro);

      setMode('new');
      setMicroName(`[Reunião] ${actionItem.action}`);
      setAssignee(actionItem.responsible || teamMembers[0]?.name || 'Responsável');
      setDueDate(actionItem.dueDate || new Date().toISOString().split('T')[0]);
    }
  }, [isOpen, actionItem, defaultProjectId, defaultMacroId, projects, teamMembers]);

  const selectedProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId);
  }, [projects, selectedProjectId]);

  const macroActivities = useMemo(() => {
    return selectedProject?.macroActivities || [];
  }, [selectedProject]);

  const selectedMacro = useMemo(() => {
    return macroActivities.find(m => m.id === selectedMacroId);
  }, [macroActivities, selectedMacroId]);

  const microActivities = useMemo(() => {
    return selectedMacro?.microActivities || [];
  }, [selectedMacro]);

  const handleProjectChange = (projId: string) => {
    setSelectedProjectId(projId);
    const p = projects.find(proj => proj.id === projId);
    const firstMacro = p?.macroActivities?.[0]?.id || '';
    setSelectedMacroId(firstMacro);
    const m = p?.macroActivities?.find(macro => macro.id === firstMacro);
    setSelectedMicroId(m?.microActivities?.[0]?.id || '');
  };

  const handleMacroChange = (macroId: string) => {
    setSelectedMacroId(macroId);
    const m = macroActivities.find(macro => macro.id === macroId);
    setSelectedMicroId(m?.microActivities?.[0]?.id || '');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
      alert('Selecione um projeto de destino.');
      return;
    }
    if (!selectedMacroId) {
      alert('Selecione uma macroatividade.');
      return;
    }
    if (mode === 'new' && !microName.trim()) {
      alert('Informe o nome da nova microatividade.');
      return;
    }
    if (mode === 'existing' && !selectedMicroId) {
      alert('Selecione a microatividade existente.');
      return;
    }

    onConfirm({
      projectId: selectedProjectId,
      macroActivityId: selectedMacroId,
      targetMicroId: mode === 'existing' ? selectedMicroId : undefined,
      microName: microName.trim(),
      assignee: assignee || 'Responsável',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      isNewMicro: mode === 'new'
    });

    onClose();
  };

  if (!isOpen || !actionItem) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-[130] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <FolderKanban size={18} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-300 tracking-wider block">
                Governança & Execução
              </span>
              <h3 className="text-base font-black uppercase tracking-tight text-white">
                Registrar Encaminhamento no Projeto
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl text-slate-300 transition"
          >
            <X size={18} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs">
          
          {/* Action Item Info Summary */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
            <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Encaminhamento da Reunião
            </span>
            <p className="font-bold text-slate-800 text-xs">
              {actionItem.action}
            </p>
            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 font-medium pt-1">
              <span><strong>Responsável:</strong> {actionItem.responsible || 'A definir'}</span>
              <span>•</span>
              <span><strong>Prazo:</strong> {actionItem.dueDate ? actionItem.dueDate.split('-').reverse().join('/') : 'Sem prazo'}</span>
              {agendaTitle && (
                <>
                  <span>•</span>
                  <span><strong>Pauta:</strong> {agendaTitle}</span>
                </>
              )}
            </div>
          </div>

          {/* Destination Selection */}
          <div className="space-y-4">
            
            {/* 1. Select Project */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-600 block flex items-center gap-1.5">
                <FolderKanban size={13} className="text-indigo-600" />
                1. Projeto de Destino:
              </label>
              <select
                value={selectedProjectId}
                onChange={e => handleProjectChange(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* 2. Select Macroactivity */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-600 block flex items-center gap-1.5">
                <Layers size={13} className="text-indigo-600" />
                2. Macroatividade de Destino:
              </label>
              {macroActivities.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 font-medium">
                  Este projeto não possui macroatividades cadastradas.
                </div>
              ) : (
                <select
                  value={selectedMacroId}
                  onChange={e => handleMacroChange(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {macroActivities.map((m, idx) => (
                    <option key={m.id} value={m.id}>
                      {m.phase ? `[${m.phase}] ` : `[Macro ${idx + 1}] `}{m.name} ({m.microActivities?.length || 0} microatividades)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Microactivity Mode Selection */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="text-[10px] font-black uppercase text-slate-600 block flex items-center gap-1.5">
                <ListTodo size={13} className="text-indigo-600" />
                3. Microatividade:
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMode('new')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    mode === 'new'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Plus size={14} className={mode === 'new' ? 'text-indigo-600' : ''} />
                  <span>Criar Nova Microatividade</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('existing')}
                  disabled={microActivities.length === 0}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs flex items-center justify-center gap-1.5 transition ${
                    mode === 'existing'
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-900 shadow-xs'
                      : microActivities.length === 0
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <ArrowRight size={14} className={mode === 'existing' ? 'text-indigo-600' : ''} />
                  <span>Inserir em Existente ({microActivities.length})</span>
                </button>
              </div>

              {/* Mode: New Microactivity */}
              {mode === 'new' && (
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 block">
                      Nome da Nova Microatividade
                    </label>
                    <input
                      type="text"
                      value={microName}
                      onChange={e => setMicroName(e.target.value)}
                      placeholder="Nome descritivo da microatividade..."
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 block flex items-center gap-1">
                        <UserCheck size={11} /> Responsável
                      </label>
                      <select
                        value={assignee}
                        onChange={e => setAssignee(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                      >
                        {teamMembers.map(tm => (
                          <option key={tm.id} value={tm.name}>{tm.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500 block flex items-center gap-1">
                        <Calendar size={11} /> Prazo de Entrega
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={e => setDueDate(e.target.value)}
                        className="w-full p-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mode: Insert in Existing Microactivity */}
              {mode === 'existing' && (
                <div className="p-3.5 bg-indigo-50/40 border border-indigo-200/80 rounded-2xl space-y-3 animate-in fade-in duration-150">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 block">
                      Selecione a Microatividade Existente
                    </label>
                    <select
                      value={selectedMicroId}
                      onChange={e => setSelectedMicroId(e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {microActivities.map((micro, idx) => (
                        <option key={micro.id} value={micro.id}>
                          {idx + 1}. {micro.name} (Resp: {micro.assignee || 'N/I'})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    O encaminhamento será anexado às observações e histórico de execução desta microatividade.
                  </p>
                </div>
              )}

            </div>

          </div>

          {/* Footer Actions */}
          <footer className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={!selectedProjectId || !selectedMacroId}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition shadow-md disabled:opacity-50"
            >
              <CheckCircle2 size={16} />
              <span>Confirmar e Inserir no Projeto</span>
            </button>
          </footer>

        </form>

      </div>
    </div>
  );
};
