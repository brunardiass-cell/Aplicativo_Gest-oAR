
import React, { useState, useEffect } from 'react';
import { ActivityPlanTemplate } from '../types';
import { X, ListPlus, Plus, Trash2, Save } from 'lucide-react';

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
  const [newMacroName, setNewMacroName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalPlans(JSON.parse(JSON.stringify(plans)));
      if (plans.length > 0) {
        setSelectedPlanId(plans[0].id);
      }
    }
  }, [isOpen, plans]);

  const selectedPlan = localPlans.find(p => p.id === selectedPlanId);

  const handleAddPlan = () => {
    if (!newPlanName.trim()) return;
    const newPlan: ActivityPlanTemplate = {
      id: 'custom_' + Math.random().toString(36).substr(2, 9),
      name: newPlanName.trim(),
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
  
  const handleAddMacro = () => {
    if (!newMacroName.trim() || !selectedPlanId) return;
    const updatedPlans = localPlans.map(p => 
      p.id === selectedPlanId ? { ...p, macroActivities: [...p.macroActivities, newMacroName.trim()] } : p
    );
    setLocalPlans(updatedPlans);
    setNewMacroName('');
  };

  const handleDeleteMacro = (index: number) => {
    if (!selectedPlanId) return;
    const updatedPlans = localPlans.map(p => {
      if (p.id === selectedPlanId) {
        const updatedMacros = p.macroActivities.filter((_, i) => i !== index);
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
      <div className="bg-[#1e293b] text-white rounded-[2rem] shadow-2xl w-full max-w-4xl h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-white/10">
        <header className="p-8 bg-amber-950/20 border-b border-amber-500/10 flex items-center gap-4">
          <div className="p-3 bg-amber-500 rounded-2xl text-white shadow-lg shadow-amber-500/20">
            <ListPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Gerenciar Planos de Atividades</h2>
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">Crie templates de macroatividades</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="w-1/3 border-r border-white/10 flex flex-col bg-slate-900/30">
            <div className="p-4 space-y-2 border-b border-white/10">
              <input
                type="text"
                value={newPlanName}
                onChange={e => setNewPlanName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddPlan()}
                placeholder="Nome do novo plano..."
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={handleAddPlan} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 transition"><Plus size={16}/>Adicionar Plano</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
              {localPlans.map(plan => (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlanId(plan.id)}
                  className={`w-full p-4 rounded-2xl text-left transition flex justify-between items-center group ${selectedPlanId === plan.id ? 'bg-blue-600 text-white' : 'text-white hover:bg-white/10'}`}
                >
                  <span className="font-black text-sm uppercase truncate">{plan.name}</span>
                  {plan.id.startsWith('custom_') && 
                    <span onClick={(e) => { e.stopPropagation(); handleDeletePlan(plan.id); }} className={`p-1 opacity-0 group-hover:opacity-100 rounded-full transition ${selectedPlanId === plan.id ? 'text-blue-200 hover:text-white hover:bg-white/20' : 'text-slate-400 hover:text-red-500 hover:bg-red-500/10'}`}>
                        <Trash2 size={16} />
                    </span>
                  }
                </button>
              ))}
            </div>
          </div>
          
          <div className="w-2/3 flex flex-col">
             {selectedPlan ? (
                <>
                <div className="p-4 flex-1 overflow-y-auto custom-scrollbar space-y-4">
                  <h3 className="text-xs font-black uppercase text-slate-400 tracking-widest px-2">Macroatividades de "{selectedPlan.name}"</h3>
                  <div className="space-y-2">
                    {selectedPlan.macroActivities.map((macro, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl group">
                        <span className="flex-1 text-xs font-bold text-slate-300 uppercase">{macro}</span>
                        <button onClick={() => handleDeleteMacro(index)} className="p-2 text-slate-500 hover:text-red-500 hover:bg-white/5 rounded-full transition opacity-0 group-hover:opacity-100">
                           <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-4 border-t border-white/10 flex gap-2 bg-slate-900/30">
                  <input
                    type="text"
                    value={newMacroName}
                    onChange={e => setNewMacroName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAddMacro()}
                    placeholder="Nome da nova macroatividade..."
                    className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button onClick={handleAddMacro} className="px-5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2 hover:bg-indigo-700 transition"><Plus size={16} />Adicionar</button>
                </div>
                </>
             ) : (
                <div className="flex-1 flex items-center justify-center text-center">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Selecione ou crie um plano.</p>
                </div>
             )}
          </div>
        </div>

        <footer className="p-6 bg-slate-900/50 border-t border-white/10 flex justify-end">
          <button onClick={handleSaveAndClose} className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition flex items-center gap-2">
            <Save size={16} /> Salvar e Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default PlanManagerModal;
