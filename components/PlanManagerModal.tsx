
import React, { useState, useEffect } from 'react';
import { ActivityPlanTemplate, MacroActivityTemplate } from '../types';
import { X, ListPlus, Plus, Trash2, Save, Layers, FilePlus, AlertTriangle } from 'lucide-react';

interface PlanManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ActivityPlanTemplate[];
  onSave: (plans: ActivityPlanTemplate[]) => void;
}

const PlanManagerModal: React.FC<PlanManagerModalProps> = ({ isOpen, onClose, plans, onSave }) => {
  const [localPlans, setLocalPlans] = useState<ActivityPlanTemplate[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [newPlanName, setNewPlanName] = useState('');
  const [newPhaseName, setNewPhaseName] = useState('');
  const [newMacroNames, setNewMacroNames] = useState<{ [key: string]: string }>({});

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
  
  const handleSaveAndClose = () => {
    onSave(localPlans);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-5xl h-[85vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        <header className="p-8 bg-amber-50 border-b border-amber-100 flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-200">
            <ListPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Gerenciar Planos de Atividades</h2>
            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Crie templates de fases e macroatividades</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-slate-100 flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <form onSubmit={handleAddPlan} className="flex gap-2">
                <input value={newPlanName} onChange={e => setNewPlanName(e.target.value)} placeholder="Nome do novo plano..." className="flex-1 px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold"/>
                <button type="submit" className="px-4 bg-slate-800 text-white rounded-xl hover:bg-black transition"><FilePlus size={16}/></button>
              </form>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scrollbar">
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
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{selectedPlan.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fases e Macroatividades</p>
                </div>

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
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-600 flex items-center gap-2"><Layers size={14}/> {phase}</h4>
                        <button onClick={() => handleDeletePhase(phase)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg transition"><Trash2 size={14}/></button>
                      </header>
                      <div className="p-4 space-y-3">
                        {selectedPlan.macroActivities.filter(m => m.phase === phase).map((macro, index) => (
                          <div key={index} className="flex justify-between items-center p-3 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700">
                            <span>{macro.name}</span>
                            <button onClick={() => handleDeleteMacro(macro)} className="p-1 text-slate-300 hover:text-red-500"><X size={14}/></button>
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
