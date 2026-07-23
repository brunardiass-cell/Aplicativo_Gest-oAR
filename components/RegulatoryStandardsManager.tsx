import React, { useState, useMemo } from 'react';
import { RegulatoryStandard, RegulatoryStandardStatus, ActivityPlanTemplate, Project, RegulatorySubject, RegulatoryBlock, KnowledgeConcept, ConceptStandardLink } from '../types';
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
  StickyNote,
  HelpCircle,
  PlusCircle,
  Sliders,
  Sparkles,
  Pin,
  Bookmark,
  FileCheck
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

const getBlockConcepts = (block: RegulatoryBlock, standardsList: RegulatoryStandard[] = []): KnowledgeConcept[] => {
  if (block.concepts && block.concepts.length > 0) {
    return block.concepts;
  }
  if (block.associations && block.associations.length > 0) {
    return block.associations.map((assoc, idx) => {
      const std = standardsList.find(s => s.id === assoc.standardId);
      const notesList = assoc.importantNotes ? assoc.importantNotes.split('\n---\n').filter(Boolean) : [];
      const firstNote = notesList[0] || assoc.importantNotes || 'Resumo consolidado do conceito.';
      return {
        id: `legacy_${block.id}_${assoc.standardId}_${idx}`,
        title: std ? `Conceito: ${std.name}` : `Conceito #${idx + 1}`,
        centralIdea: firstNote,
        practicalApplication: 'Aplicação prática extraída do cumprimento técnico da norma.',
        observations: notesList.length > 1 ? notesList.slice(1).join('\n') : '',
        color: 'yellow',
        linkedStandards: [
          {
            standardId: assoc.standardId,
            relevantPassages: assoc.specificPassages || firstNote,
            page: '',
            section: ''
          }
        ]
      };
    });
  }
  return [];
};

