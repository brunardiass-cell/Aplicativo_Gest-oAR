import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { 
  Project, 
  Task, 
  RegulatoryEvidence, 
  MacroActivityConfig, 
  RegulatoryInfoItem, 
  RepeatableRecord, 
  RegulatoryNarrative, 
  RegulatoryDocument, 
  RegulatoryDocumentChapter, 
  RegulatoryDocumentItem,
  RegulatoryDocItemType,
  RegulatoryDocItemStatus,
  RegulatoryDocumentVersion,
  RegulatoryItemResource,
  RegulatoryResourceType,
  KnowledgeCategory,
  RegulatoryKnowledgeRecord,
  RegulatoryStructuredTable,
  RegulatoryMarkerMapping
} from '../types';
import { 
  FileText, 
  BookOpen, 
  Database, 
  ShieldCheck, 
  FileCheck2, 
  Layers, 
  Plus, 
  Edit3, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Paperclip, 
  History, 
  Settings, 
  Tag, 
  Check, 
  X, 
  FileSpreadsheet, 
  ListOrdered,
  Eye,
  FileCode,
  ListPlus,
  ExternalLink,
  ArrowRight,
  Info,
  CheckCircle,
  FolderTree,
  Table as TableIcon,
  FilePlus,
  AlertTriangle,
  CheckSquare,
  XCircle,
  HelpCircle,
  Grid,
  Link as LinkIcon,
  Maximize2,
  RefreshCw,
  Upload,
  Layers3,
  Copy,
  Sliders,
  Send,
  FileUp,
  FileText as FileTextIcon,
  ListCheck,
  FolderPlus,
  ArrowLeft
} from 'lucide-react';

interface RegulatoryDocManagementProps {
  projects: Project[];
  tasks: Task[];
  regulatoryEvidence: RegulatoryEvidence[];
  macroActivityConfigs: MacroActivityConfig[];
  regulatoryInfoItems: RegulatoryInfoItem[];
  repeatableRecords: RepeatableRecord[];
  regulatoryNarratives: RegulatoryNarrative[];
  regulatoryDocs: RegulatoryDocument[];
  
  onUpdateEvidence: (items: RegulatoryEvidence[]) => void;
  onUpdateMacroConfigs: (configs: MacroActivityConfig[]) => void;
  onUpdateInfoItems: (items: RegulatoryInfoItem[]) => void;
  onUpdateRepeatableRecords: (records: RepeatableRecord[]) => void;
  onUpdateNarratives: (narratives: RegulatoryNarrative[]) => void;
  onUpdateDocs: (docs: RegulatoryDocument[]) => void;
  currentUser?: string;
  hasAdminAccess?: boolean;
  selectedProjectId?: string;
}

