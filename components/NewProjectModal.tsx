
import React, { useState, useEffect } from 'react';
import { Project, ActivityPlanTemplate, MacroActivity, TeamMember, PlanDecisionItem, RegulatoryRecordItem } from '../types';
import { X, FolderPlus, Plus, Layers, FlaskConical, ShieldCheck, Dna, Sparkles, Syringe, Atom, Microscope } from 'lucide-react';
import { STANDARD_REGULATORY_GROUPS } from '../constants';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: ActivityPlanTemplate[];
  onAddProject: (project: Project) => void;
  teamMembers: TeamMember[];
  currentUser?: TeamMember | null;
  isLeader?: boolean;
}

const AVAILABLE_PROJECT_ICONS = [
  { key: 'FlaskConical', label: 'Frasco', icon: FlaskConical },
  { key: 'ShieldCheck', label: 'Imunidade', icon: ShieldCheck },
  { key: 'Dna', label: 'DNA/RNA', icon: Dna },
  { key: 'Sparkles', label: 'Inovação', icon: Sparkles },
  { key: 'Syringe', label: 'Vacina', icon: Syringe },
  { key: 'Atom', label: 'Molecular', icon: Atom },
  { key: 'Microscope', label: 'Pesquisa', icon: Microscope },
];

const NewProjectModal: React.FC<NewProjectModalProps> = ({ 
  isOpen, 
  onClose, 
  plans, 
  onAddProject, 
  teamMembers,
  currentUser,
  isLeader = false
}) => {
  const [projectName, setProjectName] = useState('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>(() => plans[0]?.id || '');
  const [projectIcon, setProjectIcon] = useState<string>('FlaskConical');
  const [responsibleMember, setResponsibleMember] = useState<string>(() => {
    return currentUser?.name || teamMembers[0]?.name || '';
  });

  useEffect(() => {
    if (currentUser?.name) {
      setResponsibleMember(currentUser.name);
    }
  }, [currentUser]);

  const [customTeam, setCustomTeam] = useState<string[]>([]);
  const [newMemberName, setNewMemberName] = useState('');
  const [projectPhases, setProjectPhases] = useState<string[]>([]);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [error, setError] = useState('');

  // Sincroniza as fases completas ao abrir ou alterar plano selecionado
  useEffect(() => {
    if (isOpen && plans.length > 0) {
      const currentPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
      if (currentPlan) {
        if (!selectedPlanId) setSelectedPlanId(currentPlan.id);
        setProjectPhases([...(currentPlan.phases || [])]);
      }
    }
  }, [isOpen, selectedPlanId, plans]);

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

    const projectId = 'proj_' + Math.random().toString(36).substr(2, 9);
    const nowIso = new Date().toISOString();

    // Cria as macroatividades com base na estrutura integral do plano selecionado
    const createdMacros: MacroActivity[] = selectedPlan.macroActivities.map((macroTemplate, mIdx): MacroActivity => {
      const initialDecisions: PlanDecisionItem[] = (
        macroTemplate.decisionsList && macroTemplate.decisionsList.length > 0
          ? macroTemplate.decisionsList
          : (macroTemplate.keyDecisions || []).map((q, qIdx) => ({
              id: `dec_${Math.random().toString(36).substr(2, 9)}_${qIdx}`,
              question: q,
              status: 'Pendente' as const,
              hasRegulatoryImpact: true,
              isMandatory: true,
              responseType: 'ambos' as const
            }))
      ).map((d: PlanDecisionItem) => ({
        id: d.id || `dec_${Math.random().toString(36).substr(2, 9)}`,
        question: d.question,
        status: d.status || 'Pendente',
        decision: d.decision || '',
        justification: d.justification || '',
        date: d.date || '',
        responsible: d.responsible || '',
        evidenceLink: d.evidenceLink || '',
        sharepointDocUrl: d.sharepointDocUrl || '',
        hasRegulatoryImpact: d.hasRegulatoryImpact !== undefined ? d.hasRegulatoryImpact : true,
        isMandatory: d.isMandatory !== undefined ? d.isMandatory : true,
        targetFieldKey: d.targetFieldKey || '',
        targetFieldLabel: d.targetFieldLabel || '',
        responseType: d.responseType || 'ambos',
        linkedStandardIds: d.linkedStandardIds || []
      }));

      return {
        id: 'macro_' + Math.random().toString(36).substr(2, 9) + '_' + mIdx,
        name: macroTemplate.name,
        phase: projectPhases.includes(macroTemplate.phase) ? macroTemplate.phase : projectPhases[0],
        icon: macroTemplate.icon,
        expectedResults: macroTemplate.expectedResults,
        resultLinks: macroTemplate.resultLinks ? [...macroTemplate.resultLinks] : [],
        keyDecisions: macroTemplate.keyDecisions ? [...macroTemplate.keyDecisions] : [],
        decisionsList: initialDecisions,
        regulatoryPoints: macroTemplate.regulatoryPoints ? [...macroTemplate.regulatoryPoints] : [],
        technicalJustifications: macroTemplate.technicalJustifications ? [...macroTemplate.technicalJustifications] : [],
        referenceGuides: macroTemplate.referenceGuides ? JSON.parse(JSON.stringify(macroTemplate.referenceGuides)) : [],
        microActivities: (macroTemplate.microActivities || []).map((microName, micIdx) => ({
          id: 'micro_' + Math.random().toString(36).substr(2, 9) + '_' + micIdx,
          name: microName,
          assignee: '',
          startDate: '',
          dueDate: '',
          status: 'Planejado',
          observations: '',
          progress: 0,
          generatesRegulatoryContent: true
        })),
      };
    });

    // Inicializa a Base de Informações Regulatórias do Projeto a partir dos grupos padrão
    const initialRegulatoryDatabase: RegulatoryRecordItem[] = [];
    STANDARD_REGULATORY_GROUPS.forEach(grp => {
      grp.fields.forEach(f => {
        // Busca se existe decisão vinculada a esta chave no plano
        let linkedDec: PlanDecisionItem | undefined;
        let originMacroName = f.defaultOriginMacro;

        for (const m of createdMacros) {
          const found = (m.decisionsList || []).find(d => d.targetFieldKey === f.key);
          if (found) {
            linkedDec = found;
            originMacroName = m.name;
            break;
          }
        }

        initialRegulatoryDatabase.push({
          id: 'reg_rec_' + Math.random().toString(36).substr(2, 9),
          group: grp.groupName,
          key: f.key,
          label: f.label,
          phase: f.phase,
          macroActivityName: originMacroName,
          decisionQuestion: linkedDec?.question,
          decisionId: linkedDec?.id,
          value: f.defaultValue || '',
          references: [],
          status: 'Não iniciado',
          isMandatory: f.isMandatory,
          version: 1,
          lastUpdated: nowIso,
          updatedBy: responsibleMember,
          history: []
        });
      });
    });

    const newProject: Project = {
      id: projectId,
      name: projectName.trim(),
      icon: projectIcon,
      status: 'Em Planejamento',
      responsible: responsibleMember,
      templateId: selectedPlanId,
      team: customTeam,
      phases: [...projectPhases],
      macroActivities: createdMacros,
      regulatoryChecklist: selectedPlan.regulatoryChecklist ? JSON.parse(JSON.stringify(selectedPlan.regulatoryChecklist)) : [],
      regulatoryDatabase: initialRegulatoryDatabase,
      contributions: [],
      historyTimeline: [
        {
          id: 'hist_' + Math.random().toString(36).substr(2, 9),
          type: 'regulatory_field',
          title: 'Projeto Criado a partir do Plano-Base',
          description: `Projeto "${projectName.trim()}" iniciado com o modelo "${selectedPlan.name}" contendo ${projectPhases.length} fases e ${createdMacros.length} macroatividades.`,
          date: nowIso,
          author: responsibleMember
        }
      ]
    };

    onAddProject(newProject);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <header className="p-6 sm:p-8 bg-teal-50 border-b border-teal-100 flex items-center gap-4">
          <div className="p-2 sm:p-3 bg-brand-primary rounded-2xl text-white shadow-lg shadow-teal-200"><FolderPlus size={24} /></div>
          <div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 uppercase tracking-tighter">Criar Novo Projeto</h2>
            <p className="text-[8px] sm:text-[10px] font-bold text-teal-600 uppercase tracking-widest">Defina o escopo inicial</p>
          </div>
          <button onClick={onClose} className="ml-auto p-2 hover:bg-slate-200 rounded-full transition"><X size={20} /></button>
        </header>
        
        <div className="p-6 sm:p-8 space-y-6 flex-1 overflow-y-auto custom-scrollbar">
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Projeto</label>
            <input type="text" value={projectName} onChange={e => { setProjectName(e.target.value); setError(''); }} placeholder="Ex: Vacina COVID-19" className="mt-1 w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-brand-primary"/>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 block mb-2">Ícone do Projeto</label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_PROJECT_ICONS.map(item => {
                const IconComponent = item.icon;
                const isSelected = projectIcon === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setProjectIcon(item.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                      isSelected 
                        ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-400/20' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <IconComponent size={16} className={isSelected ? 'text-teal-600' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsável / Líder do Projeto</label>
              <select 
                value={responsibleMember} 
                onChange={e => { setResponsibleMember(e.target.value); setError(''); }} 
                className="mt-1 w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none focus:ring-2 focus:ring-brand-primary cursor-pointer"
              >
                {teamMembers.map(member => (<option key={member.id} value={member.name}>{member.name}</option>))}
              </select>
              <p className="text-[9px] font-semibold text-slate-400 mt-1 ml-1">Pré-selecionado com o seu perfil atual. Pode ser alterado livremente.</p>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Plano Base</label>
              <select value={selectedPlanId} onChange={e => { setSelectedPlanId(e.target.value); setError(''); }} className="mt-1 w-full px-4 sm:px-5 py-3 sm:py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-black outline-none">
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
