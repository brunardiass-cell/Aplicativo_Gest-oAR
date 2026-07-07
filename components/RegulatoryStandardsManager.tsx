import React, { useState, useMemo } from 'react';
import { RegulatoryStandard, RegulatoryStandardStatus, ActivityPlanTemplate, Project, RegulatorySubject, RegulatoryBlock } from '../types';
import { 
  ShieldCheck, 
  Plus, 
  Search, 
  FileText, 
  ExternalLink, 
  BookOpen, 
  Edit2, 
  Trash2, 
  X, 
  Save,
  Eye,
  CheckCircle2,
  AlertCircle,
  Clock,
  Tag,
  Layers,
  Folder,
  FolderPlus,
  Link2,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  HelpCircle,
  PlusCircle,
  Sliders,
  Sparkles
} from 'lucide-react';

interface RegulatoryStandardsManagerProps {
  standards: RegulatoryStandard[];
  onAddStandard: (standard: RegulatoryStandard) => void;
  onUpdateStandard: (standard: RegulatoryStandard) => void;
  onDeleteStandard: (id: string) => void;
  activityPlans: ActivityPlanTemplate[];
  projects: Project[];
  subjects?: RegulatorySubject[];
  onUpdateSubjects?: (subjects: RegulatorySubject[]) => void;
}

