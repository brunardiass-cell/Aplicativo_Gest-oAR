import React, { useState, useMemo } from 'react';
import { Project, MacroActivity, MicroActivity, MicroActivityStatus, TeamMember } from '../types';
import { ChevronDown, Plus, Trash2, MessageSquare, Link as LinkIcon, Edit, Save, X, AlertTriangle, Layers } from 'lucide-react';

interface ProjectTimelineProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', projectId: string; macroId: string; microId?: string; name: string }) => void;
  teamMembers: TeamMember[];
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ project, onUpdateProject, onOpenDeletionModal, teamMembers }) => {
  const [editingMicro, setEditingMicro] = useState<string | null>(null);
  const [isAddingMacroForPhase, setIsAddingMacroForPhase] = useState<string | null>(null);
  const [newMacroNameInput, setNewMacroNameInput] = useState('');

  // FIX: Explicitly type the useMemo hook to ensure correct type inference for projectAssignees.
  const projectAssignees = useMemo<string[]>(() => {
    const assignees = new Set<string>();
    if (project.responsible) assignees.add(project.responsible);
    if (project.team) project.team.forEach(name => assignees.add(name));
    if (assignees.size === 0) return teamMembers.map(m => m.name);
    return Array.from(assignees).sort();
  }, [project, teamMembers]);
  
  const handleMicroUpdate = (macroId: string, microId: string, updates: Partial<MicroActivity>) => {
    const updatedProject = { ...project };
    const macroIndex = updatedProject.macroActivities.findIndex(m => m.id === macroId);
    if (macroIndex === -1) return;

    const microIndex = updatedProject.macroActivities[macroIndex].microActivities.findIndex(m => m.id === microId);
    if (microIndex === -1) return;

    // FIX: Add an explicit type annotation to help TypeScript's type inference within the conditional block.
    const finalUpdates: Partial<MicroActivity> = { ...updates };
    
    if (updates.status) {
      const currentMicro = updatedProject.macroActivities[macroIndex].microActivities[microIndex];
      if (updates.status === 'Concluído e aprovado') {
        finalUpdates.progress = 100;
        if (!currentMicro.completionDate) {
            finalUpdates.completionDate = new Date().toISOString().split('T')[0];
        }
      } else if (updates.status === 'A repetir / retrabalho') {
        finalUpdates.progress = 0;
      } else if (updates.status === 'Planejado') {
        finalUpdates.progress = 0;
      }
    }

    updatedProject.macroActivities[macroIndex].microActivities[microIndex] = {
      ...updatedProject.macroActivities[macroIndex].microActivities[microIndex],
      ...finalUpdates
    };
    
    onUpdateProject(updatedProject);
  };
  
  const addMicroActivity = (macroId: string) => {
    const newMicro: MicroActivity = {
      id: 'micro_' + Math.random().toString(36).substr(2, 9),
      name: 'Nova Microatividade',
      assignee: projectAssignees[0] || '',
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Planejado',
      observations: '',
      progress: 0,
    };
    
    const updatedProject = { ...project };
    const macro = updatedProject.macroActivities.find(m => m.id === macroId);
    if (macro) {
      macro.microActivities.push(newMicro);
      onUpdateProject(updatedProject);
      setEditingMicro(newMicro.id);
    }
  };
  
  const handleAddMacroActivity = (phase: string) => {
    if (!newMacroNameInput.trim()) {
      setIsAddingMacroForPhase(null);
      return;
    }

    const newMacro: MacroActivity = {
      id: 'macro_' + Math.random().toString(36).substr(2, 9),
      name: newMacroNameInput.trim(),
      phase: phase,
      microActivities: [],
    };

    onUpdateProject({ ...project, macroActivities: [...project.macroActivities, newMacro] });
    setNewMacroNameInput('');
    setIsAddingMacroForPhase(null);
  };

  const macrosByPhase = useMemo(() => {
    const phaseMap = new Map<string, MacroActivity[]>();
    const unphased: MacroActivity[] = [];
    
    (project.phases || []).forEach(phase => phaseMap.set(phase, []));

    project.macroActivities.forEach(macro => {
      if (macro.phase && phaseMap.has(macro.phase)) {
        phaseMap.get(macro.phase)?.push(macro);
      } else {
        unphased.push(macro);
      }
    });

    if (unphased.length > 0) {
      phaseMap.set('Sem Fase Atribuída', unphased);
    }
    
    return phaseMap;
  }, [project.macroActivities, project.phases]);
  
  const phasesToRender = Array.from(macrosByPhase.keys());

  return (
    <div className="space-y-6">
      {phasesToRender.map(phase => (
        <div key={phase} className="bg-slate-50/50 border border-slate-100 rounded-3xl overflow-hidden">
          <header className="p-6 bg-slate-100/80">
            <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
              <Layers size={14}/> {phase}
            </h3>
          </header>
          <div className="p-4 space-y-4">
            {(macrosByPhase.get(phase) || []).map(macro => (
              <MacroRow 
                key={macro.id}
                macro={macro}
                project={project}
                onUpdateProject={onUpdateProject}
                onOpenDeletionModal={onOpenDeletionModal}
                teamMembers={teamMembers}
                assignees={projectAssignees}
                onMicroUpdate={handleMicroUpdate}
                onAddMicro={addMicroActivity}
                editingMicro={editingMicro}
                onSetEditingMicro={setEditingMicro}
              />
            ))}
            {isAddingMacroForPhase === phase ? (
              <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-3xl flex items-center gap-2 animate-in fade-in duration-300">
                <input type="text" value={newMacroNameInput} onChange={e => setNewMacroNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMacroActivity(phase)} placeholder="Nome da nova macroatividade" autoFocus className="flex-1 px-4 py-2 bg-white border border-teal-300 rounded-xl text-sm font-bold text-slate-900"/>
                <button onClick={() => handleAddMacroActivity(phase)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"><Save size={16} /></button>
                <button onClick={() => { setIsAddingMacroForPhase(null); setNewMacroNameInput(''); }} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition"><X size={16} /></button>
              </div>
            ) : (
              phase !== 'Sem Fase Atribuída' &&
              <button onClick={() => setIsAddingMacroForPhase(phase)} className="w-full mt-2 p-3 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-700 transition"><Plus size={14} /> Adicionar Macroatividade</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

interface MacroRowProps {
  macro: MacroActivity;
  project: Project;
  onUpdateProject: (p: Project) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', projectId: string; macroId: string; microId?: string; name: string }) => void;
  teamMembers: TeamMember[];
  assignees: string[];
  onMicroUpdate: (macroId: string, microId: string, updates: Partial<MicroActivity>) => void;
  onAddMicro: (macroId: string) => void;
  editingMicro: string | null;
  onSetEditingMicro: (id: string | null) => void;
}

const MacroRow: React.FC<MacroRowProps> = (props) => {
  const { macro, project, onUpdateProject, onOpenDeletionModal, assignees, onMicroUpdate, onAddMicro, editingMicro, onSetEditingMicro } = props;

  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(macro.name);

  const totalMicros = macro.microActivities.length;
  const completedMicros = macro.microActivities.filter(m => m.status === 'Concluído e aprovado').length;
  const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0;

  const getMacroStatus = (): 'Concluída' | 'Em Andamento' | 'Planejada' => {
    if (totalMicros === 0) return 'Planejada';
    if (completedMicros === totalMicros) return 'Concluída';
    if (macro.microActivities.some(m => m.status === 'Em andamento')) return 'Em Andamento';
    return 'Planejada';
  };
  const macroStatus = getMacroStatus();

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    const updatedProject = { ...project, macroActivities: project.macroActivities.map(m => m.id === macro.id ? {...m, name: editedName.trim()} : m) };
    onUpdateProject(updatedProject);
    setIsEditing(false);
  };
  
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="w-full p-4 flex justify-between items-center text-left group">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={() => setIsExpanded(!isExpanded)} className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 ${macroStatus === 'Concluída' ? 'bg-emerald-500' : 'bg-slate-800'}`}>
            <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          {isEditing ? (
            <div className="flex-1 flex gap-2 items-center">
              <input value={editedName} onChange={e => setEditedName(e.target.value)} autoFocus className="w-full text-xs font-black text-slate-800 uppercase tracking-tight bg-white border border-teal-300 rounded-md px-3 py-2"/>
              <button onClick={handleSaveName} className="p-2 text-emerald-500 hover:bg-emerald-100 rounded-md"><Save size={16}/></button>
              <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-md"><X size={16}/></button>
            </div>
          ) : ( <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{macro.name}</h4> )}
        </div>
        <div className="flex items-center gap-4">
            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-teal-50 rounded-md"><Edit size={16}/></button>
                <button onClick={() => onOpenDeletionModal({ type: 'macro', projectId: project.id, macroId: macro.id, name: macro.name })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-800">{Math.round(progress)}%</span>
                <div className="w-16 h-1.5 bg-slate-200 rounded-full"><div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                <span className="text-[9px] font-black text-slate-400">{completedMicros}/{totalMicros}</span>
            </div>
        </div>
      </div>
      {isExpanded && (
        <div className="bg-white p-4 border-t border-slate-100 space-y-3">
          {macro.microActivities.map(micro => (
             <MicroActivityRow key={micro.id} micro={micro} assignees={assignees} onUpdate={(updates) => onMicroUpdate(macro.id, micro.id, updates)} onDelete={() => onOpenDeletionModal({ type: 'micro', projectId: project.id, macroId: macro.id, microId: micro.id, name: micro.name })} isEditing={editingMicro === micro.id} onSetEditing={onSetEditingMicro}/>
          ))}
          <button onClick={() => onAddMicro(macro.id)} className="w-full mt-2 p-3 bg-slate-50 text-slate-500 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition"><Plus size={14}/> Adicionar Microatividade</button>
        </div>
      )}
    </div>
  );
};

interface MicroActivityRowProps {
  micro: MicroActivity;
  onUpdate: (updates: Partial<MicroActivity>) => void;
  onDelete: () => void;
  isEditing: boolean;
  onSetEditing: (id: string | null) => void;
  assignees: string[];
}

const MicroActivityRow: React.FC<MicroActivityRowProps> = ({ micro, onUpdate, onDelete, isEditing, onSetEditing, assignees }) => {
    const [localName, setLocalName] = useState(micro.name);

    const dueDateStatus = useMemo(() => {
        if (micro.status === 'Concluído e aprovado' || !micro.dueDate) return null;
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const dueDate = new Date(micro.dueDate + 'T00:00:00');
        const timeDiff = dueDate.getTime() - today.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        if (dayDiff < 0) return { status: 'overdue', text: 'Vencida', color: 'text-red-500' };
        if (dayDiff <= 7) return { status: 'upcoming', text: dayDiff === 0 ? 'Vence Hoje' : `Vence em ${dayDiff}d`, color: 'text-amber-500' };
        return null;
    }, [micro.dueDate, micro.status]);

    const handleSaveName = () => { onUpdate({ name: localName }); onSetEditing(null); };

    return (
    <div className={`p-4 border rounded-2xl transition-all ${isEditing ? 'bg-teal-50/50 border-teal-200 shadow-lg' : 'bg-slate-50/30 border-slate-100'}`}>
      <div className="grid grid-cols-12 gap-4 items-center">
        <div className="col-span-4 flex items-center gap-2">
            {isEditing ? (<>
                <input value={localName} onChange={e => setLocalName(e.target.value)} autoFocus className="w-full text-xs font-bold text-slate-900 bg-white border border-teal-300 rounded-md px-2 py-1"/>
                <button onClick={handleSaveName} className="p-1 text-emerald-500 hover:bg-emerald-100 rounded-md"><Save size={14}/></button>
            </>) : (<>
                <span className="text-xs font-bold text-slate-700">{micro.name}</span>
                <button onClick={() => { setLocalName(micro.name); onSetEditing(micro.id); }} className="p-1 text-slate-400 hover:bg-slate-100 rounded-md"><Edit size={14}/></button>
            </>)}
        </div>
        <div className="col-span-2">
          <select value={micro.assignee} onChange={e => onUpdate({ assignee: e.target.value })} className="w-full bg-transparent text-[10px] font-bold text-slate-600 outline-none">
            {assignees.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
        <div className="col-span-2 relative">
          <input type="date" value={micro.dueDate} onChange={e => onUpdate({ dueDate: e.target.value })} className="w-full bg-transparent text-[10px] font-bold text-slate-600 outline-none"/>
          {dueDateStatus && (<div className={`absolute -top-3.5 right-0 text-[8px] font-bold flex items-center gap-1 ${dueDateStatus.color}`}><AlertTriangle size={10} /> {dueDateStatus.text}</div>)}
        </div>
        <div className="col-span-3">
          <select value={micro.status} onChange={e => onUpdate({ status: e.target.value as MicroActivityStatus })} className={`w-full bg-transparent text-[10px] font-bold outline-none ${
              micro.status === 'Concluído e aprovado' ? 'text-emerald-600' :
              micro.status === 'Concluído com restrições' ? 'text-amber-600' :
              micro.status === 'A repetir / retrabalho' ? 'text-red-600' : 'text-slate-600'
          }`}>
             <option value="Planejado">Planejado</option>
             <option value="Em andamento">Em andamento</option>
             <option value="Concluído com restrições">Concluído com restrições</option>
             <option value="A repetir / retrabalho">A repetir / retrabalho</option>
             <option value="Concluído e aprovado">Concluído e aprovado ✅</option>
          </select>
        </div>
        <div className="col-span-1 flex items-center justify-end gap-1">
           <button onClick={onDelete} className="p-2 text-slate-300 hover:text-red-500 rounded-xl transition"><Trash2 size={14}/></button>
        </div>
      </div>
      {(micro.status === 'Em andamento' || micro.status === 'Concluído com restrições') && (
        <div className="mt-3 pt-3 border-t border-slate-100/80 flex items-center gap-4">
            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Progresso</label>
            <input type="range" min="0" max="100" step="5" value={micro.progress || 0} onChange={e => onUpdate({ progress: parseInt(e.target.value) })} className="flex-1 h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-brand-primary"/>
            <span className="text-sm font-bold text-brand-primary w-12 text-right">{micro.progress || 0}%</span>
        </div>
      )}
      {(isEditing || micro.observations || micro.reportLink) && (
          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
              <div>
                  <label className="text-[9px] font-black text-slate-400 flex items-center gap-1 mb-1"><MessageSquare size={12}/> Observações</label>
                  <textarea value={micro.observations} onChange={e => onUpdate({ observations: e.target.value })} rows={2} placeholder="Ex: precisa de dado complementar..." className="w-full text-xs p-2 border border-slate-200 rounded-md bg-slate-50 text-slate-900"/>
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