export const RegulatoryDocManagement: React.FC<RegulatoryDocManagementProps> = ({
  projects,
  tasks,
  regulatoryEvidence = [],
  macroActivityConfigs = [],
  regulatoryInfoItems = [],
  repeatableRecords = [],
  regulatoryNarratives = [],
  regulatoryDocs = [],
  onUpdateEvidence,
  onUpdateMacroConfigs,
  onUpdateInfoItems,
  onUpdateRepeatableRecords,
  onUpdateNarratives,
  onUpdateDocs,
  currentUser = 'Usuário',
  hasAdminAccess = true,
  selectedProjectId: initialSelectedProjectId
}) => {
  // Navigation Tabs
  const [activeTab, setActiveTab] = useState<
    'dossier_viewer' | 'pending_contributions' | 'template_manager' | 'tables_and_attachments' | 'export_and_traceability'
  >('dossier_viewer');

  // Selected Project Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    initialSelectedProjectId || (projects.length > 0 ? projects[0].id : 'all')
  );

  React.useEffect(() => {
    if (initialSelectedProjectId) {
      setSelectedProjectId(initialSelectedProjectId);
    }
  }, [initialSelectedProjectId]);

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Selected Document ID in Dossier Viewer
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  // Search Query Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Chapter Accordion State
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'cap_1': true,
    'cap_2': true,
    'cap_3': true,
    'cap_ifa_1': true,
    'cap_adj_1': true,
    'cap_ib_1': true,
    'cap_deec_1': true,
    'cap_ddcm_1': true
  });

  // Groups for Models / Document Templates
  const [modelGroups, setModelGroups] = useState<string[]>([
    'Dossiê do IFA - Proteína Recombinante',
    'Dossiê do IFA - Proteína Recombinante Liofilizada',
    'Dossiê da Vacina com Adjuvante',
    'Dossiês Clínicos e Brochuras',
    'Outros Grupos'
  ]);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');

  // Selected item state for fill / edit modal
  const [selectedItemForFill, setSelectedItemForFill] = useState<{
    doc: RegulatoryDocument;
    chapter: RegulatoryDocumentChapter;
    item: RegulatoryDocumentItem;
  } | null>(null);

  // Fill Modal Form State
  const [fillValue, setFillValue] = useState('');
  const [fillEvidenceUrl, setFillEvidenceUrl] = useState('');
  const [fillEvidenceFileName, setFillEvidenceFileName] = useState('');
  const [fillNotes, setFillNotes] = useState('');

  // Pending Contribution Drawer/Modal State (Multi-step with individual per-marker inputs)
  const [activeContribution, setActiveContribution] = useState<any | null>(null);
  const [contributionStep, setContributionStep] = useState<1 | 2>(1);
  const [selectedMarkersForContribution, setSelectedMarkersForContribution] = useState<string[]>([]);
  // Individual values typed per selected marker
  const [markerTypedValues, setMarkerTypedValues] = useState<Record<string, string>>({});

  // Conflict Resolution Modal State
  const [conflictModalData, setConflictModalData] = useState<{
    marker: string;
    itemName: string;
    currentValue: string;
    currentOrigin: string;
    newValue: string;
    newOrigin: string;
    targetDocIds: string[];
  } | null>(null);

  // Import Word Template Modal State
  const [showImportTemplateModal, setShowImportTemplateModal] = useState(false);
  const [templateTitle, setTemplateTitle] = useState('');
  const [templateType, setTemplateType] = useState('Dossiê Regulatório');
  const [templateGroup, setTemplateGroup] = useState('Dossiê da Vacina com Adjuvante');
  const [templateDescription, setTemplateDescription] = useState('');
  const [templateText, setTemplateText] = useState('');

  // Independent Structured Tables State
  const [structuredTables, setStructuredTables] = useState<RegulatoryStructuredTable[]>([
    {
      id: 'table_presentations',
      projectId: activeProject?.id || 'p1',
      key: 'TABLE_PRESENTATIONS',
      title: 'Tabela de Apresentações e Embalagem Primária',
      description: 'Apresentações comerciais, volumes de dose, tipo de vidro e embalagem primária',
      columns: [
        { key: 'apresentacao', label: 'Apresentação', type: 'text' },
        { key: 'dose', label: 'Dose (µg)', type: 'number' },
        { key: 'volume', label: 'Volume (mL)', type: 'number' },
        { key: 'embalagem', label: 'Tipo de Embalagem', type: 'text' },
        { key: 'num_doses', label: 'Nº Doses / Frasco', type: 'number' }
      ],
      rows: [
        { apresentacao: 'Frasco Multidose Líquido', dose: 25, volume: 2.5, embalagem: 'Vidro Tipo I de 5mL', num_doses: 5 },
        { apresentacao: 'Monodose Seringa Pré-enchida', dose: 25, volume: 0.5, embalagem: 'Seringa Luer Lock 1mL', num_doses: 1 }
      ],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'table_batches',
      projectId: activeProject?.id || 'p1',
      key: 'TABLE_BATCHES',
      title: 'Tabela de Controle de Lotes Produzidos',
      description: 'Mapeamento de lotes fabricados, escala, rendimento e laudos de liberação',
      columns: [
        { key: 'lote', label: 'Número do Lote', type: 'text' },
        { key: 'data_prod', label: 'Data Fabricação', type: 'date' },
        { key: 'escala', label: 'Escala (L)', type: 'number' },
        { key: 'pureza', label: 'Pureza HPLC (%)', type: 'text' },
        { key: 'status_qc', label: 'Status QC', type: 'text' }
      ],
      rows: [
        { lote: 'LOTE-PILOTO-001', data_prod: '2026-03-15', escala: 10, pureza: '98.5%', status_qc: 'Aprovado' },
        { lote: 'LOTE-PILOTO-002', data_prod: '2026-06-20', escala: 50, pureza: '99.1%', status_qc: 'Aprovado' }
      ],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'table_stability',
      projectId: activeProject?.id || 'p1',
      key: 'TABLE_STABILITY_SUMMARY',
      title: 'Tabela de Resumo dos Estudos de Estabilidade',
      description: 'Lotes testados, condições de temperatura, tempo e resultados',
      columns: [
        { key: 'lote', label: 'Lote Testado', type: 'text' },
        { key: 'condicao', label: 'Condição de Temperatura', type: 'text' },
        { key: 'tempo', label: 'Tempo (Meses)', type: 'number' },
        { key: 'resultado', label: 'Conclusão de Potência', type: 'text' }
      ],
      rows: [
        { lote: 'LOTE-PILOTO-001', condicao: '2°C a 8°C (Longa Duração)', tempo: 24, resultado: 'Dentro das especificações (>95%)' },
        { lote: 'LOTE-PILOTO-001', condicao: '25°C / 60% UR (Acelerado)', tempo: 6, resultado: 'Conforme especificação' }
      ],
      updatedAt: new Date().toISOString()
    }
  ]);

  // Pre-existing Table Templates / Models for Table Creation
  const tableTemplates = [
    {
      key: 'TABLE_PRESENTATIONS',
      title: 'Modelo: Apresentações e Embalagem Primária',
      description: 'Doses, volumes, tipos de frasco e seringas',
      columns: [
        { key: 'apresentacao', label: 'Apresentação', type: 'text' as const },
        { key: 'dose', label: 'Dose (µg)', type: 'number' as const },
        { key: 'volume', label: 'Volume (mL)', type: 'number' as const },
        { key: 'embalagem', label: 'Tipo de Embalagem', type: 'text' as const },
        { key: 'num_doses', label: 'Nº Doses / Frasco', type: 'number' as const }
      ]
    },
    {
      key: 'TABLE_BATCHES',
      title: 'Modelo: Controle de Lotes Produzidos',
      description: 'Rastreabilidade de lotes, datas, rendimento e laudos',
      columns: [
        { key: 'lote', label: 'Número do Lote', type: 'text' as const },
        { key: 'data_prod', label: 'Data Fabricação', type: 'date' as const },
        { key: 'escala', label: 'Escala (L)', type: 'number' as const },
        { key: 'pureza', label: 'Pureza (%)', type: 'text' as const },
        { key: 'status_qc', label: 'Status QC', type: 'text' as const }
      ]
    },
    {
      key: 'TABLE_STABILITY_SUMMARY',
      title: 'Modelo: Resumo de Estabilidade e Validade',
      description: 'Estudos de estabilidade acelerada e de longa duração',
      columns: [
        { key: 'lote', label: 'Lote Testado', type: 'text' as const },
        { key: 'condicao', label: 'Condição de Temperatura', type: 'text' as const },
        { key: 'tempo', label: 'Tempo (Meses)', type: 'number' as const },
        { key: 'resultado', label: 'Conclusão de Potência', type: 'text' as const }
      ]
    },
    {
      key: 'TABLE_ADJUVANTS',
      title: 'Modelo: Composição de Adjuvantes e Tampões',
      description: 'Concentração de lipídios, sais e tensoativos',
      columns: [
        { key: 'componente', label: 'Componente / Reagente', type: 'text' as const },
        { key: 'funcao', label: 'Função na Formulação', type: 'text' as const },
        { key: 'concentracao', label: 'Concentração (mg/mL)', type: 'text' as const },
        { key: 'grau', label: 'Grau de Injetabilidade', type: 'text' as const }
      ]
    }
  ];

  // Table Modal State
  const [showTableModal, setShowTableModal] = useState(false);
  const [editingTable, setEditingTable] = useState<RegulatoryStructuredTable | null>(null);
  const [tableTitleInput, setTableTitleInput] = useState('');
  const [tableKeyInput, setTableKeyInput] = useState('');
  const [tableDescInput, setTableDescInput] = useState('');
  const [tableColsInput, setTableColsInput] = useState<{ key: string; label: string; type: 'text' | 'number' | 'date' }[]>([]);
  const [tableRowsInput, setTableRowsInput] = useState<Record<string, any>[]>([]);

  // Default Presets for Regulatory Document Templates Grouped
  const defaultDocs = useMemo<RegulatoryDocument[]>(() => {
    if (regulatoryDocs.length > 0) return regulatoryDocs;
    
    return projects.map(proj => [
      {
        id: `doc_vacina_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê da Vacina com Adjuvante',
        type: 'Dossiê do Produto Final',
        group: 'Dossiê da Vacina com Adjuvante',
        description: 'Dossiê regulatório com dados clínicos, estabilidade e formulação do produto acabado.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        versionHistory: [
          { version: '0.1', date: new Date().toISOString(), status: 'Rascunho', author: currentUser, notes: 'Estruturação inicial do documento' }
        ],
        chapters: [
          {
            id: 'cap_1',
            code: '1.0',
            title: '1. Introdução e Identificação do Produto',
            description: 'Visão geral da vacina, indicação, forma farmacêutica e apresentações',
            items: [
              { 
                id: 'item_1_1', 
                code: '1.1',
                name: 'Nome e Identificação da Vacina', 
                description: 'Denominação comercial e código de desenvolvimento técnico da vacina',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'PRODUCT.NAME', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[NOME DA VACINA]',
                value: 'Vacina Malária Recombinante - UniMaV-01'
              },
              { 
                id: 'item_1_2', 
                code: '1.2',
                name: 'Indicação Terapêutica / Alvo Clínico', 
                description: 'Detalhamento das populações de risco e patógeno alvo',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'PRODUCT.INDICATION', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[INDICAÇÃO]',
                value: 'Imunização ativa para prevenção da malária clínica por Plasmodium falciparum em indivíduos a partir de 2 anos de idade.'
              },
              { 
                id: 'item_1_3', 
                code: '1.3',
                name: 'Descrição da Forma Farmacêutica e Composição', 
                description: 'Propriedades organolépticas, IFA, adjuvantes e via de administração',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'PRODUCT.ADMINISTRATION_ROUTE', 
                status: 'Em preenchimento' as RegulatoryDocItemStatus, 
                marker: '[VIA DE ADM]',
                value: 'Intramuscular (IM), aplicada no músculo deltoide na dose de 0.5 mL.'
              },
              { 
                id: 'item_1_4', 
                code: '1.4',
                name: 'Tabela de Apresentações e Embalagem Primária', 
                description: 'Volume, doses por frasco e materiais de acondicionamento',
                type: 'Tabela' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'TABLE_PRESENTATIONS', 
                status: 'Aprovado' as RegulatoryDocItemStatus, 
                marker: '[APRESENTAÇÕES DA VACINA]',
                value: 'Tabela de Apresentações (2 apresentações cadastradas)'
              }
            ]
          },
          {
            id: 'cap_2',
            code: '2.0',
            title: '2. Descrição e Composição',
            description: 'Caracterização do Insumo Farmacêutico Ativo e do Adjuvante',
            items: [
              { 
                id: 'item_2_1', 
                code: '2.1',
                name: 'Descrição e Nome do IFA', 
                description: 'Identificação e caracterização do Insumo Farmacêutico Ativo',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'IFA.NAME', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[DESCRIÇÃO E NOME DO IFA]',
                value: 'Proteína Recombinante Pfs25 / MSP1-19 expressa em Pichia pastoris'
              },
              { 
                id: 'item_2_2', 
                code: '2.2',
                name: 'Nome do Adjuvante e Emulsão', 
                description: 'Identificação do sistema imunoadjuvante',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'ADJUVANT.NAME', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[NOME DO ADJUVANTE]',
                value: 'Emulsão de Esqualeno com QS-21 (Adjuvante L30-Adjuv)'
              }
            ]
          }
        ]
      },
      {
        id: `doc_ifa_rec_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do IFA Proteína Recombinante',
        type: 'Dossiê do IFA',
        group: 'Dossiê do IFA - Proteína Recombinante',
        description: 'Dados técnicos, rota sintética em meio líquido e controle de qualidade do IFA recombinante.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        versionHistory: [
          { version: '0.1', date: new Date().toISOString(), status: 'Rascunho', author: currentUser, notes: 'Abertura do dossiê de IFA Recombinante' }
        ],
        chapters: [
          {
            id: 'cap_ifa_1',
            code: '1.0',
            title: '1. Caracterização do IFA Recombinante',
            description: 'Estrutura, linhagem de expressão e massa molecular',
            items: [
              { 
                id: 'item_ifa_1_1', 
                code: '1.1',
                name: 'Descrição e Nome do IFA', 
                description: 'Sequência primária e caracterização físico-química',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'IFA.NAME', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[DESCRIÇÃO E NOME DO IFA]',
                value: 'Proteína Recombinante Pfs25 / MSP1-19 expressa em Pichia pastoris'
              }
            ]
          }
        ]
      },
      {
        id: `doc_ifa_liof_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do IFA Proteína Recombinante Liofilizada',
        type: 'Dossiê do IFA',
        group: 'Dossiê do IFA - Proteína Recombinante Liofilizada',
        description: 'Especificações para forma liofilizada, crioprotetores e umidade residual.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_ifa_liof_1',
            code: '1.0',
            title: '1. Processo de Liofilização e Estabilidade do Liofilizado',
            description: 'Ciclo de liofilização, reconstituição e validade',
            items: [
              { 
                id: 'item_ifa_liof_1_1', 
                code: '1.1',
                name: 'Nome e Descrição do IFA Liofilizado', 
                description: 'Pó liofilizado para reconstituição estéril',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'IFA.NAME', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[DESCRIÇÃO E NOME DO IFA]',
                value: 'Proteína Recombinante Pfs25 Liofilizada em Sacarose/Manitol'
              }
            ]
          }
        ]
      },
      {
        id: `doc_deec_${proj.id}`,
        projectId: proj.id,
        title: 'DEEC - Dossiê de Ensaio Clínico',
        type: 'DEEC',
        group: 'Dossiês Clínicos e Brochuras',
        description: 'Dossiê para submissão à Anvisa / CEUA / CONEP.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_deec_1',
            code: '1.0',
            title: '1. Resumo do Ensaio Clínico Proposto',
            description: 'Desenho do estudo, tamanho amostral e critérios de inclusão',
            items: [
              {
                id: 'item_deec_1_1',
                code: '1.1',
                name: 'Nome e Identificação da Vacina',
                description: 'Identificação comercial',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.NAME',
                status: 'Preenchido' as RegulatoryDocItemStatus,
                marker: '[NOME DA VACINA]',
                value: 'Vacina Malária Recombinante - UniMaV-01'
              }
            ]
          }
        ]
      }
    ]).flat();
  }, [regulatoryDocs, projects, currentUser]);

  // Effective Documents State
  const [docState, setDocState] = useState<RegulatoryDocument[]>(defaultDocs);
  const [hasUserModifiedDocs, setHasUserModifiedDocs] = useState(false);

  const effectiveDocs = useMemo(() => {
    if (hasUserModifiedDocs) return docState;
    return docState.length > 0 ? docState : defaultDocs;
  }, [docState, defaultDocs, hasUserModifiedDocs]);

  const updateDocState = (nextDocs: RegulatoryDocument[]) => {
    setDocState(nextDocs);
    setHasUserModifiedDocs(true);
    onUpdateDocs(nextDocs);
  };

  // Model Editing State
  const [editingModelDoc, setEditingModelDoc] = useState<RegulatoryDocument | null>(null);
  const [editModelTitle, setEditModelTitle] = useState('');
  const [editModelGroup, setEditModelGroup] = useState('');
  const [editModelType, setEditModelType] = useState('');
  const [editModelDesc, setEditModelDesc] = useState('');

  // Contribution Deletion and Editing State
  const [deletedContributionIds, setDeletedContributionIds] = useState<string[]>([]);
  const [editedContributionsMap, setEditedContributionsMap] = useState<Record<string, any>>({});
  const [editingContribution, setEditingContribution] = useState<any | null>(null);
  const [customContributions, setCustomContributions] = useState<any[]>([]);

  // Add Custom Contribution State
  const [showAddContributionModal, setShowAddContributionModal] = useState(false);
  const [newContribTitle, setNewContribTitle] = useState('');
  const [newContribDesc, setNewContribDesc] = useState('');
  const [newContribAssignee, setNewContribAssignee] = useState('');
  const [newContribPhase, setNewContribPhase] = useState('Desenvolvimento');
  const [newContribEvidenceUrl, setNewContribEvidenceUrl] = useState('');
  const [newContribEvidenceFileName, setNewContribEvidenceFileName] = useState('');

  // Add Chapter / Item State
  const [showAddChapterModal, setShowAddChapterModal] = useState(false);
  const [targetDocForNewChapter, setTargetDocForNewChapter] = useState<RegulatoryDocument | null>(null);
  const [newChapterCode, setNewChapterCode] = useState('');
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [newChapterDesc, setNewChapterDesc] = useState('');

  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [targetDocForNewItem, setTargetDocForNewItem] = useState<RegulatoryDocument | null>(null);
  const [targetChapterForNewItem, setTargetChapterForNewItem] = useState<RegulatoryDocumentChapter | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemMarker, setNewItemMarker] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemType, setNewItemType] = useState<RegulatoryDocItemType>('Informação Estruturada');
  const [newItemPresetKey, setNewItemPresetKey] = useState('');

  // Edit Table Item Directly in Dossier State
  const [editingTableItem, setEditingTableItem] = useState<{ doc: RegulatoryDocument; chapter: RegulatoryDocumentChapter; item: RegulatoryDocumentItem } | null>(null);
  const [itemTableTitle, setItemTableTitle] = useState('');
  const [itemTableCols, setItemTableCols] = useState<{ key: string; label: string; type: 'text' | 'number' | 'date' }[]>([]);
  const [itemTableRows, setItemTableRows] = useState<Record<string, any>[]>([]);

  // Filter Documents by Selected Project
  const currentProjectDocs = useMemo(() => {
    if (selectedProjectId === 'all') return effectiveDocs;
    return effectiveDocs.filter(d => d.projectId === selectedProjectId);
  }, [effectiveDocs, selectedProjectId]);

  // Selected Active Document
  const activeDoc = useMemo(() => {
    if (selectedDocId) {
      const found = effectiveDocs.find(d => d.id === selectedDocId);
      if (found) return found;
    }
    return currentProjectDocs.length > 0 ? currentProjectDocs[0] : null;
  }, [effectiveDocs, currentProjectDocs, selectedDocId]);

  // Central Knowledge Base
  const [knowledgeRecords, setKnowledgeRecords] = useState<RegulatoryKnowledgeRecord[]>([
    {
      id: 'kb_1',
      projectId: activeProject?.id || 'p1',
      internalId: 'PRODUCT.NAME',
      category: 'Informações Estruturadas',
      title: 'Nome e Identificação da Vacina',
      value: 'Vacina Malária Recombinante - UniMaV-01',
      origin: 'Definição Estratégica da Liderança do Projeto',
      updatedAt: new Date().toISOString(),
      version: 1,
      history: [{ version: 1, updatedAt: new Date().toISOString(), author: currentUser, value: 'Vacina Malária Recombinante - UniMaV-01' }],
      usedInDocs: [
        { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.1', itemName: 'Nome e Identificação da Vacina' }
      ]
    },
    {
      id: 'kb_2',
      projectId: activeProject?.id || 'p1',
      internalId: 'PRODUCT.INDICATION',
      category: 'Informações Estruturadas',
      title: 'Indicação Terapêutica / Alvo Clínico',
      value: 'Imunização ativa para prevenção da malária clínica por Plasmodium falciparum em indivíduos a partir de 2 anos de idade.',
      origin: 'Protocolo da Fase I / Comitê Científico',
      updatedAt: new Date().toISOString(),
      version: 1,
      usedInDocs: [
        { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.2', itemName: 'Indicação Terapêutica' }
      ]
    }
  ]);

  // Microactivities with Regulatory Contributions
  const projectPendingContributions = useMemo(() => {
    const list: any[] = [];
    tasks.forEach(t => {
      if ((t.generatesRegulatoryContent || t.dossierContribution) && (selectedProjectId === 'all' || t.project === selectedProjectId || t.project === activeProject?.name)) {
        list.push({
          id: t.id,
          title: t.activity || 'Atividade do Projeto',
          description: t.description || 'Contribuição regulatória registrada na atividade do projeto.',
          assignee: t.projectLead || 'Responsável Técnico',
          projectName: t.project || activeProject?.name || 'Projeto',
          phase: t.status || 'Desenvolvimento',
          evidenceUrl: t.fileLocation || '',
          evidenceFileName: t.fileLocation ? 'Documento_Anexo.pdf' : '',
          updatedAt: t.completionDate || new Date().toISOString()
        });
      }
    });

    // Default mock contribution if none found
    if (list.length === 0) {
      list.push(
        {
          id: 'contrib_1',
          title: 'Produção do Lote Piloto LP-002 e Caracterização Bioquímica',
          description: 'Ajuste na denominação da vacina para UniMaV-01 e nova indicação pediátrica a partir de 2 anos.',
          assignee: 'Dra. Ana Silva',
          projectName: activeProject?.name || 'Vacina Malária Universal',
          phase: 'Insumo Farmacêutico Ativo',
          evidenceUrl: 'https://sharepoint.ctvacinas.org/laudos/lp002.pdf',
          evidenceFileName: 'Laudo_QC_LP002.pdf',
          updatedAt: new Date().toISOString()
        },
        {
          id: 'contrib_2',
          title: 'Estudo de Estabilidade Acelerada de 6 Meses (25°C)',
          description: 'Apresentação em frascos multidose de 5mL em vidro borossilicato Tipo I.',
          assignee: 'Dr. Carlos Souza',
          projectName: activeProject?.name || 'Vacina Malária Universal',
          phase: 'Formulação e Estabilidade',
          evidenceUrl: 'https://sharepoint.ctvacinas.org/estabilidade/relatorio_6m.pdf',
          evidenceFileName: 'Relatorio_Estabilidade_6M.pdf',
          updatedAt: new Date().toISOString()
        }
      );
    }

    // Merge custom contributions with tasks list
    const mergedList = [...customContributions, ...list];

    return mergedList
      .filter(c => !deletedContributionIds.includes(c.id))
      .map(c => editedContributionsMap[c.id] ? { ...c, ...editedContributionsMap[c.id] } : c);
  }, [tasks, selectedProjectId, activeProject, customContributions, deletedContributionIds, editedContributionsMap]);

  // All Available Markers across documents
  const allAvailableMarkers = useMemo(() => {
    const map = new Map<string, { marker: string; name: string; docTitles: string[] }>();

    effectiveDocs.forEach(doc => {
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
          const m = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;
          if (!map.has(m)) {
            map.set(m, { marker: m, name: item.name, docTitles: [doc.title] });
          } else {
            const existing = map.get(m)!;
            if (!existing.docTitles.includes(doc.title)) {
              existing.docTitles.push(doc.title);
            }
          }
        });
      });
    });

    return Array.from(map.values());
  }, [effectiveDocs]);

  // Save Item Fill
  const handleSaveFillItem = (overrideValue?: string, targetDocs?: string[]) => {
    if (!selectedItemForFill) return;

    const valToSave = overrideValue !== undefined ? overrideValue : fillValue;
    const marker = selectedItemForFill.item.marker || `[${selectedItemForFill.item.name.toUpperCase().replace(/\s+/g, '_')}]`;

    const updatedDocs = docState.map(doc => {
      if (targetDocs && !targetDocs.includes(doc.id) && doc.id !== selectedItemForFill.doc.id) {
        return doc;
      }

      const updatedChapters = doc.chapters.map(chap => {
        const updatedItems = chap.items.map(item => {
          const itemMarker = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;
          if (itemMarker === marker || item.id === selectedItemForFill.item.id) {
            return {
              ...item,
              value: valToSave,
              status: 'Preenchido' as RegulatoryDocItemStatus,
              evidenceUrl: fillEvidenceUrl || item.evidenceUrl,
              evidenceFileName: fillEvidenceFileName || item.evidenceFileName,
              notes: fillNotes || item.notes
            };
          }
          return item;
        });
        return { ...chap, items: updatedItems };
      });

      return { ...doc, chapters: updatedChapters, updatedAt: new Date().toISOString() };
    });

    setDocState(updatedDocs);
    onUpdateDocs(updatedDocs);

    const updatedKb = [...knowledgeRecords];
    const existingRecIndex = updatedKb.findIndex(k => k.internalId === selectedItemForFill.item.sourceInternalId || k.title === selectedItemForFill.item.name);

    if (existingRecIndex >= 0) {
      updatedKb[existingRecIndex] = {
        ...updatedKb[existingRecIndex],
        value: valToSave,
        updatedAt: new Date().toISOString(),
        version: updatedKb[existingRecIndex].version + 1,
        history: [
          ...(updatedKb[existingRecIndex].history || []),
          { version: updatedKb[existingRecIndex].version + 1, updatedAt: new Date().toISOString(), author: currentUser, value: valToSave }
        ]
      };
    } else {
      updatedKb.push({
        id: `kb_${Date.now()}`,
        projectId: activeProject?.id || 'p1',
        internalId: selectedItemForFill.item.sourceInternalId || marker.replace(/[^a-zA-Z0-9_]/g, '_'),
        category: 'Informações Estruturadas',
        title: selectedItemForFill.item.name,
        value: valToSave,
        origin: 'Preenchimento Direto no Dossiê',
        updatedAt: new Date().toISOString(),
        version: 1,
        history: [{ version: 1, updatedAt: new Date().toISOString(), author: currentUser, value: valToSave }],
        usedInDocs: [{ docId: selectedItemForFill.doc.id, docTitle: selectedItemForFill.doc.title, itemCode: selectedItemForFill.item.code, itemName: selectedItemForFill.item.name }]
      });
    }

    setKnowledgeRecords(updatedKb);
    setSelectedItemForFill(null);
  };

  // Open Fill Modal
  const handleOpenFillModal = (doc: RegulatoryDocument, chapter: RegulatoryDocumentChapter, item: RegulatoryDocumentItem) => {
    setSelectedItemForFill({ doc, chapter, item });
    setFillValue(item.value || '');
    setFillEvidenceUrl(item.evidenceUrl || '');
    setFillEvidenceFileName(item.evidenceFileName || '');
    setFillNotes(item.notes || '');
  };

  // Save Contribution to Selected Markers (Per Marker Typed Value)
  const handleApplyContributionToSelectedMarkers = () => {
    if (!activeContribution || selectedMarkersForContribution.length === 0) return;

    // Apply typed values per marker
    const updatedDocs = docState.map(doc => {
      const updatedChapters = doc.chapters.map(chap => {
        const updatedItems = chap.items.map(item => {
          const itemMarker = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;
          if (selectedMarkersForContribution.includes(itemMarker)) {
            const newValue = markerTypedValues[itemMarker] !== undefined ? markerTypedValues[itemMarker] : (item.value || '');
            return {
              ...item,
              value: newValue,
              status: 'Preenchido' as RegulatoryDocItemStatus,
              evidenceUrl: activeContribution?.evidenceUrl || item.evidenceUrl,
              evidenceFileName: activeContribution?.evidenceFileName || item.evidenceFileName,
              notes: `Preenchido via atividade: ${activeContribution?.title}`
            };
          }
          return item;
        });
        return { ...chap, items: updatedItems };
      });

      return { ...doc, chapters: updatedChapters, updatedAt: new Date().toISOString() };
    });

    setDocState(updatedDocs);
    onUpdateDocs(updatedDocs);

    // Update Knowledge Records for each selected marker
    const updatedKb = [...knowledgeRecords];
    selectedMarkersForContribution.forEach(marker => {
      const markerObj = allAvailableMarkers.find(m => m.marker === marker);
      const valToSave = markerTypedValues[marker] || '';
      const existingIdx = updatedKb.findIndex(k => k.internalId === marker.replace(/[^a-zA-Z0-9_]/g, '_') || k.title === markerObj?.name);

      if (existingIdx >= 0) {
        updatedKb[existingIdx] = {
          ...updatedKb[existingIdx],
          value: valToSave,
          updatedAt: new Date().toISOString(),
          version: updatedKb[existingIdx].version + 1,
          history: [
            ...(updatedKb[existingIdx].history || []),
            { version: updatedKb[existingIdx].version + 1, updatedAt: new Date().toISOString(), author: currentUser, value: valToSave }
          ]
        };
      } else {
        updatedKb.push({
          id: `kb_${Date.now()}_${Math.random()}`,
          projectId: activeProject?.id || 'p1',
          internalId: marker.replace(/[^a-zA-Z0-9_]/g, '_'),
          category: 'Informações Estruturadas',
          title: markerObj?.name || marker,
          value: valToSave,
          origin: `Contribuição: ${activeContribution.title}`,
          updatedAt: new Date().toISOString(),
          version: 1,
          history: [{ version: 1, updatedAt: new Date().toISOString(), author: currentUser, value: valToSave }]
        });
      }
    });

    setKnowledgeRecords(updatedKb);
    setActiveContribution(null);
    setContributionStep(1);
    setSelectedMarkersForContribution([]);
    setMarkerTypedValues({});
  };

  // Import Word Template with Markers Parsing
  const handleImportWordTemplate = () => {
    if (!templateTitle.trim()) return;

    const markerMatches = templateText.match(/\[([^\]]+)\]/g) || [];
    const uniqueMarkers = Array.from(new Set(markerMatches));

    const defaultItems: RegulatoryDocumentItem[] = uniqueMarkers.map((marker, idx) => {
      const cleanName = marker.replace(/[\[\]]/g, '');
      return {
        id: `item_imp_${Date.now()}_${idx}`,
        code: `1.${idx + 1}`,
        name: cleanName,
        type: 'Informação Estruturada' as RegulatoryDocItemType,
        required: true,
        sourceInternalId: cleanName.toUpperCase().replace(/\s+/g, '_'),
        status: 'Vazio' as RegulatoryDocItemStatus,
        marker: marker,
        value: ''
      };
    });

    const newDoc: RegulatoryDocument = {
      id: `doc_imported_${Date.now()}`,
      projectId: activeProject?.id || 'p1',
      title: templateTitle.trim(),
      type: templateType,
      group: templateGroup,
      description: templateDescription.trim() || 'Modelo regulatório gerado a partir de importação Word.',
      currentVersion: '0.1',
      currentVersionStatus: 'Rascunho',
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `cap_imp_${Date.now()}`,
          code: '1.0',
          title: '1. Conteúdos do Modelo Importado',
          description: 'Estrutura e marcadores extraídos',
          items: defaultItems.length > 0 ? defaultItems : [
            {
              id: `item_def_${Date.now()}`,
              code: '1.1',
              name: 'Nome do Produto',
              type: 'Informação Estruturada',
              required: true,
              sourceInternalId: 'PRODUCT.NAME',
              status: 'Vazio',
              marker: '[NOME DA VACINA]',
              value: ''
            }
          ]
        }
      ]
    };

    const updated = [newDoc, ...docState];
    setDocState(updated);
    onUpdateDocs(updated);

    // If new group was selected/entered
    if (templateGroup && !modelGroups.includes(templateGroup)) {
      setModelGroups(prev => [...prev, templateGroup]);
    }

    setShowImportTemplateModal(false);
    setTemplateTitle('');
    setTemplateText('');
    setTemplateDescription('');
  };

  // Handle Create / Edit Table Modal Save
  const handleSaveStructuredTable = () => {
    if (!tableTitleInput.trim()) return;

    if (editingTable) {
      // Edit existing table
      const updated = structuredTables.map(t => {
        if (t.id === editingTable.id) {
          return {
            ...t,
            title: tableTitleInput.trim(),
            key: tableKeyInput.trim() || t.key,
            description: tableDescInput.trim(),
            columns: tableColsInput,
            rows: tableRowsInput,
            updatedAt: new Date().toISOString()
          };
        }
        return t;
      });
      setStructuredTables(updated);
    } else {
      // Create new table
      const newTbl: RegulatoryStructuredTable = {
        id: `table_${Date.now()}`,
        projectId: activeProject?.id || 'p1',
        key: tableKeyInput.trim() || `TABLE_${Date.now()}`,
        title: tableTitleInput.trim(),
        description: tableDescInput.trim() || 'Tabela estruturada customizada',
        columns: tableColsInput.length > 0 ? tableColsInput : [
          { key: 'col1', label: 'Item / Parâmetro', type: 'text' },
          { key: 'col2', label: 'Valor / Especificação', type: 'text' }
        ],
        rows: tableRowsInput,
        updatedAt: new Date().toISOString()
      };
      setStructuredTables(prev => [newTbl, ...prev]);
    }

    setShowTableModal(false);
    setEditingTable(null);
  };

  // Open Edit Table Modal
  const handleOpenEditTable = (tbl: RegulatoryStructuredTable) => {
    setEditingTable(tbl);
    setTableTitleInput(tbl.title);
    setTableKeyInput(tbl.key);
    setTableDescInput(tbl.description || '');
    setTableColsInput(tbl.columns.map(c => ({
      key: c.key,
      label: c.label,
      type: (c.type || 'text') as 'text' | 'number' | 'date'
    })));
    setTableRowsInput(JSON.parse(JSON.stringify(tbl.rows)));
    setShowTableModal(true);
  };

  // Open Create Table Modal from Preset
  const handleOpenCreateTableFromPreset = (preset?: any) => {
    setEditingTable(null);
    if (preset) {
      setTableTitleInput(preset.title.replace('Modelo: ', ''));
      setTableKeyInput(preset.key);
      setTableDescInput(preset.description);
      setTableColsInput([...preset.columns]);
      setTableRowsInput([{}]);
    } else {
      setTableTitleInput('');
      setTableKeyInput('');
      setTableDescInput('');
      setTableColsInput([
        { key: 'item', label: 'Item / Parâmetro', type: 'text' },
        { key: 'resultado', label: 'Resultado', type: 'text' }
      ]);
      setTableRowsInput([{}]);
    }
    setShowTableModal(true);
  };

  // Delete Model Handler
  const handleDeleteModel = (docId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este modelo de documento regulatório?')) return;
    const nextDocs = docState.filter(d => d.id !== docId);
    updateDocState(nextDocs);
    if (selectedDocId === docId) {
      setSelectedDocId('');
    }
  };

  // Open Edit Model Modal
  const handleOpenEditModel = (doc: RegulatoryDocument) => {
    setEditingModelDoc(doc);
    setEditModelTitle(doc.title);
    setEditModelGroup(doc.group || modelGroups[0] || 'Geral');
    setEditModelType(doc.type || 'Dossiê Regulatório');
    setEditModelDesc(doc.description || '');
  };

  // Save Edited Model
  const handleSaveEditedModel = () => {
    if (!editingModelDoc) return;
    const nextDocs = docState.map(d => {
      if (d.id === editingModelDoc.id) {
        return {
          ...d,
          title: editModelTitle.trim() || d.title,
          group: editModelGroup.trim() || d.group,
          type: editModelType.trim() || d.type,
          description: editModelDesc.trim() || d.description,
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });
    updateDocState(nextDocs);
    setEditingModelDoc(null);
  };

  // Delete Contribution Handler
  const handleDeleteContribution = (id: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir esta contribuição regulatória?')) return;
    setDeletedContributionIds(prev => [...prev, id]);
    setCustomContributions(prev => prev.filter(c => c.id !== id));
  };

  // Open Edit Contribution Modal
  const handleOpenEditContribution = (contrib: any) => {
    setEditingContribution({ ...contrib });
  };

  // Save Edited Contribution
  const handleSaveEditedContribution = () => {
    if (!editingContribution) return;
    setEditedContributionsMap(prev => ({
      ...prev,
      [editingContribution.id]: editingContribution
    }));
    setEditingContribution(null);
  };

  // Create Custom Contribution
  const handleCreateCustomContribution = () => {
    if (!newContribTitle.trim()) return;
    const newC = {
      id: `contrib_custom_${Date.now()}`,
      title: newContribTitle.trim(),
      description: newContribDesc.trim() || 'Contribuição regulatória adicionada manualmente.',
      assignee: newContribAssignee.trim() || currentUser || 'Responsável Técnico',
      projectName: activeProject?.name || 'Projeto',
      phase: newContribPhase || 'Desenvolvimento',
      evidenceUrl: newContribEvidenceUrl.trim(),
      evidenceFileName: newContribEvidenceFileName.trim(),
      updatedAt: new Date().toISOString()
    };
    setCustomContributions(prev => [newC, ...prev]);
    setShowAddContributionModal(false);
    setNewContribTitle('');
    setNewContribDesc('');
    setNewContribAssignee('');
    setNewContribEvidenceUrl('');
    setNewContribEvidenceFileName('');
  };

  // Chapter Management (Add / Delete)
  const handleOpenAddChapterModal = (doc: RegulatoryDocument) => {
    setTargetDocForNewChapter(doc);
    const nextNum = (doc.chapters?.length || 0) + 1;
    setNewChapterCode(`${nextNum}.0`);
    setNewChapterTitle(`${nextNum}. Novo Capítulo`);
    setNewChapterDesc('');
    setShowAddChapterModal(true);
  };

  const handleSaveNewChapter = () => {
    if (!targetDocForNewChapter || !newChapterTitle.trim()) return;

    const newChapter: RegulatoryDocumentChapter = {
      id: `cap_${Date.now()}`,
      code: newChapterCode.trim() || '1.0',
      title: newChapterTitle.trim(),
      description: newChapterDesc.trim(),
      items: []
    };

    const nextDocs = docState.map(d => {
      if (d.id === targetDocForNewChapter.id) {
        return {
          ...d,
          chapters: [...(d.chapters || []), newChapter],
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });

    updateDocState(nextDocs);
    setShowAddChapterModal(false);
    setTargetDocForNewChapter(null);
  };

  const handleDeleteChapter = (docId: string, chapterId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este capítulo e todos os seus itens?')) return;
    const nextDocs = docState.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          chapters: d.chapters.filter(c => c.id !== chapterId),
          updatedAt: new Date().toISOString()
        };
      }
      return d;
    });
    updateDocState(nextDocs);
  };

  // Item & Custom Table Addition to Chapter/Model
  const handleOpenAddItemModal = (doc: RegulatoryDocument, chapter: RegulatoryDocumentChapter) => {
    setTargetDocForNewItem(doc);
    setTargetChapterForNewItem(chapter);
    const nextItemNum = (chapter.items?.length || 0) + 1;
    setNewItemName(`Novo Item / Marcador ${nextItemNum}`);
    setNewItemMarker(`[MARCADOR_${nextItemNum}]`);
    setNewItemDesc('');
    setNewItemType('Informação Estruturada');
    setNewItemPresetKey('');
    setShowAddItemModal(true);
  };

  const handleSaveNewItem = () => {
    if (!targetDocForNewItem || !targetChapterForNewItem || !newItemName.trim()) return;

    let initialValue = '';
    if (newItemType === 'Tabela') {
      const preset = tableTemplates.find(t => t.key === newItemPresetKey);
      if (preset) {
        initialValue = JSON.stringify({
          columns: preset.columns,
          rows: [
            preset.columns.reduce((acc, col) => ({ ...acc, [col.key]: '' }), {})
          ]
        });
      } else {
        initialValue = JSON.stringify({
          columns: [
            { key: 'col1', label: 'Item / Parâmetro', type: 'text' },
            { key: 'col2', label: 'Valor / Especificação', type: 'text' }
          ],
          rows: [{ col1: '', col2: '' }]
        });
      }
    }

    const cleanMarker = newItemMarker.trim() 
      ? (newItemMarker.trim().startsWith('[') ? newItemMarker.trim() : `[${newItemMarker.trim().toUpperCase()}]`)
      : `[${newItemName.trim().toUpperCase().replace(/\s+/g, '_')}]`;

    const newItem: RegulatoryDocumentItem = {
      id: `item_${Date.now()}`,
      code: `${targetChapterForNewItem.code || '1'}.${(targetChapterForNewItem.items?.length || 0) + 1}`,
      name: newItemName.trim(),
      description: newItemDesc.trim(),
      type: newItemType,
      required: true,
      sourceInternalId: cleanMarker.replace(/[^a-zA-Z0-9_]/g, '_'),
      status: initialValue ? 'Preenchido' : 'Vazio',
      marker: cleanMarker,
      value: initialValue
    };

    const nextDocs = docState.map(d => {
      if (d.id === targetDocForNewItem.id) {
        const nextChapters = d.chapters.map(c => {
          if (c.id === targetChapterForNewItem.id) {
            return {
              ...c,
              items: [...(c.items || []), newItem]
            };
          }
          return c;
        });
        return { ...d, chapters: nextChapters, updatedAt: new Date().toISOString() };
      }
      return d;
    });

    updateDocState(nextDocs);
    setShowAddItemModal(false);
    setTargetDocForNewItem(null);
    setTargetChapterForNewItem(null);
  };

  const handleDeleteItem = (docId: string, chapterId: string, itemId: string) => {
    if (!window.confirm('Tem certeza de que deseja excluir este item/marcador do modelo?')) return;
    const nextDocs = docState.map(d => {
      if (d.id === docId) {
        const nextChapters = d.chapters.map(c => {
          if (c.id === chapterId) {
            return {
              ...c,
              items: c.items.filter(i => i.id !== itemId)
            };
          }
          return c;
        });
        return { ...d, chapters: nextChapters, updatedAt: new Date().toISOString() };
      }
      return d;
    });
    updateDocState(nextDocs);
  };

  // Free Editing of Table Data on Dossier Item
  const handleOpenEditTableItem = (doc: RegulatoryDocument, chapter: RegulatoryDocumentChapter, item: RegulatoryDocumentItem) => {
    setEditingTableItem({ doc, chapter, item });
    setItemTableTitle(item.name);

    if (item.value) {
      try {
        const parsed = JSON.parse(item.value);
        if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
          setItemTableCols(parsed.columns);
          setItemTableRows(parsed.rows);
          return;
        }
      } catch (e) {
        // Fallback to default structure
      }
    }

    setItemTableCols([
      { key: 'col1', label: 'Item / Parâmetro', type: 'text' },
      { key: 'col2', label: 'Especificação / Valor', type: 'text' }
    ]);
    setItemTableRows([{ col1: '', col2: '' }]);
  };

  const handleSaveEditTableItem = () => {
    if (!editingTableItem) return;

    const tableDataString = JSON.stringify({
      columns: itemTableCols,
      rows: itemTableRows
    });

    const nextDocs = docState.map(d => {
      if (d.id === editingTableItem.doc.id) {
        const nextChapters = d.chapters.map(c => {
          if (c.id === editingTableItem.chapter.id) {
            const nextItems = c.items.map(i => {
              if (i.id === editingTableItem.item.id) {
                return {
                  ...i,
                  name: itemTableTitle.trim() || i.name,
                  value: tableDataString,
                  status: 'Preenchido' as RegulatoryDocItemStatus
                };
              }
              return i;
            });
            return { ...c, items: nextItems };
          }
          return c;
        });
        return { ...d, chapters: nextChapters, updatedAt: new Date().toISOString() };
      }
      return d;
    });

    updateDocState(nextDocs);
    setEditingTableItem(null);
  };

  // Helper to Render Formatted Table or Plain Text inside Dossier Items
  const renderItemContentValue = (val: string) => {
    if (!val) return null;
    try {
      const parsed = JSON.parse(val);
      if (parsed && Array.isArray(parsed.columns) && Array.isArray(parsed.rows)) {
        return (
          <div className="overflow-x-auto border border-slate-200 rounded-xl my-1 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 font-extrabold text-slate-700">
                <tr>
                  {parsed.columns.map((c: any, i: number) => (
                    <th key={c.key || i} className="p-2 border-b border-slate-200">{c.label || c.name || c.key}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {parsed.rows.map((row: any, rIdx: number) => (
                  <tr key={rIdx} className="hover:bg-slate-50 font-medium text-slate-800">
                    {parsed.columns.map((c: any, cIdx: number) => (
                      <td key={c.key || cIdx} className="p-2">{row[c.key] !== undefined ? String(row[c.key]) : '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    } catch (e) {
      // Plain text
    }

    return (
      <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap">
        {val}
      </p>
    );
  };

  // Export Excel Database
  const handleExportExcelDatabase = () => {
    const wb = XLSX.utils.book_new();

    const itemsData = knowledgeRecords.map(r => ({
      'Identificador Interno': r.internalId,
      'Marcador': r.internalId ? `[${r.internalId}]` : '-',
      'Nome do Item': r.title,
      'Valor': typeof r.value === 'object' ? JSON.stringify(r.value) : (r.value || ''),
      'Tipo': r.category,
      'Versão': r.version,
      'Origem': r.origin,
      'Responsável': currentUser,
      'Data de Atualização': new Date(r.updatedAt).toLocaleString('pt-BR')
    }));
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Itens Regulatórios');

    const docUsageData: any[] = [];
    currentProjectDocs.forEach(doc => {
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
          docUsageData.push({
            'Identificador Interno': item.sourceInternalId || item.code || '-',
            'Documento': doc.title,
            'Grupo': doc.group || 'Geral',
            'Capítulo': chap.title,
            'Posição': item.code || '-',
            'Marcador': item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`,
            'Status': item.status || 'Vazio'
          });
        });
      });
    });
    const wsDocUsage = XLSX.utils.json_to_sheet(docUsageData);
    XLSX.utils.book_append_sheet(wb, wsDocUsage, 'Uso nos Documentos');

    XLSX.writeFile(wb, `Banco_Regulatorio_${activeProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Projetos'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Render Status Badge
  const renderItemStatusBadge = (status: RegulatoryDocItemStatus) => {
    switch (status) {
      case 'Preenchido':
      case 'Concluído':
        return (
          <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-blue-200">
            <CheckCircle2 size={12} className="text-blue-600" /> Preenchido
          </span>
        );
      case 'Aprovado':
      case 'Pronto':
        return (
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-emerald-200">
            <CheckCircle size={12} className="text-emerald-600" /> Aprovado
          </span>
        );
      case 'Em preenchimento':
      case 'Em Andamento':
      case 'Pendente':
        return (
          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200">
            <Clock size={12} className="text-amber-600" /> Em preenchimento
          </span>
        );
      case 'Divergente':
        return (
          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-rose-200">
            <AlertTriangle size={12} className="text-rose-600" /> Divergente
          </span>
        );
      case 'Vazio':
      case 'Faltando':
      default:
        return (
          <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-200">
            <XCircle size={12} className="text-slate-400" /> Vazio
          </span>
        );
    }
  };

  // Documents grouped by Group
  const docsByGroup = useMemo(() => {
    const map: Record<string, RegulatoryDocument[]> = {};
    modelGroups.forEach(g => { map[g] = []; });

    currentProjectDocs.forEach(doc => {
      const grp = doc.group || 'Outros Grupos';
      if (!map[grp]) map[grp] = [];
      map[grp].push(doc);
    });

    return map;
  }, [currentProjectDocs, modelGroups]);

  return (
    <div className="space-y-4">
      {/* Sleek Compact Header Bar (Replacing the giant card) */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30">
            <FileText size={22} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase tracking-tight text-white flex items-center gap-2">
              Modelos e Dossiês Regulatórios
            </h1>
            <p className="text-xs text-slate-400 font-medium">
              Acompanhamento de modelos por grupos, capítulos e marcadores regulatórios.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Project Selector */}
          <div className="flex items-center gap-2 bg-slate-800 p-1.5 rounded-xl border border-slate-700">
            <span className="text-[10px] font-black uppercase text-amber-400 px-1.5">Projeto:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="bg-slate-900 text-white font-extrabold px-2.5 py-1 rounded-lg border border-slate-700 outline-none text-xs cursor-pointer"
            >
              <option value="all">Todos os Projetos</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportExcelDatabase}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <FileSpreadsheet size={15} /> Exportar Banco
          </button>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('dossier_viewer')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'dossier_viewer'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree size={16} />
          <span>Visualizador do Dossiê</span>
        </button>

        <button
          onClick={() => setActiveTab('pending_contributions')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'pending_contributions'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={16} />
          <span>Contribuições Pendentes</span>
          {projectPendingContributions.length > 0 && (
            <span className="px-2 py-0.5 bg-amber-400 text-slate-950 rounded-full text-[10px] font-black">
              {projectPendingContributions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('template_manager')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'template_manager'
              ? 'bg-slate-800 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode size={16} />
          <span>Modelos por Grupos</span>
        </button>

        <button
          onClick={() => setActiveTab('tables_and_attachments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'tables_and_attachments'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TableIcon size={16} />
          <span>Tabelas & Estruturas</span>
        </button>

        <button
          onClick={() => setActiveTab('export_and_traceability')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'export_and_traceability'
              ? 'bg-amber-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download size={16} />
          <span>Exportação</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: VISUALIZADOR DO DOSSIÊ (ORGANIZED BY GROUPS) */}
      {/* =================================================================== */}
      {activeTab === 'dossier_viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Grouped Models List */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  Modelos de Documento
                </h3>
                <span className="text-[10px] text-slate-400 font-bold">{currentProjectDocs.length} totais</span>
              </div>

              {Object.entries(docsByGroup).map(([groupName, docs]) => {
                if (docs.length === 0) return null;

                return (
                  <div key={groupName} className="space-y-2">
                    <div className="px-2 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-700 flex items-center justify-between">
                      <span className="truncate max-w-[170px]">{groupName}</span>
                      <span className="text-slate-500 font-bold">({docs.length})</span>
                    </div>

                    <div className="space-y-1.5">
                      {docs.map(doc => {
                        const isActive = activeDoc?.id === doc.id;
                        
                        let totalInDoc = 0;
                        let readyInDoc = 0;
                        doc.chapters?.forEach(c => c.items?.forEach(i => {
                          totalInDoc++;
                          if (i.value && i.value.trim() !== '' && i.status !== 'Vazio') readyInDoc++;
                        }));
                        const docPercent = totalInDoc > 0 ? Math.round((readyInDoc / totalInDoc) * 100) : 0;

                        return (
                          <button
                            key={doc.id}
                            onClick={() => setSelectedDocId(doc.id)}
                            className={`w-full text-left p-3 rounded-xl border transition cursor-pointer ${
                              isActive
                                ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                                : 'bg-white border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="font-extrabold text-xs text-slate-900 block leading-snug">{doc.title}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                docPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {docPercent}%
                              </span>
                            </div>

                            <div className="w-full bg-slate-100 h-1 rounded-full mt-2 overflow-hidden">
                              <div 
                                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                                style={{ width: `${docPercent}%` }}
                              />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Active Document Viewer */}
          <div className="lg:col-span-3 space-y-4">
            {activeDoc ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
                {/* Active Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeDoc.group && (
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-black uppercase rounded-md border border-slate-200">
                          {activeDoc.group}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase rounded-md border border-indigo-200">
                        {activeDoc.type}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">Versão {activeDoc.currentVersion} ({activeDoc.currentVersionStatus})</span>
                    </div>
                    <h2 className="text-xl font-black text-slate-900">{activeDoc.title}</h2>
                    <p className="text-xs text-slate-500 font-medium">{activeDoc.description}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 justify-end">
                    <button
                      onClick={() => handleOpenAddChapterModal(activeDoc)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer border border-indigo-200"
                    >
                      <Plus size={14} />
                      <span>+ Capítulo</span>
                    </button>

                    <button
                      onClick={() => handleOpenEditModel(activeDoc)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={14} />
                      <span>Editar Modelo</span>
                    </button>

                    <button
                      onClick={() => handleDeleteModel(activeDoc.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer border border-rose-200"
                    >
                      <Trash2 size={14} />
                      <span>Excluir Modelo</span>
                    </button>

                    {/* Search filter inside document */}
                    <div className="relative w-full sm:w-48 mt-1 sm:mt-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                      <input
                        type="text"
                        placeholder="Buscar marcadores..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Chapters & Items List */}
                <div className="space-y-4">
                  {activeDoc.chapters.map((chapter) => {
                    const isExpanded = expandedChapters[chapter.id] ?? true;

                    const filteredItems = chapter.items.filter(item => 
                      !searchQuery.trim() || 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.marker && item.marker.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (item.value && item.value.toLowerCase().includes(searchQuery.toLowerCase()))
                    );

                    if (searchQuery.trim() && filteredItems.length === 0) return null;

                    return (
                      <div key={chapter.id} className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                        <div className="w-full p-3.5 bg-slate-50 border-b border-slate-200/60 flex items-center justify-between flex-wrap gap-2">
                          <button
                            onClick={() => setExpandedChapters(prev => ({ ...prev, [chapter.id]: !isExpanded }))}
                            className="flex items-center gap-2 cursor-pointer hover:text-indigo-600 transition"
                          >
                            {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                            <span className="font-extrabold text-xs sm:text-sm text-slate-900">{chapter.title}</span>
                          </button>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-500 px-2 py-0.5 bg-white rounded-md border border-slate-200">
                              {filteredItems.length} itens
                            </span>

                            <button
                              onClick={() => handleOpenAddItemModal(activeDoc, chapter)}
                              className="px-2.5 py-1 bg-white hover:bg-indigo-50 text-indigo-700 rounded-lg text-[11px] font-black transition flex items-center gap-1 cursor-pointer border border-indigo-200 shadow-2xs"
                              title="Adicionar Item ou Tabela Customizada neste Capítulo"
                            >
                              <Plus size={13} />
                              <span>+ Item / Tabela</span>
                            </button>

                            <button
                              onClick={() => handleDeleteChapter(activeDoc.id, chapter.id)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded-lg transition cursor-pointer"
                              title="Excluir Capítulo"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-4 space-y-3 bg-white">
                            {filteredItems.map((item) => {
                              const isFilled = item.value && item.value.trim() !== '' && item.status !== 'Vazio';
                              const markerTag = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;

                              return (
                                <div
                                  key={item.id}
                                  className={`p-4 rounded-xl border transition ${
                                    isFilled
                                      ? 'bg-slate-50/50 border-slate-200'
                                      : 'bg-amber-50/30 border-dashed border-amber-300'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100 font-mono">
                                          {markerTag}
                                        </span>
                                        {renderItemStatusBadge(item.status)}
                                        {item.type === 'Tabela' && (
                                          <span className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-black uppercase rounded-md border border-teal-200">
                                            Tabela
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{item.code ? `${item.code} - ` : ''}{item.name}</h4>
                                      {item.description && (
                                        <p className="text-xs text-slate-500 font-medium">{item.description}</p>
                                      )}
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0">
                                      {item.type === 'Tabela' ? (
                                        <button
                                          onClick={() => handleOpenEditTableItem(activeDoc, chapter, item)}
                                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                        >
                                          <TableIcon size={13} />
                                          <span>{isFilled ? 'Editar Tabela' : 'Preencher Tabela'}</span>
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleOpenFillModal(activeDoc, chapter, item)}
                                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                                        >
                                          <Edit3 size={13} />
                                          <span>{isFilled ? 'Editar' : 'Preencher'}</span>
                                        </button>
                                      )}

                                      <button
                                        onClick={() => handleDeleteItem(activeDoc.id, chapter.id, item.id)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                        title="Excluir Item do Modelo"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </div>

                                  <div className="mt-3 pt-2 border-t border-slate-100">
                                    {isFilled ? (
                                      <div className="bg-white p-3 rounded-lg border border-slate-200/80 space-y-1">
                                        <span className="text-[9px] font-black uppercase text-slate-400 block">Conteúdo Registrado:</span>
                                        {renderItemContentValue(item.value || '')}
                                        {item.evidenceUrl && (
                                          <div className="flex items-center gap-1.5 mt-2 text-xs font-extrabold text-indigo-600 pt-1 border-t border-slate-100">
                                            <Paperclip size={13} />
                                            <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-800">
                                              Anexo: {item.evidenceFileName || 'Evidência'}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 flex items-center justify-between text-xs">
                                        <div className="flex items-center gap-2 font-medium">
                                          <AlertCircle size={15} className="text-amber-600 shrink-0" />
                                          <span>Item vazio.</span>
                                        </div>
                                        {item.type === 'Tabela' ? (
                                          <button
                                            onClick={() => handleOpenEditTableItem(activeDoc, chapter, item)}
                                            className="font-black text-teal-800 hover:underline cursor-pointer"
                                          >
                                            Preencher Tabela →
                                          </button>
                                        ) : (
                                          <button
                                            onClick={() => handleOpenFillModal(activeDoc, chapter, item)}
                                            className="font-black text-amber-800 hover:underline cursor-pointer"
                                          >
                                            Preencher →
                                          </button>
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
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="bg-white p-10 rounded-2xl border border-slate-200 text-center space-y-2">
                <FileText size={40} className="mx-auto text-slate-300" />
                <h3 className="font-extrabold text-slate-800 text-sm">Nenhum Modelo Selecionado</h3>
                <p className="text-xs text-slate-500">Selecione um modelo na coluna ao lado para visualizar o conteúdo.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: CONTRIBUIÇÕES PENDENTES (PROJECT ACTIVITIES) */}
      {/* =================================================================== */}
      {activeTab === 'pending_contributions' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Layers className="text-indigo-600" size={22} />
                Contribuições Regulatórias das Atividades
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Atividades dos projetos com contribuições regulatórias. Selecione uma atividade para mapear marcadores e preencher valores diretamente nos dossiês.
              </p>
            </div>

            <button
              onClick={() => setShowAddContributionModal(true)}
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
            >
              <Plus size={15} />
              <span>Nova Contribuição</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectPendingContributions.map((contrib) => (
              <div key={contrib.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 hover:border-indigo-300 transition relative group">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-md">
                    {contrib.phase || 'Atividade'}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 font-bold">{contrib.projectName}</span>
                    <button
                      onClick={() => handleOpenEditContribution(contrib)}
                      className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition cursor-pointer ml-1"
                      title="Editar Contribuição"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteContribution(contrib.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                      title="Excluir Contribuição"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{contrib.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{contrib.description}</p>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Responsável:</span>
                    <span className="font-semibold text-slate-800">{contrib.assignee}</span>
                  </div>
                  {contrib.evidenceUrl && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Evidência:</span>
                      <a href={contrib.evidenceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline truncate max-w-[140px]">
                        {contrib.evidenceFileName || 'Anexo'}
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveContribution(contrib);
                    setContributionStep(1);
                    setSelectedMarkersForContribution([]);
                    setMarkerTypedValues({});
                  }}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 shadow-xs"
                >
                  <ListCheck size={15} />
                  <span>Classificar & Preencher Marcadores</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MODELOS POR GRUPOS & IMPORTAÇÃO */}
      {/* =================================================================== */}
      {activeTab === 'template_manager' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <FileCode className="text-indigo-600" size={22} />
                Modelos de Documentos por Grupos
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Crie e organize os modelos de dossiê por grupo (ex: IFA Proteína Recombinante, IFA Liofilizado, Vacina com Adjuvante).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const name = prompt('Nome do novo grupo de modelos:');
                  if (name && name.trim()) {
                    setModelGroups(prev => [...prev, name.trim()]);
                  }
                }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer"
              >
                <FolderPlus size={15} strokeWidth={2.5} />
                <span>Novo Grupo</span>
              </button>

              <button
                onClick={() => setShowImportTemplateModal(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <FileUp size={15} />
                <span>Importar / Criar Modelo</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {modelGroups.map((grpName) => {
              const grpDocs = effectiveDocs.filter(d => (d.group || 'Outros Grupos') === grpName);

              return (
                <div key={grpName} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <FolderTree className="text-indigo-600" size={18} />
                      {grpName}
                    </h3>
                    <span className="text-[10px] font-black text-slate-500 px-2 py-0.5 bg-white rounded-md border border-slate-200">
                      {grpDocs.length} modelos
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {grpDocs.map(doc => {
                      let totalItems = 0;
                      doc.chapters?.forEach(c => totalItems += (c.items?.length || 0));

                      return (
                        <div key={doc.id} className="p-4 bg-white rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[10px] font-black uppercase">
                                {doc.type}
                              </span>
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] text-slate-400 font-bold mr-1">v{doc.currentVersion}</span>
                                <button
                                  onClick={() => handleOpenEditModel(doc)}
                                  className="p-1 text-slate-400 hover:text-indigo-600 rounded-md transition cursor-pointer"
                                  title="Editar Modelo"
                                >
                                  <Edit3 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteModel(doc.id)}
                                  className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition cursor-pointer"
                                  title="Excluir Modelo"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            <h4 className="font-extrabold text-xs sm:text-sm text-slate-900">{doc.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2">{doc.description}</p>
                          </div>

                          <div className="pt-2 border-t border-slate-100 space-y-2">
                            <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                              <span>{doc.chapters?.length || 0} capítulos</span>
                              <span>{totalItems} marcadores</span>
                            </div>

                            <button
                              onClick={() => {
                                setSelectedDocId(doc.id);
                                setActiveTab('dossier_viewer');
                              }}
                              className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-black transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <FileText size={13} />
                              <span>Visualizar / Preencher Dossiê</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {grpDocs.length === 0 && (
                      <div className="col-span-full p-4 text-center text-xs text-slate-400 italic">
                        Nenhum modelo cadastrado neste grupo. Clique em "Importar Modelo Word" para criar um.
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: TABELAS ESTRUTURADAS E EDITÁVEIS */}
      {/* =================================================================== */}
      {activeTab === 'tables_and_attachments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <TableIcon className="text-teal-600" size={22} />
                Tabelas Estruturadas do Banco Regulatório
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Crie, edite e atualize tabelas a partir de modelos pré-existentes ou através das atividades dos projetos.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleOpenCreateTableFromPreset()}
                className="px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              >
                <Plus size={15} />
                <span>Criar Tabela Customizada</span>
              </button>
            </div>
          </div>

          {/* Table Presets Bar */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Modelos de Tabelas Pré-existentes:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tableTemplates.map(preset => (
                <button
                  key={preset.key}
                  onClick={() => handleOpenCreateTableFromPreset(preset)}
                  className="p-3 bg-slate-50 hover:bg-teal-50/60 border border-slate-200 hover:border-teal-300 rounded-xl text-left transition cursor-pointer space-y-1"
                >
                  <span className="font-black text-xs text-slate-900 block">{preset.title}</span>
                  <span className="text-[10px] text-slate-500 block leading-tight">{preset.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Active Tables List */}
          <div className="space-y-6 pt-2">
            {structuredTables.map(tbl => (
              <div key={tbl.id} className="p-4 sm:p-5 border border-slate-200 rounded-2xl space-y-3 bg-slate-50/30">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{tbl.title}</h4>
                    <p className="text-xs text-slate-500">{tbl.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-white text-slate-700 font-bold rounded-md border border-slate-200">
                      [{tbl.key}]
                    </span>
                    <button
                      onClick={() => handleOpenEditTable(tbl)}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 size={13} />
                      <span>Editar Tabela</span>
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-700">
                      <tr>
                        {tbl.columns.map(c => (
                          <th key={c.key} className="p-3 border-b border-slate-200">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tbl.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800">
                          {tbl.columns.map(c => (
                            <td key={c.key} className="p-3">{row[c.key] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 5: EXPORTAÇÃO */}
      {/* =================================================================== */}
      {activeTab === 'export_and_traceability' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Download className="text-amber-600" size={22} />
              Exportação do Banco de Dados Regulatório
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Exporte todos os itens, históricos, grupos e tabelas em formato Excel.
            </p>
          </div>

          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 max-w-xl">
            <FileSpreadsheet className="text-emerald-600" size={32} />
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm">Exportar Banco em Excel (.xlsx)</h4>
              <p className="text-xs text-slate-500 mt-1">
                Gera arquivo Excel organizado com itens, grupos e relacionamentos multi-documentos.
              </p>
            </div>
            <button
              onClick={handleExportExcelDatabase}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-xs cursor-pointer"
            >
              Baixar Excel Regulatório
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ITEM FILL / EDIT */}
      {/* =================================================================== */}
      {selectedItemForFill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-mono px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold">
                  {selectedItemForFill.item.marker || `[${selectedItemForFill.item.name.toUpperCase().replace(/\s+/g, '_')}]`}
                </span>
                <h3 className="font-black text-base text-slate-900">{selectedItemForFill.item.name}</h3>
                <p className="text-xs text-slate-500">{selectedItemForFill.doc.title} • {selectedItemForFill.chapter.title}</p>
              </div>
              <button onClick={() => setSelectedItemForFill(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Conteúdo do Marcador:</label>
                <textarea
                  rows={4}
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  placeholder="Insira o texto..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Link da Evidência:</label>
                  <input
                    type="text"
                    value={fillEvidenceUrl}
                    onChange={(e) => setFillEvidenceUrl(e.target.value)}
                    placeholder="https://sharepoint..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Nome do Arquivo:</label>
                  <input
                    type="text"
                    value={fillEvidenceFileName}
                    onChange={(e) => setFillEvidenceFileName(e.target.value)}
                    placeholder="laudo_esterilidade.pdf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedItemForFill(null)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveFillItem()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Salvar Conteúdo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: PENDING CONTRIBUTION (MULTI-STEP PER-MARKER INPUT WINDOW) */}
      {/* =================================================================== */}
      {activeContribution && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                  Contribuição do Projeto • Passo {contributionStep} de 2
                </span>
                <h3 className="font-black text-base text-slate-900 mt-1">{activeContribution.title}</h3>
                <p className="text-xs text-slate-500">{activeContribution.projectName} • {activeContribution.assignee}</p>
              </div>
              <button onClick={() => setActiveContribution(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            {/* STEP 1: Marker Selection */}
            {contributionStep === 1 && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Atividade Impacta:</span>
                  <p className="text-xs text-slate-800 font-medium">{activeContribution.description}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-slate-700 block">
                    Selecione quais marcadores serão alterados nesta janela:
                  </label>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                    {allAvailableMarkers.map(m => {
                      const isChecked = selectedMarkersForContribution.includes(m.marker);
                      return (
                        <label key={m.marker} className="flex items-start gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedMarkersForContribution(prev => [...prev, m.marker]);
                                // Pre-fill typed value with current recorded value or contribution text
                                const currentKb = knowledgeRecords.find(k => k.title === m.name || k.internalId === m.marker.replace(/[^a-zA-Z0-9_]/g, '_'));
                                setMarkerTypedValues(prev => ({
                                  ...prev,
                                  [m.marker]: currentKb?.value || activeContribution.description || ''
                                }));
                              } else {
                                setSelectedMarkersForContribution(prev => prev.filter(x => x !== m.marker));
                              }
                            }}
                            className="mt-1 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <div className="text-xs">
                            <span className="font-black text-indigo-700 font-mono block">{m.marker}</span>
                            <span className="text-slate-800 font-bold block">{m.name}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Presente em: {m.docTitles.join(', ')}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setActiveContribution(null)}
                    className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => setContributionStep(2)}
                    disabled={selectedMarkersForContribution.length === 0}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs flex items-center gap-1.5"
                  >
                    <span>Avançar: Preencher Valores ({selectedMarkersForContribution.length})</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Dedicated Window/Input Per Selected Marker */}
            {contributionStep === 2 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-700">
                    Preencha o novo valor específico para cada marcador selecionado:
                  </p>
                  <button
                    onClick={() => setContributionStep(1)}
                    className="text-xs text-indigo-600 font-extrabold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <ArrowLeft size={14} /> Voltar à Seleção
                  </button>
                </div>

                <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
                  {selectedMarkersForContribution.map(markerTag => {
                    const markerInfo = allAvailableMarkers.find(m => m.marker === markerTag);
                    const currentKb = knowledgeRecords.find(k => k.title === markerInfo?.name || k.internalId === markerTag.replace(/[^a-zA-Z0-9_]/g, '_'));

                    return (
                      <div key={markerTag} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            {markerTag}
                          </span>
                          <span className="text-[10px] text-slate-400 font-bold">{markerInfo?.name}</span>
                        </div>

                        {currentKb?.value && (
                          <div className="text-[11px] text-slate-500 bg-white p-2 rounded border border-slate-200">
                            <span className="font-bold block text-slate-400 text-[9px] uppercase">Valor Atual no Dossiê:</span>
                            <span>{currentKb.value}</span>
                          </div>
                        )}

                        <div>
                          <label className="text-[10px] font-black uppercase text-slate-700 block mb-1">
                            Novo Valor para {markerTag}:
                          </label>
                          <textarea
                            rows={3}
                            value={markerTypedValues[markerTag] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMarkerTypedValues(prev => ({ ...prev, [markerTag]: val }));
                            }}
                            placeholder={`Insira o novo valor específico para ${markerTag}...`}
                            className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => setContributionStep(1)}
                    className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                  >
                    Voltar
                  </button>
                  <button
                    onClick={handleApplyContributionToSelectedMarkers}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
                  >
                    Gravar e Atualizar Dossiês
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: IMPORT WORD TEMPLATE */}
      {/* =================================================================== */}
      {showImportTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Importar Modelo Word / Marcadores</h3>
                <p className="text-xs text-slate-500">Mapeamento automático de [MARCADORES] entre colchetes.</p>
              </div>
              <button onClick={() => setShowImportTemplateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título do Modelo:</label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="Ex: Dossiê do IFA - Proteína Recombinante Liofilizada"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Grupo do Modelo:</label>
                  <select
                    value={templateGroup}
                    onChange={(e) => setTemplateGroup(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {modelGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Tipo de Documento:</label>
                  <input
                    type="text"
                    value={templateType}
                    onChange={(e) => setTemplateType(e.target.value)}
                    placeholder="Dossiê do IFA"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Cole o Texto do Modelo com [MARCADORES]:</label>
                <textarea
                  rows={5}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder="Cole o texto contendo marcadores entre colchetes como [NOME DA VACINA], [INDICAÇÃO]..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowImportTemplateModal(false)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportWordTemplate}
                disabled={!templateTitle.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Criar Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: CREATE / EDIT STRUCTURED TABLE */}
      {/* =================================================================== */}
      {showTableModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">
                  {editingTable ? 'Editar Tabela Estruturada' : 'Criar Nova Tabela Estruturada'}
                </h3>
                <p className="text-xs text-slate-500">Defina título, chave do marcador e preencha as linhas.</p>
              </div>
              <button onClick={() => setShowTableModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título da Tabela:</label>
                  <input
                    type="text"
                    value={tableTitleInput}
                    onChange={(e) => setTableTitleInput(e.target.value)}
                    placeholder="Tabela de Lotes Produzidos"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Chave / Marcador:</label>
                  <input
                    type="text"
                    value={tableKeyInput}
                    onChange={(e) => setTableKeyInput(e.target.value.toUpperCase())}
                    placeholder="TABLE_BATCHES"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Rows Interactive Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700">Registros / Linhas da Tabela:</label>
                  <button
                    onClick={() => setTableRowsInput(prev => [...prev, {}])}
                    className="text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Adicionar Linha
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-700">
                      <tr>
                        {tableColsInput.map(c => (
                          <th key={c.key} className="p-2.5 border-b border-slate-200">{c.label}</th>
                        ))}
                        <th className="p-2.5 border-b border-slate-200 text-center w-12">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {tableRowsInput.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {tableColsInput.map(col => (
                            <td key={col.key} className="p-2">
                              <input
                                type="text"
                                value={row[col.key] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setTableRowsInput(prev => {
                                    const next = [...prev];
                                    next[rowIdx] = { ...next[rowIdx], [col.key]: val };
                                    return next;
                                  });
                                }}
                                className="w-full p-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-none focus:border-teal-500"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center">
                            <button
                              onClick={() => setTableRowsInput(prev => prev.filter((_, idx) => idx !== rowIdx))}
                              className="p-1 text-rose-500 hover:text-rose-700 rounded-lg cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowTableModal(false)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveStructuredTable}
                disabled={!tableTitleInput.trim()}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Salvar Tabela
              </button>
            </div>
          </div>
        </div>
      )}
      {/* =================================================================== */}
      {/* MODAL: EDIT MODEL */}
      {/* =================================================================== */}
      {editingModelDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Editar Modelo de Documento</h3>
                <p className="text-xs text-slate-500">Altere as informações cadastrais e o grupo do modelo.</p>
              </div>
              <button onClick={() => setEditingModelDoc(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título do Modelo:</label>
                <input
                  type="text"
                  value={editModelTitle}
                  onChange={(e) => setEditModelTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Grupo:</label>
                  <select
                    value={editModelGroup}
                    onChange={(e) => setEditModelGroup(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    {modelGroups.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Tipo:</label>
                  <input
                    type="text"
                    value={editModelType}
                    onChange={(e) => setEditModelType(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Descrição:</label>
                <textarea
                  rows={3}
                  value={editModelDesc}
                  onChange={(e) => setEditModelDesc(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingModelDoc(null)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedModel}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: EDIT CONTRIBUTION */}
      {/* =================================================================== */}
      {editingContribution && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Editar Contribuição Regulatória</h3>
                <p className="text-xs text-slate-500">Altere dados da atividade/contribuição do projeto.</p>
              </div>
              <button onClick={() => setEditingContribution(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título da Atividade:</label>
                <input
                  type="text"
                  value={editingContribution.title || ''}
                  onChange={(e) => setEditingContribution({ ...editingContribution, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Descrição do Impacto Regulatório:</label>
                <textarea
                  rows={3}
                  value={editingContribution.description || ''}
                  onChange={(e) => setEditingContribution({ ...editingContribution, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Responsável:</label>
                  <input
                    type="text"
                    value={editingContribution.assignee || ''}
                    onChange={(e) => setEditingContribution({ ...editingContribution, assignee: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Fase / Etapa:</label>
                  <input
                    type="text"
                    value={editingContribution.phase || ''}
                    onChange={(e) => setEditingContribution({ ...editingContribution, phase: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">URL da Evidência:</label>
                  <input
                    type="text"
                    value={editingContribution.evidenceUrl || ''}
                    onChange={(e) => setEditingContribution({ ...editingContribution, evidenceUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Nome do Anexo:</label>
                  <input
                    type="text"
                    value={editingContribution.evidenceFileName || ''}
                    onChange={(e) => setEditingContribution({ ...editingContribution, evidenceFileName: e.target.value })}
                    placeholder="Laudo_LP01.pdf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingContribution(null)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEditedContribution}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD CUSTOM CONTRIBUTION */}
      {/* =================================================================== */}
      {showAddContributionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Nova Contribuição Regulatória</h3>
                <p className="text-xs text-slate-500">Registre uma nova atividade para preenchimento de dossiê.</p>
              </div>
              <button onClick={() => setShowAddContributionModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título da Atividade / Contribuição:</label>
                <input
                  type="text"
                  value={newContribTitle}
                  onChange={(e) => setNewContribTitle(e.target.value)}
                  placeholder="Ex: Resultados do Ensaio de Potência do Lote LP-003"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Descrição das Alterações Regulatórias:</label>
                <textarea
                  rows={3}
                  value={newContribDesc}
                  onChange={(e) => setNewContribDesc(e.target.value)}
                  placeholder="Detalhamento do impacto regulatório e novos dados coletados..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Responsável:</label>
                  <input
                    type="text"
                    value={newContribAssignee}
                    onChange={(e) => setNewContribAssignee(e.target.value)}
                    placeholder={currentUser || 'Responsável Técnico'}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Fase / Etapa:</label>
                  <input
                    type="text"
                    value={newContribPhase}
                    onChange={(e) => setNewContribPhase(e.target.value)}
                    placeholder="Desenvolvimento"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Link da Evidência (URL):</label>
                  <input
                    type="text"
                    value={newContribEvidenceUrl}
                    onChange={(e) => setNewContribEvidenceUrl(e.target.value)}
                    placeholder="https://sharepoint..."
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Nome do Arquivo:</label>
                  <input
                    type="text"
                    value={newContribEvidenceFileName}
                    onChange={(e) => setNewContribEvidenceFileName(e.target.value)}
                    placeholder="Laudo_LP003.pdf"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddContributionModal(false)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCustomContribution}
                disabled={!newContribTitle.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Cadastrar Contribuição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD CHAPTER */}
      {/* =================================================================== */}
      {showAddChapterModal && targetDocForNewChapter && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Novo Capítulo no Modelo</h3>
                <p className="text-xs text-slate-500">Adicione um novo capítulo ao documento "{targetDocForNewChapter.title}".</p>
              </div>
              <button onClick={() => setShowAddChapterModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Código:</label>
                  <input
                    type="text"
                    value={newChapterCode}
                    onChange={(e) => setNewChapterCode(e.target.value)}
                    placeholder="2.0"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título do Capítulo:</label>
                  <input
                    type="text"
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder="Ex: 2. Controle do Insumo Farmacêutico Ativo"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Descrição (Opcional):</label>
                <textarea
                  rows={2}
                  value={newChapterDesc}
                  onChange={(e) => setNewChapterDesc(e.target.value)}
                  placeholder="Orientações técnicas sobre este capítulo..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddChapterModal(false)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewChapter}
                disabled={!newChapterTitle.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Adicionar Capítulo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: ADD ITEM OR CUSTOM TABLE TO CHAPTER */}
      {/* =================================================================== */}
      {showAddItemModal && targetDocForNewItem && targetChapterForNewItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Adicionar Item ou Tabela Customizada</h3>
                <p className="text-xs text-slate-500">Capítulo: {targetChapterForNewItem.title}</p>
              </div>
              <button onClick={() => setShowAddItemModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Tipo de Elemento:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewItemType('Informação Estruturada')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      newItemType === 'Informação Estruturada'
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Texto / Marcador
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('Tabela')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      newItemType === 'Tabela'
                        ? 'bg-teal-50 border-teal-500 text-teal-700 ring-2 ring-teal-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Tabela Estruturada
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewItemType('Narrativa')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      newItemType === 'Narrativa'
                        ? 'bg-purple-50 border-purple-500 text-purple-700 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Narrativa / Texto Longo
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Nome do Item / Seção:</label>
                <input
                  type="text"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Tabela de Resultados de Potência"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Identificador / Marcador entre Colchetes:</label>
                <input
                  type="text"
                  value={newItemMarker}
                  onChange={(e) => setNewItemMarker(e.target.value.toUpperCase())}
                  placeholder="[TABELA_POTENCIA]"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              {newItemType === 'Tabela' && (
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Modelo de Tabela Pré-existente (Opcional):</label>
                  <select
                    value={newItemPresetKey}
                    onChange={(e) => setNewItemPresetKey(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">-- Criar Tabela Genérica (2 Colunas) --</option>
                    {tableTemplates.map(t => (
                      <option key={t.key} value={t.key}>{t.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Orientações de Preenchimento:</label>
                <textarea
                  rows={2}
                  value={newItemDesc}
                  onChange={(e) => setNewItemDesc(e.target.value)}
                  placeholder="Instruções para a pessoa que for preencher..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewItem}
                disabled={!newItemName.trim()}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Adicionar ao Modelo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: EDIT DOSSIER ITEM TABLE DATA DIRECTLY */}
      {/* =================================================================== */}
      {editingTableItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-base text-slate-900">Preencher / Editar Tabela no Dossiê</h3>
                <p className="text-xs text-slate-500">Edite o título, adicione colunas e preencha as linhas livremente.</p>
              </div>
              <button onClick={() => setEditingTableItem(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título da Tabela:</label>
                <input
                  type="text"
                  value={itemTableTitle}
                  onChange={(e) => setItemTableTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Colunas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700">Colunas da Tabela:</label>
                  <button
                    type="button"
                    onClick={() => {
                      const nextKey = `col_${Date.now()}`;
                      setItemTableCols(prev => [...prev, { key: nextKey, label: `Nova Coluna ${prev.length + 1}`, type: 'text' }]);
                    }}
                    className="text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Adicionar Coluna</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {itemTableCols.map((col, cIdx) => (
                    <div key={col.key || cIdx} className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                      <input
                        type="text"
                        value={col.label}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemTableCols(prev => prev.map((c, i) => i === cIdx ? { ...c, label: val } : c));
                        }}
                        className="w-full p-1 bg-white border border-slate-200 rounded text-xs font-bold"
                        placeholder="Nome da coluna"
                      />
                      {itemTableCols.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setItemTableCols(prev => prev.filter((_, i) => i !== cIdx))}
                          className="text-slate-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Linhas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-black uppercase text-slate-700">Linhas de Dados:</label>
                  <button
                    type="button"
                    onClick={() => setItemTableRows(prev => [...prev, {}])}
                    className="text-xs font-extrabold text-teal-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={13} />
                    <span>Adicionar Linha</span>
                  </button>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-700">
                      <tr>
                        {itemTableCols.map(col => (
                          <th key={col.key} className="p-2 border-b border-slate-200">{col.label}</th>
                        ))}
                        <th className="p-2 border-b border-slate-200 w-10 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {itemTableRows.map((row, rIdx) => (
                        <tr key={rIdx}>
                          {itemTableCols.map(col => (
                            <td key={col.key} className="p-2">
                              <input
                                type="text"
                                value={row[col.key] || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setItemTableRows(prev => prev.map((r, i) => i === rIdx ? { ...r, [col.key]: val } : r));
                                }}
                                placeholder="Preencha..."
                                className="w-full p-1 bg-white border border-slate-200 rounded text-xs font-medium focus:outline-none focus:border-teal-500"
                              />
                            </td>
                          ))}
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => setItemTableRows(prev => prev.filter((_, i) => i !== rIdx))}
                              className="text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTableItem(null)}
                className="px-4 py-2 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveEditTableItem}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-xs"
              >
                Salvar Tabela no Dossiê
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