const getPostItColorClasses = (color?: string) => {
  switch (color) {
    case 'blue':
      return {
        cardBg: 'bg-sky-50/90 hover:bg-sky-50/100 border-sky-200/90 shadow-sky-100',
        headerBg: 'bg-sky-100/80 text-sky-900 border-sky-200',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
        pinColor: 'text-sky-600',
        accentText: 'text-sky-700',
        borderColor: 'border-sky-300'
      };
    case 'green':
      return {
        cardBg: 'bg-emerald-50/90 hover:bg-emerald-50/100 border-emerald-200/90 shadow-emerald-100',
        headerBg: 'bg-emerald-100/80 text-emerald-900 border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        pinColor: 'text-emerald-600',
        accentText: 'text-emerald-700',
        borderColor: 'border-emerald-300'
      };
    case 'pink':
      return {
        cardBg: 'bg-rose-50/90 hover:bg-rose-50/100 border-rose-200/90 shadow-rose-100',
        headerBg: 'bg-rose-100/80 text-rose-900 border-rose-200',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        pinColor: 'text-rose-600',
        accentText: 'text-rose-700',
        borderColor: 'border-rose-300'
      };
    case 'purple':
      return {
        cardBg: 'bg-purple-50/90 hover:bg-purple-50/100 border-purple-200/90 shadow-purple-100',
        headerBg: 'bg-purple-100/80 text-purple-900 border-purple-200',
        badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
        pinColor: 'text-purple-600',
        accentText: 'text-purple-700',
        borderColor: 'border-purple-300'
      };
    case 'amber':
    case 'yellow':
    default:
      return {
        cardBg: 'bg-amber-50/90 hover:bg-amber-50/100 border-amber-200/90 shadow-amber-100',
        headerBg: 'bg-amber-100/80 text-amber-900 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        pinColor: 'text-amber-600',
        accentText: 'text-amber-800',
        borderColor: 'border-amber-300'
      };
  }
};

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
  const [activeTab, setActiveTab] = useState<'lista' | 'assuntos'>('assuntos');

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
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({
    'subj_1': true
  });
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Record<string, boolean>>({});

  // Modals / forms states for Subject & Block
  const [subjectModal, setSubjectModal] = useState<{ isOpen: boolean; subjectId?: string; name: string } | null>(null);
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; subjectId: string; blockId?: string; name: string } | null>(null);

  // Post-it Concept Modals State
  const [conceptModal, setConceptModal] = useState<{
    isOpen: boolean;
    subjectId: string;
    blockId: string;
    conceptId?: string;
    title: string;
    centralIdea: string;
    practicalApplication: string;
    observations: string;
    color: string;
    linkedStandards: ConceptStandardLink[];
  } | null>(null);

  const [viewConceptModal, setViewConceptModal] = useState<{
    concept: KnowledgeConcept;
    subjectName: string;
    blockName: string;
    subjectId: string;
    blockId: string;
  } | null>(null);

  // Detailed standard modal
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
    const kw = keywordInput.trim();
    if (kw && !formData.keywords?.includes(kw)) {
      setFormData({
        ...formData,
        keywords: [...(formData.keywords || []), kw]
      });
      setKeywordInput('');
    }
  };

  const removeKeyword = (kw: string) => {
    setFormData({
      ...formData,
      keywords: formData.keywords?.filter(k => k !== kw)
    });
  };

  const handleAddLinkedStandard = (stdName?: string) => {
    const finalName = stdName || linkedStandardInput.trim();
    if (finalName && !formData.linkedStandards?.includes(finalName)) {
      setFormData({
        ...formData,
        linkedStandards: [...(formData.linkedStandards || []), finalName]
      });
      setLinkedStandardInput('');
      setShowStandardSuggestions(false);
    }
  };

  const removeLinkedStandard = (std: string) => {
    setFormData({
      ...formData,
      linkedStandards: formData.linkedStandards?.filter(s => s !== std)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      onUpdateStandard({
        ...formData,
        id: editingId
      });
      setEditingId(null);
    } else {
      onAddStandard({
        ...formData,
        id: `norma_${Date.now()}`
      });
    }
    setIsAdding(false);
    resetForm();
  };

  const startEdit = (standard: RegulatoryStandard) => {
    setEditingId(standard.id);
    setFormData({
      name: standard.name,
      type: standard.type || 'Manual',
      theme: standard.theme,
      phase: standard.phase || '',
      relatedActivities: standard.relatedActivities,
      version: standard.version,
      status: standard.status,
      summary: standard.summary,
      documentLink: standard.documentLink || '',
      notebookLMLink: standard.notebookLMLink || '',
      keywords: standard.keywords || [],
      appliesTo: standard.appliesTo || '',
      linkedStandards: standard.linkedStandards || [],
      keyNotes: standard.keyNotes || ''
    });
    setIsAdding(true);
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

  const filteredStandards = useMemo(() => {
    return standards.filter(std => {
      const matchesSearch = std.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            std.theme.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            std.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (std.keywords && std.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()))) ||
                            (std.appliesTo && std.appliesTo.toLowerCase().includes(searchTerm.toLowerCase())) ||
                            (std.keyNotes && std.keyNotes.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesType = selectedType === 'todos' || std.type === selectedType;

      return matchesSearch && matchesType;
    });
  }, [standards, searchTerm, selectedType]);

  const getStatusColor = (status: RegulatoryStandardStatus) => {
    switch (status) {
      case 'vigente': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'vigente com alteração': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Alterador': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'À Entrar em Vigor': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'obsoleto': return 'bg-slate-100 text-slate-600 border-slate-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  const getStatusIcon = (status: RegulatoryStandardStatus) => {
    switch (status) {
      case 'vigente': return <CheckCircle2 size={12} className="text-emerald-600" />;
      case 'vigente com alteração': return <AlertCircle size={12} className="text-blue-600" />;
      case 'Alterador': return <Clock size={12} className="text-purple-600" />;
      case 'À Entrar em Vigor': return <Clock size={12} className="text-amber-600" />;
      case 'obsoleto': return <AlertCircle size={12} className="text-slate-400" />;
      default: return null;
    }
  };

  // SUBJECT AND BLOCK CRUD HANDLERS
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModal) return;

    if (subjectModal.subjectId) {
      onUpdateSubjects(subjects.map(s => s.id === subjectModal.subjectId ? { ...s, name: subjectModal.name.trim() } : s));
    } else {
      const newSubject: RegulatorySubject = {
        id: `subj_${Date.now()}`,
        name: subjectModal.name.trim(),
        blocks: []
      };
      onUpdateSubjects([...subjects, newSubject]);
      setExpandedSubjectIds(prev => ({ ...prev, [newSubject.id]: true }));
    }
    setSubjectModal(null);
  };

  const handleDeleteSubject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este assunto? Todos os blocos e Post-its serão excluídos permanentemente.')) {
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
          return {
            ...s,
            blocks: s.blocks.map(b => b.id === blockId ? { ...b, name: name.trim() } : b)
          };
        } else {
          const newBlock: RegulatoryBlock = {
            id: `block_${Date.now()}`,
            name: name.trim(),
            concepts: []
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
    if (window.confirm('Tem certeza que deseja excluir este bloco? Todos os Post-its deste bloco serão removidos.')) {
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

  // POST-IT CONCEPT HANDLERS
  const handleSaveConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptModal) return;

    const { subjectId, blockId, conceptId, title, centralIdea, practicalApplication, observations, color, linkedStandards } = conceptModal;

    if (!title.trim()) {
      alert('Por favor, informe o título do conceito.');
      return;
    }

    const cleanedLinks = linkedStandards
      .filter(link => link.standardId.trim() !== '')
      .map(link => ({
        standardId: link.standardId,
        relevantPassages: link.relevantPassages.trim(),
        page: link.page ? link.page.trim() : '',
        section: link.section ? link.section.trim() : ''
      }));

    const newConcept: KnowledgeConcept = {
      id: conceptId || `concept_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      centralIdea: centralIdea.trim(),
      practicalApplication: practicalApplication.trim(),
      observations: observations.trim(),
      color: color || 'yellow',
      linkedStandards: cleanedLinks
    };

    onUpdateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;
      return {
        ...s,
        blocks: s.blocks.map(b => {
          if (b.id !== blockId) return b;
          const currentConcepts = getBlockConcepts(b, standards);
          let updated: KnowledgeConcept[];
          if (conceptId) {
            updated = currentConcepts.map(c => c.id === conceptId ? newConcept : c);
          } else {
            updated = [...currentConcepts, newConcept];
          }
          return {
            ...b,
            concepts: updated
          };
        })
      };
    }));

    // If currently viewing this concept in modal, refresh view
    if (viewConceptModal && viewConceptModal.concept.id === newConcept.id) {
      setViewConceptModal({
        ...viewConceptModal,
        concept: newConcept
      });
    }

    setConceptModal(null);
  };

  const handleDeleteConcept = (subjectId: string, blockId: string, conceptId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este Post-it de Conhecimento?')) {
      onUpdateSubjects(subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          blocks: s.blocks.map(b => {
            if (b.id !== blockId) return b;
            const currentConcepts = getBlockConcepts(b, standards);
            return {
              ...b,
              concepts: currentConcepts.filter(c => c.id !== conceptId)
            };
          })
        };
      }));

      if (viewConceptModal && viewConceptModal.concept.id === conceptId) {
        setViewConceptModal(null);
      }
    }
  };

  const handleAddLinkToConcept = () => {
    if (!conceptModal) return;
    setConceptModal({
      ...conceptModal,
      linkedStandards: [
        ...conceptModal.linkedStandards,
        { standardId: '', relevantPassages: '', page: '', section: '' }
      ]
    });
  };

  const handleUpdateConceptLink = (index: number, field: keyof ConceptStandardLink, value: string) => {
    if (!conceptModal) return;
    const updated = [...conceptModal.linkedStandards];
    updated[index] = { ...updated[index], [field]: value };
    setConceptModal({ ...conceptModal, linkedStandards: updated });
  };

  const handleRemoveConceptLink = (index: number) => {
    if (!conceptModal) return;
    setConceptModal({
      ...conceptModal,
      linkedStandards: conceptModal.linkedStandards.filter((_, i) => i !== index)
    });
  };

  const toggleSubjectExpanded = (id: string) => {
    setExpandedSubjectIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredSubjects = useMemo(() => {
    if (!subjectSearchTerm.trim()) return subjects;
    const term = subjectSearchTerm.toLowerCase();

    return subjects.filter(s => {
      if (s.name.toLowerCase().includes(term)) return true;
      return s.blocks.some(b => {
        if (b.name.toLowerCase().includes(term)) return true;
        const concepts = getBlockConcepts(b, standards);
        return concepts.some(c => {
          if (c.title.toLowerCase().includes(term)) return true;
          if (c.centralIdea.toLowerCase().includes(term)) return true;
          if (c.practicalApplication.toLowerCase().includes(term)) return true;
          if (c.observations && c.observations.toLowerCase().includes(term)) return true;
          return c.linkedStandards.some(link => {
            if (link.relevantPassages && link.relevantPassages.toLowerCase().includes(term)) return true;
            if (link.page && link.page.toLowerCase().includes(term)) return true;
            if (link.section && link.section.toLowerCase().includes(term)) return true;
            const std = standards.find(st => st.id === link.standardId);
            return std ? std.name.toLowerCase().includes(term) : false;
          });
        });
      });
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
          <p className="text-slate-500 text-sm font-medium mt-1">
            Consulte o acervo normativo e explore os <strong className="text-teal-700 font-bold">Post-its de Conhecimento</strong> embasados em evidências regulatórias.
          </p>
        </div>
        
        {/* Conditional Header Action Buttons */}
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

      {/* Tab Switcher */}
      {!isAdding && (
        <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-sm w-fit">
          <button
            onClick={() => setActiveTab('assuntos')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition ${
              activeTab === 'assuntos'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/15'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <StickyNote size={15} /> Post-its de Conhecimento
          </button>
          <button
            onClick={() => setActiveTab('lista')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-black uppercase text-[10px] tracking-wider transition ${
              activeTab === 'lista'
                ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/10'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <FileText size={15} /> Acervo de Normas
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
                  onChange={e => setFormData({...formData, type: e.target.value as any})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                >
                  <option value="ICH">ICH</option>
                  <option value="RDC">RDC</option>
                  <option value="Guia">Guia</option>
                  <option value="Instrução Normativa">Instrução Normativa</option>
                  <option value="Farmacopeia">Farmacopeia</option>
                  <option value="Manual">Manual / Outros</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tema / Assunto Geral</label>
                <input 
                  required
                  value={formData.theme}
                  onChange={e => setFormData({...formData, theme: e.target.value})}
                  placeholder="Ex: Boas Práticas de Fabricação (BPF)"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status da Norma</label>
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as any})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                >
                  <option value="vigente">Vigente</option>
                  <option value="vigente com alteração">Vigente com Alteração</option>
                  <option value="Alterador">Alterador</option>
                  <option value="À Entrar em Vigor">À Entrar em Vigor</option>
                  <option value="obsoleto">Obsoleto</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Versão</label>
                <input 
                  required
                  value={formData.version}
                  onChange={e => setFormData({...formData, version: e.target.value})}
                  placeholder="Ex: 1.0 ou Rev. 2"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Se Aplica A (Escopo)</label>
                <input 
                  value={formData.appliesTo || ''}
                  onChange={e => setFormData({...formData, appliesTo: e.target.value})}
                  placeholder="Ex: Biofármacos, Vacinas, Produtos Injetáveis..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resumo das Diretrizes</label>
              <textarea 
                required
                rows={3}
                value={formData.summary}
                onChange={e => setFormData({...formData, summary: e.target.value})}
                placeholder="Descreva brevemente os principais pontos e requisitos da norma..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Anotações / Notas Gerais</label>
              <textarea 
                rows={2}
                value={formData.keyNotes || ''}
                onChange={e => setFormData({...formData, keyNotes: e.target.value})}
                placeholder="Anotações internas importantes sobre esta norma..."
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium resize-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link para o Documento Oficial</label>
                <input 
                  type="url"
                  value={formData.documentLink || ''}
                  onChange={e => setFormData({...formData, documentLink: e.target.value})}
                  placeholder="https://..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link do Caderno NotebookLM</label>
                <input 
                  type="url"
                  value={formData.notebookLMLink || ''}
                  onChange={e => setFormData({...formData, notebookLMLink: e.target.value})}
                  placeholder="https://notebooklm.google.com/..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                />
              </div>
            </div>

            {/* Atividades Relacionadas */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Atividades e Macroatividades Relacionadas</label>
              <div className="relative">
                <div className="flex gap-2">
                  <input 
                    value={activityInput}
                    onChange={e => {
                      setActivityInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Digite para buscar atividade do sistema..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                  <button 
                    type="button"
                    onClick={() => handleAddActivity()}
                    className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold uppercase text-xs transition"
                  >
                    Adicionar
                  </button>
                </div>

                {showSuggestions && activityInput.trim() && filteredSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    {filteredSuggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleAddActivity(suggestion)}
                        className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-xs font-bold text-slate-700 border-b border-slate-100 last:border-0 flex items-center justify-between"
                      >
                        <span>{suggestion}</span>
                        <Plus size={14} className="text-brand-primary" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mt-3">
                {formData.relatedActivities.map(act => (
                  <span key={act} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-bold border border-slate-200">
                    {act}
                    <button type="button" onClick={() => removeActivity(act)} className="text-slate-400 hover:text-red-500 transition">
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold uppercase text-xs tracking-wider hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="flex items-center gap-2 px-8 py-2.5 bg-brand-primary text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg shadow-brand-primary/20 hover:bg-brand-primary/90 transition"
              >
                <Save size={16} /> Salvar Norma
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div>
          {/* TAB 1: TODAS AS NORMAS */}
          {activeTab === 'lista' && (
            <div className="space-y-6">
              
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome, tema, resumo ou palavras-chave..."
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-medium"
                  />
                </div>

                <select 
                  value={selectedType}
                  onChange={e => setSelectedType(e.target.value)}
                  className="px-4 py-3.5 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition outline-none text-sm font-bold text-slate-700 bg-white"
                >
                  <option value="todos">Todos os Tipos</option>
                  <option value="ICH">ICH</option>
                  <option value="RDC">RDC</option>
                  <option value="Guia">Guia</option>
                  <option value="Instrução Normativa">Instrução Normativa</option>
                  <option value="Farmacopeia">Farmacopeia</option>
                  <option value="Manual">Manual / Outros</option>
                </select>
              </div>

              {/* Grid of Standards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStandards.map(standard => {
                  const isExpanded = expandedId === standard.id;

                  return (
                    <div key={standard.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusColor(standard.status)}`}>
                                {getStatusIcon(standard.status)}
                                {standard.status}
                              </span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">v{standard.version}</span>
                            </div>
                            <h3 className="text-base font-black text-slate-800 uppercase tracking-tight group-hover:text-brand-primary transition-colors">
                              {standard.name}
                            </h3>
                            <p className="text-brand-primary text-[10px] font-bold uppercase tracking-wider">{standard.theme}</p>
                          </div>

                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button 
                              onClick={() => setExpandedId(isExpanded ? null : standard.id)} 
                              className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-brand-primary text-white shadow-md' : 'text-slate-400 hover:bg-white hover:text-brand-primary'}`}
                              title={isExpanded ? "Recolher informações" : "Ver informações completas"}
                            >
                              <Eye size={16} />
                            </button>
                            <button onClick={() => startEdit(standard)} className="p-2 text-slate-400 hover:bg-white hover:text-brand-primary rounded-lg transition" title="Editar">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => onDeleteStandard(standard.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition" title="Excluir">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        <p className={`text-slate-600 text-xs mb-4 font-medium leading-relaxed text-justify ${isExpanded ? '' : 'line-clamp-3'}`}>
                          {standard.summary}
                        </p>

                        {isExpanded && standard.keyNotes && (
                          <div className="mt-3 p-3 bg-amber-50/60 border border-amber-100 rounded-xl text-xs text-slate-700 whitespace-pre-line">
                            <span className="text-[9px] font-black text-amber-800 uppercase tracking-widest block mb-1">Anotações do Acervo:</span>
                            {standard.keyNotes}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 items-center justify-between pt-4 border-t border-slate-50 mt-4">
                        <div className="flex gap-3">
                          {standard.documentLink && (
                            <a 
                              href={standard.documentLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-slate-500 hover:text-brand-primary text-[10px] font-bold uppercase tracking-tight transition"
                            >
                              <FileText size={12} /> Documento <ExternalLink size={10} />
                            </a>
                          )}
                          {standard.notebookLMLink && (
                            <a 
                              href={standard.notebookLMLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-slate-500 hover:text-emerald-600 text-[10px] font-bold uppercase tracking-tight transition"
                            >
                              <BookOpen size={12} /> NotebookLM <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                        
                        <span className="text-[9px] font-bold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                          {standard.relatedActivities.length} Atividades
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: POST-ITS DE CONHECIMENTO (ORGANIZAÇÃO POR CONCEITOS) */}
          {activeTab === 'assuntos' && (
            <div className="space-y-6">
              
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                  value={subjectSearchTerm}
                  onChange={e => setSubjectSearchTerm(e.target.value)}
                  placeholder="Buscar por Post-it/Conceito (ex: Dose, Biodistribuição, Potência), Assunto, Bloco ou Norma..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 shadow-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium"
                />
              </div>

              {/* Subject list hierarchy rendering */}
              <div className="space-y-6">
                {filteredSubjects.map(subject => {
                  const isExpanded = !!expandedSubjectIds[subject.id];
                  const totalConceptsCount = subject.blocks.reduce((acc, b) => acc + getBlockConcepts(b, standards).length, 0);

                  return (
                    <div key={subject.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden transition-all">
                      
                      {/* Subject Card Header */}
                      <div 
                        onClick={() => toggleSubjectExpanded(subject.id)}
                        className="p-5 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100"
                      >
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                            <Folder size={22} />
                          </div>
                          <div className="truncate">
                            <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight">{subject.name}</h3>
                            <div className="flex gap-2 items-center mt-1">
                              <span className="text-[10px] font-black text-teal-700 uppercase bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100/80">
                                {subject.blocks.length} {subject.blocks.length === 1 ? 'Bloco' : 'Blocos'}
                              </span>
                              <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                                <StickyNote size={11} /> {totalConceptsCount} {totalConceptsCount === 1 ? 'Post-it de Conhecimento' : 'Post-its de Conhecimento'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions of Subject */}
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <button 
                            onClick={() => setSubjectModal({ isOpen: true, subjectId: subject.id, name: subject.name })}
                            className="p-2 text-slate-400 hover:text-teal-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition"
                            title="Editar Nome do Assunto"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button 
                            onClick={(e) => handleDeleteSubject(subject.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-100 transition"
                            title="Excluir Assunto"
                          >
                            <Trash2 size={15} />
                          </button>
                          <button 
                            onClick={() => setBlockModal({ isOpen: true, subjectId: subject.id, name: '' })}
                            className="flex items-center gap-1.5 px-3.5 py-2 text-teal-700 bg-teal-50 hover:bg-teal-100/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-teal-100"
                            title="Criar Bloco/Fase"
                          >
                            <Plus size={13} /> Bloco
                          </button>
                          <div className="w-px h-6 bg-slate-200 mx-1"></div>
                          <button 
                            onClick={() => toggleSubjectExpanded(subject.id)}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition"
                          >
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>
                      </div>

                      {/* Subject Expanded Body */}
                      {isExpanded && (
                        <div className="p-6 bg-slate-50/30 space-y-6">
                          
                          {/* Rendering blocks */}
                          {subject.blocks.length === 0 ? (
                            <div className="text-center py-10 bg-white rounded-2xl border-2 border-dashed border-slate-200 p-6">
                              <Layers size={28} className="text-slate-300 mx-auto mb-2" />
                              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nenhum bloco cadastrado</p>
                              <p className="text-slate-400 text-xs mt-1">Crie blocos (ex: Estudo de Segurança, Estudo de Estabilidade, Qualidade) clicando em "+ Bloco".</p>
                            </div>
                          ) : (
                            <div className="space-y-6">
                              {subject.blocks.map(block => {
                                const blockKey = `${subject.id}-${block.id}`;
                                const isBlockCollapsed = !!collapsedBlockIds[blockKey];
                                const concepts = getBlockConcepts(block, standards);

                                return (
                                  <div key={block.id} className="border border-slate-200/80 rounded-2xl bg-white shadow-xs overflow-hidden">
                                    
                                    {/* Block Header */}
                                    <div 
                                      onClick={() => setCollapsedBlockIds(prev => ({ ...prev, [blockKey]: !prev[blockKey] }))}
                                      className="px-5 py-3.5 bg-slate-100/60 border-b border-slate-200/80 flex items-center justify-between cursor-pointer hover:bg-slate-100 transition select-none"
                                    >
                                      <div className="flex items-center gap-3">
                                        <Layers size={16} className="text-teal-600" />
                                        <h4 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wide">{block.name}</h4>
                                        <span className="text-[10px] bg-amber-100 text-amber-800 border border-amber-200/80 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                          <StickyNote size={11} /> {concepts.length} {concepts.length === 1 ? 'Post-it' : 'Post-its'}
                                        </span>
                                        <div className="text-slate-400">
                                          {isBlockCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                                        </div>
                                      </div>

                                      {/* Block Actions */}
                                      <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                        <button 
                                          onClick={() => setBlockModal({ isOpen: true, subjectId: subject.id, blockId: block.id, name: block.name })}
                                          className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white transition"
                                          title="Renomear Bloco"
                                        >
                                          <Edit2 size={13} />
                                        </button>
                                        <button 
                                          onClick={() => handleDeleteBlock(subject.id, block.id)}
                                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition"
                                          title="Excluir Bloco"
                                        >
                                          <Trash2 size={13} />
                                        </button>
                                        <div className="w-px h-4 bg-slate-300 mx-1"></div>
                                        <button 
                                          onClick={() => setConceptModal({ 
                                            isOpen: true, 
                                            subjectId: subject.id, 
                                            blockId: block.id, 
                                            title: '', 
                                            centralIdea: '', 
                                            practicalApplication: '', 
                                            observations: '', 
                                            color: 'yellow',
                                            linkedStandards: [{ standardId: '', relevantPassages: '', page: '', section: '' }]
                                          })}
                                          className="flex items-center gap-1.5 px-3 py-1.5 text-amber-900 bg-amber-100 hover:bg-amber-200/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-amber-200 shadow-xs"
                                        >
                                          <Plus size={12} /> Novo Post-it
                                        </button>
                                      </div>
                                    </div>

                                    {/* Block Concepts Body */}
                                    {!isBlockCollapsed && (
                                      <div className="p-5">
                                        {concepts.length === 0 ? (
                                          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                                            <StickyNote size={24} className="text-slate-300 mx-auto" />
                                            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nenhum Post-it cadastrado neste bloco</p>
                                            <p className="text-[11px] text-slate-400">Clique em <strong className="text-amber-800">+ Novo Post-it</strong> para adicionar conceitos como Dose, Toxicidade, Potência, etc.</p>
                                          </div>
                                        ) : (
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                            {concepts.map(concept => {
                                              const theme = getPostItColorClasses(concept.color);

                                              return (
                                                <div 
                                                  key={concept.id} 
                                                  onClick={() => setViewConceptModal({
                                                    concept,
                                                    subjectName: subject.name,
                                                    blockName: block.name,
                                                    subjectId: subject.id,
                                                    blockId: block.id
                                                  })}
                                                  className={`rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative ${theme.cardBg}`}
                                                >
                                                  <div>
                                                    {/* Post-it Tape / Header Accent */}
                                                    <div className="flex items-center justify-between pb-3 border-b border-black/5 mb-3">
                                                      <div className="flex items-center gap-2">
                                                        <Pin size={14} className={theme.pinColor} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Post-it de Conhecimento</span>
                                                      </div>
                                                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                                                        <button 
                                                          onClick={() => setConceptModal({
                                                            isOpen: true,
                                                            subjectId: subject.id,
                                                            blockId: block.id,
                                                            conceptId: concept.id,
                                                            title: concept.title,
                                                            centralIdea: concept.centralIdea,
                                                            practicalApplication: concept.practicalApplication,
                                                            observations: concept.observations || '',
                                                            color: concept.color || 'yellow',
                                                            linkedStandards: concept.linkedStandards && concept.linkedStandards.length > 0 
                                                              ? concept.linkedStandards 
                                                              : [{ standardId: '', relevantPassages: '', page: '', section: '' }]
                                                          })}
                                                          className="p-1 text-slate-400 hover:text-slate-800 hover:bg-white/80 rounded transition"
                                                          title="Editar Post-it"
                                                        >
                                                          <Edit2 size={13} />
                                                        </button>
                                                        <button 
                                                          onClick={(e) => handleDeleteConcept(subject.id, block.id, concept.id, e)}
                                                          className="p-1 text-slate-400 hover:text-red-600 hover:bg-white/80 rounded transition"
                                                          title="Excluir Post-it"
                                                        >
                                                          <Trash2 size={13} />
                                                        </button>
                                                      </div>
                                                    </div>

                                                    {/* Concept Title */}
                                                    <h5 className="text-base font-black text-slate-900 uppercase tracking-tight mb-2 leading-snug">
                                                      {concept.title}
                                                    </h5>

                                                    {/* Central Idea Preview */}
                                                    <div className="mb-3">
                                                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Ideia Central:</span>
                                                      <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3 text-justify">
                                                        {concept.centralIdea}
                                                      </p>
                                                    </div>

                                                    {/* Practical Application Preview */}
                                                    {concept.practicalApplication && (
                                                      <div className="mb-3 pt-2 border-t border-black/5">
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-0.5">Aplicação Prática:</span>
                                                        <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2 text-justify">
                                                          {concept.practicalApplication}
                                                        </p>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* Footer Evidence Count Tag */}
                                                  <div className="pt-3 border-t border-black/5 flex items-center justify-between mt-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${theme.badgeBg}`}>
                                                      <ShieldCheck size={12} />
                                                      {concept.linkedStandards.length} {concept.linkedStandards.length === 1 ? 'Norma de Evidência' : 'Normas de Evidência'}
                                                    </span>

                                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider group-hover:text-slate-900 flex items-center gap-1 transition">
                                                      Abrir <ChevronDown size={12} className="-rotate-90" />
                                                    </span>
                                                  </div>
                                                </div>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
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
                      <p className="text-slate-500 text-sm font-medium">Tente ajustar sua busca por Post-it ou crie um novo assunto.</p>
                    </div>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL VIEW: DETAILED POST-IT CONCEPT (ABRIR POST-IT) */}
      {viewConceptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            
            {/* Header Banner */}
            <div className={`p-6 border-b flex items-center justify-between ${getPostItColorClasses(viewConceptModal.concept.color).headerBg}`}>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-white/80 text-slate-800 rounded-md text-[9px] font-black uppercase tracking-widest border border-black/10 flex items-center gap-1">
                    <Pin size={10} /> Post-it de Conhecimento
                  </span>
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    {viewConceptModal.subjectName} &bull; {viewConceptModal.blockName}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                  {viewConceptModal.concept.title}
                </h2>
              </div>
              <button 
                onClick={() => setViewConceptModal(null)} 
                className="p-2 text-slate-600 hover:bg-white/80 rounded-full transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              
              {/* 1. Ideia Central */}
              <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-700" />
                  Ideia Central (Resumo Consolidado)
                </span>
                <p className="text-sm text-slate-800 font-medium leading-relaxed text-justify whitespace-pre-line">
                  {viewConceptModal.concept.centralIdea}
                </p>
              </div>

              {/* 2. Aplicação Prática */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex items-center gap-1.5">
                  <Bookmark size={14} className="text-teal-600" />
                  Aplicação Prática
                </span>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed text-justify whitespace-pre-line">
                  {viewConceptModal.concept.practicalApplication}
                </p>
              </div>

              {/* 3. Observações */}
              {viewConceptModal.concept.observations && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-slate-500" />
                    Observações
                  </span>
                  <p className="text-xs text-slate-700 font-medium leading-relaxed text-justify whitespace-pre-line">
                    {viewConceptModal.concept.observations}
                  </p>
                </div>
              )}

              {/* 4. Lista de Normas Vinculadas */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={18} className="text-teal-600" />
                    Normas Vinculadas (Fontes de Evidência Regulatoria)
                  </h3>
                  <span className="text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-200/60 px-2.5 py-0.5 rounded-full uppercase">
                    {viewConceptModal.concept.linkedStandards.length} Vinculada(s)
                  </span>
                </div>

                {viewConceptModal.concept.linkedStandards.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nenhuma norma vinculada a este conceito.</p>
                ) : (
                  <div className="space-y-4">
                    {viewConceptModal.concept.linkedStandards.map((link, idx) => {
                      const std = standards.find(s => s.id === link.standardId);

                      return (
                        <div key={idx} className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs space-y-3">
                          
                          {/* Standard Info Banner */}
                          <div className="flex justify-between items-start gap-3 border-b border-slate-100 pb-3">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                {std && (
                                  <>
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase border ${getStatusColor(std.status)}`}>
                                      {getStatusIcon(std.status)}
                                      {std.status}
                                    </span>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase bg-slate-100 px-2 py-0.5 rounded-md">
                                      {std.type || 'Manual'}
                                    </span>
                                  </>
                                )}
                              </div>
                              <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                                {std ? std.name : `Norma Vinculada (${link.standardId})`}
                              </h4>
                              {std?.theme && (
                                <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wide">{std.theme}</p>
                              )}
                            </div>

                            {std && (
                              <button 
                                onClick={() => setDetailedStandard(std)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[10px] font-bold uppercase transition"
                                title="Ver Detalhes Gerais da Norma"
                              >
                                <Eye size={12} /> Ver Norma
                              </button>
                            )}
                          </div>

                          {/* Passages, Page & Section */}
                          <div className="space-y-2">
                            {link.relevantPassages && (
                              <div>
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-0.5">Trechos Relevantes:</span>
                                <p className="text-xs text-slate-700 font-medium leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 text-justify whitespace-pre-line">
                                  "{link.relevantPassages}"
                                </p>
                              </div>
                            )}

                            <div className="flex gap-4 items-center pt-1">
                              {link.page && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg uppercase">
                                  Página: <strong>{link.page}</strong>
                                </span>
                              )}
                              {link.section && (
                                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-lg uppercase">
                                  Seção: <strong>{link.section}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={() => {
                  const c = viewConceptModal.concept;
                  const sId = viewConceptModal.subjectId;
                  const bId = viewConceptModal.blockId;
                  setViewConceptModal(null);
                  setConceptModal({
                    isOpen: true,
                    subjectId: sId,
                    blockId: bId,
                    conceptId: c.id,
                    title: c.title,
                    centralIdea: c.centralIdea,
                    practicalApplication: c.practicalApplication,
                    observations: c.observations || '',
                    color: c.color || 'yellow',
                    linkedStandards: c.linkedStandards && c.linkedStandards.length > 0 ? c.linkedStandards : [{ standardId: '', relevantPassages: '', page: '', section: '' }]
                  });
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold uppercase transition"
              >
                <Edit2 size={14} /> Editar Post-it
              </button>

              <button 
                onClick={() => setViewConceptModal(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-700 transition"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL FORM: CREATE / EDIT POST-IT CONCEPT */}
      {conceptModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-amber-50/60">
              <h3 className="font-black text-amber-950 uppercase tracking-tight flex items-center gap-2">
                <StickyNote size={18} className="text-amber-600" />
                {conceptModal.conceptId ? 'Editar Post-it de Conhecimento' : 'Novo Post-it de Conhecimento'}
              </h3>
              <button onClick={() => setConceptModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveConcept} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              
              {/* Concept Title & Color Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Conceito</label>
                  <input
                    required
                    autoFocus
                    value={conceptModal.title}
                    onChange={e => setConceptModal({ ...conceptModal, title: e.target.value })}
                    placeholder="Ex: Dose, Biodistribuição, Toxicidade Local, Potência..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-bold uppercase"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Cor do Post-it</label>
                  <div className="flex gap-2 items-center pt-1">
                    {[
                      { id: 'yellow', bg: 'bg-amber-300' },
                      { id: 'blue', bg: 'bg-sky-300' },
                      { id: 'green', bg: 'bg-emerald-300' },
                      { id: 'pink', bg: 'bg-rose-300' },
                      { id: 'purple', bg: 'bg-purple-300' }
                    ].map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setConceptModal({ ...conceptModal, color: c.id })}
                        className={`w-7 h-7 rounded-full ${c.bg} transition-all border-2 ${
                          (conceptModal.color || 'yellow') === c.id ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                        title={`Cor ${c.id}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Central Idea */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ideia Central (Resumo Consolidado)</label>
                <textarea
                  required
                  rows={3}
                  value={conceptModal.centralIdea}
                  onChange={e => setConceptModal({ ...conceptModal, centralIdea: e.target.value })}
                  placeholder="Descreva a ideia central do conceito de forma direta e consolidada..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium resize-none"
                />
              </div>

              {/* Practical Application */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Aplicação Prática</label>
                <textarea
                  required
                  rows={3}
                  value={conceptModal.practicalApplication}
                  onChange={e => setConceptModal({ ...conceptModal, practicalApplication: e.target.value })}
                  placeholder="Descreva como este conceito se aplica na prática e nos ensaios..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium resize-none"
                />
              </div>

              {/* Observations */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Observações (Opcional)</label>
                <textarea
                  rows={2}
                  value={conceptModal.observations}
                  onChange={e => setConceptModal({ ...conceptModal, observations: e.target.value })}
                  placeholder="Adicione observações complementares relevantes..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-sm font-medium resize-none"
                />
              </div>

              {/* Linked Standards Section */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-teal-600" />
                    Normas Vinculadas que Sustentam esse Conceito (Fontes de Evidência)
                  </label>

                  <button
                    type="button"
                    onClick={handleAddLinkToConcept}
                    className="flex items-center gap-1 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-teal-200/80"
                  >
                    <Plus size={12} /> Vincular Norma
                  </button>
                </div>

                <div className="space-y-4">
                  {conceptModal.linkedStandards.map((link, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3 relative group">
                      
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Norma #{idx + 1}
                        </span>

                        {conceptModal.linkedStandards.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveConceptLink(idx)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition"
                            title="Remover Norma Vinculada"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Select Standard */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Selecione a Norma</label>
                        <select
                          value={link.standardId}
                          onChange={e => handleUpdateConceptLink(idx, 'standardId', e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                        >
                          <option value="">Selecione uma norma cadastrada...</option>
                          {standards.map(std => (
                            <option key={std.id} value={std.id}>
                              {std.name} ({std.type || 'Manual'}) - {std.theme}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Relevant Passages */}
                      <div className="space-y-1">
                        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Trechos Relevantes da Norma</label>
                        <textarea
                          rows={2}
                          value={link.relevantPassages}
                          onChange={e => handleUpdateConceptLink(idx, 'relevantPassages', e.target.value)}
                          placeholder="Informe os trechos específicos da norma que fundamentam este conceito..."
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium resize-none"
                        />
                      </div>

                      {/* Page & Section Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Página</label>
                          <input
                            type="text"
                            value={link.page || ''}
                            onChange={e => handleUpdateConceptLink(idx, 'page', e.target.value)}
                            placeholder="Ex: Página 14"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Seção</label>
                          <input
                            type="text"
                            value={link.section || ''}
                            onChange={e => handleUpdateConceptLink(idx, 'section', e.target.value)}
                            placeholder="Ex: Seção 4.3"
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                          />
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setConceptModal(null)}
                  className="px-5 py-2.5 text-xs font-bold text-slate-500 uppercase tracking-wider hover:bg-slate-50 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 uppercase tracking-wider rounded-xl transition shadow-md shadow-amber-600/20 flex items-center gap-2"
                >
                  <Save size={14} /> Salvar Post-it
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: SUBJECT MODAL (CREATE / EDIT NAME) */}
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
      {/* MODAL: BLOCK MODAL (CREATE / EDIT NAME) */}
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
                  placeholder="Ex: Estudo de Segurança, Estudo de Estabilidade, Qualidade..."
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
      {/* MODAL: DETAILED VIEW MODAL FOR ASSOCIATED STANDARD */}
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

              {/* Links */}
              <div className="flex gap-4 pt-2 border-t border-slate-100">
                {detailedStandard.documentLink && (
                  <a 
                    href={detailedStandard.documentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 hover:text-brand-primary text-xs font-bold uppercase tracking-tight transition"
                  >
                    <FileText size={14} /> Documento <ExternalLink size={12} />
                  </a>
                )}
                {detailedStandard.notebookLMLink && (
                  <a 
                    href={detailedStandard.notebookLMLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-600 hover:text-emerald-600 text-xs font-bold uppercase tracking-tight transition"
                  >
                    <BookOpen size={14} /> NotebookLM <ExternalLink size={12} />
                  </a>
                )}
              </div>

            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button 
                onClick={() => setDetailedStandard(null)}
                className="px-6 py-2 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-slate-700 transition"
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
