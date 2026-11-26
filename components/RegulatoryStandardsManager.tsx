import React, { useState, useMemo } from 'react';
import { RegulatoryStandard, RegulatoryStandardStatus, RegulatoryStandardUpdateEntry, ActivityPlanTemplate, Project, RegulatorySubject, RegulatoryBlock, KnowledgeConcept, ConceptStandardLink } from '../types';
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
  ChevronDown,
  ChevronUp,
  StickyNote,
  HelpCircle,
  SlidersHorizontal,
  Pin,
  Star,
  Grid,
  List,
  FlaskConical,
  MoreHorizontal,
  LayoutDashboard,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen,
  BellRing,
  RefreshCw,
  History,
  AlertTriangle
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
  onSwitchModule?: () => void;
  currentUserName?: string;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const normalizeUserKey = (name?: string): string =>
  (name || 'usuario')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const isWithinSevenDays = (isoDate?: string): boolean => {
  if (!isoDate) return false;
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return false;
  const diff = Date.now() - ts;
  return diff >= -24 * 60 * 60 * 1000 && diff <= SEVEN_DAYS_MS;
};

const getDaysRemainingSevenDays = (isoDate?: string): number => {
  if (!isoDate) return 0;
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return 0;
  const remaining = SEVEN_DAYS_MS - (Date.now() - ts);
  return Math.max(1, Math.min(7, Math.ceil(remaining / (24 * 60 * 60 * 1000))));
};

const isHighlightedOneYear = (isoDate?: string): boolean => {
  if (!isoDate) return false;
  const ts = new Date(isoDate).getTime();
  if (Number.isNaN(ts)) return false;
  const diff = Date.now() - ts;
  return diff >= -24 * 60 * 60 * 1000 && diff <= ONE_YEAR_MS;
};

const formatDateBr = (isoDate?: string): string => {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('pt-BR');
};

const getHighlightExpiryBr = (isoDate?: string): string => {
  if (!isoDate) return '—';
  const d = new Date(isoDate);
  if (Number.isNaN(d.getTime())) return '—';
  const expiry = new Date(d.getTime() + ONE_YEAR_MS);
  return expiry.toLocaleDateString('pt-BR');
};

const isRevokedStatus = (status?: string): boolean => {
  const st = (status || '').toLowerCase();
  return st.includes('revogad') || st.includes('obsoleto');
};

const isAlteredStatus = (status?: string): boolean => {
  const st = (status || '').toLowerCase();
  return st.includes('altera') || st.includes('revis');
};

const matchCategory = (s: RegulatoryStandard, category: string): boolean => {
  if (category === 'todas') return true;
  const typeLower = (s.type || '').toLowerCase();
  const themeLower = (s.theme || '').toLowerCase();
  const nameLower = (s.name || '').toLowerCase();
  const summaryLower = (s.summary || '').toLowerCase();

  const isRDC = typeLower === 'rdc' || nameLower.includes('rdc');
  const isGuia = typeLower === 'guia' || typeLower.includes('guia') || typeLower.includes('diretriz');
  const isIN = typeLower === 'in' || typeLower === 'instrução normativa' || typeLower.includes('instrução') || typeLower.includes('normativa');
  const isBP = themeLower.includes('boas práticas') || summaryLower.includes('boas práticas') || nameLower.includes('boas práticas') || typeLower.includes('boas práticas');

  if (category === 'RDC') return isRDC;
  if (category === 'Guias e Diretrizes') return isGuia;
  if (category === 'Instruções Normativas') return isIN;
  if (category === 'Boas Práticas') return isBP;
  if (category === 'Outros Documentos') return !isRDC && !isGuia && !isIN && !isBP;

  return true;
};

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
        centralIdeas: [firstNote],
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

const getConceptCentralIdeas = (concept: KnowledgeConcept): string[] => {
  if (concept.centralIdeas && concept.centralIdeas.length > 0) {
    const valid = concept.centralIdeas.filter(i => i && i.trim() !== '');
    if (valid.length > 0) return valid;
  }
  if (concept.centralIdea && concept.centralIdea.trim() !== '') {
    return [concept.centralIdea.trim()];
  }
  return ['Ideia central não informada.'];
};

const getPostItColorClasses = (color?: string) => {
  switch (color) {
    case 'blue':
      return {
        cardBg: 'bg-sky-50/90 hover:bg-sky-50 border-sky-200/90 shadow-sky-100',
        headerBg: 'bg-sky-100/80 text-sky-900 border-sky-200',
        badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
        pinColor: 'text-sky-600',
        accentText: 'text-sky-700',
        borderColor: 'border-sky-300'
      };
    case 'green':
      return {
        cardBg: 'bg-emerald-50/90 hover:bg-emerald-50 border-emerald-200/90 shadow-emerald-100',
        headerBg: 'bg-emerald-100/80 text-emerald-900 border-emerald-200',
        badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        pinColor: 'text-emerald-600',
        accentText: 'text-emerald-700',
        borderColor: 'border-emerald-300'
      };
    case 'pink':
      return {
        cardBg: 'bg-rose-50/90 hover:bg-rose-50 border-rose-200/90 shadow-rose-100',
        headerBg: 'bg-rose-100/80 text-rose-900 border-rose-200',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        pinColor: 'text-rose-600',
        accentText: 'text-rose-700',
        borderColor: 'border-rose-300'
      };
    case 'purple':
      return {
        cardBg: 'bg-purple-50/90 hover:bg-purple-50 border-purple-200/90 shadow-purple-100',
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
        cardBg: 'bg-amber-50/90 hover:bg-amber-50 border-amber-200/90 shadow-amber-100',
        headerBg: 'bg-amber-100/80 text-amber-900 border-amber-200',
        badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
        pinColor: 'text-amber-600',
        accentText: 'text-amber-800',
        borderColor: 'border-amber-300'
      };
  }
};

const getStatusBadge = (status: string) => {
  const st = (status || '').toLowerCase();
  if (st.includes('obsoleto') || st.includes('revogada') || st.includes('revogado')) {
    return { label: 'REVOGADO', className: 'bg-rose-100 text-rose-800 border-rose-200' };
  }
  if (st.includes('vigente com altera') || st.includes('em revisão')) {
    return { label: 'VIGENTE COM ALTERAÇÕES', className: 'bg-amber-100 text-amber-900 border-amber-300' };
  }
  return { label: 'VIGENTE', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
};

const extractDateFromName = (name: string): string => {
  const match = name.match(/(\d{1,2}\s+de\s+[a-zç]+\s+de\s+\d{4})/i);
  if (match) return match[1];
  const dateMatch = name.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) return dateMatch[1];
  return '30/03/2022';
};

