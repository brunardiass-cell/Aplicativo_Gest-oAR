
import React, { useState, useMemo, useEffect } from 'react';
import { Project, MacroActivity, MicroActivity, MicroActivityStatus, TeamMember, Prerequisite, BudgetInfo, PrerequisiteType, PrerequisiteStatus, BudgetStatus, RegulatoryStandard, DDCMChapterDef } from '../types';
import { ChevronDown, Plus, Trash2, MessageSquare, Link as LinkIcon, Edit, Save, X, AlertTriangle, Layers, GripVertical, ListTodo, DollarSign, Calendar, User, CheckCircle2, Clock, ShieldCheck, ClipboardCheck, Activity, BadgeAlert, Paperclip, Eye } from 'lucide-react';
import { PrerequisitesModal } from './PrerequisitesModal';
import { DossierContributionSection } from './DossierContributionSection';
import {
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProjectTimelineProps {
  project: Project;
  onUpdateProject: (project: Project) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', ids: { projectId: string; macroId: string; microId?: string; }, name: string }) => void;
  teamMembers: TeamMember[];
  targetMicroId?: string | null;
  onClearTargetMicroId?: () => void;
  regulatoryStandards: RegulatoryStandard[];
  onOpenRegulatoryModal: (activityName: string) => void;
}

const ProjectTimeline: React.FC<ProjectTimelineProps> = ({ 
  project, 
  onUpdateProject, 
  onOpenDeletionModal, 
  teamMembers,
  targetMicroId,
  onClearTargetMicroId,
  regulatoryStandards,
  onOpenRegulatoryModal
}) => {
  const [editingMicro, setEditingMicro] = useState<string | null>(null);
  const [isAddingMacroForPhase, setIsAddingMacroForPhase] = useState<string | null>(null);
  const [newMacroNameInput, setNewMacroNameInput] = useState('');
  const [expandedMacros, setExpandedMacros] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (targetMicroId) {
      const macro = project.macroActivities.find(m => 
        m.microActivities.some(mi => mi.id === targetMicroId)
      );
      
      if (macro) {
        setExpandedMacros(prev => ({ ...prev, [macro.id]: true }));
        
        setTimeout(() => {
          const element = document.getElementById(`micro-${targetMicroId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-brand-primary', 'ring-offset-4', 'scale-[1.02]');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-brand-primary', 'ring-offset-4', 'scale-[1.02]');
              if (onClearTargetMicroId) onClearTargetMicroId();
            }, 3000);
          }
        }, 500);
      }
    }
  }, [targetMicroId, project.macroActivities, onClearTargetMicroId]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Phase reordering
    if (project.phases.includes(activeId)) {
      const oldIndex = project.phases.indexOf(activeId);
      const newIndex = project.phases.indexOf(overId);
      if (newIndex !== -1) {
        const newPhases = arrayMove(project.phases, oldIndex, newIndex);
        onUpdateProject({ ...project, phases: newPhases });
      }
      return;
    }

    // Macro reordering
    if (activeId.startsWith('macro_')) {
      const oldIndex = project.macroActivities.findIndex((m) => m.id === activeId);
      const newIndex = project.macroActivities.findIndex((m) => m.id === overId);
      if (newIndex !== -1) {
        const newMacros = arrayMove(project.macroActivities, oldIndex, newIndex);
        onUpdateProject({ ...project, macroActivities: newMacros });
      }
      return;
    }

    // Micro reordering
    if (activeId.startsWith('micro_')) {
      const macro = project.macroActivities.find(m => m.microActivities.some(mi => mi.id === activeId));
      if (macro) {
        const oldIndex = macro.microActivities.findIndex(mi => mi.id === activeId);
        const newIndex = macro.microActivities.findIndex(mi => mi.id === overId);
        if (newIndex !== -1) {
          const newMicros = arrayMove(macro.microActivities, oldIndex, newIndex);
          const newMacros = project.macroActivities.map(m => m.id === macro.id ? { ...m, microActivities: newMicros } : m);
          onUpdateProject({ ...project, macroActivities: newMacros });
        }
      }
      return;
    }
  };

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
      if (updates.status === 'Concluído e aprovado' || updates.status === 'Concluído com restrições') {
        finalUpdates.progress = 100;
        if (!currentMicro.completionDate) {
            finalUpdates.completionDate = new Date().toISOString().split('T')[0];
        }
        if (!currentMicro.realStartDate) {
            finalUpdates.realStartDate = currentMicro.startDate || new Date().toISOString().split('T')[0];
        }
        if (!currentMicro.realEndDate) {
            finalUpdates.realEndDate = finalUpdates.completionDate || new Date().toISOString().split('T')[0];
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
      assignee: '',
      startDate: '',
      dueDate: '',
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
      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={phasesToRender}
          strategy={verticalListSortingStrategy}
        >
          {phasesToRender.map(phase => (
            <PhaseSection 
              key={phase}
              phase={phase}
              macros={macrosByPhase.get(phase) || []}
              project={project}
              onUpdateProject={onUpdateProject}
              onOpenDeletionModal={onOpenDeletionModal}
              teamMembers={teamMembers}
              projectAssignees={projectAssignees}
              handleMicroUpdate={handleMicroUpdate}
              addMicroActivity={addMicroActivity}
              editingMicro={editingMicro}
              setEditingMicro={setEditingMicro}
              expandedMacros={expandedMacros}
              setExpandedMacros={setExpandedMacros}
              regulatoryStandards={regulatoryStandards}
              onOpenRegulatoryModal={onOpenRegulatoryModal}
              isAddingMacroForPhase={isAddingMacroForPhase}
              setIsAddingMacroForPhase={setIsAddingMacroForPhase}
              newMacroNameInput={newMacroNameInput}
              setNewMacroNameInput={setNewMacroNameInput}
              handleAddMacroActivity={handleAddMacroActivity}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};

interface PhaseSectionProps {
  phase: string;
  macros: MacroActivity[];
  project: Project;
  onUpdateProject: (p: Project) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', ids: { projectId: string; macroId: string; microId?: string; }, name: string }) => void;
  teamMembers: TeamMember[];
  projectAssignees: string[];
  handleMicroUpdate: (macroId: string, microId: string, updates: Partial<MicroActivity>) => void;
  addMicroActivity: (macroId: string) => void;
  editingMicro: string | null;
  setEditingMicro: (id: string | null) => void;
  expandedMacros: Record<string, boolean>;
  setExpandedMacros: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  regulatoryStandards: RegulatoryStandard[];
  onOpenRegulatoryModal: (activityName: string) => void;
  isAddingMacroForPhase: string | null;
  setIsAddingMacroForPhase: (phase: string | null) => void;
  newMacroNameInput: string;
  setNewMacroNameInput: (val: string) => void;
  handleAddMacroActivity: (phase: string) => void;
}

const PhaseSection: React.FC<PhaseSectionProps> = ({
  phase, macros, project, onUpdateProject, onOpenDeletionModal, teamMembers, projectAssignees,
  handleMicroUpdate, addMicroActivity, editingMicro, setEditingMicro, expandedMacros, setExpandedMacros,
  regulatoryStandards, onOpenRegulatoryModal, isAddingMacroForPhase, setIsAddingMacroForPhase,
  newMacroNameInput, setNewMacroNameInput, handleAddMacroActivity
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: phase });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="bg-slate-50/50 border border-slate-100 rounded-3xl overflow-hidden">
      <header className="p-6 bg-slate-100/80 flex items-center gap-4">
        <div {...attributes} {...listeners} className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
          <GripVertical size={16} />
        </div>
        <h3 className="text-sm font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">
          <Layers size={14}/> {phase}
        </h3>
      </header>
      <div className="p-4 space-y-4">
        <SortableContext 
          items={macros.map(m => m.id)}
          strategy={verticalListSortingStrategy}
        >
          {macros.map(macro => (
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
              isExpanded={expandedMacros[macro.id]}
              onToggleExpand={(expanded) => setExpandedMacros(prev => ({ ...prev, [macro.id]: expanded }))}
              regulatoryStandards={regulatoryStandards}
              onOpenRegulatoryModal={onOpenRegulatoryModal}
            />
          ))}
        </SortableContext>
        {isAddingMacroForPhase === phase ? (
          <div className="p-4 bg-teal-50/50 border border-teal-200 rounded-3xl flex items-center gap-2 animate-in fade-in duration-300">
            <input type="text" value={newMacroNameInput} onChange={e => setNewMacroNameInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddMacroActivity(String(phase))} placeholder="Nome da nova macroatividade" autoFocus className="flex-1 px-4 py-2 bg-white border border-teal-300 rounded-xl text-sm font-bold text-slate-900"/>
            <button onClick={() => handleAddMacroActivity(String(phase))} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition"><Save size={16} /></button>
            <button onClick={() => { setIsAddingMacroForPhase(null); setNewMacroNameInput(''); }} className="p-2 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition"><X size={16} /></button>
          </div>
        ) : (
          phase !== 'Sem Fase Atribuída' &&
          <button onClick={() => setIsAddingMacroForPhase(phase)} className="w-full mt-2 p-3 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 hover:text-slate-700 transition"><Plus size={14} /> Adicionar Macroatividade</button>
        )}
      </div>
    </div>
  );
};

interface MacroRowProps {
  macro: MacroActivity;
  project: Project;
  onUpdateProject: (p: Project) => void;
  onOpenDeletionModal: (item: { type: 'macro' | 'micro', ids: { projectId: string; macroId: string; microId?: string; }, name: string }) => void;
  teamMembers: TeamMember[];
  assignees: string[];
  onMicroUpdate: (macroId: string, microId: string, updates: Partial<MicroActivity>) => void;
  onAddMicro: (macroId: string) => void;
  editingMicro: string | null;
  onSetEditingMicro: (id: string | null) => void;
  isExpanded?: boolean;
  onToggleExpand?: (expanded: boolean) => void;
  regulatoryStandards: RegulatoryStandard[];
  onOpenRegulatoryModal: (activityName: string) => void;
}

const MacroRow: React.FC<MacroRowProps> = (props) => {
  const { 
    macro, project, onUpdateProject, onOpenDeletionModal, assignees, onMicroUpdate, onAddMicro, editingMicro, onSetEditingMicro,
    isExpanded: controlledIsExpanded, onToggleExpand, regulatoryStandards, onOpenRegulatoryModal
  } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: macro.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const [isExpandedInternal, setIsExpandedInternal] = useState(false);
  const isExpanded = controlledIsExpanded !== undefined ? controlledIsExpanded : isExpandedInternal;
  const setIsExpanded = onToggleExpand || setIsExpandedInternal;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(macro.name);
  const [showPrerequisites, setShowPrerequisites] = useState(false);

  const [isResultsModalOpen, setIsResultsModalOpen] = useState(false);
  const [evidenceModalMicro, setEvidenceModalMicro] = useState<MicroActivity | null>(null);

  const hasBudgetPrerequisite = useMemo(() => {
    return (macro.prerequisites || []).some(p => p.type === 'orçamento');
  }, [macro.prerequisites]);

  const totalMicros = macro.microActivities.length;
  const completedMicros = macro.microActivities.filter(m => m.status === 'Concluído e aprovado' || m.status === 'Concluído com restrições').length;
  
  const allMicrosDone = totalMicros > 0 && completedMicros === totalMicros;
  const progress = totalMicros > 0 ? (completedMicros / totalMicros) * 100 : 0;
  const restrictedCount = macro.microActivities.filter(m => m.status === 'Concluído com restrições').length;

  const hasRegulatoryStandards = useMemo(() => {
    return regulatoryStandards.some(s => 
      s.relatedActivities.some((a: string) => a.toLowerCase() === macro.name.toLowerCase())
    );
  }, [macro.name, regulatoryStandards]);

  const microOverdueAlert = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return macro.microActivities.some(micro => {
      if (micro.status === 'Concluído e aprovado' || !micro.dueDate) return false;
      const dueDate = new Date(micro.dueDate + 'T00:00:00');
      return today > dueDate;
    });
  }, [macro.microActivities]);

  const getMacroStatus = (): string => {
    if (totalMicros === 0) return 'Planejado';
    
    const statuses = macro.microActivities.map(m => m.status);
    
    if (statuses.some(s => s === 'Em andamento')) return 'Em andamento';
    if (statuses.some(s => s === 'A repetir / retrabalho')) return 'A repetir / retrabalho';
    
    const allDone = statuses.every(s => s === 'Concluído e aprovado' || s === 'Concluído com restrições');
    
    if (allDone) {
      const hasRestrictions = statuses.some(s => s === 'Concluído com restrições');
      const deliverableMissing = macro.hasDeliverable && !macro.isDeliverableRegistered;
      
      if (hasRestrictions || deliverableMissing) return 'Concluído com restrições';
      return 'Concluído e aprovado';
    }
    
    if (statuses.every(s => s === 'Planejado')) return 'Planejado';
    return 'Em andamento';
  };
  const macroStatus = getMacroStatus();

  const getMacroStatusIcon = () => {
    switch (macroStatus) {
      case 'Concluído e aprovado':
        return <div className="w-5 h-5 bg-emerald-500 rounded flex items-center justify-center text-white"><CheckCircle2 size={12} /></div>;
      case 'Em andamento':
        return <Activity size={18} className="text-blue-500" />;
      case 'Concluído com restrições':
        return <BadgeAlert size={18} className="text-cyan-500" />;
      case 'A repetir / retrabalho':
        return <div className="w-5 h-5 rounded-full border-2 border-amber-500 flex items-center justify-center text-amber-500"><ChevronDown size={12} /></div>;
      case 'Planejado':
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-slate-300" />;
    }
  };

  const deliverableMissing = macro.hasDeliverable && !macro.isDeliverableRegistered && macroStatus === 'Concluído com restrições';

  const handleSaveName = () => {
    if (!editedName.trim()) return;
    const updatedProject = { ...project, macroActivities: project.macroActivities.map(m => m.id === macro.id ? {...m, name: editedName.trim()} : m) };
    onUpdateProject(updatedProject);
    setIsEditing(false);
  };

  const handleUpdateMacro = (updates: Partial<MacroActivity>) => {
    const updatedProject = { ...project, macroActivities: project.macroActivities.map(m => m.id === macro.id ? {...m, ...updates} : m) };
    onUpdateProject(updatedProject);
  };

  const handleAddPrerequisite = () => {
    const newPre: Prerequisite = {
        id: 'pre_' + Math.random().toString(36).substr(2, 9),
        name: 'Novo Pré-requisito',
        type: 'recurso',
        status: 'não iniciado',
        completed: false,
        leadTimeDays: 7
    };
    handleUpdateMacro({ prerequisites: [...(macro.prerequisites || []), newPre] });
    setShowPrerequisites(true);
  };

  const handleUpdatePrerequisite = (preId: string, updates: Partial<Prerequisite>) => {
    const updatedPres = (macro.prerequisites || []).map(p => p.id === preId ? { ...p, ...updates } : p);
    handleUpdateMacro({ prerequisites: updatedPres });
  };

  const handleDeletePrerequisite = (preId: string) => {
    const updatedPres = (macro.prerequisites || []).filter(p => p.id !== preId);
    handleUpdateMacro({ prerequisites: updatedPres });
  };
  
  return (
    <div ref={setNodeRef} style={style} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="w-full p-4 flex justify-between items-center text-left group">
        <div className="flex items-center gap-4 flex-1">
          <div {...attributes} {...listeners} className="p-2 text-slate-300 hover:text-slate-500 cursor-grab active:cursor-grabbing">
            <GripVertical size={16} />
          </div>
          <button onClick={() => setIsExpanded(!isExpanded)} className={`w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 bg-slate-800`}>
            <ChevronDown size={20} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
          </button>
          <div className="flex items-center gap-3">
            {getMacroStatusIcon()}
            {isEditing ? (
              <div className="flex-1 flex gap-2 items-center">
                <input value={editedName} onChange={e => setEditedName(e.target.value)} autoFocus className="w-full text-xs font-black text-slate-800 uppercase tracking-tight bg-white border border-teal-300 rounded-md px-3 py-2"/>
                <button onClick={handleSaveName} className="p-2 text-emerald-500 hover:bg-emerald-100 rounded-md"><Save size={16}/></button>
                <button onClick={() => setIsEditing(false)} className="p-2 text-slate-400 hover:bg-slate-200 rounded-md"><X size={16}/></button>
                <button onClick={handleAddPrerequisite} className="p-2 text-teal-600 hover:bg-teal-50 rounded-md" title="Adicionar Pré-requisito"><ListTodo size={16}/></button>
              </div>
            ) : ( 
              <div className="flex flex-col">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsResultsModalOpen(true)}>
                    {microOverdueAlert && (
                        <div className="animate-bounce" title="Existem microatividades atrasadas nesta macro!">
                            <AlertTriangle size={14} className="text-red-500" />
                        </div>
                    )}
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight group-hover:text-brand-primary transition-colors">{macro.name}</h4> 
                    {macro.resultsFulfilled ? (
                      <span title="Resultados Cumpridos">
                        <CheckCircle2 size={14} className="text-emerald-500" />
                      </span>
                    ) : macro.completionExplanation ? (
                      <span title="Possui justificativa de não conclusão de resultados">
                        <MessageSquare size={14} className="text-amber-500" />
                      </span>
                    ) : null}
                    {hasRegulatoryStandards && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onOpenRegulatoryModal(macro.name); }}
                            className="p-1 text-brand-primary hover:bg-brand-primary/10 rounded-md transition-colors"
                            title="Normas Regulatórias Aplicáveis"
                        >
                            <ShieldCheck size={14} />
                        </button>
                    )}
                </div>
                {deliverableMissing && (
                  <div className="flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-tighter">
                    <AlertTriangle size={10} />
                    Entregável ({macro.deliverableType || 'não especificado'}) pende registro
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
              <button onClick={() => setShowPrerequisites(true)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-md" title="Adicionar Pré-requisito"><ListTodo size={16}/></button>
              <button onClick={() => setIsEditing(true)} className="p-2 text-slate-400 hover:text-brand-primary hover:bg-teal-50 rounded-md"><Edit size={16}/></button>
              <button onClick={() => onOpenDeletionModal({ type: 'macro', ids: { projectId: project.id, macroId: macro.id }, name: macro.name })} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"><Trash2 size={16}/></button>
          </div>
          <div className="flex items-center gap-2">
              {macro.prerequisites && macro.prerequisites.length > 0 && (
                  <button 
                      onClick={() => setShowPrerequisites(!showPrerequisites)}
                      className={`p-2 rounded-xl transition flex items-center gap-1 ${showPrerequisites ? 'bg-teal-100 text-teal-600' : 'text-slate-400 hover:bg-slate-100'}`}
                      title="Pré-requisitos da Macro"
                  >
                      <ListTodo size={14}/>
                      {hasBudgetPrerequisite && <DollarSign size={14} className="text-emerald-500 animate-pulse" />}
                      <span className="text-[9px] font-bold">{macro.prerequisites.length}</span>
                  </button>
              )}
              <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">{Math.round(progress)}%</span>
                      <div className="w-16 h-1.5 bg-slate-200 rounded-full"><div className="bg-brand-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div></div>
                      <span className="text-[9px] font-black text-slate-400">{completedMicros}/{totalMicros}</span>
                  </div>
                  {restrictedCount > 0 && (
                      <div className="flex items-center gap-1 mt-1 text-amber-600">
                          <AlertTriangle size={12} />
                          <span className="text-[9px] font-black uppercase">{restrictedCount}/{completedMicros} com restrições</span>
                      </div>
                  )}
              </div>
          </div>
        </div>
      </div>

      {showPrerequisites && (
        <PrerequisitesModal
          isOpen={showPrerequisites}
          onClose={() => setShowPrerequisites(false)}
          title={macro.name}
          prerequisites={macro.prerequisites || []}
          onUpdatePrerequisites={(updated) => handleUpdateMacro({ prerequisites: updated })}
        />
      )}
      {isResultsModalOpen && (
        <MacroActivityResultsModal 
          isOpen={isResultsModalOpen}
          onClose={() => setIsResultsModalOpen(false)}
          macro={macro}
          onUpdate={handleUpdateMacro}
          allMicrosDone={allMicrosDone}
        />
      )}
      {isExpanded && (
        <div className="bg-white p-4 border-t border-slate-100 space-y-3">
          <div className="overflow-x-auto custom-scrollbar border border-slate-200/80 rounded-2xl bg-white shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-600">
                  <th className="py-3 px-4 min-w-[200px]">Atividade</th>
                  <th className="py-3 px-4 min-w-[140px]">Responsável</th>
                  <th className="py-3 px-4 min-w-[150px]">Status</th>
                  <th className="py-3 px-4 min-w-[120px]">Evidência</th>
                  <th className="py-3 px-4 min-w-[170px]">Contribuição Regulatória</th>
                  <th className="py-3 px-4 w-[90px] text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {macro.microActivities.map(micro => (
                  <MicroActivityTableRow 
                    key={micro.id} 
                    micro={micro} 
                    assignees={assignees} 
                    onUpdate={(updates) => onMicroUpdate(macro.id, micro.id, updates)} 
                    onDelete={() => onOpenDeletionModal({ type: 'micro', ids: { projectId: project.id, macroId: macro.id, microId: micro.id }, name: micro.name })} 
                    onOpenEvidenceModal={(m) => setEvidenceModalMicro(m)}
                    projectId={project.id}
                    projectName={project.name}
                    macroId={macro.id}
                    macroName={macro.name}
                  />
                ))}
                {macro.microActivities.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400 italic text-xs font-medium">
                      Nenhuma atividade cadastrada nesta macroatividade.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <button onClick={() => onAddMicro(macro.id)} className="w-full mt-2 p-3 bg-slate-50 text-slate-600 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 transition border border-dashed border-slate-200"><Plus size={14}/> Adicionar Microatividade</button>
        </div>
      )}

      {evidenceModalMicro && (
        <MicroEvidenceModal
          micro={evidenceModalMicro}
          onClose={() => setEvidenceModalMicro(null)}
          onSave={(updates) => {
            onMicroUpdate(macro.id, evidenceModalMicro.id, updates);
            setEvidenceModalMicro(null);
          }}
        />
      )}
    </div>
  );
};

interface MacroActivityResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  macro: MacroActivity;
  onUpdate: (updates: Partial<MacroActivity>) => void;
  allMicrosDone: boolean;
}

const MacroActivityResultsModal: React.FC<MacroActivityResultsModalProps> = ({ 
  isOpen, onClose, macro, onUpdate, allMicrosDone 
}) => {
  const [explanation, setExplanation] = useState(macro.completionExplanation || '');
  const [fulfilled, setFulfilled] = useState(macro.resultsFulfilled || false);
  const [newLink, setNewLink] = useState('');

  if (!isOpen) return null;

  const handleSave = () => {
    // If setting as concluded without results fulfilled, check if explanation is provided
    if (allMicrosDone && !fulfilled && explanation.trim() === '') {
      alert('Uma explicação é obrigatória para considerar a macroatividade concluída sem o cumprimento de todos os resultados esperados.');
      return;
    }

    onUpdate({
      resultsFulfilled: fulfilled,
      completionExplanation: fulfilled ? '' : explanation,
      resultLinks: macro.resultLinks // preservation
    });
    onClose();
  };

  const handleAddLink = () => {
    if (!newLink.trim()) return;
    const currentLinks = macro.resultLinks || [];
    onUpdate({ resultLinks: [...currentLinks, newLink.trim()] });
    setNewLink('');
  };

  const handleRemoveLink = (idx: number) => {
    const currentLinks = macro.resultLinks || [];
    onUpdate({ resultLinks: currentLinks.filter((_, i) => i !== idx) });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200">
            <ClipboardCheck size={24} />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Gestão de Entregáveis</h2>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{macro.name}</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
        </header>

        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-4">
             <div className="flex items-center justify-between">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <ListTodo size={14}/> Descrição do Entregável / Comprovação
               </label>
               <span className="text-[9px] font-bold text-slate-400 uppercase italic">Conforme definido no plano</span>
             </div>
             
             <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                <textarea 
                  value={macro.expectedResults || ''}
                  onChange={e => onUpdate({ expectedResults: e.target.value })}
                  placeholder="Descreva o entregável alcançado ou detalhes da comprovação..."
                  className="w-full bg-transparent text-xs font-bold text-slate-600 leading-relaxed italic border-none focus:ring-0 p-0 min-h-[80px] resize-none text-justify"
                />
                
                <div className="pt-2 border-t border-slate-200 flex flex-col gap-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={fulfilled} 
                      onChange={e => setFulfilled(e.target.checked)}
                      className="w-5 h-5 rounded-lg border-slate-300 text-emerald-500 focus:ring-emerald-500 transition"
                    />
                    <span className="text-sm font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-600 transition">Confirmo o cumprimento integral deste resultado</span>
                  </label>

                  {macro.hasDeliverable && (
                    <label className="flex items-center gap-3 cursor-pointer group p-3 bg-amber-50 rounded-xl border border-amber-100">
                      <input 
                        type="checkbox" 
                        checked={macro.isDeliverableRegistered || false} 
                        onChange={e => onUpdate({ isDeliverableRegistered: e.target.checked })}
                        className="w-5 h-5 rounded-lg border-amber-300 text-amber-500 focus:ring-amber-500 transition"
                      />
                      <div className="flex-1">
                        <span className="text-xs font-black text-amber-900 uppercase tracking-tight block">Entregável Registrado?</span>
                        <span className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">Tipo: {macro.deliverableType || 'Não especificado'}</span>
                      </div>
                    </label>
                  )}
                </div>
             </div>
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
               <LinkIcon size={14}/> Links / Comprovantes (Obrigatório para registro de entregável)
             </label>
             <div className="flex gap-2">
                <input 
                  value={newLink} 
                  onChange={e => setNewLink(e.target.value)}
                  placeholder="Adicionar novo link..."
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-amber-500/20"
                />
                <button 
                  onClick={handleAddLink}
                  className="px-4 py-2 bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase hover:bg-black transition"
                >
                  Add
                </button>
             </div>
             {macro.resultLinks && macro.resultLinks.length > 0 && (
               <div className="space-y-2 mt-2">
                  {macro.resultLinks.map((link, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-white border border-slate-100 rounded-xl">
                      <LinkIcon size={12} className="text-slate-400 shrink-0" />
                      <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-amber-600 truncate flex-1 hover:underline">{link}</a>
                      <button onClick={() => handleRemoveLink(idx)} className="text-slate-300 hover:text-red-500 p-1"><X size={14}/></button>
                    </div>
                  ))}
               </div>
             )}
          </div>

          {!fulfilled && (allMicrosDone || macro.completionExplanation) && (
            <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
               <label className="text-[10px] font-black text-red-400 uppercase tracking-widest flex items-center gap-2">
                 <AlertTriangle size={14}/> Explicação para Não Cumprimento
               </label>
               <textarea 
                  value={explanation}
                  onChange={e => setExplanation(e.target.value)}
                  placeholder="Por que os resultados esperados não foram totalmente alcançados?"
                  className="w-full p-4 bg-red-50/30 border border-red-100 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-red-500/20 min-h-[100px]"
               />
               {!allMicrosDone && (
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider italic">
                   Nota: A macro será considerada concluída somente após a finalização de todas as microatividades e o preenchimento da justificativa.
                 </p>
               )}
            </div>
          )}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 rounded-xl transition">Cancelar</button>
          <button onClick={handleSave} className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition">
            Salvar Registro
          </button>
        </footer>
      </div>
    </div>
  );
};

interface MicroActivityTableRowProps {
  micro: MicroActivity;
  assignees: string[];
  onUpdate: (updates: Partial<MicroActivity>) => void;
  onDelete: () => void;
  onOpenEvidenceModal: (micro: MicroActivity) => void;
  projectId?: string;
  projectName?: string;
  macroId?: string;
  macroName?: string;
}

const MicroActivityTableRow: React.FC<MicroActivityTableRowProps> = ({
  micro,
  assignees,
  onUpdate,
  onDelete,
  onOpenEvidenceModal,
  projectId = 'geral',
  projectName = 'Geral',
  macroId,
  macroName
}) => {
  const [localName, setLocalName] = useState(micro.name);

  useEffect(() => {
    setLocalName(micro.name);
  }, [micro.name]);

  const hasEvidence = Boolean(
    (micro.reportLink && micro.reportLink.trim().length > 0) ||
    (micro.observations && micro.observations.trim().length > 0) ||
    (micro.dossierContribution?.attachmentUrl && micro.dossierContribution.attachmentUrl.trim().length > 0)
  );

  const handleToggleRegulatory = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    
    if (isChecked) {
      const existingContrib = micro.dossierContribution || {
        id: 'contrib_' + Math.random().toString(36).substring(2, 9),
        projectId: projectId,
        projectName: projectName,
        macroActivityId: macroId,
        macroActivityName: macroName,
        activityId: micro.id,
        activityName: micro.name,
        chapterId: 'cap_1' as const,
        chapterTitle: 'Geral',
        type: 'documento' as const,
        content: micro.observations || '',
        status: 'Em Revisão' as const,
        version: 1,
        author: micro.assignee || 'Usuário',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      onUpdate({
        generatesRegulatoryContent: true,
        dossierContribution: existingContrib
      });
    } else {
      onUpdate({
        generatesRegulatoryContent: false
      });
    }
  };

  return (
    <tr className="border-b border-slate-100 hover:bg-slate-50/80 transition-colors">
      <td className="py-3 px-4 font-medium text-slate-800">
        <input 
          type="text"
          value={localName}
          onChange={(e) => setLocalName(e.target.value)}
          onBlur={() => {
            if (localName.trim() !== micro.name) {
              onUpdate({ name: localName.trim() });
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              (e.target as HTMLInputElement).blur();
            }
          }}
          className="w-full bg-transparent font-bold text-slate-800 text-xs border-b border-transparent focus:border-teal-500 hover:border-slate-300 outline-none px-1 py-0.5 rounded transition-colors"
          placeholder="Nome da atividade..."
        />
      </td>

      <td className="py-3 px-4 text-slate-600">
        <select 
          value={micro.assignee || ''} 
          onChange={(e) => onUpdate({ assignee: e.target.value })}
          className="w-full bg-slate-50 border border-slate-200/80 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer"
        >
          <option value="">Selecione...</option>
          {assignees.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </td>

      <td className="py-3 px-4">
        <select 
          value={micro.status} 
          onChange={(e) => onUpdate({ status: e.target.value as MicroActivityStatus })}
          className={`w-full text-xs font-bold px-2 py-1.5 rounded-xl border outline-none cursor-pointer transition ${
            micro.status === 'Concluído e aprovado' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' :
            micro.status === 'Em andamento' ? 'bg-amber-50 text-amber-800 border-amber-300' :
            micro.status === 'Concluído com restrições' ? 'bg-orange-50 text-orange-800 border-orange-300' :
            micro.status === 'A repetir / retrabalho' ? 'bg-rose-50 text-rose-800 border-rose-300' :
            'bg-slate-50 text-slate-700 border-slate-200'
          }`}
        >
          <option value="Planejado">⚪ Não iniciado</option>
          <option value="Em andamento">🟡 Em andamento</option>
          <option value="Concluído e aprovado">🟩 Concluído</option>
          <option value="Concluído com restrições">🟠 Com restrições</option>
          <option value="A repetir / retrabalho">🔴 A repetir</option>
        </select>
      </td>

      <td className="py-3 px-4">
        <button
          type="button"
          onClick={() => onOpenEvidenceModal(micro)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
            hasEvidence 
              ? 'bg-emerald-100/90 text-emerald-900 hover:bg-emerald-200 border border-emerald-300' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
          }`}
        >
          {hasEvidence ? (
            <>
              <Paperclip size={13} className="text-emerald-700" />
              <span>Evidência</span>
            </>
          ) : (
            <>
              <Plus size={13} className="text-slate-500" />
              <span>Adicionar</span>
            </>
          )}
        </button>
      </td>

      <td className="py-3 px-4">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input 
            type="checkbox"
            checked={Boolean(micro.generatesRegulatoryContent)}
            onChange={handleToggleRegulatory}
            className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
          />
          <span className={`text-xs font-bold ${
            micro.generatesRegulatoryContent ? 'text-indigo-900' : 'text-slate-500'
          }`}>
            {micro.generatesRegulatoryContent ? '☑ Sim' : '☐ Não'}
          </span>
        </label>
      </td>

      <td className="py-3 px-4 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => onOpenEvidenceModal(micro)}
            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
            title="Visualizar / Editar Detalhes da Evidência"
          >
            <Eye size={16} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            title="Excluir Atividade"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </td>
    </tr>
  );
};

interface MicroEvidenceModalProps {
  micro: MicroActivity;
  onClose: () => void;
  onSave: (updates: Partial<MicroActivity>) => void;
}

const MicroEvidenceModal: React.FC<MicroEvidenceModalProps> = ({ micro, onClose, onSave }) => {
  const [link, setLink] = useState(micro.reportLink || '');
  const [obs, setObs] = useState(micro.observations || '');
  const [docUrl, setDocUrl] = useState(micro.dossierContribution?.attachmentUrl || '');

  const handleSave = () => {
    const updatedContrib = micro.dossierContribution ? {
      ...micro.dossierContribution,
      attachmentUrl: docUrl.trim(),
      attachmentName: docUrl.trim() ? (docUrl.trim().split('/').pop() || 'Anexo') : '',
      content: obs.trim() || micro.dossierContribution.content
    } : (docUrl.trim() ? {
      id: 'contrib_' + Math.random().toString(36).substring(2, 9),
      projectId: 'geral',
      activityId: micro.id,
      activityName: micro.name,
      chapterId: 'cap_1' as const,
      chapterTitle: 'Geral',
      type: 'documento' as const,
      content: obs.trim(),
      attachmentUrl: docUrl.trim(),
      attachmentName: docUrl.trim().split('/').pop() || 'Anexo',
      status: 'Em Revisão' as const,
      version: 1,
      author: micro.assignee || 'Usuário',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    } : undefined);

    onSave({
      reportLink: link.trim(),
      observations: obs.trim(),
      dossierContribution: updatedContrib
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
        <header className="p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-teal-400 tracking-wider block mb-0.5">Painel de Evidência</span>
            <h3 className="text-base font-black uppercase tracking-tight">{micro.name}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-slate-300 hover:text-white transition">
            <X size={18} />
          </button>
        </header>

        <div className="p-6 space-y-4 text-xs">
          <p className="text-slate-500 font-medium">
            Preencha ao menos uma das opções abaixo para que a evidência seja considerada existente.
          </p>

          <div className="space-y-1">
            <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <LinkIcon size={12} className="text-indigo-600" /> Link
            </label>
            <input 
              type="text"
              value={link}
              onChange={e => setLink(e.target.value)}
              placeholder="https://sharepoint.com/... ou URL do arquivo"
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <MessageSquare size={12} className="text-indigo-600" /> Texto / Observação
            </label>
            <textarea 
              rows={3}
              value={obs}
              onChange={e => setObs(e.target.value)}
              placeholder="Insira detalhes técnicos, observações ou notas da evidência..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="font-extrabold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Paperclip size={12} className="text-indigo-600" /> Documento (Anexo)
            </label>
            <input 
              type="text"
              value={docUrl}
              onChange={e => setDocUrl(e.target.value)}
              placeholder="Link do anexo ou documento de suporte..."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <footer className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-[10px]">
            Cancelar
          </button>
          <button onClick={handleSave} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-black uppercase text-[10px] tracking-wider hover:bg-indigo-700 shadow-md">
            Salvar Evidência
          </button>
        </footer>
      </div>
    </div>
  );
};


export default ProjectTimeline;