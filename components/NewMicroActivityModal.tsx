import React, { useState } from 'react';
import { Project, MacroActivity, MicroActivity, TeamMember, Priority, MicroActivityStatus, Prerequisite } from '../types';
import { 
  X, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  Layers, 
  AlertCircle, 
  CheckCircle, 
  ListOrdered,
  FileText,
  ShieldCheck,
  Link,
  Sparkles
} from 'lucide-react';

interface NewMicroActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  selectedMacroId?: string;
  teamMembers: TeamMember[];
  onAddMicroActivity: (macroId: string, newMicro: MicroActivity) => void;
}

export const NewMicroActivityModal: React.FC<NewMicroActivityModalProps> = ({
  isOpen,
  onClose,
  project,
  selectedMacroId,
  teamMembers,
  onAddMicroActivity
}) => {
  const [macroId, setMacroId] = useState<string>(selectedMacroId || project.macroActivities[0]?.id || '');
  const [name, setName] = useState('');
  const [assignee, setAssignee] = useState(teamMembers[0]?.name || project.responsible || '');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<MicroActivityStatus>('Em andamento');
  const [priority, setPriority] = useState<Priority>('Média');
  const [progress, setProgress] = useState<number>(0);
  
  // Progressive disclosure toggle
  const [showAdvancedDetails, setShowAdvancedDetails] = useState(false);
  
  // Advanced fields
  const [observations, setObservations] = useState('');
  const [dependsOnMicroIds, setDependsOnMicroIds] = useState<string[]>([]);
  const [blocksMicroIds, setBlocksMicroIds] = useState<string[]>([]);
  const [customPrerequisiteName, setCustomPrerequisiteName] = useState('');
  const [customPrerequisites, setCustomPrerequisites] = useState<Prerequisite[]>([]);
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  // Flatten existing microactivities for dependency select
  const allExistingMicros = project.macroActivities.flatMap(m => 
    m.microActivities.map(mi => ({ ...mi, macroName: m.name }))
  );

  const handleAddCustomPrerequisite = () => {
    if (!customPrerequisiteName.trim()) return;
    const newPre: Prerequisite = {
      id: 'pre_' + Math.random().toString(36).substr(2, 9),
      name: customPrerequisiteName.trim(),
      type: 'recurso',
      status: 'não iniciado',
      completed: false,
      leadTimeDays: 7
    };
    setCustomPrerequisites([...customPrerequisites, newPre]);
    setCustomPrerequisiteName('');
  };

  const handleRemoveCustomPrerequisite = (id: string) => {
    setCustomPrerequisites(customPrerequisites.filter(p => p.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !macroId) return;

    const newMicro: MicroActivity = {
      id: 'micro_' + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      assignee: assignee || 'Não atribuído',
      dueDate,
      startDate,
      status,
      priority,
      progress: status === 'Concluído e aprovado' ? 100 : progress,
      code: code.trim() || undefined,
      observations: observations.trim(),
      dependsOnMicroIds,
      blocksMicroIds,
      prerequisites: customPrerequisites.length > 0 ? customPrerequisites : undefined
    };

    onAddMicroActivity(macroId, newMicro);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <header className="p-6 bg-slate-50/80 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 border border-teal-100/90 flex items-center justify-center shadow-2xs shrink-0">
              <Plus size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                Nova Microatividade
              </h2>
              <p className="text-xs font-bold text-slate-400">
                {project.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-full transition text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          
          {/* ESSENTIAL FIELD 1: Name */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
              Nome da Microatividade *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Síntese do DNA plasmidial recombinante"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
            />
          </div>

          {/* ESSENTIAL ROW: Macro/Fase + Responsável */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Macroetapa / Fase *
              </label>
              <select
                value={macroId}
                onChange={(e) => setMacroId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
              >
                {project.macroActivities.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} ({m.phase || 'Fase'})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Responsável *
              </label>
              <select
                value={assignee}
                onChange={(e) => setAssignee(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
              >
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.name}>
                    {member.name} {member.role ? `(${member.role})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* ESSENTIAL ROW: Prazo, Status, Prioridade */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Prazo de Conclusão *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => {
                  const val = e.target.value as MicroActivityStatus;
                  setStatus(val);
                  if (val === 'Concluído e aprovado') setProgress(100);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
              >
                <option value="Em andamento">Em andamento</option>
                <option value="Planejado">Planejada</option>
                <option value="Concluído e aprovado">Concluída e aprovada</option>
                <option value="Concluído com restrições">Concluída com restrições</option>
                <option value="A repetir / retrabalho">A repetir / retrabalho</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
              >
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
                <option value="Urgente">Urgente</option>
              </select>
            </div>
          </div>

          {/* Progresso Slider */}
          <div className="space-y-2 pt-1">
            <div className="flex justify-between items-center text-xs font-black">
              <span className="text-slate-500 uppercase tracking-wider text-[11px]">Progresso</span>
              <span className="text-teal-700">{progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              className="w-full accent-teal-600 h-2 bg-slate-100 rounded-lg cursor-pointer"
            />
          </div>

          {/* PROGRESSIVE DISCLOSURE TOGGLE: "Adicionar detalhes" */}
          <div className="pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowAdvancedDetails(!showAdvancedDetails)}
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-teal-700 hover:text-teal-900 transition py-1"
            >
              {showAdvancedDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              <span>{showAdvancedDetails ? 'Ocultar detalhes adicionais' : '+ Adicionar detalhes (Pré-requisitos, Observações, Código)'}</span>
            </button>
          </div>

          {/* ADVANCED SECTION */}
          {showAdvancedDetails && (
            <div className="space-y-4 pt-2 animate-in fade-in duration-200">
              
              {/* Código / Numeração (ex: 2.1, 2.2) */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Código Identificador (opcional)
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Ex: 2.1 ou ATIV-01"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
                />
              </div>

              {/* Pré-requisitos: Atividades das quais depende */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Para iniciar isto, é necessário (Dependência de outras atividades):
                </label>
                
                <div className="max-h-36 overflow-y-auto custom-scrollbar border border-slate-200 rounded-2xl p-2.5 bg-slate-50 space-y-1.5">
                  {allExistingMicros.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic p-1">Nenhuma outra atividade existente no projeto.</p>
                  ) : (
                    allExistingMicros.map((mi) => (
                      <label key={mi.id} className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:bg-white p-1.5 rounded-lg cursor-pointer transition">
                        <input
                          type="checkbox"
                          checked={dependsOnMicroIds.includes(mi.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setDependsOnMicroIds([...dependsOnMicroIds, mi.id]);
                            } else {
                              setDependsOnMicroIds(dependsOnMicroIds.filter(id => id !== mi.id));
                            }
                          }}
                          className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4"
                        />
                        <span className="truncate">
                          {mi.code ? `[${mi.code}] ` : ''}{mi.name} <span className="text-[10px] text-slate-400 font-normal">({mi.macroName})</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Pré-requisitos avulsos / condições customizadas */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Condições de Pré-requisito Específicas
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPrerequisiteName}
                    onChange={(e) => setCustomPrerequisiteName(e.target.value)}
                    placeholder="Ex: Aprovação do comitê de ética..."
                    className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomPrerequisite}
                    className="px-3.5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-black transition"
                  >
                    Adicionar
                  </button>
                </div>

                {customPrerequisites.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {customPrerequisites.map((p) => (
                      <div key={p.id} className="flex items-center justify-between px-3 py-1.5 bg-slate-100 rounded-xl text-xs font-bold text-slate-700">
                        <span>{p.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomPrerequisite(p.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observações / Descrição */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                  Observações e Informações Operacionais
                </label>
                <textarea
                  rows={3}
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Descreva detalhes, metodologias, notas ou critérios de aceite desta microatividade..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-teal-600 outline-none transition"
                />
              </div>

            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95"
            >
              Criar Microatividade
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
