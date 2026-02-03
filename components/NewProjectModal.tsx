
import React, { useState } from 'react';
import { Project, ActivityPlanTemplate, MacroActivity } from '../types';
import { X, FolderPlus } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ActivityPlanTemplate[];
  onAddProject: (project: Project) => void;
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, plans, onAddProject }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!projectName.trim() || !selectedPlanId) {
      setError('Nome do projeto e plano são obrigatórios.');
      return;
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) {
      setError('Plano de atividades inválido.');
      return;
    }

    const newProject: Project = {
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      name: projectName.trim(),
      status: 'Em Planejamento',
      templateId: selectedPlanId,
      macroActivities: selectedPlan.macroActivities.map((macroName): MacroActivity => ({
        id: 'macro_' + Math.random().toString(36).substr(2, 9),
        name: macroName,
        status: 'Planejada',
        microActivities: [],
      }))
    };

    onAddProject(newProject);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-[#1e293b] rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-white/10 text-white">
        <header className="p-8 bg-blue-950/20 border-b border-blue-500/10 flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-500/20">
            <FolderPlus size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Criar Novo Projeto</h2>
            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Defina o escopo inicial</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 text-slate-400 hover:bg-white/10 rounded-full transition"><X size={20} /></button>
        </header>
        
        <div className="p-8 space-y-6">
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Projeto</label>
            <input 
              type="text" 
              value={projectName}
              onChange={e => { setProjectName(e.target.value); setError(''); }}
              placeholder="Ex: Vacina COVID-19 (Submissão ANVISA)"
              className="mt-1 w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plano de Atividades Base</label>
            <select 
              value={selectedPlanId}
              onChange={e => { setSelectedPlanId(e.target.value); setError(''); }}
              className="mt-1 w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm font-bold text-white outline-none appearance-none focus:ring-2 focus:ring-blue-500"
            >
              {plans.map(plan => (
                <option key={plan.id} value={plan.id} className="bg-slate-800">{plan.name}</option>
              ))}
            </select>
          </div>
          {error && <p className="text-xs text-red-500 font-bold uppercase text-center">{error}</p>}
        </div>

        <footer className="p-6 bg-slate-900/50 border-t border-white/10 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 rounded-2xl transition">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition">Criar Projeto</button>
        </footer>
      </div>
    </div>
  );
};

export default NewProjectModal;