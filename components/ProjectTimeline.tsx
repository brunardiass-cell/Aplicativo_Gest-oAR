
import React, { useState, useMemo } from 'react';
import { Project, MacroActivity, MicroActivity, Status, CompletionStatus, TeamMember } from '../types';
import { ChevronDown, Plus, Trash2, MessageSquare, Link as LinkIcon, Edit, Save, X, AlertTriangle } from 'lucide-react';

interface ProjectTimelineProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', projectId: string; macroId: string; microId?: string; name: string }) => void;
  teamMembers: TeamMember[];
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ project, onUpdateProject, onOpenDeletionModal, teamMembers }) => {
  const [expandedMacros, setExpandedMacros] = useState<Set<string>>(new Set([project.macroActivities[0]?.id].filter(Boolean)));
  const [editingMicro, setEditingMicro] = useState<string | null>(null);
  const [editingMacro, setEditingMacro] = useState<string | null>(null);
  const [editingMacroName, setEditingMacroName] = useState('');

  const projectTeamMembers = useMemo(() => {
    if (!project.team || project.team.length === 0) {
        return teamMembers; // Fallback para todos se nenhuma equipe for definida
    }
    return teamMembers.filter(member => project.team!.includes(member.name));
  }, [project, teamMembers]);

  const toggleMacro = (macroId: string) => {
    const newSet = new Set(expandedMacros);
    if (newSet.has(macroId)) {
      newSet.delete(macroId);
    } else {
      newSet.add(macroId);
    }
    setExpandedMacros(newSet);
  };

  const updateMacroStatus = (macro: MacroActivity): Status => {
    if (macro.microActivities.length === 0) return 'Planejada';
    const allDone = macro.microActivities.every(m => m.status === 'Concluída');
    if (allDone) return 'Concluída';
    const anyOngoing = macro.microActivities.some(m => m.status === 'Em Andamento');
    if (anyOngoing) return 'Em Andamento';
    return 'Planejada';
  };
  
  const handleMicroUpdate = (macroId: string, microId: string, updates: Partial<MicroActivity>) => {
    const updatedProject = { ...project };
    const macroIndex = updatedProject.macroActivities.findIndex(m => m.id === macroId);
    if (macroIndex === -1) return;

    const microIndex = updatedProject.macroActivities[macroIndex].microActivities.findIndex(m => m.id === microId);
    if (microIndex === -1) return;

    // Apply updates
    updatedProject.macroActivities[macroIndex].microActivities[microIndex] = {
      ...updatedProject.macroActivities[macroIndex].microActivities[microIndex],
      ...updates
    };
    
    // Update completionDate if status is Concluída
    if(updates.status === 'Concluída' && !updatedProject.macroActivities[macroIndex].microActivities[microIndex].completionDate) {
      updatedProject.macroActivities[macroIndex].microActivities[microIndex].completionDate = new Date().toISOString();
    }


    // Recalculate macro status
    const updatedMacro = updatedProject.macroActivities[macroIndex];
    updatedProject.macroActivities[macroIndex].status = updateMacroStatus(updatedMacro);
    
    onUpdateProject(updatedProject);
  };
  
  const addMicroActivity = (macroId: string) => {
    const newMicro: MicroActivity = {
      id: 'micro_' + Math.random().toString(36).substr(2, 9),
      name: 'Nova Microatividade',
      assignee: projectTeamMembers[0]?.name || teamMembers[0].name,
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Planejada',
      completionStatus: 'Não Finalizada',
      observations: '',
    };
    
    const updatedProject = { ...project };
    const macro = updatedProject.macroActivities.find(m => m.id === macroId);
    if (macro) {
      macro.microActivities.push(newMicro);
      macro.status = updateMacroStatus(macro);
      onUpdateProject(updatedProject);
      setEditingMicro(newMicro.id);
    }
  };

  const handleStartEditMacro = (macro: MacroActivity) => {
    setEditingMacro(macro.id);
    setEditingMacroName(macro.name);
  };

  const handleSaveMacroName = (macroId: string) => {
    if (!editingMacroName.trim()) return;
    const updatedProject = { ...project };
    const macro = updatedProject.macroActivities.find(m => m.id === macroId);
    if (macro) {
        macro.name = editingMacroName.trim();
        onUpdateProject(updatedProject);
    }
    setEditingMacro(null);
  };

  return (
    <div className="space-y-4">
      {project.macroActivities.map(macro => (
        <div key={macro.id} className="bg-slate-50/50 border border-slate-100 rounded-3xl overflow-hidden">
          <div className="w-full p-6 flex justify-between items-center text-left hover:bg-slate-100/50 group">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => toggleMacro(macro.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${macro.status === 'Concluída' ? 'bg-emerald-500' : 'bg-slate-800'}`}>
                <ChevronDown size={20} className={`transition-transform ${expandedMacros.has(macro.id) ? 'rotate-180' : ''}`} />
              </button>
              {editingMacro === macro.id ? (
                <div className="flex-1 flex gap-2 items-center">
                   <input 
                      value={editingMacroName}
                      onChange={e => setEditingMacroName(e.target.value)}
                      autoFocus
                      className="w-full text-sm font-black text-slate-800 uppercase tracking-tight bg-white border border-indigo-300 rounded-md px-3 py-2"
                   />
                   <button onClick={() => handleSaveMacroName(macro.id)} className="p-2 text-emerald-500 hover:bg-emerald-100 rounded-md"><Save size={16}/></button>
                   <button onClick={() => setEditingMacro(null)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-md"><X size={16}/></button>
                </div>
              ) : (
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">{macro.name}</h3>
              )}
            </div>
            <div className="flex items-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    <button onClick={() => handleStartEditMacro(macro)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"><Edit size={16}/></button>
                    <button onClick={() => onOpenDeletionModal({ type: 'macro', projectId: project.id, macroId: macro.id, name: macro.name })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    macro.status === 'Concluída' ? 'bg-emerald-100 text-emerald-600' : 
                    macro.status === 'Em Andamento' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                }`}>
                {macro.status}
                </span>
            </div>
          </div>

          {expandedMacros.has(macro.id) && (
            <div className="bg-white p-4 space-y-3">
              {macro.microActivities.map(micro => (
                 <MicroActivityRow 
                    key={micro.id} 
                    micro={micro}
                    teamMembers={projectTeamMembers}
                    onUpdate={(updates) => handleMicroUpdate(macro.id, micro.id, updates)}
                    onDelete={() => onOpenDeletionModal({ type: 'micro', projectId: project.id, macroId: macro.id, microId: micro.id, name: micro.name })}
                    isEditing={editingMicro === micro.id}
                    onSetEditing={setEditingMicro}
                 />
              ))}
              <button onClick={() => addMicroActivity(macro.id)} className="w-full mt-2 p-3 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition">
                <Plus size={14}/> Adicionar Microatividade
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

// Sub-componente para a linha de Microatividade
interface MicroActivityRowProps {
  micro: MicroActivity;
  onUpdate: (updates: Partial<MicroActivity>) => void;
  onDelete: () => void;
  isEditing: boolean;
  onSetEditing: (id: string | null) => void;
  teamMembers: TeamMember[];
}

const MicroActivityRow: React.FC<MicroActivityRowProps> = ({ micro, onUpdate, onDelete, isEditing, onSetEditing, teamMembers }) => {
    const [localName, setLocalName] = useState(micro.name);

    const getDueDateStatus = () => {
        if (micro.status === 'Concluída' || !micro.dueDate) return null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(micro.dueDate + 'T00:00:00');
        const timeDiff = dueDate.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
        if (dayDiff < 0) {
            return { status: 'overdue', text: 'Vencida', color: 'text-red-500' };
        }
        if (dayDiff <= 7) {
            const label = dayDiff === 0 ? 'Vence Hoje' : `Vence em ${dayDiff}d`;
            return { status: 'upcoming', text: label, color: 'text-amber-500' };
        }
        return null;
    };
    
    const dueDateStatus = getDueDateStatus();

    const handleSaveName = () => {
      onUpdate({ name: localName });
      onSetEditing(null);
    };

    return (
    <div className={`p-4 border rounded-2xl transition-all ${isEditing ? 'bg-indigo-50/50 border-indigo-200 shadow-lg' : 'bg-white border-slate-100'}`}>
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 flex items-center gap-2">
            {isEditing ? (
                <>
                <input value={localName} onChange={e => setLocalName(e.target.value)} autoFocus className="w-full text-xs font-bold text-slate-900 bg-white border border-indigo-300 rounded-md px-2 py-1"/>
                <button onClick={handleSaveName} className="p-1 text-emerald-500 hover:bg-emerald-100 rounded-md"><Save size={14}/></button>
                </>
            ) : (
                <>
                <span className="text-xs font-bold text-slate-700">{micro.name}</span>
                <button onClick={() => { setLocalName(micro.name); onSetEditing(micro.id); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"><Edit size={14}/></button>
                </>
            )}
        </div>
        <div className="col-span-2">
          <select value={micro.assignee} onChange={e => onUpdate({ assignee: e.target.value })} className="w-full bg-transparent text-[10px] font-bold text-slate-600">
            {teamMembers.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div className="col-span-2 relative">
          <input type="date" value={micro.dueDate} onChange={e => onUpdate({ dueDate: e.target.value })} className="w-full bg-transparent text-[10px] font-bold text-slate-600"/>
          {dueDateStatus && (
            <div className={`absolute -top-3.5 right-0 text-[8px] font-bold flex items-center gap-1 ${dueDateStatus.color}`}>
                <AlertTriangle size={10} /> {dueDateStatus.text}
            </div>
          )}
        </div>
        <div className="col-span-2">
          <select value={micro.status} onChange={e => onUpdate({ status: e.target.value as Status })} className="w-full bg-transparent text-[10px] font-bold text-slate-600">
             <option value="Planejada">Planejada</option><option value="Em Andamento">Em Andamento</option><option value="Concluída">Concluída</option><option value="Bloqueada">Bloqueada</option>
          </select>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-1">
           {micro.status === 'Concluída' && (
             <select value={micro.completionStatus} onChange={e => onUpdate({ completionStatus: e.target.value as CompletionStatus })} className={`w-full text-[9px] font-bold rounded-md p-1 border-2 ${
                micro.completionStatus === 'Aprovada' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                micro.completionStatus === 'Finalizada com Restrições' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-red-50 text-red-600 border-red-100'
             }`}>
               <option value="Aprovada">Aprovada</option>
               <option value="Finalizada com Restrições">Com Restrições</option>
               <option value="A ser Repetida">A Repetir</option>
             </select>
           )}
           <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition"><Trash2 size={14}/></button>
        </div>
      </div>
      {(isEditing || micro.observations || micro.reportLink) && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                  <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 mb-1"><MessageSquare size={12}/> Observações</label>
                  <textarea value={micro.observations} onChange={e => onUpdate({ observations: e.target.value })} rows={2} className="w-full text-xs p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-900"/>
              </div>
              <div>
                  <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 mb-1"><LinkIcon size={12}/> Link do Relatório</label>
                  <input value={micro.reportLink || ''} onChange={e => onUpdate({ reportLink: e.target.value })} placeholder="Cole o link aqui..." className="w-full text-xs p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-900"/>
              </div>
          </div>
      )}
    </div>
    );
};


export default ProjectTimeline;