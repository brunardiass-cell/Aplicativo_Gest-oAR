
import React, { useState, useEffect } from 'react';
import { Project, ActivityPlanTemplate, MacroActivity, TeamMember } from '../types';
import { X, FolderPlus, Plus, Trash2, Layers } from 'lucide-react';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ActivityPlanTemplate[];
  onAddProject: (project: Project) => void;
  teamMembers: TeamMember[];
}

const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, plans, onAddProject, teamMembers }) => {
  const [projectName, setProjectName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');
  const [responsibleMember, setResponsibleMember] = useState<string>(teamMembers[0]?.name || '');
  const [customTeam, setCustomTeam] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [projectPhases, setProjectPhases] = useState<string[]>([]);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedPlanId) {
      const selectedPlan = plans.find(p => p.id === selectedPlanId);
      setProjectPhases(selectedPlan?.phases || []);
    }
  }, [selectedPlanId, plans]);

  const handleAddMember = () => {
    if (newMemberName.trim() && !customTeam.includes(newMemberName.trim())) {
      setCustomTeam([...customTeam, newMemberName.trim()]);
      setNewMemberName('');
    }
  };

  const handleRemoveMember = (nameToRemove: string) => {
    setCustomTeam(customTeam.filter(name => name !== nameToRemove));
  };
  
  const handleAddPhase = () => {
    if (newPhaseName.trim() && !projectPhases.includes(newPhaseName.trim())) {
      setProjectPhases([...projectPhases, newPhaseName.trim()]);
      setNewPhaseName('');
    }
  };

  const handleRemovePhase = (phaseToRemove: string) => {
    setProjectPhases(projectPhases.filter(phase => phase !== phaseToRemove));
  };

  const handleSubmit = () => {
    if (!projectName.trim() || !selectedPlanId || !responsibleMember || projectPhases.length === 0) {
      setError('Nome, responsável, plano e ao menos uma fase são obrigatórios.');
      return;
    }

    const selectedPlan = plans.find(p => p.id === selectedPlanId);
    if (!selectedPlan) {
      setError('Plano de atividades inválido.');
      return;
    }

    const defaultPhase = projectPhases[0];

    const newProject: Project = {
      id: 'proj_' + Math.random().toString(36).substr(2, 9),
      name: projectName.trim(),
      status: 'Em Planejamento',
      responsible: responsibleMember,
      templateId: selectedPlanId,
      team: customTeam,
      phases: projectPhases,
      macroActivities: selectedPlan.macroActivities.map((macroName): MacroActivity => ({
        id: 'macro_' + Math.random().toString(36).substr(2, 9),
        name: macroName,
        phase: defaultPhase,
        microActivities: [],
      }))
    };

    onAddProject(newProject);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-8 bg-teal-50 border-b border-teal-100 flex items-center gap-4">
          <div className="p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-teal-200"><FolderPlus size={24} /></div>
          <div>
            <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Criar Novo Projeto</h2>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest">Defina o escopo inicial</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
        </header>
        
        <div className="p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Projeto</label>
            <input type="text" value={projectName} onChange={e => { setProjectName(e.target.value); setError(''); }} placeholder="Ex: Vacina COVID-19 (Submissão ANVISA)" className="mt-1 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-brand-primary"/>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsável</label>
              <select value={responsibleMember} onChange={e => { setResponsibleMember(e.target.value); setError(''); }} className="mt-1 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none">
                {teamMembers.map(member => (<option key={member.id} value={member.name}>{member.name}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Plano Base</label>
              <select value={selectedPlanId} onChange={e => { setSelectedPlanId(e.target.value); setError(''); }} className="mt-1 w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none">
                {plans.map(plan => (<option key={plan.id} value={plan.id}>{plan.name}</option>))}
              </select>
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers size={12}/> Fases do Kanban</label>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-2 min-h-[40px]">
                {projectPhases.map(name => (
                    <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        <span>{name}</span>
                        <button type="button" onClick={() => handleRemovePhase(name)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                    </div>
                ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newPhaseName} onChange={e => setNewPhaseName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPhase())} placeholder="Adicionar fase customizada" className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"/>
              <button type="button" onClick={handleAddPhase} className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"><Plus size={16}/>Add</button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Equipe do Projeto</label>
            <div className="flex gap-2">
              <input type="text" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMember())} placeholder="Digite o nome do integrante" className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold"/>
              <button type="button" onClick={handleAddMember} className="px-4 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase flex items-center justify-center gap-2"><Plus size={16}/>Add</button>
            </div>
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap gap-2 min-h-[40px]">
                {customTeam.map(name => (
                    <div key={name} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest">
                        <span>{name}</span>
                        <button type="button" onClick={() => handleRemoveMember(name)} className="text-slate-400 hover:text-red-500"><X size={12}/></button>
                    </div>
                ))}
            </div>
          </div>
          {error && <p className="text-xs text-red-500 font-bold uppercase text-center">{error}</p>}
        </div>

        <footer className="p-6 bg-slate-50 border-t border-slate-100 flex gap-3">
          <button onClick={onClose} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 rounded-2xl transition">Cancelar</button>
          <button onClick={handleSubmit} className="flex-1 py-4 bg-brand-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl hover:bg-brand-accent transition">Criar Projeto</button>
        </footer>
      </div>
    </div>
  );
};

export default NewProjectModal;
