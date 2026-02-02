
import React, { useState } from 'react';
import { Project, MacroActivity, MicroActivity, Status, CompletionStatus, TeamMember } from '../types';
import { ChevronDown, Plus, Trash2, MessageSquare, Link as LinkIcon, Edit, Save, X } from 'lucide-react';

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
      assignee: teamMembers[0].name,
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
        <div key={macro.id} className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="w-full p-6 flex justify-between items-center text-left hover:bg-white/10 group">
            <div className="flex items-center gap-4 flex-1">
              <button onClick={() => toggleMacro(macro.id)} className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${macro.status === 'Concluída' ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                <ChevronDown size={20} className={`transition-transform ${expandedMacros.has(macro.id) ? 'rotate-180' : ''}`} />
              </button>
              {editingMacro === macro.id ? (
                <div className="flex-1 flex gap-2 items-center">
                   <input 
                      value={editingMacroName}
                      onChange={e => setEditingMacroName(e.target.value)}
                      autoFocus
                      className="w-full text-sm font-black text-white uppercase tracking-tight bg-slate-900 border border-blue-500 rounded-md px-3 py-2"
                   />
                   <button onClick={() => handleSaveMacroName(macro.id)} className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-md"><Save size={16}/></button>
                   <button onClick={() => setEditingMacro(null)} className="p-2 text-slate-400 hover:bg-white/10 rounded-md"><X size={16}/></button>
                </div>
              ) : (
                <h3 className="text-sm font-black text-white uppercase tracking-tight">{macro.name}</h3>
              )}
            </div>
            <div className="flex items-center gap-2">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                    <button onClick={() => handleStartEditMacro(macro)} className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-md"><Edit size={16}/></button>
                    <button onClick={() => onOpenDeletionModal({ type: 'macro', projectId: project.id, macroId: macro.id, name: macro.name })} className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-md"><Trash2 size={16}/></button>
                </div>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    macro.status === 'Concluída' ? 'bg-emerald-500/10 text-emerald-400' : 
                    macro.status === 'Em Andamento' ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-slate-400'
                }`}>
                {macro.status}
                </span>
            </div>
          </div>

          {expandedMacros.has(macro.id) && (
            <div className="bg-slate-900/30 p-4 space-y-3">
              {macro.microActivities.map(micro => (
                 <MicroActivityRow 
                    key={micro.id} 
                    micro={micro}
                    teamMembers={teamMembers}
                    onUpdate={(updates) => handleMicroUpdate(macro.id, micro.id, updates)}
                    onDelete={() => onOpenDeletionModal({ type: 'micro', projectId: project.id, macroId: macro.id, microId: micro.id, name: micro.name })}
                    isEditing={editingMicro === micro.id}
                    onSetEditing={setEditingMicro}
                 />
              ))}
              <button onClick={() => addMicroActivity(macro.id)} className="w-full mt-2 p-3 bg-white/5 text-slate-400 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition">
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

    const handleSaveName = () => {
      onUpdate({ name: localName });
      onSetEditing(null);
    };

    return (
    <div className={`p-4 border rounded-2xl transition-all ${isEditing ? 'bg-blue-950/30 border-blue-500/20 shadow-lg' : 'bg-white/5 border-white/10'}`}>
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 flex items-center gap-2">
            {isEditing ? (
                <>
                <input value={localName} onChange={e => setLocalName(e.target.value)} autoFocus className="w-full text-xs font-bold text-white bg-slate-900 border border-blue-500 rounded-md px-2 py-1"/>
                <button onClick={handleSaveName} className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded-md"><Save size={14}/></button>
                </>
            ) : (
                <>
                <span className="text-xs font-bold text-slate-300">{micro.name}</span>
                <button onClick={() => { setLocalName(micro.name); onSetEditing(micro.id); }} className="p-1 text-slate-500 hover:text-white hover:bg-white/10 rounded-md"><Edit size={14}/></button>
                </>
            )}
        </div>
        <div className="col-span-2">
          <select value={micro.assignee} onChange={e => onUpdate({ assignee: e.target.value })} className="w-full bg-transparent text-[10px] font-bold text-slate-300 outline-none">
            {teamMembers.map(m => <option className="bg-slate-800" key={m.id} value={m.name}>{m.name}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <input type="date" value={micro.dueDate} onChange={e => onUpdate({ dueDate: e.target.value })} className="w-full bg-transparent text-[10px] font-bold text-slate-300 outline-none [color-scheme:dark]"/>
        </div>
        <div className="col-span-2">
          <select value={micro.status} onChange={e => onUpdate({ status: e.target.value as Status })} className="w-full bg-transparent text-[10px] font-bold text-slate-300 outline-none">
             <option className="bg-slate-800" value="Planejada">Planejada</option><option className="bg-slate-800" value="Em Andamento">Em Andamento</option><option className="bg-slate-800" value="Concluída">Concluída</option><option className="bg-slate-800" value="Bloqueada">Bloqueada</option>
          </select>
        </div>
        <div className="col-span-2 flex items-center justify-end gap-1">
           {micro.status === 'Concluída' && (
             <select value={micro.completionStatus} onChange={e => onUpdate({ completionStatus: e.target.value as CompletionStatus })} className={`w-full text-[9px] font-bold rounded-md p-1 border-2 outline-none ${
                micro.completionStatus === 'Aprovada' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 
                micro.completionStatus === 'Finalizada com Restrições' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
             }`}>
               <option className="bg-slate-800" value="Aprovada">Aprovada</option>
               <option className="bg-slate-800" value="Finalizada com Restrições">Com Restrições</option>
               <option className="bg-slate-800" value="A ser Repetida">A Repetir</option>
             </select>
           )}
           <button onClick={onDelete} className="p-2 text-slate-500 hover:text-red-400 rounded-xl transition"><Trash2 size={14}/></button>
        </div>
      </div>
      {(isEditing || micro.observations || micro.reportLink) && (
          <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
              <div>
                  <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 mb-1"><MessageSquare size={12}/> Observações</label>
                  <textarea value={micro.observations} onChange={e => onUpdate({ observations: e.target.value })} rows={2} className="w-full text-xs p-2 border border-white/10 rounded-md bg-white/5 text-white outline-none focus:ring-1 focus:ring-blue-500"/>
              </div>
              <div>
                  <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 mb-1"><LinkIcon size={12}/> Link do Relatório</label>
                  <input value={micro.reportLink || ''} onChange={e => onUpdate({ reportLink: e.target.value })} placeholder="Cole o link aqui..." className="w-full text-xs p-2 border border-white/10 rounded-md bg-white/5 text-white outline-none focus:ring-1 focus:ring-blue-500"/>
              </div>
          </div>
      )}
    </div>
    );
};


export default ProjectTimeline;
