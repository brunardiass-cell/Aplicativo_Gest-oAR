
import React, { useState, useEffect } from 'react';
import { ActivityPlanTemplate, MacroActivityTemplate, Project } from '../types';
import { X, ListPlus, Plus, Trash2, Save, Layers, FilePlus, AlertTriangle } from 'lucide-react';

interface PlanManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ActivityPlanTemplate[];
  onSave: (plans: ActivityPlanTemplate[]) => void;
  projects: Project[];
  onUpdateProjects: (projects: Project[]) => void;
}

const PlanManagerModal: React.FC<PlanManagerModalProps> = ({ isOpen, onClose, plans, onSave, projects, onUpdateProjects }) => {
  const [localPlans, setLocalPlans] = useState<ActivityPlanTemplate[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newMacroNames, setNewMacroNames] = useState<{ [key: string]: string }>({});
  const [newMicroNames, setNewMicroNames] = useState<{ [key: string]: string }>({});
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [activeTab, setActiveTab] = useState<'activities' | 'checklist'>('activities');

  useEffect(() => {
    if (isOpen) {
      setLocalPlans(JSON.parse(JSON.stringify(plans)));
      if (plans.length > 0 && !selectedPlanId) {
        setSelectedPlanId(plans[0].id);
      } else if (plans.length > 0 && selectedPlanId && !plans.find(p => p.id === selectedPlanId)) {
        setSelectedPlanId(plans[0].id);
      } else if (plans.length === 0) {
        setSelectedPlanId(null);
      }
    }
  }, [isOpen, plans, selectedPlanId]);

  const selectedPlan = localPlans.find(p => p.id === selectedPlanId);

  const handleAddPlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlanName.trim()) return;
    const newPlan: ActivityPlanTemplate = {
      id: 'custom_' + Math.random().toString(36).substr(2, 9),
      name: newPlanName.trim(),
      phases: ['Nova Fase'],
      macroActivities: [],
      regulatoryChecklist: []
    };
    setLocalPlans([...localPlans, newPlan]);
    setSelectedPlanId(newPlan.id);
    setNewPlanName('');
  };

  const handleDeletePlan = (planId: string) => {
    if (!confirm(`Tem certeza que deseja excluir o plano "${localPlans.find(p => p.id === planId)?.name}"?`)) return;
    const updatedPlans = localPlans.filter(p => p.id !== planId);
    setLocalPlans(updatedPlans);
    if (selectedPlanId === planId) {
      setSelectedPlanId(updatedPlans[0]?.id || null);
    }
  };
  
  const handleAddPhase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPhaseName.trim() || !selectedPlanId) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const currentPhases = p.phases || [];
        if (!currentPhases.includes(newPhaseName.trim())) {
          return { ...p, phases: [...currentPhases, newPhaseName.trim()] };
        }
      }
      return p;
    });
    setLocalPlans(updatedPlans);
    setNewPhaseName('');
  };

  const handleDeletePhase = (phaseToDelete: string) => {
     if (!selectedPlanId || !confirm(`Deseja excluir a fase "${phaseToDelete}"? Todas as macroatividades associadas a ela serão removidas.`)) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        return { 
          ...p, 
          phases: (p.phases || []).filter(phase => phase !== phaseToDelete),
          macroActivities: p.macroActivities.filter(macro => macro.phase !== phaseToDelete)
        };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };
  
  const handleAddMacro = (e: React.FormEvent, phase: string) => {
    e.preventDefault();
    const macroName = newMacroNames[phase]?.trim();
    if (!macroName || !selectedPlanId) return;

    const updatedPlans = localPlans.map(p => 
      p.id === selectedPlanId 
        ? { ...p, macroActivities: [...p.macroActivities, { name: macroName, phase: phase }] } 
        : p
    );
    setLocalPlans(updatedPlans);
    setNewMacroNames({ ...newMacroNames, [phase]: '' });
  };

  const handleDeleteMacro = (macroToDelete: MacroActivityTemplate) => {
    if (!selectedPlanId) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const updatedMacros = p.macroActivities.filter(m => m.name !== macroToDelete.name || m.phase !== macroToDelete.phase);
        return { ...p, macroActivities: updatedMacros };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };
  
  const handleUpdatePhase = (oldName: string, newName: string) => {
    if (!selectedPlanId || !newName.trim() || oldName === newName) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        return {
          ...p,
          phases: (p.phases || []).map(phase => phase === oldName ? newName.trim() : phase),
          macroActivities: p.macroActivities.map(macro => 
            macro.phase === oldName ? { ...macro, phase: newName.trim() } : macro
          )
        };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };

  const handleUpdateMacro = (macroToUpdate: MacroActivityTemplate, newName: string) => {
    if (!selectedPlanId || !newName.trim() || macroToUpdate.name === newName) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const updatedMacros = p.macroActivities.map(m => 
          (m.name === macroToUpdate.name && m.phase === macroToUpdate.phase) 
            ? { ...m, name: newName.trim() } 
            : m
        );
        return { ...p, macroActivities: updatedMacros };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };

  const handleAddMicro = (e: React.FormEvent, macro: MacroActivityTemplate) => {
    e.preventDefault();
    const microName = newMicroNames[macro.name + macro.phase]?.trim();
    if (!microName || !selectedPlanId) return;

    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const updatedMacros = p.macroActivities.map(m => {
          if (m.name === macro.name && m.phase === macro.phase) {
            return { ...m, microActivities: [...(m.microActivities || []), microName] };
          }
          return m;
        });
        return { ...p, macroActivities: updatedMacros };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
    setNewMicroNames({ ...newMicroNames, [macro.name + macro.phase]: '' });
  };

  const handleDeleteMicro = (macro: MacroActivityTemplate, microIndex: number) => {
    if (!selectedPlanId) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const updatedMacros = p.macroActivities.map(m => {
          if (m.name === macro.name && m.phase === macro.phase) {
            const updatedMicros = (m.microActivities || []).filter((_, i) => i !== microIndex);
            return { ...m, microActivities: updatedMicros };
          }
          return m;
        });
        return { ...p, macroActivities: updatedMacros };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };

  const handleAddChecklistItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistItem.trim() || !selectedPlanId) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const currentChecklist = p.regulatoryChecklist || [];
        return { 
          ...p, 
          regulatoryChecklist: [
            ...currentChecklist, 
            { id: 'item_' + Math.random().toString(36).substr(2, 9), item: newChecklistItem.trim(), completed: false }
          ] 
        };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
    setNewChecklistItem('');
  };

  const handleDeleteChecklistItem = (itemId: string) => {
    if (!selectedPlanId) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        return { ...p, regulatoryChecklist: (p.regulatoryChecklist || []).filter(i => i.id !== itemId) };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };

  const handleUpdateChecklistItem = (itemId: string, newItem: string) => {
    if (!selectedPlanId || !newItem.trim()) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        return { 
          ...p, 
          regulatoryChecklist: (p.regulatoryChecklist || []).map(i => i.id === itemId ? { ...i, item: newItem.trim() } : i) 
        };
      }
      return p;
    });
    setLocalPlans(updatedPlans);
  };

  const handleSaveAndClose = () => {
    onSave(localPlans);
    
    // Check if any checklist was modified and ask to apply to existing projects
    const modifiedPlans = localPlans.filter(localPlan => {
      const originalPlan = plans.find(p => p.id === localPlan.id);
      if (!originalPlan) return false;
      return JSON.stringify(localPlan.regulatoryChecklist) !== JSON.stringify(originalPlan.regulatoryChecklist);
    });

    if (modifiedPlans.length > 0) {
      const shouldApply = confirm("Você alterou o checklist regulatório de um ou mais planos. Deseja aplicar estas alterações aos projetos já existentes que utilizam estes planos?");
      
      if (shouldApply) {
        const updatedProjects = projects.map(project => {
          const matchingModifiedPlan = modifiedPlans.find(p => p.id === project.templateId);
          if (matchingModifiedPlan) {
            // Update the checklist without overwriting existing progress if possible
            // But usually, if the template changed, we want to sync the items.
            // The user said: "não modifique o que já está la, apenas atualize o checklist"
            // This means we should add new items and maybe remove deleted ones, 
            // but keep the state of existing items.
            
            const currentProjectChecklist = project.regulatoryChecklist || [];
            const newTemplateChecklist = matchingModifiedPlan.regulatoryChecklist || [];
            
            const updatedChecklist = newTemplateChecklist.map(templateItem => {
              const existingItem = currentProjectChecklist.find(i => i.item === templateItem.item);
              if (existingItem) {
                return { ...existingItem }; // Keep existing state (completed, etc)
              }
              return { ...templateItem }; // Add new item from template
            });
            
            return { ...project, regulatoryChecklist: updatedChecklist };
          }
          return project;
        });
        onUpdateProjects(updatedProjects);
      }
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-5xl h-[95vh] sm:h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <header className="p-6 sm:p-8 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
          <div className="p-2 sm:p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200">
            <ListPlus size={24} />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter">Gerenciar Planos</h2>
            <p className="text-[8px] sm:text-[10px] font-bold text-amber-600 uppercase tracking-widest">Templates de atividades</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
        </header>

        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          <div className="w-full sm:w-1/3 border-b sm:border-b-0 sm:border-r border-slate-100 flex flex-col h-1/3 sm:h-auto">
            <div className="p-4 sm:p-6 border-b border-slate-100">
              <form onSubmit={handleAddPlan} className="flex gap-2">
                <input value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="Novo plano..." className="flex-1 px-3 sm:px-4 py-2 sm:py-3 bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold"/>
                <button type="submit" className="px-3 sm:px-4 bg-slate-800 text-white rounded-xl hover:bg-black transition"><FilePlus size={16}/></button>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 custom-scrollbar">
              {localPlans.map(plan => (
                <div key={plan.id} className={`flex items-center justify-between rounded-2xl transition group ${selectedPlanId === plan.id ? 'bg-amber-100' : 'hover:bg-slate-50'}`}>
                  <button onClick={() => setSelectedPlanId(plan.id)} className="flex-1 text-left p-4">
                    <p className={`font-black text-sm uppercase tracking-tight ${selectedPlanId === plan.id ? 'text-amber-900' : 'text-slate-800'}`}>{plan.name}</p>
                  </button>
                  <button onClick={() => handleDeletePlan(plan.id)} className="p-3 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                </div>
              ))}
            </div>
          </div>
          <div className="w-2/3 flex-1 overflow-y-auto custom-scrollbar">
            {selectedPlan ? (
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedPlan.name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Configuração do Template</p>
                  </div>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setActiveTab('activities')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'activities' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Atividades
                    </button>
                    <button 
                      onClick={() => setActiveTab('checklist')}
                      className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition ${activeTab === 'checklist' ? 'bg-white text-brand-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Checklist Regulatório
                    </button>
                  </div>
                </div>

                {activeTab === 'activities' ? (
                  <>
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gerenciar Fases</label>
                        <form onSubmit={handleAddPhase} className="flex gap-2">
                          <input value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} placeholder="Nome da nova fase..." className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"/>
                          <button type="submit" className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"><Plus size={16}/>Add</button>
                        </form>
                    </div>

                    <div className="space-y-6">
                      {(selectedPlan.phases || []).map(phase => (
                        <div key={phase} className="bg-slate-50/50 border border-slate-100 rounded-2xl">
                          <header className="p-4 flex justify-between items-center bg-slate-100/80">
                            <div className="flex items-center gap-2 flex-1">
                              <Layers size={14} className="text-slate-400"/>
                              <input 
                                value={phase} 
                                onChange={e => handleUpdatePhase(phase, e.target.value)}
                                className="bg-transparent border-none text-xs font-black uppercase tracking-widest text-slate-600 focus:ring-0 w-full"
                              />
                            </div>
                            <button onClick={() => handleDeletePhase(phase)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition"><Trash2 size={14}/></button>
                          </header>
                          <div className="p-4 space-y-3">
                            {selectedPlan.macroActivities.filter(m => m.phase === phase).map((macro, index) => (
                              <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                                  <input 
                                    value={macro.name} 
                                    onChange={e => handleUpdateMacro(macro, e.target.value)}
                                    className="bg-transparent border-none text-xs font-bold text-slate-700 focus:ring-0 flex-1"
                                  />
                                  <button onClick={() => handleDeleteMacro(macro)} className="p-1 text-slate-300 hover:text-red-500"><X size={14}/></button>
                                </div>
                                
                                {/* Microactivities for this macro */}
                                <div className="ml-6 space-y-2 border-l-2 border-slate-100 pl-4">
                                  {(macro.microActivities || []).map((micro, mIndex) => (
                                    <div key={mIndex} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-100 rounded-md text-[10px] font-bold text-slate-600">
                                      <span>{micro}</span>
                                      <button onClick={() => handleDeleteMicro(macro, mIndex)} className="text-slate-300 hover:text-red-500"><X size={12}/></button>
                                    </div>
                                  ))}
                                  <form onSubmit={(e) => handleAddMicro(e, macro)} className="flex gap-2">
                                    <input 
                                      value={newMicroNames[macro.name + macro.phase] || ''} 
                                      onChange={e => setNewMicroNames({ ...newMicroNames, [macro.name + macro.phase]: e.target.value })} 
                                      placeholder="Nova microatividade padrão..." 
                                      className="flex-1 px-2 py-1.5 bg-white border border-slate-200 rounded-md text-[10px] font-bold"
                                    />
                                    <button type="submit" className="px-2 bg-slate-100 text-slate-500 rounded-md text-[10px] font-bold uppercase hover:bg-slate-200 transition">Add</button>
                                  </form>
                                </div>
                              </div>
                            ))}
                            <form onSubmit={(e) => handleAddMacro(e, phase)} className="flex gap-2 pt-2">
                               <input value={newMacroNames[phase] || ''} onChange={e => setNewMacroNames({ ...newMacroNames, [phase]: e.target.value })} placeholder="Nova macroatividade..." className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold"/>
                               <button type="submit" className="px-3 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold uppercase flex items-center justify-center gap-1 hover:bg-slate-300 transition"><Plus size={14}/>Add</button>
                            </form>
                          </div>
                        </div>
                      ))}
                       {(selectedPlan.phases || []).length === 0 && (
                         <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                            <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Adicione uma fase para começar.</p>
                         </div>
                       )}
                    </div>
                  </>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Adicionar Item ao Checklist</label>
                        <form onSubmit={handleAddChecklistItem} className="flex gap-2">
                          <input value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} placeholder="Descreva o item regulatório..." className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"/>
                          <button type="submit" className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"><Plus size={16}/>Add</button>
                        </form>
                    </div>

                    <div className="space-y-3">
                      {(selectedPlan.regulatoryChecklist || []).map((item) => (
                        <div key={item.id} className="flex justify-between items-center p-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 shadow-sm">
                          <input 
                            value={item.item} 
                            onChange={e => handleUpdateChecklistItem(item.id, e.target.value)}
                            className="bg-transparent border-none text-sm font-bold text-slate-700 focus:ring-0 flex-1"
                          />
                          <button onClick={() => handleDeleteChecklistItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                        </div>
                      ))}
                      {(selectedPlan.regulatoryChecklist || []).length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-2xl">
                          <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">Nenhum item no checklist regulatório.</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <ListPlus size={48} className="mx-auto text-slate-200 mb-4" />
                  <p className="font-bold text-slate-400">Selecione ou crie um plano.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-8 py-3 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 rounded-xl transition">Cancelar</button>
          <button onClick={handleSaveAndClose} className="px-10 py-3 bg-amber-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-amber-100 hover:bg-amber-600 transition flex items-center gap-2">
            <Save size={14}/> Salvar e Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PlanManagerModal;
