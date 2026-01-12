
import React, { useState, useEffect } from 'react';
import { ProjectData, MacroTask, MicroTask, Task, ProjectStatus, ItemStatus, Person, RegulatoryNorm } from '../types';
import { Plus, Trash2, FolderKanban, ChevronDown, ChevronUp, Edit3, Check, ExternalLink, FileText, X, MoreVertical } from 'lucide-react';

interface ProjectsManagerProps {
  projects: ProjectData[];
  tasks: Task[];
  people: Person[];
  canEdit: boolean;
  onUpdate: (projects: ProjectData[]) => void;
}

const PROJECT_STATUSES: ProjectStatus[] = ['Em Planejamento', 'Ativo', 'Suspenso', 'Concluído', 'Atrasado'];
const ITEM_STATUSES: ItemStatus[] = ['Pendente', 'Em Andamento', 'Validado', 'Concluído'];

const ProjectsManager: React.FC<ProjectsManagerProps> = ({ projects, tasks, people, canEdit, onUpdate }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(projects[0]?.id || null);
  const [newProjectName, setNewProjectName] = useState('');
  const [expandedMacros, setExpandedMacros] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'tracking' | 'regulatory' | 'norms'>('tracking');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  const [newMacroTitle, setNewMacroTitle] = useState('');
  const [newMicroInputs, setNewMicroInputs] = useState<Record<string, string>>({});
  
  const [editingMacroId, setEditingMacroId] = useState<string | null>(null);
  const [tempMacroTitle, setTempMacroTitle] = useState('');

  const [editingMicroId, setEditingMicroId] = useState<string | null>(null);
  const [tempMicroText, setTempMicroText] = useState('');
  
  const [newNorm, setNewNorm] = useState({ title: '', link: '' });

  const activeProject = projects.find(p => p.id === selectedProjectId);

  // Fecha menus ao clicar fora
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const toggleMacro = (id: string) => {
    setExpandedMacros(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

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

  const addMacroTask = (type: 'tracking' | 'regulatory') => {
    if (!newMacroTitle.trim() || !selectedProjectId || !canEdit) return;
    const newMacro: MacroTask = {
      id: Math.random().toString(36).substring(2, 9),
      title: newMacroTitle.trim(),
      microTasks: []
    };
    
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = type === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return { ...p, [key]: [...(p[key] || []), newMacro] };
      }
      return p;
    });
    
    onUpdate(updatedProjects);
    setNewMacroTitle('');
    setExpandedMacros(prev => [...prev, newMacro.id]);
  };

  const startEditMacro = (macro: MacroTask) => {
    setEditingMacroId(macro.id);
    setTempMacroTitle(macro.title);
  };

  const saveEditMacro = (macroId: string, type: 'tracking' | 'regulatory') => {
    if (!tempMacroTitle.trim() || !canEdit) return;
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = type === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === macroId ? { ...m, title: tempMacroTitle.trim() } : m)
        };
      }
      return p;
    });
    onUpdate(updatedProjects);
    setEditingMacroId(null);
  };

  const removeMacroAction = (macroId: string, type: 'tracking' | 'regulatory') => {
    if (!canEdit) return;
    const label = type === 'tracking' ? 'Acompanhamento' : 'Fluxo Regulatório';
    if (!window.confirm(`Tem certeza que deseja excluir esta MACROTAREFA de ${label}? Todas as microtarefas internas serão apagadas.`)) return;

    const key = type === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          [key]: (p[key] || []).filter(m => m.id !== macroId)
        };
      }
      return p;
    });
    
    onUpdate(updatedProjects);
    setOpenMenuId(null);
  };

  const addMicroTask = (macroId: string, type: 'tracking' | 'regulatory') => {
    const text = newMicroInputs[macroId];
    if (!text?.trim() || !canEdit) return;
    const newMicro: MicroTask = {
      id: Math.random().toString(36).substring(2, 9),
      text: text.trim(),
      status: 'Pendente',
      owner: people[0]?.name || '',
      deadline: ''
    };
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = type === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === macroId ? { ...m, microTasks: [...(m.microTasks || []), newMicro] } : m)
        };
      }
      return p;
    });
    onUpdate(updatedProjects);
    setNewMicroInputs(prev => ({ ...prev, [macroId]: '' }));
  };

  const updateMicroTask = (macroId: string, microId: string, type: 'tracking' | 'regulatory', updates: Partial<MicroTask>) => {
    if (!canEdit) return;
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        const key = type === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === macroId ? {
            ...m,
            microTasks: (m.microTasks || []).map(mt => mt.id === microId ? { ...mt, ...updates } : mt)
          } : m)
        };
      }
      return p;
    });
    onUpdate(updatedProjects);
  };

  const removeMicroAction = (macroId: string, microId: string, type: 'tracking' | 'regulatory') => {
    if (!canEdit) return;
    if (!window.confirm("Deseja realmente excluir esta microtarefa?")) return;

    const key = type === 'tracking' ? 'trackingMacroTasks' : 'regulatoryMacroTasks';
    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          [key]: (p[key] || []).map(m => m.id === macroId ? {
            ...m,
            microTasks: (m.microTasks || []).filter(mt => mt.id !== microId)
          } : m)
        };
      }
      return p;
    });
    
    onUpdate(updatedProjects);
    setOpenMenuId(null);
  };

  const startEditMicro = (micro: MicroTask) => {
    setEditingMicroId(micro.id);
    setTempMicroText(micro.text);
  };

  const saveEditMicro = (macroId: string, microId: string, type: 'tracking' | 'regulatory') => {
    if (!tempMicroText.trim() || !canEdit) return;
    updateMicroTask(macroId, microId, type, { text: tempMicroText.trim() });
    setEditingMicroId(null);
  };

  const removeNorm = (normId: string) => {
    if (!canEdit || !selectedProjectId) return;
    if (!confirm("Tem certeza que deseja remover esta norma?")) return;

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          norms: (p.norms || []).filter(n => n.id !== normId)
        };
      }
      return p;
    });
    onUpdate(updatedProjects);
  };

  const addNorm = () => {
    if (!newNorm.title.trim() || !selectedProjectId || !canEdit) return;
    const norm: RegulatoryNorm = {
      id: Math.random().toString(36).substring(2, 9),
      title: newNorm.title.trim(),
      link: newNorm.link.trim(),
      lastVerifiedDate: new Date().toISOString().split('T')[0]
    };

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProjectId) {
        return {
          ...p,
          norms: [...(p.norms || []), norm]
        };
      }
      return p;
    });
    onUpdate(updatedProjects);
    setNewNorm({ title: '', link: '' });
  };

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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-500">
      <div className="lg:col-span-3 space-y-4">
        {canEdit && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Novo Projeto</h3>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Nome..." 
                value={newProjectName} 
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addProject()}
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 transition-all" 
              />
              <button onClick={addProject} className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg hover:bg-indigo-500 transition active:scale-95"><Plus size={18}/></button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
            <h3 className="text-[10px] font-black uppercase tracking-widest">Lista de Projetos</h3>
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto custom-scrollbar">
            {projects.map(p => (
              <button 
                key={p.id} 
                onClick={() => setSelectedProjectId(p.id)} 
                className={`w-full text-left p-4 transition-all ${selectedProjectId === p.id ? 'bg-indigo-50 border-l-4 border-indigo-600' : 'hover:bg-slate-50 border-l-4 border-transparent'}`}
              >
                <span className={`text-xs font-black uppercase tracking-tight block ${selectedProjectId === p.id ? 'text-indigo-900' : 'text-slate-600'}`}>{p.name}</span>
                <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded border mt-1 inline-block ${getStatusColor(p.status)}`}>{p.status}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="lg:col-span-9 space-y-6">
        {activeProject ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter flex items-center gap-3">
                <FolderKanban className="text-indigo-600" size={32} /> 
                {activeProject.name}
              </h2>
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
            </div>

            <div className="flex gap-4 mb-8 border-b border-slate-100">
              <button onClick={() => setActiveTab('tracking')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === 'tracking' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Acompanhamento</button>
              <button onClick={() => setActiveTab('regulatory')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === 'regulatory' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Fluxo Regulatório</button>
              <button onClick={() => setActiveTab('norms')} className={`pb-4 px-2 text-xs font-black uppercase tracking-widest border-b-2 transition ${activeTab === 'norms' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Normas</button>
            </div>

            {activeTab !== 'norms' ? (
              <div className="space-y-4">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fluxo de Macrotarefas</h3>
                  {canEdit && (
                    <div className="flex w-full md:w-auto gap-2">
                      <input 
                        type="text" 
                        placeholder="Nome da Macro..." 
                        value={newMacroTitle} 
                        onChange={e => setNewMacroTitle(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && addMacroTask(activeTab as any)} 
                        className="flex-1 md:w-64 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                      <button onClick={() => addMacroTask(activeTab as any)} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition shadow-lg">Cadastrar Macro</button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {(activeTab === 'tracking' ? activeProject.trackingMacroTasks : activeProject.regulatoryMacroTasks).map(macro => (
                    <div key={macro.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition">
                      <div className="bg-slate-50 p-4 flex items-center justify-between group/macro">
                        <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => toggleMacro(macro.id)}>
                          {expandedMacros.includes(macro.id) ? <ChevronUp size={18}/> : <ChevronDown size={18}/>}
                          {editingMacroId === macro.id ? (
                            <div className="flex items-center gap-2 flex-1 max-w-md" onClick={e => e.stopPropagation()}>
                              <input 
                                autoFocus 
                                value={tempMacroTitle} 
                                onChange={e => setTempMacroTitle(e.target.value)} 
                                onKeyDown={e => e.key === 'Enter' && saveEditMacro(macro.id, activeTab as any)} 
                                className="flex-1 px-3 py-1 bg-white border border-indigo-300 rounded-lg text-sm font-bold uppercase outline-none" 
                              />
                              <button onClick={() => saveEditMacro(macro.id, activeTab as any)} className="text-emerald-500 p-1 hover:bg-emerald-50 rounded"><Check size={18}/></button>
                              <button onClick={() => setEditingMacroId(null)} className="text-slate-400 p-1 hover:bg-slate-100 rounded"><X size={18}/></button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group/title">
                              <p className="text-sm font-black text-slate-800 uppercase tracking-tight">{macro.title}</p>
                              {canEdit && (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); startEditMacro(macro); }} 
                                  className="opacity-0 group-hover/macro:opacity-100 text-slate-400 hover:text-indigo-600 transition p-1"
                                >
                                  <Edit3 size={14}/>
                                </button>
                              )}
                              <p className="text-[10px] font-bold text-indigo-600 ml-4">{calculateMacroProgress(macro)}%</p>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-4 relative">
                          {canEdit && (
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === macro.id ? null : macro.id); }}
                                className="p-2 text-slate-400 hover:text-slate-900 transition-colors rounded-lg hover:bg-slate-200"
                              >
                                <MoreVertical size={20} />
                              </button>
                              
                              {openMenuId === macro.id && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-slate-100 rounded-xl shadow-2xl z-[60] overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
                                  <button 
                                    onClick={(e) => { e.stopPropagation(); removeMacroAction(macro.id, activeTab as any); }}
                                    className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 size={14} /> Excluir Macrotarefa
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {expandedMacros.includes(macro.id) && (
                        <div className="p-4 bg-white space-y-4 border-t border-slate-100">
                          {canEdit && (
                            <div className="flex gap-2 pb-2">
                              <input 
                                type="text" 
                                placeholder="Nova Microtarefa..." 
                                value={newMicroInputs[macro.id] || ''} 
                                onChange={e => setNewMicroInputs({ ...newMicroInputs, [macro.id]: e.target.value })} 
                                onKeyDown={e => e.key === 'Enter' && addMicroTask(macro.id, activeTab as any)} 
                                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                              />
                              <button onClick={() => addMicroTask(macro.id, activeTab as any)} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition shadow-md"><Plus size={16}/></button>
                            </div>
                          )}
                          <div className="space-y-2">
                            {(macro.microTasks || []).map(micro => (
                              <div key={micro.id} className="flex flex-wrap items-center gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-indigo-200 transition group/micro">
                                <div className="flex-1 min-w-[200px]">
                                  {editingMicroId === micro.id ? (
                                    <div className="flex items-center gap-2">
                                      <input 
                                        autoFocus 
                                        value={tempMicroText} 
                                        onChange={e => setTempMicroText(e.target.value)} 
                                        onKeyDown={e => e.key === 'Enter' && saveEditMicro(macro.id, micro.id, activeTab as any)}
                                        className="flex-1 px-2 py-1 bg-white border border-indigo-300 rounded text-xs font-bold uppercase outline-none"
                                      />
                                      <button onClick={() => saveEditMicro(macro.id, micro.id, activeTab as any)} className="text-emerald-500"><Check size={14}/></button>
                                      <button onClick={() => setEditingMicroId(null)} className="text-slate-400"><X size={14}/></button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <p className={`text-xs font-bold uppercase tracking-tight ${micro.status === 'Concluído' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                                        {micro.text}
                                      </p>
                                      {canEdit && (
                                        <button onClick={() => startEditMicro(micro)} className="opacity-0 group-hover/micro:opacity-100 text-slate-300 hover:text-indigo-600 transition">
                                          <Edit3 size={12}/>
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-4">
                                  <select value={micro.status} onChange={e => updateMicroTask(macro.id, micro.id, activeTab as any, { status: e.target.value as ItemStatus })} disabled={!canEdit} className={`text-[9px] font-black uppercase border rounded px-1 py-0.5 outline-none ${getStatusColor(micro.status)}`}>
                                    {ITEM_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                  </select>
                                  <select value={micro.owner} onChange={e => updateMicroTask(macro.id, micro.id, activeTab as any, { owner: e.target.value })} disabled={!canEdit} className="text-[9px] font-bold border rounded px-1 py-0.5 bg-white text-slate-600 outline-none">
                                    {people.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                  </select>
                                  {canEdit && (
                                    <div className="relative">
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === micro.id ? null : micro.id); }}
                                        className="p-1 text-slate-400 hover:text-slate-900 transition-colors rounded-md hover:bg-slate-200"
                                      >
                                        <MoreVertical size={16} />
                                      </button>
                                      
                                      {openMenuId === micro.id && (
                                        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-2xl z-[60] overflow-hidden ring-1 ring-slate-900/5">
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); removeMicroAction(macro.id, micro.id, activeTab as any); }}
                                            className="w-full text-left px-3 py-2 text-[9px] font-black uppercase text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                          >
                                            <Trash2 size={12} /> Excluir Micro
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {canEdit && (
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título da Norma</label>
                      <input 
                        type="text" 
                        placeholder="Ex: RDC 44/2009" 
                        value={newNorm.title} 
                        onChange={e => setNewNorm({ ...newNorm, title: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                    <div className="flex-1 space-y-1 w-full">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Link de Acesso</label>
                      <input 
                        type="text" 
                        placeholder="https://..." 
                        value={newNorm.link} 
                        onChange={e => setNewNorm({ ...newNorm, link: e.target.value })}
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500" 
                      />
                    </div>
                    <button onClick={addNorm} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition shadow-lg h-[38px]">Adicionar</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(activeProject.norms || []).map(norm => (
                    <div key={norm.id} className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-blue-200 transition group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><FileText size={20}/></div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">{norm.title}</h4>
                        </div>
                        {canEdit && (
                          <button onClick={(e) => { e.preventDefault(); removeNorm(norm.id); }} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                        )}
                      </div>
                      {norm.link && <a href={norm.link} target="_blank" rel="noopener noreferrer" className="text-[10px] font-black text-indigo-600 uppercase flex items-center gap-1 hover:underline"><ExternalLink size={12}/> Acessar Norma</a>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200 border-dashed p-32 text-center shadow-inner">
            <FolderKanban size={40} className="mx-auto text-slate-200 mb-6" />
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-[0.3em] italic">Selecione um projeto para gerenciar os fluxos.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectsManager;
