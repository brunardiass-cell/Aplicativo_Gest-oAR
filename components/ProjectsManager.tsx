
import React, { useState } from 'react';
import { ProjectData, MacroTask, MicroTask, Task, ProjectStatus, ItemStatus, Person, RegulatoryNorm } from '../types';
import DeletionModal from './DeletionModal';
import { 
  Plus, Trash2, FolderKanban, ChevronRight, Edit3, Check, 
  ExternalLink, FileText, X, Calendar, User, LayoutList, 
  Settings2, ArrowLeft, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';

interface ProjectsManagerProps {
  projects: ProjectData[];
  tasks: Task[];
  people: Person[];
  canEdit: boolean;
  onUpdate: (projects: ProjectData[]) => void;
  onAddLog: (id: string, title: string, reason: string) => void;
}

const PROJECT_STATUSES: ProjectStatus[] = ['Em Planejamento', 'Ativo', 'Suspenso', 'Concluído', 'Atrasado'];
const ITEM_STATUSES: ItemStatus[] = ['Pendente', 'Em Andamento', 'Validado', 'Concluído'];

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ projects, tasks, people, canEdit, onUpdate, onAddLog }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [activeMacroId, setActiveMacroId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'tracking' | 'regulatory' | 'norms'>('tracking');
  const [detailTab, setDetailTab] = useState<'items' | 'config'>('items');

  // Estado para edição de nome de projeto
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [tempProjectName, setTempProjectName] = useState('');

  // Estado para controle de exclusão com Auditoria
  const [pendingDeletion, setPendingDeletion] = useState<{
    id: string;
    name: string;
    type: 'macro' | 'micro' | 'project';
  } | null>(null);

  const [newProjectName, setNewProjectName] = useState('');
  const [newMacroTitle, setNewMacroTitle] = useState('');
  const [newMicroText, setNewMicroText] = useState('');
  const [newNorm, setNewNorm] = useState({ title: '', link: '' });

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const activeMacro = (activeTab === 'tracking' ? activeProject?.trackingMacroTasks : activeProject?.regulatoryMacroTasks)
    ?.find(m => m.id === activeMacroId);

  // --- Handlers de Projeto ---
  const addProject = () => {
    if (!newProjectName.trim() || !canEdit) return;
    const newProj: ProjectData = {
      id: Math.random().toString(36).substring(2, 9),
      name: newProjectName.trim(),
      status: 'Em Planejamento',
      trackingMacroTasks: [],
      regulatoryMacroTasks: [],
      norms: []
    };
    onUpdate([...projects, newProj]);
    setNewProjectName('');
    setSelectedProjectId(newProj.id);
  };

  const handleRenameProject = (projectId: string) => {
    if (!tempProjectName.trim()) return;
    onUpdate(projects.map(p => p.id === projectId ? { ...p, name: tempProjectName.trim() } : p));
    setEditingProjectId(null);
  };

  const handleConfirmDeletion = (reason: string) => {
    if (!pendingDeletion || !canEdit) return;
    
    // Log da auditoria
    onAddLog(pendingDeletion.id, `${pendingDeletion.type.toUpperCase()}: ${pendingDeletion.name}`, reason);

    if (pendingDeletion.type === 'project') {
      const updatedProjects = projects.filter(p => p.id !== pendingDeletion.id);
      onUpdate(updatedProjects);
      if (selectedProjectId === pendingDeletion.id) {
        setSelectedProjectId(updatedProjects[0]?.id || null);
      }
    } else if (pendingDeletion.type === 'macro') {
      onUpdate(projects.map(p => {
        if (p.id === selectedProjectId) {
          const key = activeTab === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
          return { ...p, [key]: (p[key] || []).filter(m => m.id !== pendingDeletion.id) };
        }
        return p;
      }));
      setActiveMacroId(null);
    } else if (pendingDeletion.type === 'micro') {
      onUpdate(projects.map(p => {
        if (p.id === selectedProjectId) {
          const key = activeTab === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
          return {
            ...p,
            [key]: (p[key] || []).map(m => m.id === activeMacroId ? {
              ...m,
              microTasks: (m.microTasks || []).filter(mt => mt.id !== pendingDeletion.id)
            } : m)
          };
        }
        return p;
      }));
    }
    
    setPendingDeletion(null);
  };

  // Fix: Added missing addMacroTask function to handle the creation of macro tasks within projects
  const addMacroTask = () => {
    if (!newMacroTitle.trim() || !selectedProjectId || !canEdit) return;
    const newMacro: MacroTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newMacroTitle.trim(),
      microTasks: []
    };

    onUpdate(projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = activeTab === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: [...(p[key] || []), newMacro]
        };
      }
      return p;
    }));
    setNewMacroTitle('');
  };

  const updateMacroTitle = (macroId: string, newTitle: string) => {
    if (!canEdit || !newTitle.trim()) return;
    onUpdate(projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = activeTab === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === macroId ? { ...m, title: newTitle } : m)
        };
      }
      return p;
    }));
  };

  // --- Handlers de Microtarefa ---
  const addMicroTask = () => {
    if (!newMicroText.trim() || !activeMacroId || !canEdit) return;
    const newMicro: MicroTask = {
      id: Math.random().toString(36).substring(2, 9),
      text: newMicroText.trim(),
      status: 'Pendente',
      owner: people[0]?.name || '',
      deadline: new Date().toISOString().split('T')[0]
    };

    onUpdate(projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = activeTab === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === activeMacroId ? { ...m, microTasks: [...(m.microTasks || []), newMicro] } : m)
        };
      }
      return p;
    }));
    setNewMicroText('');
  };

  const updateMicroTask = (microId: string, updates: Partial<MicroTask>) => {
    if (!canEdit) return;
    onUpdate(projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = activeTab === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === activeMacroId ? {
            ...m,
            microTasks: (m.microTasks || []).map(mt => mt.id === microId ? { ...mt, ...updates } : mt)
          } : m)
        };
      }
      return p;
    }));
  };

  // --- Handlers de Normas ---
  const addNorm = () => {
    if (!newNorm.title.trim() || !selectedProjectId || !canEdit) return;
    const norm: RegulatoryNorm = {
      id: Math.random().toString(36).substring(2, 9),
      title: newNorm.title.trim(),
      link: newNorm.link.trim(),
      lastVerifiedDate: new Date().toISOString().split('T')[0]
    };
    onUpdate(projects.map(p => p.id === selectedProjectId ? { ...p, norms: [...(p.norms || []), norm] } : p));
    setNewNorm({ title: '', link: '' });
  };

  const removeNorm = (normId: string) => {
    if (!canEdit || !confirm("Remover norma do projeto?")) return;
    onUpdate(projects.map(p => p.id === selectedProjectId ? { ...p, norms: (p.norms || []).filter(n => n.id !== normId) } : p));
  };

  // --- Helpers Visuais ---
  const calculateMacroProgress = (macro: MacroTask) => {
    if (!macro.microTasks || macro.microTasks.length === 0) return 0;
    const completed = macro.microTasks.filter(m => m.status === 'Concluído').length;
    const validated = macro.microTasks.filter(m => m.status === 'Validado').length;
    return Math.round(((completed + validated * 0.8) / macro.microTasks.length) * 100);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'Ativo': case 'Concluído': case 'Validado': return 'text-emerald-500 bg-emerald-50 border-emerald-100';
      case 'Em Planejamento': case 'Em Andamento': return 'text-indigo-500 bg-indigo-50 border-indigo-100';
      case 'Suspenso': case 'Pendente': return 'text-amber-500 bg-amber-50 border-amber-100';
      case 'Atrasado': return 'text-red-500 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50 border-slate-100';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px] animate-in fade-in duration-500 relative">
      
      {/* 1. Sidebar de Projetos (Portfólio) */}
      <div className="lg:col-span-3 space-y-4">
        {canEdit && (
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Novo Projeto Estratégico</h3>
            <div className="flex gap-2">
              <input 
                type="text" placeholder="Nome do projeto..." value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProject()}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
              <button onClick={addProject} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition active:scale-95">
                <Plus size={18}/>
              </button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900 text-white">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Lista de Projetos</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            {projects.map(p => (
              <div 
                key={p.id}
                className={`group relative transition-all ${selectedProjectId === p.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
              >
                <div className="flex items-center justify-between p-4 pr-2">
                  <div className="flex-1 mr-2 overflow-hidden" onClick={() => { setSelectedProjectId(p.id); setActiveMacroId(null); }}>
                    {editingProjectId === p.id ? (
                      <input 
                        autoFocus
                        value={tempProjectName}
                        onChange={e => setTempProjectName(e.target.value)}
                        onBlur={() => handleRenameProject(p.id)}
                        onKeyDown={e => e.key === 'Enter' && handleRenameProject(p.id)}
                        className="w-full bg-white border border-indigo-300 rounded px-2 py-1 text-xs font-bold uppercase outline-none"
                      />
                    ) : (
                      <>
                        <span className={`text-xs font-black uppercase tracking-tight block truncate ${selectedProjectId === p.id ? 'text-indigo-900' : 'text-slate-600'}`}>
                          {p.name}
                        </span>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${getStatusColor(p.status)}`}>
                          {p.status}
                        </span>
                      </>
                    )}
                  </div>

                  {canEdit && !editingProjectId && (
                    <div className={`flex gap-1 transition-opacity ${selectedProjectId === p.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingProjectId(p.id); setTempProjectName(p.name); }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-100/50 rounded-lg transition"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setPendingDeletion({ id: p.id, name: p.name, type: 'project' }); }}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-100/50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Área Central: Dashboard de Macrotarefas */}
      <div className="lg:col-span-9 space-y-6">
        {activeProject ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 min-h-[600px]">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                  <FolderKanban className="text-indigo-600" size={32} /> 
                  {activeProject.name}
                </h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Acompanhamento de Macrotarefas e Fluxos</p>
              </div>
              <div className="flex items-center gap-3">
                <select 
                  value={activeProject.status} 
                  onChange={e => onUpdate(projects.map(p => p.id === activeProject.id ? { ...p, status: e.target.value as ProjectStatus } : p))} 
                  disabled={!canEdit} 
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase border outline-none focus:ring-2 focus:ring-indigo-500 transition-all ${getStatusColor(activeProject.status)}`}
                >
                  {PROJECT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </header>

            <nav className="flex gap-4 mb-8 border-b border-slate-100">
              <button onClick={() => { setActiveTab('tracking'); setActiveMacroId(null); }} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === 'tracking' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Acompanhamento</button>
              <button onClick={() => { setActiveTab('regulatory'); setActiveMacroId(null); }} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === 'regulatory' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Fluxo Regulatório</button>
              <button onClick={() => { setActiveTab('norms'); setActiveMacroId(null); }} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === 'norms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Normas Aplicáveis</button>
            </nav>

            {activeTab !== 'norms' ? (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Macrotarefas Ativas</h3>
                  {canEdit && (
                    <div className="flex w-full md:w-auto gap-2">
                      <input 
                        type="text" placeholder="Nome da Macrotarefa..." value={newMacroTitle} 
                        onChange={e => setNewMacroTitle(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && addMacroTask()} 
                        className="flex-1 md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                      <button onClick={addMacroTask} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition shadow-lg shadow-slate-200">Criar Macro</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(activeTab === 'tracking' ? activeProject.trackingMacroTasks : activeProject.regulatoryMacroTasks).map(macro => (
                    <button 
                      key={macro.id} 
                      onClick={() => { setActiveMacroId(macro.id); setDetailTab('items'); }}
                      className={`group text-left p-6 border rounded-[2rem] transition-all relative overflow-hidden bg-white ${activeMacroId === macro.id ? 'border-indigo-600 ring-4 ring-indigo-500/10' : 'border-slate-200 hover:border-indigo-300 hover:shadow-xl'}`}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className={`p-3 rounded-2xl transition ${activeMacroId === macro.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600'}`}>
                          <LayoutList size={24} />
                        </div>
                        <ChevronRight size={20} className={`text-slate-300 transition-transform ${activeMacroId === macro.id ? 'translate-x-1 text-indigo-600' : 'group-hover:translate-x-1'}`} />
                      </div>
                      
                      <h4 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2 leading-tight">{macro.title}</h4>
                      
                      <div className="flex items-center gap-3 mt-4">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-600 transition-all duration-700" style={{ width: `${calculateMacroProgress(macro)}%` }}></div>
                        </div>
                        <span className="text-[10px] font-black text-indigo-600">{calculateMacroProgress(macro)}%</span>
                      </div>
                      
                      <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-50">
                        <span className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          <CheckCircle2 size={12} className="text-emerald-500" /> {macro.microTasks?.length || 0} Microtarefas
                        </span>
                      </div>
                    </button>
                  ))}
                  {(activeTab === 'tracking' ? activeProject.trackingMacroTasks : activeProject.regulatoryMacroTasks).length === 0 && (
                    <div className="col-span-full py-24 text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem]">
                       <LayoutList size={40} className="mx-auto text-slate-200 mb-4" />
                       <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest italic">Nenhuma macrotarefa cadastrada para este fluxo.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {canEdit && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Norma</label>
                      <input 
                        type="text" placeholder="Ex: RDC 44/2009" value={newNorm.title} 
                        onChange={e => setNewNorm({ ...newNorm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Acesso</label>
                      <input 
                        type="text" placeholder="https://..." value={newNorm.link} 
                        onChange={e => setNewNorm({ ...newNorm, link: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <button onClick={addNorm} className="px-6 py-2 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition shadow-lg h-[38px]">Vincular Norma</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(activeProject.norms || []).map(norm => (
                    <div key={norm.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-200 transition group relative">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FileText size={20}/></div>
                          <div>
                            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{norm.title}</h4>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 flex items-center gap-1">
                              <Clock size={10} /> Verificado em: {new Date(norm.lastVerifiedDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        {canEdit && (
                          <button onClick={() => removeNorm(norm.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                            <Trash2 size={16}/>
                          </button>
                        )}
                      </div>
                      {norm.link && (
                        <a 
                          href={norm.link} target="_blank" rel="noopener noreferrer" 
                          className="mt-4 w-full py-2 bg-slate-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 transition border border-slate-100 font-bold"
                        >
                          <ExternalLink size={12}/> Abrir Normativa
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-[3rem] border border-slate-200 border-dashed p-32 text-center shadow-inner">
            <FolderKanban size={64} className="mx-auto text-slate-100 mb-8" />
            <p className="text-slate-400 font-black uppercase text-sm tracking-[0.3em] italic">Selecione um projeto para detalhar os fluxos.</p>
          </div>
        )}
      </div>

      {/* 3. Painel de Detalhes (Slide-over) */}
      {activeMacro && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          {/* Overlay com Blur */}
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setActiveMacroId(null)}></div>
          
          {/* Painel Lateral */}
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl relative animate-in slide-in-from-right duration-500 flex flex-col border-l border-slate-100">
            
            <header className="px-10 py-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-5">
                <button onClick={() => setActiveMacroId(null)} className="p-3 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-slate-900 transition border border-slate-100"><ArrowLeft size={24} /></button>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none">{activeMacro.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest px-2 py-0.5 bg-indigo-50 rounded">{calculateMacroProgress(activeMacro)}% CONCLUÍDO</span>
                  </div>
                </div>
              </div>
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm">
                <button 
                  onClick={() => setDetailTab('items')} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${detailTab === 'items' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <LayoutList size={16} /> Microtarefas
                </button>
                <button 
                  onClick={() => setDetailTab('config')} 
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition ${detailTab === 'config' ? 'bg-slate-900 text-white shadow-lg shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
                >
                  <Settings2 size={16} /> Detalhes Macro
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar space-y-10">
              {detailTab === 'items' ? (
                <div className="space-y-10">
                  {/* Gestão de Microtarefas com Adição Rápida */}
                  {canEdit && (
                    <section className="space-y-4">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Novo Item de Verificação</h4>
                      <div className="flex gap-2 p-3 bg-slate-50 border border-slate-100 rounded-[1.5rem] shadow-sm">
                        <input 
                          type="text" placeholder="Descreva a atividade..." value={newMicroText} 
                          onChange={e => setNewMicroText(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && addMicroTask()}
                          className="flex-1 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-tight outline-none focus:ring-2 focus:ring-indigo-500" 
                        />
                        <button onClick={addMicroTask} className="px-5 bg-indigo-600 text-white rounded-2xl shadow-lg hover:bg-indigo-500 transition active:scale-95">
                          <Plus size={24}/>
                        </button>
                      </div>
                    </section>
                  )}

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex justify-between">
                      Checklist do Fluxo <span>{activeMacro.microTasks?.length || 0} Itens</span>
                    </h4>
                    
                    <div className="space-y-3">
                      {activeMacro.microTasks?.map(micro => (
                        <div key={micro.id} className="p-5 border border-slate-100 rounded-3xl bg-white hover:border-indigo-100 transition-all shadow-sm hover:shadow-md">
                          <div className="flex flex-col gap-4">
                            {/* Linha Superior: Texto e Botão Excluir (Padronizado Fig 1) */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3 flex-1">
                                <input 
                                  type="text" value={micro.text} 
                                  onChange={e => updateMicroTask(micro.id, { text: e.target.value })}
                                  disabled={!canEdit}
                                  className={`flex-1 bg-transparent border-none outline-none text-xs font-black uppercase tracking-tight focus:ring-0 ${micro.status === 'Concluído' ? 'text-slate-400 line-through' : 'text-slate-800'}`}
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <select 
                                  value={micro.status} 
                                  onChange={e => updateMicroTask(micro.id, { status: e.target.value as ItemStatus })}
                                  disabled={!canEdit}
                                  className={`text-[10px] font-black uppercase border rounded-xl px-3 py-1 outline-none transition-all shadow-sm ${getStatusColor(micro.status)}`}
                                >
                                  {ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {canEdit && (
                                  <button 
                                    onClick={() => setPendingDeletion({ id: micro.id, name: micro.text, type: 'micro' })}
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Excluir"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Linha Inferior: Responsável e Prazo */}
                            <div className="flex items-center gap-6 px-1 border-t border-slate-50 pt-4 mt-1">
                              <div className="flex items-center gap-2 group/owner">
                                <User size={14} className="text-slate-300 group-hover/owner:text-indigo-400 transition" />
                                <select 
                                  value={micro.owner} 
                                  onChange={e => updateMicroTask(micro.id, { owner: e.target.value })}
                                  disabled={!canEdit}
                                  className="bg-transparent border-none text-[10px] font-black text-slate-500 uppercase p-0 focus:ring-0 cursor-pointer hover:text-indigo-600 transition"
                                >
                                  {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                              </div>

                              <div className="flex items-center gap-2 group/date">
                                <Calendar size={14} className="text-slate-300 group-hover/date:text-amber-400 transition" />
                                <input 
                                  type="date" value={micro.deadline} 
                                  onChange={e => updateMicroTask(micro.id, { deadline: e.target.value })}
                                  disabled={!canEdit}
                                  className="bg-transparent border-none text-[10px] font-black text-slate-500 p-0 focus:ring-0 cursor-pointer hover:text-amber-600 transition"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {(!activeMacro.microTasks || activeMacro.microTasks.length === 0) && (
                        <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[2rem]">
                          <LayoutList size={48} className="mx-auto text-slate-100 mb-4" />
                          <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] italic">Aguardando definição de itens.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <section className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                      <Edit3 size={14} className="text-indigo-500" /> Renomear Macrotarefa
                    </h4>
                    <input 
                      type="text" value={activeMacro.title} 
                      onChange={e => updateMacroTitle(activeMacro.id, e.target.value)}
                      disabled={!canEdit}
                      className="w-full px-8 py-6 bg-slate-50 border border-slate-200 rounded-[2rem] text-base font-black uppercase tracking-tight outline-none focus:ring-4 focus:ring-indigo-500/10 shadow-inner"
                    />
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-4">O novo nome será atualizado em tempo real no dashboard.</p>
                  </section>

                  <section className="space-y-4 pt-12 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                      <AlertTriangle size={14} /> Zona Crítica de Exclusão
                    </h4>
                    <div className="p-8 bg-red-50 border border-red-100 rounded-[2rem] shadow-sm">
                      <p className="text-sm text-red-900 font-bold mb-6 leading-relaxed">
                        Ao excluir esta Macrotarefa, todo o progresso do fluxo e os {activeMacro.microTasks?.length || 0} itens de verificação associados serão removidos permanentemente.
                      </p>
                      <button 
                        onClick={() => setPendingDeletion({ id: activeMacro.id, name: activeMacro.title, type: 'macro' })}
                        disabled={!canEdit}
                        className="w-full py-5 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-700 transition shadow-xl shadow-red-200 active:scale-[0.98] flex items-center justify-center gap-3"
                      >
                        <Trash2 size={18} /> Excluir Macrotarefa Permanentemente
                      </button>
                    </div>
                  </section>
                </div>
              )}
            </div>

            <footer className="px-10 py-8 border-t border-slate-50 flex justify-center bg-white">
              <button 
                onClick={() => setActiveMacroId(null)}
                className="px-20 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-widest hover:bg-black transition active:scale-95 shadow-2xl"
              >
                Salvar e Fechar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* Modal de Exclusão com Auditoria (Igual ao Dashboard) */}
      {pendingDeletion && (
        <DeletionModal 
          taskName={pendingDeletion.name} 
          onClose={() => setPendingDeletion(null)} 
          onConfirm={handleConfirmDeletion} 
        />
      )}
    </div>
  );
};

export default ProjectsManager;