const RegulatoryStandardsManager: React.FC<RegulatoryStandardsManagerProps> = ({
  standards,
  onAddStandard,
  onUpdateStandard,
  onDeleteStandard,
  activityPlans,
  projects,
  subjects = [],
  onUpdateSubjects = () => {},
  onSwitchModule,
  currentUserName = 'Usuário'
}) => {
  // Navigation State
  const [activeNav, setActiveNav] = useState<'post_its' | 'acervo' | 'favoritos' | 'atualizacoes'>('acervo');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recentes' | 'nome' | 'status'>('recentes');
  const [updatesFilter, setUpdatesFilter] = useState<'todas' | 'destaque_1_ano' | 'vigente_alteracoes' | 'revogado'>('todas');
  const [quickUpdateTargetId, setQuickUpdateTargetId] = useState<string>('');

  // Favorites
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => [
    'std_rdc_658',
    'std_in_127',
    'std_guia_dossies',
    'std_rdc_55'
  ]);

  // Original list and form states
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [registerAsUpdate, setRegisterAsUpdate] = useState(false);
  const [updateSummaryInput, setUpdateSummaryInput] = useState('');
  const [updateDateInput, setUpdateDateInput] = useState<string>(() => new Date().toISOString().split('T')[0]);
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

  // Subject and block-specific state
  const [expandedSubjectIds, setExpandedSubjectIds] = useState<Record<string, boolean>>({ 'subj_1': true });
  const [subjectSearchTerm, setSubjectSearchTerm] = useState('');
  const [collapsedBlockIds, setCollapsedBlockIds] = useState<Record<string, boolean>>({});

  // Modals / forms states
  const [subjectModal, setSubjectModal] = useState<{ isOpen: boolean; subjectId?: string; name: string } | null>(null);
  const [blockModal, setBlockModal] = useState<{ isOpen: boolean; subjectId: string; blockId?: string; name: string } | null>(null);

  const [conceptModal, setConceptModal] = useState<{
    isOpen: boolean;
    subjectId: string;
    blockId: string;
    conceptId?: string;
    title: string;
    centralIdeas: string[];
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

  const [detailedStandard, setDetailedStandard] = useState<RegulatoryStandard | null>(null);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavoriteIds(prev => 
      prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id]
    );
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
    setRegisterAsUpdate(false);
    setUpdateSummaryInput('');
    setUpdateDateInput(new Date().toISOString().split('T')[0]);
  };

  const currentUserKey = useMemo(() => normalizeUserKey(currentUserName), [currentUserName]);

  const startEdit = (standard: RegulatoryStandard, asUpdate: boolean = false) => {
    const normalizedInitialStatus: RegulatoryStandardStatus = asUpdate
      ? (isRevokedStatus(standard.status) ? 'revogado' : 'vigente com alterações')
      : standard.status;

    setFormData({
      name: standard.name,
      type: standard.type,
      theme: standard.theme,
      phase: standard.phase,
      relatedActivities: standard.relatedActivities || [],
      version: standard.version,
      status: normalizedInitialStatus,
      summary: standard.summary,
      documentLink: standard.documentLink || '',
      notebookLMLink: standard.notebookLMLink || '',
      keywords: standard.keywords || [],
      appliesTo: standard.appliesTo || '',
      linkedStandards: standard.linkedStandards || [],
      keyNotes: standard.keyNotes || ''
    });
    setEditingId(standard.id);
    setRegisterAsUpdate(asUpdate);
    setUpdateSummaryInput(asUpdate ? '' : (standard.updateSummary || ''));
    setUpdateDateInput(new Date().toISOString().split('T')[0]);
    setIsAdding(true);
  };

  const handleDismissUpdateNotification = (standard: RegulatoryStandard, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const existingDismissed = standard.dismissedNotificationUsers || [];
    if (existingDismissed.includes(currentUserKey)) return;
    onUpdateStandard({
      ...standard,
      dismissedNotificationUsers: [...existingDismissed, currentUserKey]
    });
  };

  const handleDismissAllUpdateNotifications = () => {
    activeUpdateNotifications.forEach(std => {
      const existingDismissed = std.dismissedNotificationUsers || [];
      if (!existingDismissed.includes(currentUserKey)) {
        onUpdateStandard({
          ...std,
          dismissedNotificationUsers: [...existingDismissed, currentUserKey]
        });
      }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const existing = standards.find(s => s.id === editingId);
      const statusChanged = existing ? existing.status !== formData.status : false;
      const isMarkedUpdateStatus = isRevokedStatus(formData.status) || isAlteredStatus(formData.status);
      const shouldRecordUpdate = registerAsUpdate || (statusChanged && isMarkedUpdateStatus);

      if (shouldRecordUpdate) {
        const finalStatus: RegulatoryStandardStatus = isRevokedStatus(formData.status)
          ? 'revogado'
          : 'vigente com alterações';

        const todayYmd = new Date().toISOString().split('T')[0];
        const updateIso =
          updateDateInput && updateDateInput !== todayYmd
            ? new Date(`${updateDateInput}T12:00:00.000Z`).toISOString()
            : new Date().toISOString();

        const historyEntry: RegulatoryStandardUpdateEntry = {
          id: `upd_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          date: updateIso,
          updatedBy: currentUserName,
          previousStatus: existing?.status,
          newStatus: finalStatus,
          summary: updateSummaryInput.trim() || undefined
        };

        const updatedStandard: RegulatoryStandard = {
          ...existing,
          ...formData,
          id: editingId,
          status: finalStatus,
          lastUpdatedAt: updateIso,
          updatedBy: currentUserName,
          updateSummary: updateSummaryInput.trim() || existing?.updateSummary,
          previousStatus: existing?.status,
          updateHistory: [historyEntry, ...(existing?.updateHistory || [])],
          dismissedNotificationUsers: [] // Nova atualização gera notificação de 7 dias para todos
        };

        onUpdateStandard(updatedStandard);
        if (detailedStandard?.id === editingId) {
          setDetailedStandard(updatedStandard);
        }
      } else {
        const updatedStandard: RegulatoryStandard = {
          ...existing,
          ...formData,
          id: editingId
        };
        onUpdateStandard(updatedStandard);
        if (detailedStandard?.id === editingId) {
          setDetailedStandard(updatedStandard);
        }
      }
      setEditingId(null);
    } else {
      const isInitialUpdateStatus = isRevokedStatus(formData.status) || isAlteredStatus(formData.status);
      const nowIso = new Date().toISOString();
      onAddStandard({
        ...formData,
        id: `std_${Date.now()}`,
        ...(isInitialUpdateStatus
          ? {
              status: isRevokedStatus(formData.status) ? 'revogado' : 'vigente com alterações',
              lastUpdatedAt: nowIso,
              updatedBy: currentUserName,
              updateSummary: updateSummaryInput.trim() || undefined,
              updateHistory: [
                {
                  id: `upd_${Date.now()}`,
                  date: nowIso,
                  updatedBy: currentUserName,
                  newStatus: isRevokedStatus(formData.status) ? 'revogado' : 'vigente com alterações',
                  summary: updateSummaryInput.trim() || 'Cadastro inicial com status atualizado'
                }
              ],
              dismissedNotificationUsers: []
            }
          : {})
      });
    }
    setIsAdding(false);
    resetForm();
  };

  // Normas atualizadas (para aba "Atualizações de Normas", notificações 7d e destaque 1 ano)
  const updatedStandardsList = useMemo(() => {
    return standards
      .filter(s => Boolean(s.lastUpdatedAt) || isRevokedStatus(s.status) || isAlteredStatus(s.status))
      .sort((a, b) => {
        const ta = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
        const tb = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
        return tb - ta;
      });
  }, [standards]);

  // Notificações ativas nos últimos 7 dias (que o usuário ainda não apagou)
  const activeUpdateNotifications = useMemo(() => {
    return standards
      .filter(
        s =>
          isWithinSevenDays(s.lastUpdatedAt) &&
          !(s.dismissedNotificationUsers || []).includes(currentUserKey)
      )
      .sort((a, b) => {
        const ta = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
        const tb = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
        return tb - ta;
      });
  }, [standards, currentUserKey]);

  const highlightedOneYearCount = useMemo(
    () => standards.filter(s => isHighlightedOneYear(s.lastUpdatedAt)).length,
    [standards]
  );

  const filteredUpdatedStandards = useMemo(() => {
    return updatedStandardsList.filter(s => {
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matches =
          s.name.toLowerCase().includes(term) ||
          s.theme.toLowerCase().includes(term) ||
          s.summary.toLowerCase().includes(term) ||
          (s.updateSummary || '').toLowerCase().includes(term);
        if (!matches) return false;
      }
      if (updatesFilter === 'destaque_1_ano') return isHighlightedOneYear(s.lastUpdatedAt);
      if (updatesFilter === 'vigente_alteracoes') return isAlteredStatus(s.status);
      if (updatesFilter === 'revogado') return isRevokedStatus(s.status);
      return true;
    });
  }, [updatedStandardsList, searchTerm, updatesFilter]);

  // Filtered standards calculation
  const filteredStandards = useMemo(() => {
    const list = standards.filter(s => {
      // Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchesName = s.name.toLowerCase().includes(term);
        const matchesTheme = s.theme.toLowerCase().includes(term);
        const matchesSummary = s.summary.toLowerCase().includes(term);
        const matchesKeywords = s.keywords?.some(k => k.toLowerCase().includes(term));
        if (!matchesName && !matchesTheme && !matchesSummary && !matchesKeywords) return false;
      }

      // Type
      if (selectedType !== 'todos' && s.type.toLowerCase() !== selectedType.toLowerCase()) {
        return false;
      }

      // Nav Tab Filter
      if (activeNav === 'favoritos' && !favoriteIds.includes(s.id)) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'todas') {
        if (!matchCategory(s, selectedCategory)) return false;
      }

      return true;
    });

    if (sortBy === 'nome') {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sortBy === 'status') {
      return [...list].sort((a, b) => (a.status || '').localeCompare(b.status || ''));
    }
    // Mais recentes: prioriza normas atualizadas no último ano no topo
    return [...list].sort((a, b) => {
      const aHl = isHighlightedOneYear(a.lastUpdatedAt) ? 1 : 0;
      const bHl = isHighlightedOneYear(b.lastUpdatedAt) ? 1 : 0;
      if (aHl !== bHl) return bHl - aHl;
      const ta = a.lastUpdatedAt ? new Date(a.lastUpdatedAt).getTime() : 0;
      const tb = b.lastUpdatedAt ? new Date(b.lastUpdatedAt).getTime() : 0;
      return tb - ta;
    });
  }, [standards, searchTerm, selectedType, activeNav, favoriteIds, selectedCategory, sortBy]);

  const favoritesList = useMemo(() => {
    return standards.filter(s => favoriteIds.includes(s.id));
  }, [standards, favoriteIds]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      'Boas Práticas': 0,
      'RDC': 0,
      'Guias e Diretrizes': 0,
      'Instruções Normativas': 0,
      'Outros Documentos': 0
    };

    standards.forEach(s => {
      if (matchCategory(s, 'Boas Práticas')) counts['Boas Práticas']++;
      if (matchCategory(s, 'RDC')) counts['RDC']++;
      if (matchCategory(s, 'Guias e Diretrizes')) counts['Guias e Diretrizes']++;
      if (matchCategory(s, 'Instruções Normativas')) counts['Instruções Normativas']++;
      if (matchCategory(s, 'Outros Documentos')) counts['Outros Documentos']++;
    });

    return counts;
  }, [standards]);

  // Post-its Subject filtering
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
          const ideas = getConceptCentralIdeas(c);
          if (ideas.some(i => i.toLowerCase().includes(term))) return true;
          return false;
        });
      });
    });
  }, [subjects, subjectSearchTerm, standards]);

  // Subject and Block Handlers
  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectModal || !subjectModal.name.trim()) return;

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

  const handleDeleteSubject = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('Tem certeza que deseja excluir este Assunto/Plataforma e todos os seus blocos e conceitos?')) {
      onUpdateSubjects(subjects.filter(s => s.id !== id));
    }
  };

  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockModal || !blockModal.name.trim()) return;

    const { subjectId, blockId, name } = blockModal;

    onUpdateSubjects(subjects.map(s => {
      if (s.id !== subjectId) return s;

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
    }));

    setBlockModal(null);
  };

  const handleDeleteBlock = (subjectId: string, blockId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este Bloco?')) {
      onUpdateSubjects(subjects.map(s => {
        if (s.id !== subjectId) return s;
        return {
          ...s,
          blocks: s.blocks.filter(b => b.id !== blockId)
        };
      }));
    }
  };

  const handleSaveConcept = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conceptModal) return;

    const { subjectId, blockId, conceptId, title, centralIdeas, observations, color, linkedStandards } = conceptModal;

    if (!title.trim()) {
      alert('Por favor, informe o título do Post-it.');
      return;
    }

    const cleanedIdeas = centralIdeas.map(i => i.trim()).filter(Boolean);
    if (cleanedIdeas.length === 0) {
      alert('Por favor, informe ao menos uma Ideia Central.');
      return;
    }

    const cleanedLinks = linkedStandards
      .filter(link => link.standardId.trim() !== '')
      .map(link => ({
        standardId: link.standardId,
        relevantPassages: link.relevantPassages ? link.relevantPassages.trim() : '',
        page: link.page ? link.page.trim() : '',
        section: link.section ? link.section.trim() : ''
      }));

    const newConcept: KnowledgeConcept = {
      id: conceptId || `concept_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: title.trim(),
      centralIdeas: cleanedIdeas,
      centralIdea: cleanedIdeas[0],
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
          return { ...b, concepts: updated };
        })
      };
    }));

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

  return (
    <div className="-m-4 sm:-m-10 bg-slate-50 min-h-screen flex flex-col lg:flex-row text-slate-800 font-sans">
      
      {/* 1. LEFT SIDEBAR (COLLAPSIBLE DEDICATED NORMAS SIDEBAR) */}
      <aside className={`w-full ${isSidebarCollapsed ? 'lg:w-20 p-3' : 'lg:w-64 p-5'} bg-white border-r border-slate-200/90 flex-shrink-0 flex flex-col justify-between space-y-6 transition-all duration-300 relative`}>
        <div>
          {/* Logo Header & Collapse Toggle */}
          <div className="flex items-center justify-between gap-2 px-1 py-1 mb-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white shadow-md shadow-slate-900/10 flex-shrink-0">
                <Sparkles size={20} className="text-teal-400" />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <span className="text-base font-black tracking-tight text-slate-900 block leading-tight truncate">CTVacinas</span>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100/80">
                    Regulatório
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              title={isSidebarCollapsed ? "Expandir menu lateral" : "Minimizar menu lateral"}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition flex-shrink-0"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>
          </div>

          {/* Trocar Módulo option */}
          {onSwitchModule && (
            <button
              onClick={onSwitchModule}
              title="Trocar Módulo"
              className={`w-full mb-5 flex items-center ${isSidebarCollapsed ? 'justify-center p-2.5' : 'justify-between px-3 py-2'} rounded-xl text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-800 border border-slate-200 hover:border-teal-200 transition active:scale-95`}
            >
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-teal-600" />
                {!isSidebarCollapsed && <span>Trocar Módulo</span>}
              </div>
            </button>
          )}

          {/* Section 1: Normas Regulatórias */}
          <div className="space-y-1 mb-6">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                NORMAS REGULATÓRIAS
              </p>
            )}

            <button
              onClick={() => { setActiveNav('post_its'); setIsAdding(false); }}
              title="Post-its de Conhecimento"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'post_its'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${activeNav === 'post_its' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'} flex-shrink-0`}>
                <StickyNote size={16} />
              </div>
              {!isSidebarCollapsed && <span className="text-left flex-1 leading-tight">Post-its de Conhecimento</span>}
            </button>

            <button
              onClick={() => { setActiveNav('acervo'); setSelectedCategory('todas'); setIsAdding(false); }}
              title="Acervo de Normas"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'acervo'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${activeNav === 'acervo' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'} flex-shrink-0`}>
                <FileText size={16} />
              </div>
              {!isSidebarCollapsed && <span className="text-left flex-1 leading-tight">Acervo de Normas</span>}
            </button>

            <button
              onClick={() => { setActiveNav('favoritos'); setIsAdding(false); }}
              title="Favoritos"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-2xl text-xs font-extrabold transition-all text-left ${
                activeNav === 'favoritos'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-100 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${activeNav === 'favoritos' ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400'} flex-shrink-0`}>
                <Star size={16} />
              </div>
              {!isSidebarCollapsed && <span className="text-left flex-1 leading-tight">Favoritos</span>}
            </button>

            <button
              onClick={() => { setActiveNav('atualizacoes'); setIsAdding(false); }}
              title="Atualizações de Normas"
              className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3.5 py-2.5'} rounded-2xl text-xs font-extrabold transition-all text-left relative ${
                activeNav === 'atualizacoes'
                  ? 'bg-amber-50 text-amber-900 border border-amber-200 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className={`p-1.5 rounded-xl ${activeNav === 'atualizacoes' ? 'bg-amber-100 text-amber-700' : activeUpdateNotifications.length > 0 ? 'bg-amber-50 text-amber-600' : 'text-slate-400'} flex-shrink-0`}>
                <RefreshCw size={16} />
              </div>
              {!isSidebarCollapsed && (
                <>
                  <span className="text-left flex-1 leading-tight">Atualizações de Normas</span>
                  {activeUpdateNotifications.length > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-white shadow-2xs flex-shrink-0">
                      {activeUpdateNotifications.length}
                    </span>
                  ) : highlightedOneYearCount > 0 ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 flex-shrink-0">
                      {highlightedOneYearCount}
                    </span>
                  ) : null}
                </>
              )}
              {isSidebarCollapsed && activeUpdateNotifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* Section 2: Categorias Sidebar Links */}
          <div className="space-y-1">
            {!isSidebarCollapsed && (
              <p className="px-3 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                CATEGORIAS
              </p>
            )}

            {[
              { id: 'Boas Práticas', label: 'Boas Práticas', icon: FlaskConical, count: categoryCounts['Boas Práticas'] },
              { id: 'RDC', label: 'RDC', icon: FileText, count: categoryCounts['RDC'] },
              { id: 'Guias e Diretrizes', label: 'Guias e Diretrizes', icon: BookOpen, count: categoryCounts['Guias e Diretrizes'] },
              { id: 'Instruções Normativas', label: 'Instruções Normativas', icon: Layers, count: categoryCounts['Instruções Normativas'] },
              { id: 'Outros Documentos', label: 'Outros Documentos', icon: MoreHorizontal, count: categoryCounts['Outros Documentos'] }
            ].map((cat) => {
              const CatIcon = cat.icon;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  title={cat.label}
                  onClick={() => {
                    setSelectedCategory(isSelected ? 'todas' : cat.id);
                    if (activeNav === 'post_its') setActiveNav('acervo');
                    setIsAdding(false);
                  }}
                  className={`w-full flex items-center ${isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3.5 py-2'} rounded-2xl text-xs font-bold transition-all text-left ${
                    isSelected 
                      ? 'bg-teal-50 text-teal-800 font-black border border-teal-100' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate min-w-0 flex-1">
                    <CatIcon size={15} className={`flex-shrink-0 ${isSelected ? 'text-teal-600' : 'text-slate-400'}`} />
                    {!isSidebarCollapsed && <span className="truncate text-left flex-1">{cat.label}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border flex-shrink-0 ml-1 ${
                      isSelected ? 'bg-teal-100 text-teal-800 border-teal-200' : 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    }`}>
                      {cat.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Help Box */}
        {!isSidebarCollapsed ? (
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <HelpCircle size={15} className="text-teal-600" />
                Precisa de ajuda?
              </span>
              <ChevronRight size={14} className="text-slate-400" />
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Acesse o guia rápido do módulo</p>
          </div>
        ) : (
          <div className="flex justify-center p-2" title="Precisa de ajuda?">
            <HelpCircle size={18} className="text-teal-600" />
          </div>
        )}
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 sm:p-6 space-y-4 max-w-7xl">
        
        {/* Header Banner matching mockup image */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100 shadow-xs flex-shrink-0">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Gestão de Normas Regulatórias
              </h1>
              <p className="text-slate-500 text-xs font-medium">
                Consulte o acervo normativo e explore os Post-its de Conhecimento embasados em evidências regulatórias.
              </p>
            </div>
          </div>

          <button
            onClick={() => { setIsAdding(true); setEditingId(null); resetForm(); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white rounded-xl font-black text-xs uppercase tracking-wider transition-all shadow-md shadow-teal-900/10 active:scale-95 flex-shrink-0"
          >
            <Plus size={15} /> Nova Norma
          </button>
        </div>



        {/* NOTIFICAÇÕES DE ATUALIZAÇÕES DE NORMAS (7 DIAS OU ATÉ O USUÁRIO APAGAR) */}
        {!isAdding && activeUpdateNotifications.length > 0 && (
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 shadow-xs space-y-3 animate-in fade-in duration-200">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200/80 shrink-0">
                  <BellRing size={16} />
                </div>
                <div>
                  <h2 className="text-xs font-black uppercase tracking-wider text-amber-950">
                    {activeUpdateNotifications.length === 1
                      ? '1 Norma Regulatória Atualizada Recentemente'
                      : `${activeUpdateNotifications.length} Normas Regulatórias Atualizadas Recentemente`}
                  </h2>
                  <p className="text-[11px] font-medium text-amber-800/90">
                    Aviso exibido por 7 dias após a atualização ou até você apagar a notificação.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {activeNav !== 'atualizacoes' && (
                  <button
                    type="button"
                    onClick={() => setActiveNav('atualizacoes')}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-amber-100/70 text-amber-900 border border-amber-200 text-[11px] font-bold transition"
                  >
                    Ver Atualizações
                  </button>
                )}
                {activeUpdateNotifications.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDismissAllUpdateNotifications}
                    className="px-3 py-1.5 rounded-xl bg-white/80 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                    title="Apagar todas as notificações de atualização"
                  >
                    <Trash2 size={12} /> Apagar todas
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              {activeUpdateNotifications.map(std => {
                const badge = getStatusBadge(std.status);
                const daysLeft = getDaysRemainingSevenDays(std.lastUpdatedAt);
                return (
                  <div
                    key={std.id}
                    className="bg-white rounded-xl border border-amber-200/80 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${badge.className}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs font-black text-slate-900 truncate">
                          {std.name}
                        </span>
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/70">
                          Atualizada em {formatDateBr(std.lastUpdatedAt)} • Expira em {daysLeft} {daysLeft === 1 ? 'dia' : 'dias'}
                        </span>
                      </div>
                      {std.updateSummary && (
                        <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                          {std.updateSummary}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setDetailedStandard(std)}
                        className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-100 text-[11px] font-bold transition flex items-center gap-1"
                      >
                        <Eye size={12} /> Ver
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDismissUpdateNotification(std, e)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-[11px] font-bold transition flex items-center gap-1"
                        title="Apagar esta notificação"
                      >
                        <X size={12} /> Apagar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        {!isAdding && activeNav !== 'post_its' && activeNav !== 'atualizacoes' && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, tema, resumo ou palavras-chave..."
                className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
              />
            </div>

            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="px-4 py-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-extrabold text-slate-700 cursor-pointer"
            >
              <option value="todos">Todos os tipos</option>
              <option value="ICH">ICH</option>
              <option value="RDC">RDC</option>
              <option value="Guia">Guia</option>
              <option value="Instrução Normativa">Instrução Normativa</option>
              <option value="Farmacopeia">Farmacopeia</option>
              <option value="Manual">Manual / Outros</option>
            </select>

            <button
              onClick={() => { setSearchTerm(''); setSelectedType('todos'); setSelectedCategory('todas'); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl border border-slate-200/80 bg-white shadow-xs hover:bg-slate-50 text-xs font-extrabold text-slate-700 transition"
            >
              <SlidersHorizontal size={15} /> Filtros
            </button>
          </div>
        )}

        {/* 3. NEW / EDIT NORMA FORM */}
        {isAdding ? (
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h2 className="font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 text-base">
                {editingId ? 'Editar Norma Regulatória' : 'Cadastrar Nova Norma Regulatória'}
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
                    placeholder="Ex: RDC Nº 658, de 30 de março de 2022"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Tipo da Norma</label>
                  <select 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium bg-white"
                  >
                    <option value="RDC">RDC</option>
                    <option value="Guia">Guia</option>
                    <option value="IN">Instrução Normativa (IN)</option>
                    <option value="ICH">ICH</option>
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
                    placeholder="Ex: Boas Práticas de Fabricação de Medicamentos"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status da Norma</label>
                  <select 
                    value={formData.status}
                    onChange={e => {
                      const nextStatus = e.target.value as RegulatoryStandardStatus;
                      setFormData({ ...formData, status: nextStatus });
                      if (editingId && (isRevokedStatus(nextStatus) || isAlteredStatus(nextStatus))) {
                        setRegisterAsUpdate(true);
                      }
                    }}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium bg-white"
                  >
                    {!registerAsUpdate && <option value="vigente">Vigente</option>}
                    <option value="vigente com alterações">Vigente com Alterações</option>
                    <option value="revogado">Revogado</option>
                  </select>
                </div>
              </div>

              {editingId && (
                <div className={`p-4 rounded-2xl border space-y-3 transition ${
                  registerAsUpdate
                    ? 'bg-amber-50/70 border-amber-300'
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={registerAsUpdate}
                        onChange={e => {
                          const checked = e.target.checked;
                          setRegisterAsUpdate(checked);
                          if (checked && !isRevokedStatus(formData.status) && !isAlteredStatus(formData.status)) {
                            setFormData(prev => ({ ...prev, status: 'vigente com alterações' }));
                          }
                        }}
                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
                      />
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <RefreshCw size={14} className="text-amber-600" />
                        Registrar como Atualização de Norma
                      </span>
                    </label>
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                      Notificação por 7 dias • Destaque por 1 ano
                    </span>
                  </div>

                  {registerAsUpdate && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Data da Atualização
                        </label>
                        <input
                          type="date"
                          value={updateDateInput}
                          onChange={e => setUpdateDateInput(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-amber-400/30"
                        />
                      </div>
                      <div className="md:col-span-2 space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                          Resumo da Atualização / Norma Substituta (opcional)
                        </label>
                        <input
                          type="text"
                          value={updateSummaryInput}
                          onChange={e => setUpdateSummaryInput(e.target.value)}
                          placeholder="Ex: Alterada pela RDC XXX/2026 ou revogada integralmente..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-amber-200 bg-white text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-amber-400/30"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Resumo das Diretrizes</label>
                <textarea 
                  required
                  rows={3}
                  value={formData.summary}
                  onChange={e => setFormData({...formData, summary: e.target.value})}
                  placeholder="Descreva os requisitos principais..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link do Documento Oficial</label>
                  <input 
                    type="url"
                    value={formData.documentLink || ''}
                    onChange={e => setFormData({...formData, documentLink: e.target.value})}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Link do Caderno NotebookLM</label>
                  <input 
                    type="url"
                    value={formData.notebookLMLink || ''}
                    onChange={e => setFormData({...formData, notebookLMLink: e.target.value})}
                    placeholder="https://notebooklm.google.com/..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => { setIsAdding(false); setEditingId(null); resetForm(); }}
                  className="px-6 py-2.5 border border-slate-200 text-slate-600 rounded-2xl font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex items-center gap-2 px-8 py-2.5 bg-teal-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-md hover:bg-teal-900 transition"
                >
                  <Save size={16} /> Salvar Norma
                </button>
              </div>
            </form>
          </div>
        ) : activeNav === 'post_its' ? (
          
          /* 4. POST-ITS DE CONHECIMENTO VIEW */
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  value={subjectSearchTerm}
                  onChange={e => setSubjectSearchTerm(e.target.value)}
                  placeholder="Buscar por Post-it/Conceito, Assunto, Bloco ou Norma..."
                  className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200/80 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                />
              </div>

              <button 
                onClick={() => setSubjectModal({ isOpen: true, name: '' })}
                className="flex items-center gap-2 px-5 py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-sm flex-shrink-0"
              >
                <FolderPlus size={16} /> Novo Assunto
              </button>
            </div>

            {/* Render Subjects Hierarchy */}
            <div className="space-y-6">
              {filteredSubjects.map(subject => {
                const isExpanded = !!expandedSubjectIds[subject.id];
                const totalConceptsCount = subject.blocks.reduce((acc, b) => acc + getBlockConcepts(b, standards).length, 0);

                return (
                  <div key={subject.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div 
                      onClick={() => setExpandedSubjectIds(prev => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                      className="p-5 flex items-center justify-between cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition border-b border-slate-100"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl border border-teal-100">
                          <Folder size={22} />
                        </div>
                        <div className="truncate">
                          <h3 className="text-base font-black text-slate-900 uppercase tracking-tight">{subject.name}</h3>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-[10px] font-black text-teal-800 uppercase bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                              {subject.blocks.length} {subject.blocks.length === 1 ? 'Bloco' : 'Blocos'}
                            </span>
                            <span className="text-[10px] font-black text-amber-800 uppercase bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200/60 flex items-center gap-1">
                              <StickyNote size={11} /> {totalConceptsCount} Post-its
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        <button 
                          onClick={() => setSubjectModal({ isOpen: true, subjectId: subject.id, name: subject.name })}
                          className="p-2 text-slate-400 hover:text-teal-600 hover:bg-white rounded-xl transition"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button 
                          onClick={(e) => handleDeleteSubject(subject.id, e)}
                          className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition"
                        >
                          <Trash2 size={15} />
                        </button>
                        <button 
                          onClick={() => setBlockModal({ isOpen: true, subjectId: subject.id, name: '' })}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-teal-700 bg-teal-50 hover:bg-teal-100/80 rounded-xl text-[10px] font-black uppercase tracking-wider transition border border-teal-100"
                        >
                          <Plus size={13} /> Bloco
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button 
                          onClick={() => setExpandedSubjectIds(prev => ({ ...prev, [subject.id]: !prev[subject.id] }))}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-xl transition"
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="p-6 bg-slate-50/30 space-y-6">
                        {subject.blocks.map(block => {
                          const blockKey = `${subject.id}-${block.id}`;
                          const isBlockCollapsed = !!collapsedBlockIds[blockKey];
                          const concepts = getBlockConcepts(block, standards);

                          return (
                            <div key={block.id} className="border border-slate-200/80 rounded-2xl bg-white shadow-xs overflow-hidden">
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
                                </div>

                                <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                  <button 
                                    onClick={() => setBlockModal({ isOpen: true, subjectId: subject.id, blockId: block.id, name: block.name })}
                                    className="p-1.5 text-slate-400 hover:text-teal-600 rounded-lg hover:bg-white transition"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteBlock(subject.id, block.id)}
                                    className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-white transition"
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
                                      centralIdeas: [''], 
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

                              {!isBlockCollapsed && (
                                <div className="p-5">
                                  {concepts.length === 0 ? (
                                    <p className="text-xs text-slate-400 text-center py-6">Nenhum post-it cadastrado neste bloco.</p>
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
                                            className={`rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative ${theme.cardBg}`}
                                          >
                                            <div>
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
                                                      centralIdeas: getConceptCentralIdeas(concept),
                                                      observations: concept.observations || '',
                                                      color: concept.color || 'yellow',
                                                      linkedStandards: concept.linkedStandards && concept.linkedStandards.length > 0 
                                                        ? concept.linkedStandards 
                                                        : [{ standardId: '', relevantPassages: '', page: '', section: '' }]
                                                    })}
                                                    className="p-1 text-slate-400 hover:text-slate-800 rounded transition"
                                                  >
                                                    <Edit2 size={13} />
                                                  </button>
                                                  <button 
                                                    onClick={(e) => handleDeleteConcept(subject.id, block.id, concept.id, e)}
                                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                                  >
                                                    <Trash2 size={13} />
                                                  </button>
                                                </div>
                                              </div>

                                              <h5 className="text-sm font-black text-slate-900 uppercase tracking-tight mb-2">
                                                {concept.title}
                                              </h5>

                                              <p className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-3">
                                                {concept.centralIdea}
                                              </p>
                                            </div>

                                            <div className="pt-3 border-t border-black/5 flex items-center justify-between mt-3">
                                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${theme.badgeBg}`}>
                                                <ShieldCheck size={12} />
                                                {concept.linkedStandards.length} {concept.linkedStandards.length === 1 ? 'Evidência' : 'Evidências'}
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
                );
              })}
            </div>
          </div>
        ) : activeNav === 'atualizacoes' ? (
          /* 4.5 ATUALIZAÇÕES DE NORMAS VIEW */
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Indicadores */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-700">Notificações (7 dias)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{activeUpdateNotifications.length}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Ativas para você</p>
              </div>
              <div className="bg-white rounded-2xl border border-teal-200/80 p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-teal-700">Em Destaque (1 ano)</p>
                <p className="text-2xl font-black text-slate-900 mt-1">{highlightedOneYearCount}</p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Destacadas no acervo</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-800">Vigente c/ Alterações</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {updatedStandardsList.filter(s => isAlteredStatus(s.status)).length}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Normas revisadas</p>
              </div>
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-700">Revogadas</p>
                <p className="text-2xl font-black text-slate-900 mt-1">
                  {updatedStandardsList.filter(s => isRevokedStatus(s.status)).length}
                </p>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">Substituídas / encerradas</p>
              </div>
            </div>

            {/* Ação rápida: registrar atualização em qualquer norma existente */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5 shrink-0">
                  <RefreshCw size={14} className="text-amber-600" />
                  Registrar atualização:
                </span>
                <select
                  value={quickUpdateTargetId}
                  onChange={e => setQuickUpdateTargetId(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500/20"
                >
                  <option value="">Selecione uma norma do acervo para atualizar...</option>
                  {standards.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                disabled={!quickUpdateTargetId}
                onClick={() => {
                  const target = standards.find(s => s.id === quickUpdateTargetId);
                  if (target) {
                    startEdit(target, true);
                    setQuickUpdateTargetId('');
                  }
                }}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-white text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <RefreshCw size={14} /> Atualizar Norma
              </button>
            </div>

            {/* Busca + Filtros da aba de atualizações */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'todas', label: `Todas (${updatedStandardsList.length})` },
                  { id: 'destaque_1_ano', label: `Em destaque 1 ano (${highlightedOneYearCount})` },
                  { id: 'vigente_alteracoes', label: 'Vigente com Alterações' },
                  { id: 'revogado', label: 'Revogado' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setUpdatesFilter(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                      updatesFilter === tab.id
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filtrar normas atualizadas..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>

            {/* Lista de normas atualizadas */}
            {filteredUpdatedStandards.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-10 text-center space-y-2">
                <RefreshCw size={32} className="text-slate-300 mx-auto" />
                <p className="text-xs font-black uppercase tracking-wider text-slate-500">
                  Nenhuma atualização de norma registrada neste filtro
                </p>
                <p className="text-xs text-slate-400">
                  Selecione uma norma acima ou clique no ícone de atualização em qualquer norma do acervo.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUpdatedStandards.map(std => {
                  const statusBadge = getStatusBadge(std.status);
                  const isHighlighted = isHighlightedOneYear(std.lastUpdatedAt);
                  const isRevoked = isRevokedStatus(std.status);
                  const hasActiveNotif =
                    isWithinSevenDays(std.lastUpdatedAt) &&
                    !(std.dismissedNotificationUsers || []).includes(currentUserKey);

                  return (
                    <div
                      key={std.id}
                      onClick={() => setDetailedStandard(std)}
                      className={`p-5 rounded-3xl border shadow-xs hover:shadow-md transition cursor-pointer flex flex-col gap-3 ${
                        isHighlighted
                          ? isRevoked
                            ? 'bg-gradient-to-br from-rose-50/50 via-white to-white border-rose-300 ring-1 ring-rose-200/70'
                            : 'bg-gradient-to-br from-amber-50/60 via-white to-white border-amber-300 ring-1 ring-amber-200/70'
                          : 'bg-white border-slate-200/80'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusBadge.className}`}>
                              {statusBadge.label}
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                              {std.type}
                            </span>
                            {isHighlighted && (
                              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white flex items-center gap-1">
                                <Sparkles size={10} /> Atualizada • Destaque até {getHighlightExpiryBr(std.lastUpdatedAt)}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight">
                            {std.name}
                          </h4>
                          <p className="text-xs text-slate-600 font-medium">
                            {std.updateSummary || std.theme || std.summary}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                          {hasActiveNotif && (
                            <button
                              type="button"
                              onClick={(e) => handleDismissUpdateNotification(std, e)}
                              className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 text-[11px] font-bold transition flex items-center gap-1"
                              title="Apagar notificação de 7 dias"
                            >
                              <X size={12} /> Apagar aviso
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => startEdit(std, true)}
                            className="px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <RefreshCw size={12} /> Atualizar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDetailedStandard(std)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Eye size={12} /> Detalhes
                          </button>
                        </div>
                      </div>

                      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-semibold">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} className="text-amber-600" />
                            Atualizada em: <strong className="text-slate-700">{formatDateBr(std.lastUpdatedAt)}</strong>
                          </span>
                          {std.updatedBy && (
                            <span>
                              Por: <strong className="text-slate-700">{std.updatedBy}</strong>
                            </span>
                          )}
                          {std.previousStatus && (
                            <span>
                              Status anterior: <strong className="text-slate-700">{getStatusBadge(std.previousStatus).label}</strong>
                            </span>
                          )}
                        </div>
                        {std.documentLink && (
                          <a
                            href={std.documentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-teal-700 hover:underline flex items-center gap-1 text-[10px] font-black uppercase"
                          >
                            Documento <ExternalLink size={10} />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          
          /* 5. VISÃO GERAL & ACERVO LAYOUT (MATCHING MOCKUP IMAGE) */
          <div className="space-y-8">
            
            {/* FAVORITOS SECTION (Horizontal row matching image mockup) */}
            {favoritesList.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Favoritos</h3>
                  <button 
                    onClick={() => setActiveNav('favoritos')} 
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 transition"
                  >
                    Ver todos <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {favoritesList.slice(0, 4).map(std => {
                    const isFav = favoriteIds.includes(std.id);
                    const isBook = std.type === 'Guia' || std.name.toLowerCase().includes('guia');

                    return (
                      <div 
                        key={std.id}
                        onClick={() => setDetailedStandard(std)}
                        className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100/80 flex-shrink-0">
                            {isBook ? <BookOpen size={18} /> : <ShieldCheck size={18} />}
                          </div>
                          <span className="text-xs font-black text-slate-800 group-hover:text-teal-700 transition truncate">
                            {std.name.split(',')[0]}
                          </span>
                        </div>

                        <button 
                          onClick={(e) => toggleFavorite(std.id, e)}
                          className="p-1.5 text-slate-300 hover:text-amber-400 transition"
                        >
                          <Star size={16} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* NORMAS RECENTES GRID (FULL WIDTH) */}
            <div className="space-y-4">
              
              {/* Header row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-slate-900 tracking-tight">Normas recentes</h3>
                  <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    {filteredStandards.length} resultados
                  </span>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                    <span>Ordenar por:</span>
                    <select 
                      value={sortBy}
                      onChange={e => setSortBy(e.target.value as any)}
                      className="bg-transparent font-black text-slate-800 outline-none cursor-pointer"
                    >
                      <option value="recentes">Mais recentes</option>
                      <option value="nome">Nome</option>
                      <option value="status">Status</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button 
                      onClick={() => setViewLayout('grid')}
                      className={`p-1.5 rounded-lg transition ${viewLayout === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                    >
                      <Grid size={15} />
                    </button>
                    <button 
                      onClick={() => setViewLayout('list')}
                      className={`p-1.5 rounded-lg transition ${viewLayout === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400'}`}
                    >
                      <List size={15} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cards Grid */}
              <div className={viewLayout === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-3"}>
                  {filteredStandards.map(std => {
                    const statusBadge = getStatusBadge(std.status);
                    const isFav = favoriteIds.includes(std.id);
                    const dateStr = extractDateFromName(std.name);
                    const isHighlighted = isHighlightedOneYear(std.lastUpdatedAt);
                    const isRevoked = isRevokedStatus(std.status);

                    return (
                      <div 
                        key={std.id}
                        onClick={() => setDetailedStandard(std)}
                        className={`p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group relative ${
                          isHighlighted
                            ? isRevoked
                              ? 'bg-gradient-to-br from-rose-50/50 via-white to-white border-rose-300 ring-1 ring-rose-200/80'
                              : 'bg-gradient-to-br from-amber-50/60 via-white to-white border-amber-300 ring-1 ring-amber-200/80'
                            : 'bg-white border-slate-200/80'
                        }`}
                      >
                        <div>
                          {/* Destaque de 1 ano para norma atualizada */}
                          {isHighlighted && (
                            <div className={`mb-2.5 px-2.5 py-1 rounded-xl border flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-wider ${
                              isRevoked
                                ? 'bg-rose-100/80 border-rose-200 text-rose-800'
                                : 'bg-amber-100/80 border-amber-200 text-amber-900'
                            }`}>
                              <span className="flex items-center gap-1">
                                <RefreshCw size={11} /> Norma Atualizada ({formatDateBr(std.lastUpdatedAt)})
                              </span>
                              <span className="text-[9px] opacity-80">até {getHighlightExpiryBr(std.lastUpdatedAt)}</span>
                            </div>
                          )}

                          {/* Top Badge Row */}
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${statusBadge.className}`}>
                                {statusBadge.label}
                              </span>
                              <span className="text-[9px] font-black uppercase tracking-wider text-slate-500">
                                {std.type}
                              </span>
                            </div>

                            <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                              <button 
                                onClick={(e) => toggleFavorite(std.id, e)}
                                className="p-1 text-slate-300 hover:text-amber-400 transition"
                                title="Favoritar"
                              >
                                <Star size={16} className={isFav ? "fill-amber-400 text-amber-400" : ""} />
                              </button>
                              <button 
                                onClick={() => startEdit(std, true)}
                                className="p-1 text-slate-300 hover:text-amber-600 transition"
                                title="Registrar atualização da norma (Revogado ou Vigente com Alterações)"
                              >
                                <RefreshCw size={14} />
                              </button>
                              <button 
                                onClick={() => startEdit(std, false)}
                                className="p-1 text-slate-300 hover:text-teal-700 transition"
                                title="Editar norma"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button 
                                onClick={() => onDeleteStandard(std.id)}
                                className="p-1 text-slate-300 hover:text-red-500 transition"
                                title="Excluir norma"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Title */}
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight group-hover:text-teal-800 transition line-clamp-2 mb-2">
                            {std.name}
                          </h4>

                          {/* Summary */}
                          <p className="text-xs text-slate-500 font-medium leading-relaxed line-clamp-2 mb-4">
                            {std.updateSummary && isHighlighted ? std.updateSummary : (std.theme || std.summary)}
                          </p>
                        </div>

                        {/* Footer Date */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-bold">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={13} />
                            <span>{dateStr}</span>
                          </div>

                          {std.documentLink && (
                            <a 
                              href={std.documentLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={e => e.stopPropagation()}
                              className="text-teal-700 hover:underline flex items-center gap-1 text-[10px] font-black uppercase"
                            >
                              PDF <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  {filteredStandards.length === 0 && (
                    <div className="col-span-full py-12 text-center bg-white rounded-3xl border border-slate-200/80 p-6 space-y-2">
                      <ShieldCheck size={32} className="text-slate-300 mx-auto" />
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Nenhuma norma encontrada</p>
                      <p className="text-slate-400 text-xs">Tente ajustar os filtros ou o termo de busca.</p>
                    </div>
                  )}
                </div>

              </div>

          </div>
        )}

      </main>

      {/* MODALS */}

      {/* 1. SUBJECT MODAL */}
      {subjectModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">
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
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
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
                  className="px-6 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 uppercase tracking-wider rounded-lg transition shadow-sm"
                >
                  {subjectModal.subjectId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. BLOCK MODAL */}
      {blockModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">
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
                  placeholder="Ex: Estudo de Segurança, Estudo de Estabilidade..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
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
                  className="px-6 py-2 text-xs font-bold text-white bg-teal-700 hover:bg-teal-800 uppercase tracking-wider rounded-lg transition shadow-sm"
                >
                  {blockModal.blockId ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. POST-IT MODAL */}
      {conceptModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tight text-sm">
                {conceptModal.conceptId ? 'Editar Post-it de Conhecimento' : 'Novo Post-it de Conhecimento'}
              </h3>
              <button onClick={() => setConceptModal(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConcept} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Título do Conceito / Termo</label>
                <input
                  required
                  value={conceptModal.title}
                  onChange={e => setConceptModal({ ...conceptModal, title: e.target.value })}
                  placeholder="Ex: Toxicidade Local, Potência, Estabilidade..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ideia Central (Resumo)</label>
                <textarea
                  required
                  rows={3}
                  value={conceptModal.centralIdeas[0] || ''}
                  onChange={e => setConceptModal({ ...conceptModal, centralIdeas: [e.target.value] })}
                  placeholder="Descreva brevemente o conceito regulatório..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition outline-none text-xs font-medium resize-none"
                />
              </div>

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
                  className="px-8 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 uppercase tracking-wider rounded-xl transition shadow-sm"
                >
                  <Save size={14} /> Salvar Post-it
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DETAILED STANDARD VIEW MODAL */}
      {detailedStandard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadge(detailedStandard.status).className}`}>
                    {getStatusBadge(detailedStandard.status).label}
                  </span>
                  <span className="text-[10px] font-black uppercase text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-100">
                    {detailedStandard.type}
                  </span>
                </div>
                <h3 className="text-base font-black text-slate-900 uppercase tracking-tight mt-1.5">
                  {detailedStandard.name}
                </h3>
              </div>
              <button onClick={() => setDetailedStandard(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full transition">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {isHighlightedOneYear(detailedStandard.lastUpdatedAt) && (
                <div className={`p-4 rounded-2xl border space-y-1.5 ${
                  isRevokedStatus(detailedStandard.status)
                    ? 'bg-rose-50/80 border-rose-200 text-rose-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-950'
                }`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <RefreshCw size={13} /> Norma Atualizada em {formatDateBr(detailedStandard.lastUpdatedAt)}
                    </span>
                    <span className="text-[10px] font-bold opacity-85">
                      Em destaque por 1 ano (até {getHighlightExpiryBr(detailedStandard.lastUpdatedAt)})
                    </span>
                  </div>
                  {detailedStandard.updateSummary && (
                    <p className="text-xs font-medium">{detailedStandard.updateSummary}</p>
                  )}
                  {detailedStandard.updatedBy && (
                    <p className="text-[11px] opacity-80">Registrado por: {detailedStandard.updatedBy}</p>
                  )}
                </div>
              )}

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tema / Assunto Geral:</span>
                <p className="text-xs font-bold text-teal-800 uppercase">{detailedStandard.theme}</p>
              </div>

              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Resumo / Diretrizes:</span>
                <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  {detailedStandard.summary}
                </p>
              </div>

              {detailedStandard.updateHistory && detailedStandard.updateHistory.length > 0 && (
                <div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1">
                    <History size={12} /> Histórico de Atualizações
                  </span>
                  <div className="space-y-2">
                    {detailedStandard.updateHistory.map(entry => (
                      <div key={entry.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadge(entry.newStatus).className}`}>
                            {getStatusBadge(entry.newStatus).label}
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">
                            {formatDateBr(entry.date)} • {entry.updatedBy}
                          </span>
                        </div>
                        {entry.summary && <p className="text-slate-700 font-medium">{entry.summary}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detailedStandard.documentLink && (
                <div className="pt-2">
                  <a 
                    href={detailedStandard.documentLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-50 text-teal-800 hover:bg-teal-100 rounded-xl text-xs font-bold transition border border-teal-100"
                  >
                    <FileText size={14} /> Acessar Documento Oficial <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const target = detailedStandard;
                  setDetailedStandard(null);
                  startEdit(target, true);
                }}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl font-bold uppercase text-xs tracking-wider transition flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Registrar Atualização
              </button>
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