const RegulatoryStandardsManager: React.FC<RegulatoryStandardsManagerProps> = ({
  standards,
  onAddStandard,
  onUpdateStandard,
  onDeleteStandard,
  activityPlans,
  projects,
  subjects = [],
  onUpdateSubjects = () => {}
}) => {
  // Tabs: 'lista' | 'assuntos'
  const [activeTab, setActiveTab] = useState<'lista' | 'assuntos'>('lista');

  // original list states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  
  const [formData, setFormData] = useState<Omit<RegulatoryStandard, 'id'>>({
    name: '',
    type: 'Manual',
    theme: '',
    phase: '',
    relatedActivities: [],
    version: '1.0',
    status: 'vigente',
    summary: '',
    documentLink: '',
    notebookLMLink: '',
    keywords: [],
    appliesTo: '',
    linkedStandards: [],
    keyNotes: ''
  });

  const [activityInput, setActivityInput] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [linkedStandardInput, setLinkedStandardInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showStandardSuggestions, setShowStandardSuggestions] = useState(false);

  // Subject and block-specific state
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({});
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  
  // Collapse states for standard associations
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});
  const [collapsedNotesSections, setCollapsedNotesSections] = useState<Record<string, boolean>>({});
  const [collapsedPassagesSections, setCollapsedPassagesSections] = useState<Record<string, boolean>>({});
  
  // Modals / forms states
  const [subjectModal, setSubjectModal] = useState<{ isOpen: boolean; subjectId?: string; name: string } | null>(null);
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; subjectId: string; blockId?: string; name: string } | null>(null);
  const [linkModal, setLinkModal] = useState<{ 
    isOpen: boolean; 
    subjectId: string; 
    blockId: string; 
    standardId: string; 
    importantNotes: string; 
    specificPassages: string;
    isEdit: boolean;
  } | null>(null);

  // Detailed standard modal (from subject-specific view)
  const [detailedStandard, setDetailedStandard] = useState<RegulatoryStandard | null>(null);

  const allSystemActivities = useMemo(() => {
    const names = new Set<string>();
    activityPlans.forEach(plan => {
      plan.macroActivities.forEach(macro => names.add(macro.name));
    });
    projects.forEach(project => {
      project.macroActivities.forEach(macro => {
        names.add(macro.name);
        macro.microActivities.forEach(micro => names.add(micro.name));
      });
    });
    return Array.from(names).sort();
  }, [activityPlans, projects]);

  const filteredSuggestions = allSystemActivities.filter(name => 
    name.toLowerCase().includes(activityInput.toLowerCase()) && 
    !formData.relatedActivities.includes(name)
  ).slice(0, 5);

  const handleAddActivity = (activityName?: string) => {
    const finalName = activityName || activityInput.trim();
    if (finalName && !formData.relatedActivities.includes(finalName)) {
      setFormData({
        ...formData,
        relatedActivities: [...formData.relatedActivities, finalName]
      });
      setActivityInput('');
      setShowSuggestions(false);
    }
  };

  const removeActivity = (activity: string) => {
    setFormData({
      ...formData,
      relatedActivities: formData.relatedActivities.filter(a => a !== activity)
    });
  };

  const handleAddKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords?.includes(keyword)) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), keyword]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (keyword: string) => {
    setFormData({
      ...formData,
      keywords: (formData.keywords || []).filter(k => k !== keyword)
    });
  };

  const handleAddLinkedStandard = (name?: string) => {
    const finalName = name || linkedStandardInput.trim();
    if (finalName && !(formData.linkedStandards || []).includes(finalName)) {
      setFormData({
        ...formData,
        linkedStandards: [...(formData.linkedStandards || []), finalName]
      });
      setLinkedStandardInput('');
      setShowStandardSuggestions(false);
    }
  };

  const removeLinkedStandard = (name: string) => {
    setFormData({
      ...formData,
      linkedStandards: (formData.linkedStandards || []).filter(n => n !== name)
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'Manual',
      theme: '',
      phase: '',
      relatedActivities: [],
      version: '1.0',
      status: 'vigente',
      summary: '',
      documentLink: '',
      notebookLMLink: '',
      keywords: [],
      appliesTo: '',
      linkedStandards: [],
      keyNotes: ''
    });
    setActivityInput('');
    setKeywordInput('');
    setLinkedStandardInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateStandard({ ...formData, id: editingId });
      setEditingId(null);
    } else {
      onAddStandard({ ...formData, id: crypto.randomUUID() });
      setIsAdding(false);
    }
    resetForm();
  };

  const startEdit = (standard: RegulatoryStandard) => {
    setFormData({
      name: standard.name,
      type: standard.type || 'Manual',
      theme: standard.theme,
      phase: standard.phase,
      relatedActivities: standard.relatedActivities,
      version: standard.version,
      status: standard.status,
      summary: standard.summary,
      documentLink: standard.documentLink,
      notebookLMLink: standard.notebookLMLink,
      keywords: standard.keywords || [],
      appliesTo: standard.appliesTo || '',
      linkedStandards: standard.linkedStandards || [],
      keyNotes: standard.keyNotes || ''
    });
    setEditingId(standard.id);
    setIsAdding(true);
  };

  const filteredStandards = useMemo(() => {
    let result = standards.filter(s => {
      const matchesSearch = 
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.keywords && s.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (s.appliesTo && s.appliesTo.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'todos' || s.type === selectedType;
      
      return matchesSearch && matchesType;
    });

    return result.sort((a, b) => {
      const getPriority = (type: string) => {
        if (type === 'ICH') return 1;
        if (type === 'RDC') return 2;
        return 3;
      };

      const priorityA = getPriority(a.type);
      const priorityB = getPriority(b.type);

      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [standards, searchTerm, selectedType]);

  const uniqueTypes = useMemo(() => {
    const types = new Set<string>();
    standards.forEach(s => { if (s.type) types.add(s.type); });
    return Array.from(types).sort();
  }, [standards]);

  const getStatusColor = (status: RegulatoryStandardStatus) => {
    switch (status) {
      case 'vigente': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'vigente com alteração': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Alterador': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'À Entrar em Vigor': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'obsoleto': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusIcon = (status: RegulatoryStandardStatus) => {
    switch (status) {
      case 'vigente': return <CheckCircle2 size={12} />;
      case 'vigente com alteração': return <Edit2 size={12} />;
      case 'Alterador': return <Plus size={12} />;
      case 'À Entrar em Vigor': return <Clock size={12} />;
      case 'obsoleto': return <AlertCircle size={12} />;
    }
  };

  // SUBJECT AND BLOCK CRUD HANDLERS
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModal) return;

    if (subjectModal.subjectId) {
      // Editing
      onUpdateSubjects(subjects.map(s => s.id === subjectModal.subjectId ? { ...s, name: subjectModal.name.trim() } : s));
    } else {
      // Creating
      const newSubject: RegulatorySubject = {
        id: crypto.randomUUID(),
        name: subjectModal.name.trim(),
        blocks: []
      };
      onUpdateSubjects([...subjects, newSubject]);
      // Expand newly created subject by default
      setExpandedSubjectIds(prev => ({ ...prev, [newSubject.id]: true }));
    }
    setSubjectModal(null);
  };

  const handleDeleteSubject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este assunto? Todos os blocos e vínculos serão excluídos permanentemente.')) {
      onUpdateSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockModal) return;

    const { subjectId, blockId, name } = blockModal;

    onUpdateSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        if (blockId) {
          // Edit Block
          return {
            ...s,
            blocks: s.blocks.map(b => b.id === blockId ? { ...b, name: name.trim() } : b)
          };
        } else {
          // Add Block
          const newBlock: RegulatoryBlock = {
            id: crypto.randomUUID(),
            name: name.trim(),
            associations: []
          };
          return {
            ...s,
            blocks: [...s.blocks, newBlock]
          };
        }
      }
      return s;
    }));
    setBlockModal(null);
  };

  const handleDeleteBlock = (subjectId: string, blockId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este bloco? Todos os vínculos de normas deste bloco serão removidos.')) {
      onUpdateSubjects(subjects.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            blocks: s.blocks.filter(b => b.id !== blockId)
          };
        }
        return s;
      }));
    }
  };

  const handleSaveLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkModal) return;

    const { subjectId, blockId, standardId, importantNotes, specificPassages, isEdit } = linkModal;
    if (!standardId) {
      alert('Selecione uma norma para vincular.');
      return;
    }

    const sanitizedNotes = importantNotes
      .split('\n---\n')
      .map(note => note.trim())
      .filter(Boolean)
      .join('\n---\n');

    onUpdateSubjects(subjects.map(s => {
      if (s.id === subjectId) {
        return {
          ...s,
          blocks: s.blocks.map(b => {
            if (b.id === blockId) {
              const existsIdx = b.associations.findIndex(a => a.standardId === standardId);
              let updated = [...b.associations];

              if (existsIdx >= 0) {
                updated[existsIdx] = {
                  standardId,
                  importantNotes: sanitizedNotes,
                  specificPassages: specificPassages.trim()
                };
              } else {
                updated.push({
                  standardId,
                  importantNotes: sanitizedNotes,
                  specificPassages: specificPassages.trim()
                });
              }

              return { ...b, associations: updated };
            }
            return b;
          })
        };
      }
      return s;
    }));
    setLinkModal(null);
  };

  const handleUnlinkStandard = (subjectId: string, blockId: string, standardId: string) => {
    if (window.confirm('Deseja realmente desvincular esta norma deste bloco?')) {
      onUpdateSubjects(subjects.map(s => {
        if (s.id === subjectId) {
          return {
            ...s,
            blocks: s.blocks.map(b => {
              if (b.id === blockId) {
                return {
                  ...b,
                  associations: b.associations.filter(a => a.standardId !== standardId)
                };
              }
              return b;
            })
          };
        }
        return s;
      }));
    }
  };

  const toggleSubjectExpanded = (id: string) => {
    setExpandedSubjectIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredSubjects = useMemo(() => {
    if (!subjectSearchTerm.trim()) return subjects;
    return subjects.filter(s => {
      const matchSubject = s.name.toLowerCase().includes(subjectSearchTerm.toLowerCase());
      const matchBlocks = s.blocks.some(b => 
        b.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
        b.associations.some(a => {
          const std = standards.find(st => st.id === a.standardId);
          return std?.name.toLowerCase().includes(subjectSearchTerm.toLowerCase()) || 
                 a.importantNotes.toLowerCase().includes(subjectSearchTerm.toLowerCase()) ||
                 a.specificPassages.toLowerCase().includes(subjectSearchTerm.toLowerCase());
        })
      );
      return matchSubject || matchBlocks;
    });
  }, [subjects, subjectSearchTerm, standards]);

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <div className="p-2 bg-brand-primary/10 rounded-xl text-brand-primary">
              <ShieldCheck size={24} />
            </div>
            Gestão de Normas Regulatórias
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">Configure o acervo de normas e associe-as a fases e plataformas.</p>
        </div>
        
        {/* original Add button but conditionally shown depending on active tab or if editing */}
        {!isAdding && activeTab === 'lista' && (
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-brand-primary/20 hover:scale-105 transition-all active:scale-95"
          >
            <Plus size={18} /> Nova Norma
          </button>
        )}

        {!isAdding && activeTab === 'assuntos' && (
          <button 
            onClick={() => setSubjectModal({ isOpen: true, name: '' })}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20 hover:scale-105 transition-all active:scale-95"
          >
            <FolderPlus size={18} /> Novo Assunto
          </button>
        )}
      </div>

      {/* Tab Switcher - only show if NOT in add/edit standard mode */}
      {!isAdding && (
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('lista')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition ${
              activeTab === 'lista'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileText size={14} /> Todas as Normas
          </button>
          <button
            onClick={() => setActiveTab('assuntos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition ${
              activeTab === 'assuntos'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Layers size={14} /> Normas por Assunto
          </button>
        </div>
      )}

      {/* ORIGINAL ADD/EDIT FORM CONTAINER */}
      {isAdding ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-300">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
              {editingId ? 'Editar Norma' : 'Cadastrar Nova Norma'}
            </h2>
            <button onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }} className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition">
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome da Norma</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="Ex: RDC 301/2019"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo da Norma</label>
                <select 
                  value={formData.type}
                  onChange={e => setFormData({...formData, type: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium appearance-none bg-white"
                >
                  <option value="Manual">Manual</option>
                  <option value="ICH">ICH</option>
                  <option value="Guia">Guia</option>
                  <option value="RDC">RDC</option>
                  <option value="Instrução Normativa">Instrução Normativa</option>
                  <option value="Portaria">Portaria</option>
                  <option value="Lei">Lei</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tema / Assunto</label>
                <input 
                  required
                  value={formData.theme}
                  onChange={e => setFormData({...formData, theme: e.target.value})}
                  placeholder="Ex: Boas Práticas de Fabricação"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fase do Projeto</label>
                <input 
                  value={formData.phase}
                  onChange={e => setFormData({...formData, phase: e.target.value})}
                  placeholder="Ex: Produção, Qualidade, etc."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Versão</label>
                  <input 
                    value={formData.version}
                    onChange={e => setFormData({...formData, version: e.target.value})}
                    placeholder="1.0"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status</label>
                  <select 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as RegulatoryStandardStatus})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium appearance-none bg-white"
                  >
                    <option value="vigente">Vigente</option>
                    <option value="vigente com alteração">Vigente com alteração</option>
                    <option value="Alterador">Alterador</option>
                    <option value="À Entrar em Vigor">À Entrar em Vigor</option>
                    <option value="obsoleto">Obsoleto</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resumo / Descrição</label>
                <textarea 
                  required
                  value={formData.summary}
                  onChange={e => setFormData({...formData, summary: e.target.value})}
                  rows={3}
                  placeholder="Breve descrição do conteúdo e aplicabilidade da norma..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium resize-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Se aplica a...</label>
                <input 
                  value={formData.appliesTo}
                  onChange={e => setFormData({...formData, appliesTo: e.target.value})}
                  placeholder="Ex: Laboratórios, Equipe de Qualidade, Processo de Fabricação X"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Principais Notas sobre a Norma</label>
                <textarea 
                  value={formData.keyNotes || ''}
                  onChange={e => setFormData({...formData, keyNotes: e.target.value})}
                  rows={3}
                  placeholder="Insira as principais notas, observações importantes ou orientações específicas sobre esta norma..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium resize-none"
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Normas e Guias Vinculados</label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input 
                      value={linkedStandardInput}
                      onChange={e => {
                        setLinkedStandardInput(e.target.value);
                        setShowStandardSuggestions(true);
                      }}
                      onFocus={() => setShowStandardSuggestions(true)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddLinkedStandard())}
                      placeholder="Busque ou digite o nome de outras normas ou guias vinculados..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddLinkedStandard()}
                      className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                      Adicionar
                    </button>
                  </div>

                  {showStandardSuggestions && linkedStandardInput && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-48 overflow-y-auto">
                      {standards
                        .filter(s => s.id !== editingId)
                        .filter(s => s.name.toLowerCase().includes(linkedStandardInput.toLowerCase()))
                        .filter(s => !(formData.linkedStandards || []).includes(s.name))
                        .slice(0, 5)
                        .map(suggestion => (
                          <button
                            key={suggestion.id}
                            type="button"
                            onClick={() => handleAddLinkedStandard(suggestion.name)}
                            className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex items-center justify-between"
                          >
                            <span className="flex items-center gap-2">
                              <Plus size={14} className="text-slate-400" />
                              {suggestion.name}
                            </span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-bold uppercase">{suggestion.type}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(formData.linkedStandards || []).map(linked => (
                    <span key={linked} className="inline-flex items-center gap-2 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg text-xs font-bold uppercase tracking-tight border border-teal-200">
                      {linked}
                      <button type="button" onClick={() => removeLinkedStandard(linked)} className="hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {(!formData.linkedStandards || formData.linkedStandards.length === 0) && (
                    <p className="text-[10px] text-slate-400 italic">Nenhuma outra norma ou guia vinculada.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Palavras Chaves (Facilitar Busca)</label>
                <div className="flex gap-2">
                  <input 
                    value={keywordInput}
                    onChange={e => setKeywordInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                    placeholder="Digite uma palavra chave..."
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                  <button 
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                  >
                    Adicionar
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {(formData.keywords || []).map(keyword => (
                    <span key={keyword} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold uppercase tracking-tight border border-slate-200">
                      {keyword}
                      <button type="button" onClick={() => removeKeyword(keyword)} className="hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link Documento Oficial</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    value={formData.documentLink}
                    onChange={e => setFormData({...formData, documentLink: e.target.value})}
                    placeholder="https://..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link NotebookLM</label>
                <div className="relative">
                  <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    value={formData.notebookLMLink}
                    onChange={e => setFormData({...formData, notebookLMLink: e.target.value})}
                    placeholder="https://notebooklm.google.com/..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Atividades Relacionadas (Vínculo Automático)</label>
                <div className="relative">
                  <div className="flex gap-2">
                    <input 
                      value={activityInput}
                      onChange={e => {
                        setActivityInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onKeyPress={e => e.key === 'Enter' && (e.preventDefault(), handleAddActivity())}
                      placeholder="Digite o nome exato da atividade..."
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddActivity()}
                      className="px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition"
                    >
                      Adicionar
                    </button>
                  </div>

                  {showSuggestions && activityInput && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                      {filteredSuggestions.map(suggestion => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleAddActivity(suggestion)}
                          className="w-full px-4 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50 transition border-b border-slate-50 last:border-0 flex items-center gap-2"
                        >
                          <Plus size={14} className="text-slate-400" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.relatedActivities.map(activity => (
                    <span key={activity} className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary rounded-lg text-xs font-bold uppercase tracking-tight border border-brand-primary/20">
                      {activity}
                      <button type="button" onClick={() => removeActivity(activity)} className="hover:text-red-500 transition">
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {formData.relatedActivities.length === 0 && (
                    <p className="text-[10px] text-slate-400 italic">Nenhuma atividade vinculada. A norma não aparecerá automaticamente nos projetos.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                className="px-6 py-3 text-slate-500 font-bold uppercase text-xs tracking-widest hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-emerald-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all active:scale-95"
              >
                <Save size={18} /> {editingId ? 'Salvar Alterações' : 'Confirmar Cadastro'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        /* TAB RENDERERS */
        <div>
          {/* TAB 1: ORIGINAL ALL STANDARDS FLAT LIST */}
          {activeTab === 'lista' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, tema, resumo ou palavras chaves..."
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Filtrar por:</span>
                  <select 
                    value={selectedType}
                    onChange={e => setSelectedType(e.target.value)}
                    className="bg-transparent text-xs font-bold text-slate-600 outline-none cursor-pointer"
                  >
                    <option value="todos">Todos os Tipos</option>
                    {uniqueTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredStandards.map(standard => {
                  const isExpanded = expandedId === standard.id;
                  return (
                    <div key={standard.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all group">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getStatusColor(standard.status)}`}>
                              {getStatusIcon(standard.status)}
                              {standard.status}
                            </span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                              <Tag size={10} />
                              {standard.type || 'Manual'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Versão {standard.version}</span>
                          </div>
                          <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight leading-tight">{standard.name}</h3>
                          <p className="text-brand-primary text-xs font-bold uppercase tracking-wider">{standard.theme}</p>
                          
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-200">
                              {standard.appliesTo && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Se aplica a:</span>
                                  <span className="text-xs font-bold text-slate-700 leading-relaxed text-justify">{standard.appliesTo}</span>
                                </div>
                              )}

                              {standard.keyNotes && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Principais Notas:</span>
                                  <div className="text-xs font-medium text-slate-700 leading-relaxed text-justify bg-amber-50/50 border border-amber-100 p-3 rounded-xl whitespace-pre-line">
                                    {standard.keyNotes}
                                  </div>
                                </div>
                              )}

                              {standard.linkedStandards && standard.linkedStandards.length > 0 && (
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Normas e Guias Vinculados:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {standard.linkedStandards.map(linked => (
                                      <span key={linked} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-[9.5px] font-black uppercase tracking-tight border border-teal-200">
                                        {linked}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {standard.keywords && standard.keywords.length > 0 && (
                                <div className="flex flex-col gap-2">
                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Palavras Chaves:</span>
                                  <div className="flex flex-wrap gap-1.5">
                                    {standard.keywords.map(kw => (
                                      <span key={kw} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-200">
                                        #{kw}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex gap-1 ml-4 shadow-sm rounded-lg border border-slate-100 p-1 bg-slate-50/50">
                          <button 
                            onClick={() => setExpandedId(isExpanded ? null : standard.id)} 
                            className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-brand-primary'}`}
                            title={isExpanded ? "Recolher informações" : "Ver informações completas"}
                          >
                            <Eye size={18} />
                          </button>
                          <button onClick={() => startEdit(standard)} className="p-2 text-slate-400 hover:bg-white hover:text-brand-primary rounded-lg transition" title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button onClick={() => onDeleteStandard(standard.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition" title="Excluir">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <p className={`text-slate-600 text-sm mb-6 font-medium leading-relaxed text-justify ${isExpanded ? '' : 'line-clamp-3'}`}>
                        {standard.summary}
                      </p>

                      <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-slate-50">
                        <div className="flex gap-3">
                          {standard.documentLink && (
                            <a 
                              href={standard.documentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-slate-500 hover:text-brand-primary text-xs font-bold uppercase tracking-tight transition"
                            >
                              <FileText size={14} /> Documento <ExternalLink size={12} />
                            </a>
                          )}
                          {standard.notebookLMLink && (
                            <a 
                              href={standard.notebookLMLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-slate-500 hover:text-emerald-600 text-xs font-bold uppercase tracking-tight transition"
                            >
                              <BookOpen size={14} /> NotebookLM <ExternalLink size={12} />
                            </a>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vínculos:</span>
                          <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded-md text-[10px] font-bold">
                            {standard.relatedActivities.length} Atividades
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                
                {filteredStandards.length === 0 && (
                  <div className="col-span-full py-20 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <ShieldCheck size={32} />
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-black uppercase tracking-tight">Nenhuma norma encontrada</h3>
                      <p className="text-slate-500 text-sm font-medium">Tente ajustar sua busca ou cadastre uma nova norma.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: NORMAS POR ASSUNTO (SUBJECT HIERARCHICAL MANAGER) */}
          {activeTab === 'assuntos' && (
            <div className="space-y-6">
              
              {/* Subject search bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  value={subjectSearchTerm}
                  onChange={e => setSubjectSearchTerm(e.target.value)}
                  placeholder="Buscar por Assunto, Bloco/Fase, Norma associada ou termos em notas..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              {/* Subject list hierarchy rendering */}
              <div className="space-y-4">
                {filteredSubjects.map(subject => {
                  const isExpanded = !!expandedSubjectIds[subject.id];
                  const totalStandardsCount = subject.blocks.reduce((acc, b) => acc + b.associations.length, 0);

                  return (
                    <div key={subject.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
                      
                      {/* Subject Card Header */}
                      <div 
                        onClick={() => toggleSubjectExpanded(subject.id)}
                        className="p-5 flex items-center justify-between cursor-pointer bg-slate-50/45 hover:bg-slate-50 transition border-b border-slate-100"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
                            <Folder size={20} />
                          </div>
                          <div className="truncate">
                            <h3 className="text-sm sm:text-base font-black text-slate-800 uppercase tracking-tight">{subject.name}</h3>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[10px] font-black text-teal-600 uppercase bg-teal-50 px-2 py-0.5 rounded-md">
                                {subject.blocks.length} {subject.blocks.length === 1 ? 'Bloco' : 'Blocos'}
                              </span>
                              <span className="text-[10px] font-black text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                                {totalStandardsCount} {totalStandardsCount === 1 ? 'Norma' : 'Normas'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions of Subject */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setSubjectModal({ isOpen: true, subjectId: subject.id, name: subject.name })}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition shadow-none hover:shadow-sm"
                            title="Editar Assunto"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSubject(subject.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition"
                            title="Excluir Assunto"
                          >
                            <Trash2 size={14} />
                          </button>
                          <button 
                            onClick={() => setBlockModal({ isOpen: true, subjectId: subject.id, name: '' })}
                            className="flex items-center gap-1.5 px-3 py-2 text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition"
                            title="Criar Bloco/Fase"
                          >
                            <Plus size={12} /> Bloco
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => toggleSubjectExpanded(subject.id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl border border-transparent hover:border-slate-100 transition"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      </div>

                      {/* Subject Expanded Body */}
                      {isExpanded && (
                        <div className="p-6 bg-white space-y-6">
                          
                          {/* Rendering blocks */}
                          {subject.blocks.length === 0 ? (
                            <div className="text-center py-8 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-100">
                              <Layers size={24} className="text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum bloco cadastrado</p>
                              <p className="text-slate-500 text-xs mt-1">Crie blocos/fases clicando no botão "+ Bloco" acima.</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {subject.blocks.map(block => (
                                <div key={block.id} className="border border-slate-100 rounded-2xl bg-slate-50/20 shadow-sm overflow-hidden">
                                  
                                  {/* Block Header */}
                                  <div className="px-4 py-3 bg-slate-50/40 border-b border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <Layers size={14} className="text-teal-600" />
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-700 uppercase tracking-wide">{block.name}</h4>
                                      <span className="text-[9px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-black uppercase">
                                        {block.associations.length}
                                      </span>
                                    </div>

                                    {/* Block actions */}
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => setBlockModal({ isOpen: true, subjectId: subject.id, blockId: block.id, name: block.name })}
                                        className="p-1 text-slate-400 hover:text-teal-600 rounded-md hover:bg-white transition"
                                        title="Renomear Bloco"
                                      >
                                        <Edit2 size={12} />
                                      </button>
                                      <button 
                                        onClick={() => handleDeleteBlock(subject.id, block.id)}
                                        className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-white transition"
                                        title="Excluir Bloco"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                      <div className="w-px h-4 bg-slate-200 mx-1"></div>
                                      <button 
                                        onClick={() => setLinkModal({ 
                                          isOpen: true, 
                                          subjectId: subject.id, 
                                          blockId: block.id, 
                                          standardId: '', 
                                          importantNotes: '', 
                                          specificPassages: '',
                                          isEdit: false
                                        })}
                                        className="flex items-center gap-1 px-2.5 py-1 text-teal-700 hover:text-teal-800 hover:bg-teal-100/50 rounded-lg text-[9px] font-black uppercase tracking-wider transition"
                                      >
                                        <Link2 size={11} /> Vincular Norma
                                      </button>
                                    </div>
                                  </div>

                                  {/* Block associations body */}
                                  <div className="p-4 space-y-4">
                                    {block.associations.length === 0 ? (
                                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-center py-4 italic">Nenhuma norma vinculada a este bloco.</p>
                                    ) : (
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {block.associations.map(assoc => {
                                          const std = standards.find(s => s.id === assoc.standardId);
                                          const assocKey = `${subject.id}-${block.id}-${assoc.standardId}`;
                                          const isCardCollapsed = !!collapsedCards[assocKey];
                                          const isNotesSectionCollapsed = !!collapsedNotesSections[assocKey];
                                          const isPassagesSectionCollapsed = !!collapsedPassagesSections[assocKey];
                                          const notesList = assoc.importantNotes ? assoc.importantNotes.split('\n---\n').filter(Boolean) : [];
                                          
                                          return (
                                            <div key={assoc.standardId} className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition flex flex-col justify-between group relative">
                                              
                                              <div>
                                                {/* Header of Standard Block Card */}
                                                <div className="flex justify-between items-start gap-2 mb-2">
                                                  <div className="min-w-0">
                                                    <h5 className="text-xs font-black text-slate-800 uppercase tracking-wide truncate">
                                                      {std ? std.name : `Norma Desconhecida (${assoc.standardId})`}
                                                    </h5>
                                                    <p className="text-[10px] text-teal-600 font-bold uppercase tracking-wide truncate mt-0.5">
                                                      {std ? std.theme : 'Tema indisponível'}
                                                    </p>
                                                    
                                                    {std && (
                                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                                        <span className="text-[8px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">
                                                          {std.type}
                                                        </span>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase border ${getStatusColor(std.status)}`}>
                                                          {std.status}
                                                        </span>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Icons Action Grid */}
                                                  <div className="flex items-center gap-0.5 bg-slate-50 border border-slate-100 rounded-lg p-0.5">
                                                    {std && (
                                                      <button 
                                                        onClick={() => setDetailedStandard(std)}
                                                        className="p-1 text-slate-400 hover:text-teal-600 rounded-md hover:bg-white transition"
                                                        title="Ver Detalhes Gerais da Norma"
                                                      >
                                                        <Eye size={12} />
                                                      </button>
                                                    )}
                                                    <button 
                                                      onClick={() => setLinkModal({ 
                                                        isOpen: true, 
                                                        subjectId: subject.id, 
                                                        blockId: block.id, 
                                                        standardId: assoc.standardId, 
                                                        importantNotes: assoc.importantNotes, 
                                                        specificPassages: assoc.specificPassages,
                                                        isEdit: true
                                                      })}
                                                      className="p-1 text-slate-400 hover:text-teal-600 rounded-md hover:bg-white transition"
                                                      title="Editar Notas"
                                                    >
                                                      <Edit2 size={12} />
                                                    </button>
                                                    <button 
                                                      onClick={() => handleUnlinkStandard(subject.id, block.id, assoc.standardId)}
                                                      className="p-1 text-slate-400 hover:text-red-500 rounded-md hover:bg-white transition"
                                                      title="Desvincular Norma"
                                                    >
                                                      <Trash2 size={12} />
                                                    </button>
                                                    <button 
                                                      onClick={() => setCollapsedCards(prev => ({ ...prev, [assocKey]: !prev[assocKey] }))}
                                                      className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-white transition"
                                                      title={isCardCollapsed ? "Mostrar Informações" : "Esconder Informações"}
                                                    >
                                                      {isCardCollapsed ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Important Notes */}
                                                {!isCardCollapsed && notesList.length > 0 && (
                                                  <div className="mt-3 bg-amber-50/50 border-l-4 border-amber-300 p-2.5 rounded-r-xl">
                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                      <span className="text-[9px] font-black text-amber-700 uppercase tracking-widest flex items-center gap-1">
                                                        <MessageSquare size={10} /> Notas Importantes ({notesList.length}):
                                                      </span>
                                                      <button 
                                                        onClick={() => setCollapsedNotesSections(prev => ({ ...prev, [assocKey]: !prev[assocKey] }))}
                                                        className="p-0.5 text-amber-600 hover:text-amber-800 hover:bg-amber-100/50 rounded transition"
                                                        title={isNotesSectionCollapsed ? "Expandir Notas" : "Recolher Notas"}
                                                      >
                                                        {isNotesSectionCollapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                                                      </button>
                                                    </div>
                                                    {!isNotesSectionCollapsed && (
                                                      <div className="space-y-1.5 mt-1.5">
                                                        {notesList.map((note, nIdx) => (
                                                          <div key={nIdx} className="bg-white/80 p-2 rounded-lg border border-amber-100 shadow-xs">
                                                            <p className="text-[11px] text-slate-700 font-medium leading-relaxed text-justify whitespace-pre-line">
                                                              {note}
                                                            </p>
                                                          </div>
                                                        ))}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}

                                                {/* Specific Passages */}
                                                {!isCardCollapsed && assoc.specificPassages && (
                                                  <div className="mt-2.5 bg-slate-50 border border-slate-200/60 p-2.5 rounded-xl">
                                                    <div className="flex items-center justify-between gap-1 mb-1">
                                                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1">
                                                        <FileText size={10} /> Seções Importantes do Documento:
                                                      </span>
                                                      <button 
                                                        onClick={() => setCollapsedPassagesSections(prev => ({ ...prev, [assocKey]: !prev[assocKey] }))}
                                                        className="p-0.5 text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 rounded transition"
                                                        title={isPassagesSectionCollapsed ? "Expandir Seções" : "Recolher Seções"}
                                                      >
                                                        {isPassagesSectionCollapsed ? <ChevronDown size={10} /> : <ChevronUp size={10} />}
                                                      </button>
                                                    </div>
                                                    {!isPassagesSectionCollapsed && (
                                                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed text-justify whitespace-pre-line mt-1">
                                                        {assoc.specificPassages}
                                                      </p>
                                                    )}
                                                  </div>
                                                )}
                                              </div>

                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}
                                  </div>

                                </div>
                              ))}
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}

                {filteredSubjects.length === 0 && (
                  <div className="py-20 text-center space-y-4 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mx-auto text-slate-400">
                      <Folder size={32} />
                    </div>
                    <div>
                      <h3 className="text-slate-800 font-black uppercase tracking-tight">Nenhum assunto correspondente</h3>
                      <p className="text-slate-500 text-sm font-medium">Tente ajustar sua busca ou crie um novo assunto.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: SUBJECT MODAL (CREATE / EDIT NAME) */}
      {subjectModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">
                {subjectModal.subjectId ? 'Editar Nome do Assunto' : 'Novo Assunto'}
              </h3>
              <button onClick={() => setSubjectModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveSubject} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Assunto / Plataforma</label>
                <input
                  required
                  autoFocus
                  value={subjectModal.name}
                  onChange={e => setSubjectModal({ ...subjectModal, name: e.target.value })}
                  placeholder="Ex: Proteínas Recombinantes"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSubjectModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 uppercase tracking-wider rounded-lg transition shadow-md shadow-teal-600/15"
                >
                  {subjectModal.subjectId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: BLOCK MODAL (CREATE / EDIT NAME) */}
      {blockModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight">
                {blockModal.blockId ? 'Editar Nome do Bloco/Fase' : 'Novo Bloco / Fase'}
              </h3>
              <button onClick={() => setBlockModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveBlock} className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome do Bloco / Fase</label>
                <input
                  required
                  autoFocus
                  value={blockModal.name}
                  onChange={e => setBlockModal({ ...blockModal, name: e.target.value })}
                  placeholder="Ex: Fase Pré-clínica ou Prova de Conceito"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setBlockModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-lg transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 uppercase tracking-wider rounded-lg transition shadow-md shadow-teal-600/15"
                >
                  {blockModal.blockId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: LINK STANDARD MODAL (LINK OR EDIT VINCULATED STANDARD) */}
      {linkModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Link2 size={18} className="text-teal-600" />
                {linkModal.isEdit ? 'Editar Vínculo da Norma' : 'Vincular Norma ao Bloco'}
              </h3>
              <button onClick={() => setLinkModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveLink} className="p-6 space-y-5">
              
              {/* Select Standard */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Selecione a Norma</label>
                {linkModal.isEdit ? (
                  // Disabled select on edit
                  <div className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 text-sm font-bold uppercase tracking-tight">
                    {standards.find(s => s.id === linkModal.standardId)?.name || 'Norma Desconhecida'}
                  </div>
                ) : (
                  <select
                    required
                    value={linkModal.standardId}
                    onChange={e => setLinkModal({ ...linkModal, standardId: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium appearance-none bg-white"
                  >
                    <option value="">Selecione uma norma cadastrada...</option>
                    {standards.map(std => {
                      // We can let them associate even if already exists, but filtering out is nicer if not editing
                      return (
                        <option key={std.id} value={std.id}>
                          {std.name} ({std.type || 'Manual'}) - {std.theme}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Notes of standard */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    Notas Importantes (Notas Rápidas / Post-its)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const currentNotes = linkModal.importantNotes ? linkModal.importantNotes.split('\n---\n') : [];
                      setLinkModal({
                        ...linkModal,
                        importantNotes: [...currentNotes, ''].join('\n---\n')
                      });
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 text-teal-700 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 rounded-lg text-[9px] font-black uppercase tracking-wider transition font-mono"
                  >
                    <Plus size={10} /> Adicionar Nota / Post-it
                  </button>
                </div>
                
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(linkModal.importantNotes ? linkModal.importantNotes.split('\n---\n') : ['']).map((note, idx, arr) => (
                    <div key={idx} className="flex gap-2 items-start bg-amber-50/20 p-2.5 rounded-xl border border-amber-100 shadow-xs">
                      <textarea
                        required
                        rows={2}
                        value={note}
                        onChange={e => {
                          const currentNotes = [...arr];
                          currentNotes[idx] = e.target.value;
                          setLinkModal({
                            ...linkModal,
                            importantNotes: currentNotes.join('\n---\n')
                          });
                        }}
                        placeholder={`Insira a nota #${idx + 1}...`}
                        className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium resize-none bg-white"
                      />
                      {arr.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const currentNotes = arr.filter((_, nIdx) => nIdx !== idx);
                            setLinkModal({
                              ...linkModal,
                              importantNotes: currentNotes.join('\n---\n')
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition self-center"
                          title="Remover Nota"
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Passages addressed */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seções Importantes do Documento</label>
                <textarea
                  rows={3}
                  value={linkModal.specificPassages}
                  onChange={e => setLinkModal({ ...linkModal, specificPassages: e.target.value })}
                  placeholder="Informe as seções importantes do documento dessa norma aplicadas a este bloco..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setLinkModal(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 uppercase tracking-wider rounded-xl transition shadow-md shadow-teal-600/15 flex items-center gap-2"
                >
                  <Save size={14} />
                  {linkModal.isEdit ? 'Salvar Vínculo' : 'Confirmar Vínculo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: DETAILED VIEW MODAL FOR ASSOCIATED STANDARD (FOR EXPOSING HIDDEN DETAILS) */}
      {detailedStandard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(detailedStandard.status)}`}>
                    {getStatusIcon(detailedStandard.status)}
                    {detailedStandard.status}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-100 text-slate-500 border border-slate-200">
                    <Tag size={8} />
                    {detailedStandard.type || 'Manual'}
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Versão {detailedStandard.version}</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight mt-1 leading-tight">
                  {detailedStandard.name}
                </h3>
              </div>
              <button onClick={() => setDetailedStandard(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            {/* Content body */}
            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              
              {/* Theme */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tema / Assunto Geral:</span>
                <p className="text-sm font-bold text-brand-primary uppercase tracking-wide">{detailedStandard.theme}</p>
              </div>

              {/* Summary */}
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resumo / Informações Gerais:</span>
                <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed text-justify whitespace-pre-line bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {detailedStandard.summary}
                </p>
              </div>

              {/* Applies to */}
              {detailedStandard.appliesTo && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Se aplica a:</span>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{detailedStandard.appliesTo}</p>
                </div>
              )}

              {/* General KeyNotes */}
              {detailedStandard.keyNotes && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Anotações Gerais:</span>
                  <div className="text-xs text-slate-700 font-medium leading-relaxed text-justify bg-amber-50/40 border border-amber-100 p-3 rounded-xl whitespace-pre-line">
                    {detailedStandard.keyNotes}
                  </div>
                </div>
              )}

              {/* Linked Standards */}
              {detailedStandard.linkedStandards && detailedStandard.linkedStandards.length > 0 && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Normas e Guias Vinculados:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedStandard.linkedStandards.map(linked => (
                      <span key={linked} className="px-2.5 py-1 bg-teal-50/60 text-teal-700 rounded-lg text-[9.5px] font-bold uppercase border border-teal-200/50">
                        {linked}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Keywords */}
              {detailedStandard.keywords && detailedStandard.keywords.length > 0 && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1.5">Palavras Chaves:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailedStandard.keywords.map(kw => (
                      <span key={kw} className="px-2 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-tight border border-slate-200">
                        #{kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Links */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
                {detailedStandard.documentLink && (
                  <a 
                    href={detailedStandard.documentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 hover:text-brand-primary text-xs font-bold uppercase tracking-tight transition bg-slate-100 hover:bg-brand-primary/10 px-4 py-2.5 rounded-xl border border-slate-200/50"
                  >
                    <FileText size={14} /> Documento Oficial <ExternalLink size={12} />
                  </a>
                )}
                {detailedStandard.notebookLMLink && (
                  <a 
                    href={detailedStandard.notebookLMLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 text-xs font-bold uppercase tracking-tight transition bg-slate-100 hover:bg-emerald-50 px-4 py-2.5 rounded-xl border border-slate-200/50"
                  >
                    <BookOpen size={14} /> NotebookLM <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50/50">
              <button 
                onClick={() => setDetailedStandard(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-slate-900 transition"
              >
                Fechar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default RegulatoryStandardsManager;
