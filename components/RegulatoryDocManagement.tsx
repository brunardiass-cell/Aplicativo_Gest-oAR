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
  ListCheck
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
  hasAdminAccess = true
}) => {
  // Main User Navigation Tabs focused on Regulatory Document Templates
  const [activeTab, setActiveTab] = useState<
    'dossier_viewer' | 'pending_contributions' | 'template_manager' | 'tables_and_attachments' | 'export_and_traceability'
  >('dossier_viewer');

  // Selected Project Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : 'all'
  );

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Selected Document ID in Dossier Viewer
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  // Search Query Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Chapter Accordion Expand/Collapse State
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

  // Pending Contribution Classification Drawer/Modal State
  const [activeContribution, setActiveContribution] = useState<any | null>(null);
  const [selectedMarkersForContribution, setSelectedMarkersForContribution] = useState<string[]>([]);
  const [contributionContentType, setContributionContentType] = useState<'text_short' | 'text_long' | 'table' | 'link' | 'file'>('text_long');
  const [contributionContentValue, setContributionContentValue] = useState('');

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

  // Default Presets for Regulatory Document Templates
  const defaultDocs = useMemo<RegulatoryDocument[]>(() => {
    if (regulatoryDocs.length > 0) return regulatoryDocs;
    
    return projects.map(proj => [
      {
        id: `doc_vacina_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê da Vacina',
        type: 'Dossiê do Produto Final',
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
          },
          {
            id: 'cap_3',
            code: '3.0',
            title: '3. Desenvolvimento e Controle de Qualidade',
            description: 'Processo de fabricação e liberação de lotes',
            items: [
              { 
                id: 'item_3_1', 
                code: '3.1',
                name: 'Texto Desenvolvimento do IFA', 
                description: 'Etapas de fermentação e purificação cromatográfica',
                type: 'Narrativa' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'NARRATIVE.IFA_DEV', 
                status: 'Em preenchimento' as RegulatoryDocItemStatus, 
                marker: '[TEXTO DESENVOLVIMENTO DO IFA]',
                value: 'Desenvolvimento do bioprocesso em biorreator de 50L com purificação por afinidade.'
              },
              { 
                id: 'item_3_2', 
                code: '3.2',
                name: 'Relatório de Controle de Qualidade', 
                description: 'Laudos microbiológicos e de esterilidade',
                type: 'Anexo' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'QC.REPORT', 
                status: 'Vazio' as RegulatoryDocItemStatus, 
                marker: '[RELATÓRIO DE CONTROLE DE QUALIDADE]',
                value: ''
              }
            ]
          },
          {
            id: 'cap_4',
            code: '4.0',
            title: '4. Estabilidade e Conservação',
            description: 'Acompanhamento de validade e condições de refrigeração',
            items: [
              { 
                id: 'item_4_1', 
                code: '4.1',
                name: 'Temperatura de Armazenamento', 
                description: 'Condições recomendadas de estocagem',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'PRODUCT.STORAGE_TEMP', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[TEMPERATURA DE ARMAZENAMENTO]',
                value: 'Conservar sob refrigeração entre +2°C e +8°C, protegido da luz. Não congelar.'
              },
              { 
                id: 'item_4_2', 
                code: '4.2',
                name: 'Tabela de Estabilidade', 
                description: 'Resumo dos ensaios sob refrigeração e acelerado',
                type: 'Tabela' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'STABILITY.TABLE', 
                status: 'Preenchido' as RegulatoryDocItemStatus, 
                marker: '[TABELA DE ESTABILIDADE]',
                value: 'Tabela de Resumo de Estabilidade (2 lotes testados)'
              }
            ]
          }
        ]
      },
      {
        id: `doc_ifa_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do IFA',
        type: 'Dossiê do IFA',
        description: 'Dados técnicos, rota sintética e controle de qualidade do Insumo Farmacêutico Ativo.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        versionHistory: [
          { version: '0.1', date: new Date().toISOString(), status: 'Rascunho', author: currentUser, notes: 'Abertura do dossiê de IFA' }
        ],
        chapters: [
          {
            id: 'cap_ifa_1',
            code: '1.0',
            title: '1. Caracterização do IFA',
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
              },
              { 
                id: 'item_ifa_1_2', 
                code: '1.2',
                name: 'Texto Desenvolvimento do IFA', 
                description: 'Fluxograma de purificação e inativação viral',
                type: 'Narrativa' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'NARRATIVE.IFA_DEV', 
                status: 'Em preenchimento' as RegulatoryDocItemStatus, 
                marker: '[TEXTO DESENVOLVIMENTO DO IFA]',
                value: 'Desenvolvimento do bioprocesso em biorreator de 50L com purificação por afinidade.'
              }
            ]
          }
        ]
      },
      {
        id: `doc_adj_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do Adjuvante',
        type: 'Dossiê do Adjuvante',
        description: 'Informações de composição, esterilidade e segurança do sistema adjuvante.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_adj_1',
            code: '1.0',
            title: '1. Especificações do Adjuvante',
            description: 'Identificação química, emulsão e testes de segurança',
            items: [
              {
                id: 'item_adj_1_1',
                code: '1.1',
                name: 'Nome do Adjuvante',
                description: 'Identificação dos lipídios / sais de alumínio e proporção por dose',
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
        id: `doc_brochura_${proj.id}`,
        projectId: proj.id,
        title: 'Brochura do Investigador',
        type: 'Brochura do Investigador',
        description: 'Compilação de dados clínicos e de segurança para os investigadores do ensaio.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_ib_1',
            code: '1.0',
            title: '1. Resumo Executivo e Racional Científico',
            description: 'Contexto epidemiológico e justificativa para a formulação',
            items: [
              {
                id: 'item_ib_1_1',
                code: '1.1',
                name: 'Nome e Identificação da Vacina',
                description: 'Denominação da vacina',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.NAME',
                status: 'Preenchido' as RegulatoryDocItemStatus,
                marker: '[NOME DA VACINA]',
                value: 'Vacina Malária Recombinante - UniMaV-01'
              },
              {
                id: 'item_ib_1_2',
                code: '1.2',
                name: 'Indicação Terapêutica',
                description: 'Alvo clínico e indicação',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.INDICATION',
                status: 'Preenchido' as RegulatoryDocItemStatus,
                marker: '[INDICAÇÃO]',
                value: 'Imunização ativa para prevenção da malária clínica por Plasmodium falciparum em indivíduos a partir de 2 anos de idade.'
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
              },
              {
                id: 'item_deec_1_2',
                code: '1.2',
                name: 'Via de Administração',
                description: 'Modo de aplicação',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.ADMINISTRATION_ROUTE',
                status: 'Em preenchimento' as RegulatoryDocItemStatus,
                marker: '[VIA DE ADM]',
                value: 'Intramuscular (IM), aplicada no músculo deltoide na dose de 0.5 mL.'
              }
            ]
          }
        ]
      },
      {
        id: `doc_ddcm_${proj.id}`,
        projectId: proj.id,
        title: 'DDCM - Dossiê de Desenvolvimento Clínico',
        type: 'DDCM',
        description: 'Mapeamento consolidado de todas as fases do desenvolvimento para submissão Anvisa.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_ddcm_1',
            code: '1.0',
            title: '1. Pleno Desenvolvimento e Qualidade do Produto',
            description: 'Estratégia regulatória e cadeia de suprimento',
            items: [
              {
                id: 'item_ddcm_1_1',
                code: '1.1',
                name: 'Nome da Vacina',
                description: 'Denominação comercial',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.NAME',
                status: 'Preenchido' as RegulatoryDocItemStatus,
                marker: '[NOME DA VACINA]',
                value: 'Vacina Malária Recombinante - UniMaV-01'
              },
              {
                id: 'item_ddcm_1_2',
                code: '1.2',
                name: 'Indicação',
                description: 'Descrição da indicação',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.INDICATION',
                status: 'Preenchido' as RegulatoryDocItemStatus,
                marker: '[INDICAÇÃO]',
                value: 'Imunização ativa para prevenção da malária clínica por Plasmodium falciparum em indivíduos a partir de 2 anos de idade.'
              }
            ]
          }
        ]
      }
    ]).flat();
  }, [regulatoryDocs, projects, currentUser]);

  // Effective Documents State
  const [docState, setDocState] = useState<RegulatoryDocument[]>(defaultDocs);

  const effectiveDocs = useMemo(() => {
    return docState.length > 0 ? docState : defaultDocs;
  }, [docState, defaultDocs]);

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

  // Central Knowledge Base (Background Single Source of Truth)
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
        { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.1', itemName: 'Nome e Identificação da Vacina' },
        { docId: 'doc_brochura', docTitle: 'Brochura do Investigador', itemCode: '1.1', itemName: 'Nome da Vacina' },
        { docId: 'doc_deec', docTitle: 'DEEC', itemCode: '1.1', itemName: 'Nome da Vacina' },
        { docId: 'doc_ddcm', docTitle: 'DDCM', itemCode: '1.1', itemName: 'Nome da Vacina' }
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
        { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.2', itemName: 'Indicação Terapêutica' },
        { docId: 'doc_brochura', docTitle: 'Brochura do Investigador', itemCode: '1.2', itemName: 'Indicação' },
        { docId: 'doc_ddcm', docTitle: 'DDCM', itemCode: '1.2', itemName: 'Indicação' }
      ]
    },
    {
      id: 'kb_3',
      projectId: activeProject?.id || 'p1',
      internalId: 'IFA.NAME',
      category: 'Informações Estruturadas',
      title: 'Descrição e Nome do IFA',
      value: 'Proteína Recombinante Pfs25 / MSP1-19 expressa em Pichia pastoris',
      origin: 'Bancada de Biologia Molecular',
      updatedAt: new Date().toISOString(),
      version: 1,
      usedInDocs: [
        { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '2.1', itemName: 'Descrição e Nome do IFA' },
        { docId: 'doc_ifa', docTitle: 'Dossiê do IFA', itemCode: '1.1', itemName: 'Descrição e Nome do IFA' }
      ]
    },
    {
      id: 'kb_4',
      projectId: activeProject?.id || 'p1',
      internalId: 'ADJUVANT.NAME',
      category: 'Informações Estruturadas',
      title: 'Nome do Adjuvante e Emulsão',
      value: 'Emulsão de Esqualeno com QS-21 (Adjuvante L30-Adjuv)',
      origin: 'Formulação de Adjuvante',
      updatedAt: new Date().toISOString(),
      version: 1,
      usedInDocs: [
        { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '2.2', itemName: 'Nome do Adjuvante' },
        { docId: 'doc_adj', docTitle: 'Dossiê do Adjuvante', itemCode: '1.1', itemName: 'Nome do Adjuvante' }
      ]
    }
  ]);

  // Extract All Unique Bracket Markers Across All Models
  const allAvailableMarkers = useMemo(() => {
    const map = new Map<string, { marker: string; name: string; docTitles: string[] }>();

    effectiveDocs.forEach(doc => {
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
          const markerKey = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;
          if (!map.has(markerKey)) {
            map.set(markerKey, { marker: markerKey, name: item.name, docTitles: [doc.title] });
          } else {
            const existing = map.get(markerKey)!;
            if (!existing.docTitles.includes(doc.title)) {
              existing.docTitles.push(doc.title);
            }
          }
        });
      });
    });

    return Array.from(map.values());
  }, [effectiveDocs]);

  // Pending Contributions List from Projects module
  const projectPendingContributions = useMemo(() => {
    const list: any[] = [];

    // 1. Microactivities with regulatory contributions
    projects.forEach(proj => {
      if (selectedProjectId !== 'all' && proj.id !== selectedProjectId) return;

      proj.macroActivities.forEach(macro => {
        macro.microActivities.forEach(micro => {
          if (micro.generatesRegulatoryContent || micro.evidenceUrl || micro.reportLink || micro.observations || micro.dossierContribution) {
            list.push({
              id: micro.id,
              projectId: proj.id,
              projectName: proj.name,
              macroName: macro.name,
              phase: macro.phase,
              title: micro.name,
              description: micro.evidenceDescription || micro.observations || `Contribuição gerada pela microatividade: ${micro.name}`,
              status: micro.status,
              assignee: micro.assignee || 'Não atribuído',
              evidenceUrl: micro.evidenceUrl || micro.reportLink,
              evidenceFileName: micro.evidenceFileName,
              updatedAt: micro.dueDate || new Date().toISOString()
            });
          }
        });
      });
    });

    // 2. Standalone tasks with regulatory contributions
    tasks.filter(t => 
      (selectedProjectId === 'all' || t.project === activeProject?.name || t.project === selectedProjectId) &&
      (t.generatesRegulatoryContent || t.dossierContribution)
    ).forEach(t => {
      list.push({
        id: t.id,
        projectId: activeProject?.id,
        projectName: t.project,
        macroName: 'Geral',
        phase: 'Execução',
        title: t.activity,
        description: t.description || 'Contribuição regulatória registrada em tarefa',
        status: t.status,
        assignee: t.projectLead || 'Não atribuído',
        updatedAt: t.completionDate || t.plannedStartDate || new Date().toISOString()
      });
    });

    return list;
  }, [projects, tasks, selectedProjectId, activeProject]);

  // Completeness Metrics for Dashboard
  const completenessMetrics = useMemo(() => {
    let totalItems = 0;
    let emptyItems = 0; // Vazio
    let inProgressItems = 0; // Em preenchimento
    let filledItems = 0; // Preenchido
    let approvedItems = 0; // Aprovado
    let divergentItems = 0; // Divergente

    currentProjectDocs.forEach(doc => {
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
          totalItems++;
          const status = item.status || 'Vazio';
          if (status === 'Vazio' || status === 'Faltando' || (!item.value && !item.evidenceUrl)) {
            emptyItems++;
          } else if (status === 'Em preenchimento' || status === 'Em Andamento' || status === 'Pendente') {
            inProgressItems++;
          } else if (status === 'Preenchido' || status === 'Concluído') {
            filledItems++;
          } else if (status === 'Aprovado' || status === 'Pronto') {
            approvedItems++;
          } else if (status === 'Divergente') {
            divergentItems++;
          } else {
            filledItems++;
          }
        });
      });
    });

    const readyOrFilled = filledItems + approvedItems;
    const percent = totalItems > 0 ? Math.round((readyOrFilled / totalItems) * 100) : 0;

    return {
      totalItems,
      emptyItems,
      inProgressItems,
      filledItems,
      approvedItems,
      divergentItems,
      readyOrFilled,
      percent
    };
  }, [currentProjectDocs]);

  // Handle Fill/Update Item in Document (Reusable across documents)
  const handleSaveFillItem = (overrideValue?: string, targetDocs?: string[]) => {
    if (!selectedItemForFill) return;

    const valToSave = overrideValue !== undefined ? overrideValue : fillValue;
    const marker = selectedItemForFill.item.marker || `[${selectedItemForFill.item.name.toUpperCase().replace(/\s+/g, '_')}]`;

    // Update state of all or selected documents using this marker
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

    // Also update Central Knowledge Bank
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

  // Save Contribution with Conflict Resolution check
  const handleApplyContributionToSelectedMarkers = () => {
    if (!activeContribution || selectedMarkersForContribution.length === 0) return;

    const newValue = contributionContentValue.trim();
    if (!newValue) return;

    // Check if any selected marker already has a conflicting value
    let hasConflict = false;
    let conflictingMarker = '';
    let existingVal = '';

    for (const marker of selectedMarkersForContribution) {
      // Find current value in documents or KB
      for (const doc of effectiveDocs) {
        for (const chap of doc.chapters) {
          for (const item of chap.items) {
            const itemMarker = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;
            if (itemMarker === marker && item.value && item.value.trim() !== '' && item.value.trim() !== newValue) {
              hasConflict = true;
              conflictingMarker = marker;
              existingVal = item.value;
              break;
            }
          }
          if (hasConflict) break;
        }
        if (hasConflict) break;
      }
      if (hasConflict) break;
    }

    if (hasConflict) {
      // Show Conflict Modal!
      setConflictModalData({
        marker: conflictingMarker,
        itemName: conflictingMarker,
        currentValue: existingVal,
        currentOrigin: 'Registro Anterior no Dossiê',
        newValue: newValue,
        newOrigin: `${activeContribution.projectName} / ${activeContribution.title} (${activeContribution.assignee})`,
        targetDocIds: effectiveDocs.map(d => d.id)
      });
      return;
    }

    // Direct apply if no conflict
    applyContributionValue(selectedMarkersForContribution, newValue, activeContribution);
  };

  const applyContributionValue = (markers: string[], val: string, contributionObj: any, docIdsToUpdate?: string[]) => {
    const updatedDocs = docState.map(doc => {
      if (docIdsToUpdate && !docIdsToUpdate.includes(doc.id)) return doc;

      const updatedChapters = doc.chapters.map(chap => {
        const updatedItems = chap.items.map(item => {
          const itemMarker = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;
          if (markers.includes(itemMarker)) {
            return {
              ...item,
              value: val,
              status: 'Preenchido' as RegulatoryDocItemStatus,
              evidenceUrl: contributionObj?.evidenceUrl || item.evidenceUrl,
              evidenceFileName: contributionObj?.evidenceFileName || item.evidenceFileName,
              notes: `Preenchido via contribuição da atividade: ${contributionObj?.title || 'Atividade do Projeto'}`
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

    setActiveContribution(null);
    setSelectedMarkersForContribution([]);
    setContributionContentValue('');
    setConflictModalData(null);
  };

  // Import Word Template with Markers Parsing
  const handleImportWordTemplate = () => {
    if (!templateTitle.trim()) return;

    // Parse all bracketed tags inside text like [NOME DA VACINA], [INDICAÇÃO], etc.
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
      description: templateDescription.trim() || 'Modelo regulatório criado por importação de marcadores entre colchetes.',
      currentVersion: '0.1',
      currentVersionStatus: 'Rascunho',
      updatedAt: new Date().toISOString(),
      chapters: [
        {
          id: `cap_imp_${Date.now()}`,
          code: '1.0',
          title: '1. Itens e Conteúdos do Modelo',
          description: 'Estrutura gerada a partir dos marcadores identificados',
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

    setShowImportTemplateModal(false);
    setTemplateTitle('');
    setTemplateText('');
    setTemplateDescription('');
  };

  // Export Full Regulatory Database to Excel (.xlsx) with 5 Sheets
  const handleExportExcelDatabase = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Itens Regulatórios
    const itemsData = knowledgeRecords.map(r => ({
      'Identificador Interno': r.internalId,
      'Marcador': r.internalId ? `[${r.internalId}]` : '-',
      'Nome do Item': r.title,
      'Valor': typeof r.value === 'object' ? JSON.stringify(r.value) : (r.value || ''),
      'Tipo': r.category,
      'Status': r.usedInDocs && r.usedInDocs.length > 0 ? 'Preenchido' : 'Vazio',
      'Versão': r.version,
      'Origem': r.origin,
      'Responsável': currentUser,
      'Data de Atualização': new Date(r.updatedAt).toLocaleString('pt-BR')
    }));
    const wsItems = XLSX.utils.json_to_sheet(itemsData);
    XLSX.utils.book_append_sheet(wb, wsItems, 'Itens Regulatórios');

    // Sheet 2: Uso nos Documentos
    const docUsageData: any[] = [];
    currentProjectDocs.forEach(doc => {
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
          docUsageData.push({
            'Identificador Interno': item.sourceInternalId || item.code || '-',
            'Documento': doc.title,
            'Capítulo': chap.title,
            'Subcapítulo': chap.code || '-',
            'Posição no Modelo': item.code || '-',
            'Marcador': item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`,
            'Status no Documento': item.status || 'Vazio'
          });
        });
      });
    });
    const wsDocUsage = XLSX.utils.json_to_sheet(docUsageData);
    XLSX.utils.book_append_sheet(wb, wsDocUsage, 'Uso nos Documentos');

    // Sheet 3: Evidências e Anexos
    const evidenceData = projectPendingContributions.map(c => ({
      'Título': c.title,
      'Tipo': c.evidenceFileName ? 'Arquivo / Anexo' : 'Link / Evidência',
      'Link ou Nome do Arquivo': c.evidenceUrl || c.evidenceFileName || '-',
      'Projeto': c.projectName,
      'Macroatividade': c.macroName,
      'Microatividade': c.title,
      'Responsável': c.assignee,
      'Data': new Date(c.updatedAt).toLocaleDateString('pt-BR')
    }));
    const wsEvidence = XLSX.utils.json_to_sheet(evidenceData.length > 0 ? evidenceData : [
      { 'Título': 'Laudo Microbiológico LP-001', 'Tipo': 'Arquivo', 'Link ou Nome do Arquivo': 'laudo_esterilidade.pdf', 'Projeto': activeProject?.name || 'Projeto', 'Macroatividade': 'Controle de Qualidade', 'Microatividade': 'Esterilidade', 'Responsável': currentUser, 'Data': new Date().toLocaleDateString('pt-BR') }
    ]);
    XLSX.utils.book_append_sheet(wb, wsEvidence, 'Evidências e Anexos');

    // Sheet 4: Tabelas
    const tablesData = structuredTables.map(t => ({
      'Nome da Tabela': t.title,
      'Arquivo / Chave': t.key ? `${t.key}.xlsx` : 'Tabela Estruturada',
      'Categoria': 'Dados Estruturados',
      'Origem': t.description || 'Cadastro Interno',
      'Versão': '1.0',
      'Documentos Vinculados': 'Dossiê da Vacina, DDCM'
    }));
    const wsTables = XLSX.utils.json_to_sheet(tablesData);
    XLSX.utils.book_append_sheet(wb, wsTables, 'Tabelas');

    // Sheet 5: Histórico de Alterações
    const historyData: any[] = [];
    knowledgeRecords.forEach(rec => {
      (rec.history || []).forEach(h => {
        historyData.push({
          'Item': rec.title,
          'Valor Anterior': '-',
          'Valor Novo': typeof h.value === 'object' ? JSON.stringify(h.value) : String(h.value),
          'Data': new Date(h.updatedAt).toLocaleString('pt-BR'),
          'Usuário': h.author || 'Usuário',
          'Justificativa': h.notes || 'Atualização de conteúdo regulatório',
          'Documentos Afetados': (rec.usedInDocs || []).map(d => d.docTitle).join(', ') || 'Todos os Documentos'
        });
      });
    });
    const wsHistory = XLSX.utils.json_to_sheet(historyData.length > 0 ? historyData : [
      { 'Item': 'Nome da Vacina', 'Valor Anterior': 'Vacina Malária R-01', 'Valor Novo': 'Vacina Malária Recombinante - UniMaV-01', 'Data': new Date().toLocaleString('pt-BR'), 'Usuário': currentUser, 'Justificativa': 'Ajuste de denominação oficial', 'Documentos Afetados': 'Dossiê da Vacina, DDCM, Brochura' }
    ]);
    XLSX.utils.book_append_sheet(wb, wsHistory, 'Histórico de Alterações');

    // Download File
    XLSX.writeFile(wb, `Banco_Regulatorio_${activeProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Projetos'}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Export JSON Database
  const handleExportJSONDatabase = () => {
    const payload = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser,
        system: 'Assistente do Preenchimento de Modelos Regulatórios',
        project: activeProject?.name || 'Todos os Projetos'
      },
      completenessMetrics,
      documents: currentProjectDocs,
      knowledgeRecords,
      structuredTables
    };

    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Banco_Regulatorio_${activeProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Projetos'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Render Status Badge for Document Items
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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                Assistente de Preenchimento Regulatório
              </span>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-emerald-500/30">
                Reutilização Automática Multi-Documentos
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <FileText className="text-amber-400" size={32} />
              Modelos e Dossiês Regulatórios
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-3xl leading-relaxed">
              Gerencie modelos de documentos (Dossiê da Vacina, IFA, Adjuvante, DDCM, Brochura e DEEC), acompanhe o preenchimento por capítulos/marcadores e vincule contribuições diretas das atividades dos projetos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Project Selector */}
            <div className="flex items-center gap-2 bg-slate-800/90 p-2 rounded-2xl border border-slate-700 shadow-inner">
              <span className="text-[10px] font-black uppercase text-amber-400 px-2">Projeto:</span>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="bg-slate-900 text-white font-extrabold px-3 py-1.5 rounded-xl border border-slate-700 outline-none text-xs cursor-pointer"
              >
                <option value="all">Todos os Projetos</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportExcelDatabase}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <FileSpreadsheet size={16} /> Exportar Banco (Excel)
            </button>
          </div>
        </div>

        {/* Realtime Completeness Metrics Row */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-6 gap-3">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Completude Geral</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-400">{completenessMetrics.percent}%</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Total de Itens</span>
            <span className="text-xl font-black text-white mt-1 block">{completenessMetrics.totalItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Vazios (✖)</span>
            <span className="text-xl font-black text-rose-400 mt-1 block">{completenessMetrics.emptyItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Em Preenchimento (⚠)</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">{completenessMetrics.inProgressItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Preenchidos (✔)</span>
            <span className="text-xl font-black text-blue-400 mt-1 block">{completenessMetrics.filledItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Contribuições Pendentes</span>
            <span className="text-xl font-black text-indigo-300 mt-1 block">{projectPendingContributions.length}</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('dossier_viewer')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'dossier_viewer'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree size={16} />
          <span>Visualizador do Dossiê</span>
        </button>

        <button
          onClick={() => setActiveTab('pending_contributions')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer relative ${
            activeTab === 'pending_contributions'
              ? 'bg-indigo-600 text-white shadow-md'
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
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'template_manager'
              ? 'bg-slate-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileCode size={16} />
          <span>Modelos & Importação Word</span>
        </button>

        <button
          onClick={() => setActiveTab('tables_and_attachments')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'tables_and_attachments'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TableIcon size={16} />
          <span>Tabelas & Anexos</span>
        </button>

        <button
          onClick={() => setActiveTab('export_and_traceability')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'export_and_traceability'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Download size={16} />
          <span>Exportação & Rastreabilidade</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: VISUALIZADOR DO DOSSIÊ (CENTRAL DOCUMENT VIEW) */}
      {/* =================================================================== */}
      {activeTab === 'dossier_viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column: Document Models Selector */}
          <div className="space-y-4 lg:col-span-1">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                <span>Modelos de Documento</span>
                <span className="text-[10px] text-slate-400 font-bold">{currentProjectDocs.length} disponíveis</span>
              </h3>

              <div className="space-y-2">
                {currentProjectDocs.map(doc => {
                  const isActive = activeDoc?.id === doc.id;
                  
                  // Calculate doc completeness
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
                      className={`w-full text-left p-4 rounded-2xl border transition cursor-pointer ${
                        isActive
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-extrabold text-xs text-slate-900 block leading-snug">{doc.title}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          docPercent === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {docPercent}%
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-1 font-medium">{doc.type}</span>

                      {/* Progress bar */}
                      <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
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
          </div>

          {/* Right Column: Active Document Viewer (Document -> Chapters -> Subchapters -> Items) */}
          <div className="lg:col-span-3 space-y-4">
            {activeDoc ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
                {/* Active Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 text-[10px] font-black uppercase rounded-full border border-indigo-200">
                        {activeDoc.type}
                      </span>
                      <span className="text-xs text-slate-400 font-bold">Versão {activeDoc.currentVersion} ({activeDoc.currentVersionStatus})</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">{activeDoc.title}</h2>
                    <p className="text-xs text-slate-500 font-medium">{activeDoc.description}</p>
                  </div>

                  {/* Search filter inside document */}
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Buscar marcadores..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Chapters & Items List in exact Model Order */}
                <div className="space-y-6">
                  {activeDoc.chapters.map((chapter) => {
                    const isExpanded = expandedChapters[chapter.id] ?? true;

                    // Filter items by search
                    const filteredItems = chapter.items.filter(item => 
                      !searchQuery.trim() || 
                      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      (item.marker && item.marker.toLowerCase().includes(searchQuery.toLowerCase())) ||
                      (item.value && item.value.toLowerCase().includes(searchQuery.toLowerCase()))
                    );

                    if (searchQuery.trim() && filteredItems.length === 0) return null;

                    return (
                      <div key={chapter.id} className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                        {/* Chapter Title Bar */}
                        <button
                          onClick={() => setExpandedChapters(prev => ({ ...prev, [chapter.id]: !isExpanded }))}
                          className="w-full p-4 bg-slate-50 hover:bg-slate-100/80 transition flex items-center justify-between cursor-pointer border-b border-slate-200/60"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown size={18} className="text-slate-500" /> : <ChevronRight size={18} className="text-slate-500" />}
                            <span className="font-extrabold text-sm text-slate-900">{chapter.title}</span>
                          </div>
                          <span className="text-[10px] font-black text-slate-500 px-2.5 py-1 bg-white rounded-lg border border-slate-200">
                            {filteredItems.length} itens
                          </span>
                        </button>

                        {/* Items inside Chapter */}
                        {isExpanded && (
                          <div className="p-4 sm:p-6 space-y-4 bg-white">
                            {filteredItems.map((item) => {
                              const isFilled = item.value && item.value.trim() !== '' && item.status !== 'Vazio';
                              const markerTag = item.marker || `[${item.name.toUpperCase().replace(/\s+/g, '_')}]`;

                              return (
                                <div
                                  key={item.id}
                                  className={`p-4 sm:p-5 rounded-2xl border transition ${
                                    isFilled
                                      ? 'bg-slate-50/50 border-slate-200'
                                      : 'bg-amber-50/30 border-dashed border-amber-300'
                                  }`}
                                >
                                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                    <div className="space-y-1.5 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100 font-mono">
                                          {markerTag}
                                        </span>
                                        {renderItemStatusBadge(item.status)}
                                      </div>
                                      <h4 className="font-extrabold text-sm text-slate-900">{item.code ? `${item.code} - ` : ''}{item.name}</h4>
                                      {item.description && (
                                        <p className="text-xs text-slate-500 font-medium">{item.description}</p>
                                      )}
                                    </div>

                                    <button
                                      onClick={() => handleOpenFillModal(activeDoc, chapter, item)}
                                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs active:scale-95"
                                    >
                                      <Edit3 size={14} />
                                      <span>{isFilled ? 'Editar Conteúdo' : 'Preencher Item'}</span>
                                    </button>
                                  </div>

                                  {/* Filled Content Preview or Empty Highlight */}
                                  <div className="mt-4 pt-3 border-t border-slate-100">
                                    {isFilled ? (
                                      <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-2">
                                        <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Conteúdo Atual:</span>
                                        <p className="text-xs text-slate-800 font-medium whitespace-pre-wrap leading-relaxed">
                                          {item.value}
                                        </p>
                                        {item.evidenceUrl && (
                                          <div className="flex items-center gap-2 mt-2 text-xs font-extrabold text-indigo-600">
                                            <Paperclip size={14} />
                                            <a href={item.evidenceUrl} target="_blank" rel="noreferrer" className="underline hover:text-indigo-800">
                                              Anexo: {item.evidenceFileName || 'Visualizar Evidência / Documento'}
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-amber-100/50 rounded-xl border border-amber-200 text-amber-900 flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-xs font-semibold">
                                          <AlertCircle size={16} className="text-amber-600 shrink-0" />
                                          <span>Item vazio. Aguardando preenchimento ou contribuição de atividade.</span>
                                        </div>
                                        <button
                                          onClick={() => handleOpenFillModal(activeDoc, chapter, item)}
                                          className="text-xs font-black text-amber-800 hover:underline cursor-pointer"
                                        >
                                          Preencher agora →
                                        </button>
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
              <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center space-y-3">
                <FileText size={48} className="mx-auto text-slate-300" />
                <h3 className="font-extrabold text-slate-800 text-base">Nenhum Modelo Selecionado</h3>
                <p className="text-xs text-slate-500">Selecione um modelo na coluna ao lado para visualizar a estrutura.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: CONTRIBUIÇÕES PENDENTES (PROJECT ACTIVITIES TO DOSSIER) */}
      {/* =================================================================== */}
      {activeTab === 'pending_contributions' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Layers className="text-indigo-600" size={24} />
              Contribuições Regulatórias Pendentes
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Abaixo estão listadas todas as microatividades e tarefas marcadas com contribuição regulatória. Ao abrir uma contribuição, selecione quais itens do documento ela permite preencher.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectPendingContributions.map((contrib) => (
              <div key={contrib.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-indigo-300 transition">
                <div className="flex items-start justify-between gap-2">
                  <span className="px-2.5 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full">
                    {contrib.phase || 'Atividade'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">{contrib.projectName}</span>
                </div>

                <div className="space-y-1">
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">{contrib.title}</h4>
                  <p className="text-xs text-slate-500 line-clamp-2">{contrib.description}</p>
                </div>

                <div className="text-[11px] text-slate-600 space-y-1 pt-2 border-t border-slate-200/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-bold">Responsável:</span>
                    <span className="font-semibold text-slate-800">{contrib.assignee}</span>
                  </div>
                  {contrib.evidenceUrl && (
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-bold">Evidência:</span>
                      <a href={contrib.evidenceUrl} target="_blank" rel="noreferrer" className="text-indigo-600 font-bold underline truncate max-w-[150px]">
                        {contrib.evidenceFileName || 'Abrir Anexo'}
                      </a>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveContribution(contrib);
                    setSelectedMarkersForContribution([]);
                    setContributionContentValue(contrib.description || '');
                  }}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-xs"
                >
                  <ListCheck size={16} />
                  <span>Classificar & Preencher Documento</span>
                </button>
              </div>
            ))}

            {projectPendingContributions.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-400 space-y-2">
                <CheckCircle size={40} className="mx-auto text-emerald-500" />
                <h4 className="font-extrabold text-slate-700 text-sm">Nenhuma contribuição pendente no momento</h4>
                <p className="text-xs text-slate-500">Todas as microatividades com contribuição regulatória já foram classificadas ou preenchidas.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: MODELOS & IMPORTAÇÃO WORD */}
      {/* =================================================================== */}
      {activeTab === 'template_manager' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <FileCode className="text-indigo-600" size={24} />
                Modelos do Documento Regulatório
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Importe arquivos Word contendo marcadores entre colchetes (ex: [NOME DA VACINA], [INDICAÇÃO]) para transformar em modelos de documentos regulatórios.
              </p>
            </div>

            <button
              onClick={() => setShowImportTemplateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer shadow-md active:scale-95 shrink-0"
            >
              <FileUp size={16} />
              <span>Importar Modelo Word / Marcadores</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {effectiveDocs.map(doc => {
              let totalItems = 0;
              doc.chapters?.forEach(c => totalItems += (c.items?.length || 0));

              return (
                <div key={doc.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-800 rounded-full text-[10px] font-black uppercase">
                      {doc.type}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">v{doc.currentVersion}</span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900">{doc.title}</h3>
                  <p className="text-xs text-slate-500 font-medium line-clamp-2">{doc.description}</p>

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-bold">
                    <span>{doc.chapters?.length || 0} capítulos</span>
                    <span>{totalItems} marcadores</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: TABELAS & ANEXOS */}
      {/* =================================================================== */}
      {activeTab === 'tables_and_attachments' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <TableIcon className="text-teal-600" size={24} />
              Tabelas Estruturadas e Anexos de Apoio
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Gerencie tabelas estruturadas (apresentações, estabilidade, lotes) e relatórios/certificados vinculados aos marcadores dos documentos regulatórios.
            </p>
          </div>

          <div className="space-y-6">
            {structuredTables.map(tbl => (
              <div key={tbl.id} className="p-5 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">{tbl.title}</h4>
                    <p className="text-xs text-slate-500">{tbl.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 bg-slate-100 text-slate-700 font-black rounded-lg border border-slate-200">
                    [{tbl.key}]
                  </span>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-extrabold text-slate-700">
                      <tr>
                        {tbl.columns.map(c => (
                          <th key={c.key} className="p-3 border-b border-slate-200">{c.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {tbl.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 font-medium text-slate-800">
                          {tbl.columns.map(c => (
                            <td key={c.key} className="p-3">{row[c.key]}</td>
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
      {/* TAB 5: EXPORTAÇÃO & RASTREABILIDADE */}
      {/* =================================================================== */}
      {activeTab === 'export_and_traceability' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
              <Download className="text-amber-600" size={24} />
              Exportação do Banco de Dados Regulatório
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Exporte todos os itens, históricos, origens e tabelas do banco de dados regulatório em formato Excel multi-abas ou JSON para automação.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <FileSpreadsheet className="text-emerald-600" size={32} />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Exportar Banco em Excel (.xlsx)</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Gera arquivo Excel organizado em 5 abas: Itens Regulatórios, Uso nos Documentos, Evidências e Anexos, Tabelas e Histórico de Alterações.
                </p>
              </div>
              <button
                onClick={handleExportExcelDatabase}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
              >
                Baixar Excel Regulatório
              </button>
            </div>

            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <FileCode className="text-indigo-600" size={32} />
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Exportar Banco em JSON</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Exporta toda a estrutura de relacionamentos e conteúdos para integrações e backups estruturados.
                </p>
              </div>
              <button
                onClick={handleExportJSONDatabase}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm cursor-pointer"
              >
                Baixar JSON Completo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: FILL / EDIT DOCUMENT ITEM */}
      {/* =================================================================== */}
      {selectedItemForFill && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <span className="text-[10px] font-mono px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold">
                  {selectedItemForFill.item.marker || `[${selectedItemForFill.item.name.toUpperCase().replace(/\s+/g, '_')}]`}
                </span>
                <h3 className="font-black text-base text-slate-900">{selectedItemForFill.item.name}</h3>
                <p className="text-xs text-slate-500">{selectedItemForFill.doc.title} • {selectedItemForFill.chapter.title}</p>
              </div>
              <button onClick={() => setSelectedItemForFill(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Conteúdo / Valor do Marcador:</label>
                <textarea
                  rows={4}
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  placeholder="Digite o texto, valor ou narrativa correspondente..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-slate-700 block mb-1">Link da Evidência / Anexo:</label>
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

              <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 text-[11px] text-indigo-900 space-y-1">
                <span className="font-extrabold block">ⓘ Reutilização Automática Multi-Documentos:</span>
                <p>
                  Ao salvar este valor, o sistema atualizará automaticamente todos os outros documentos vinculados que utilizam o mesmo marcador <code className="font-mono bg-indigo-100 px-1 rounded">{selectedItemForFill.item.marker || selectedItemForFill.item.name}</code>.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedItemForFill(null)}
                className="px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleSaveFillItem()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md"
              >
                Salvar Conteúdo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: CLASSIFY PENDING CONTRIBUTION */}
      {/* =================================================================== */}
      {activeContribution && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 sm:p-8 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200">
                  Contribuição do Projeto
                </span>
                <h3 className="font-black text-lg text-slate-900 mt-1">{activeContribution.title}</h3>
                <p className="text-xs text-slate-500">{activeContribution.projectName} • {activeContribution.assignee}</p>
              </div>
              <button onClick={() => setActiveContribution(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">Pergunta Regulatória:</span>
                <h4 className="font-extrabold text-xs text-indigo-950 mt-0.5">Quais itens dos documentos esta atividade permite preencher?</h4>
              </div>

              {/* Marker Selection Checklist */}
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-700 block">Selecione os marcadores correspondentes:</label>
                <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-2xl p-3 space-y-2 bg-slate-50/50">
                  {allAvailableMarkers.map(m => {
                    const isChecked = selectedMarkersForContribution.includes(m.marker);
                    return (
                      <label key={m.marker} className="flex items-start gap-3 p-2 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedMarkersForContribution(prev => [...prev, m.marker]);
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

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Conteúdo a ser Gravado:</label>
                <textarea
                  rows={4}
                  value={contributionContentValue}
                  onChange={(e) => setContributionContentValue(e.target.value)}
                  placeholder="Insira o texto ou narrativa..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setActiveContribution(null)}
                className="px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleApplyContributionToSelectedMarkers}
                disabled={selectedMarkersForContribution.length === 0 || !contributionContentValue.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md"
              >
                Gravar e Atualizar Dossiês ({selectedMarkersForContribution.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: CONFLICT COMPARISON DIALOG */}
      {/* =================================================================== */}
      {conflictModalData && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-rose-200 overflow-hidden space-y-4 p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-3 pb-4 border-b border-slate-100">
              <div className="p-3 bg-rose-100 text-rose-700 rounded-2xl">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Conflito de Valor Detectado</h3>
                <p className="text-xs text-slate-500 font-medium">
                  O marcador <code className="font-mono bg-rose-50 text-rose-800 font-bold px-1.5 py-0.5 rounded">{conflictModalData.marker}</code> já possui um valor cadastrado diferente. Como deseja proceder?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Valor Atual Registrado:</span>
                <p className="text-xs font-bold text-slate-900">{conflictModalData.currentValue}</p>
                <span className="text-[10px] text-slate-500 block italic">{conflictModalData.currentOrigin}</span>
              </div>

              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-200 space-y-1">
                <span className="text-[10px] font-black uppercase text-indigo-600 block">Novo Valor Proposto:</span>
                <p className="text-xs font-bold text-indigo-950">{conflictModalData.newValue}</p>
                <span className="text-[10px] text-indigo-600 block italic">{conflictModalData.newOrigin}</span>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => applyContributionValue(selectedMarkersForContribution, conflictModalData.newValue, activeContribution, conflictModalData.targetDocIds)}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                Substituir em todos os documentos
              </button>
              <button
                onClick={() => applyContributionValue(selectedMarkersForContribution, conflictModalData.newValue, activeContribution, [selectedDocId || effectiveDocs[0].id])}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black transition cursor-pointer shadow-xs"
              >
                Substituir apenas no documento selecionado
              </button>
              <button
                onClick={() => setConflictModalData(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition cursor-pointer"
              >
                Manter valor atual (Cancelar)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: IMPORT WORD TEMPLATE MODAL */}
      {/* =================================================================== */}
      {showImportTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-6 sm:p-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="space-y-1">
                <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                  <FileUp className="text-indigo-600" size={20} />
                  Importar Modelo com Marcadores
                </h3>
                <p className="text-xs text-slate-500">Cole o texto do modelo Word contendo marcadores entre colchetes como [NOME DA VACINA], [INDICAÇÃO], etc.</p>
              </div>
              <button onClick={() => setShowImportTemplateModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl cursor-pointer">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Título do Documento / Modelo:</label>
                <input
                  type="text"
                  value={templateTitle}
                  onChange={(e) => setTemplateTitle(e.target.value)}
                  placeholder="Ex: Dossiê da Vacina Dengue"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Tipo de Documento:</label>
                <input
                  type="text"
                  value={templateType}
                  onChange={(e) => setTemplateType(e.target.value)}
                  placeholder="Dossiê do Produto Final / DDCM / etc"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-slate-700 block mb-1">Texto do Modelo com Marcadores [COLCHETES]:</label>
                <textarea
                  rows={6}
                  value={templateText}
                  onChange={(e) => setTemplateText(e.target.value)}
                  placeholder={`1. Introdução
- [NOME DA VACINA]
- [INDICAÇÃO]

2. Descrição
- [DESCRIÇÃO E NOME DO IFA]
- [NOME DO ADJUVANTE]`}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setShowImportTemplateModal(false)}
                className="px-4 py-2.5 text-xs font-extrabold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleImportWordTemplate}
                disabled={!templateTitle.trim()}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 text-white text-xs font-black rounded-xl transition cursor-pointer shadow-md"
              >
                Criar Modelo Regulatório
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
