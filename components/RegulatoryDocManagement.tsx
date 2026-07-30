import React, { useState, useMemo } from 'react';
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
  RefreshCw
} from 'lucide-react';
import { EvidenceDetailModal } from './EvidenceDetailModal';

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
  // Main Navigation View Tabs
  const [activeTab, setActiveTab] = useState<
    'doc_tree' | 'knowledge_bank' | 'repeatable_records' | 'contributions' | 'markers_templates'
  >('doc_tree');

  // Sub-tab for Knowledge Bank (Banco de Conhecimento Regulatório)
  const [kbCategoryTab, setKbCategoryTab] = useState<KnowledgeCategory>(
    'Informações Estruturadas'
  );

  // Active Selected Project Filter
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects.length > 0 ? projects[0].id : 'all'
  );

  const activeProject = useMemo(() => {
    return projects.find(p => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Selected Active Document inside Project
  const [selectedDocId, setSelectedDocId] = useState<string>('');

  // Search filter inside tree view and knowledge bank
  const [searchQuery, setSearchQuery] = useState('');

  // Expand / Collapse state for tree view chapters
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({
    'cap_1': true,
    'cap_2': true,
    'cap_3': true
  });

  // Selected item detail state for drawer / modal
  const [selectedTreeItem, setSelectedTreeItem] = useState<{
    doc: RegulatoryDocument;
    chapter: RegulatoryDocumentChapter;
    item: RegulatoryDocumentItem;
  } | null>(null);

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
        { apresentacao: 'Monodose Monodose Seringa', dose: 25, volume: 0.5, embalagem: 'Seringa Pré-enchida Luer Lock', num_doses: 1 }
      ],
      updatedAt: new Date().toISOString()
    },
    {
      id: 'table_stability',
      projectId: activeProject?.id || 'p1',
      key: 'TABLE_STABILITY_SUMMARY',
      title: 'Tabela de Resumo dos Estudos de Estabilidade',
      description: 'Lotes testados, condições de temperatura, tempo de acompanhamento e resultados',
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

  // Word Template Markers Mapping State
  const [markerMappings, setMarkerMappings] = useState<RegulatoryMarkerMapping[]>([
    {
      id: 'm1',
      marker: '[NOME_DA_VACINA]',
      sourceCategory: 'Informações Estruturadas',
      sourceKey: 'PRODUCT.NAME',
      description: 'Substituído pelo Nome Comercial / Técnico da Vacina'
    },
    {
      id: 'm2',
      marker: '[INDICACAO_TERAPEUTICA]',
      sourceCategory: 'Informações Estruturadas',
      sourceKey: 'PRODUCT.INDICATION',
      description: 'Substituído pelo texto da Indicação Terapêutica'
    },
    {
      id: 'm3',
      marker: '[TABELA_APRESENTACOES]',
      sourceCategory: 'Tabelas',
      sourceKey: 'TABLE_PRESENTATIONS',
      description: 'Insere a tabela dinâmica de apresentações e embalagem'
    },
    {
      id: 'm4',
      marker: '[INTRODUÇÃO_PROJETO]',
      sourceCategory: 'Narrativas Técnicas',
      sourceKey: 'NARRATIVE.INTRO',
      description: 'Substituído pelo texto completo da narrativa de Introdução'
    }
  ]);

  // Default Presets for Regulatory Documents
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
            title: '1. Informações Gerais e Descrição do Produto',
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
                status: 'Pronto' as RegulatoryDocItemStatus, 
                marker: '[NOME_DA_VACINA]',
                requiredResources: [
                  { id: 'r1', name: 'Nome da vacina', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.NAME' },
                  { id: 'r2', name: 'Código interno do produto', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.CODE' }
                ]
              },
              { 
                id: 'item_1_2', 
                code: '1.2',
                name: 'Indicação Terapêutica / Alvo Clínico', 
                description: 'Detalhamento das populações de risco e patógeno alvo',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'PRODUCT.INDICATION', 
                status: 'Pronto' as RegulatoryDocItemStatus, 
                marker: '[INDICACAO]',
                requiredResources: [
                  { id: 'r3', name: 'Texto de indicação terapêutica', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.INDICATION' }
                ]
              },
              { 
                id: 'item_1_3', 
                code: '1.3',
                name: 'Descrição da Forma Farmacêutica e Composição', 
                description: 'Propriedades organolépticas, IFA, adjuvantes e via de administração',
                type: 'Informação Estruturada' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'PRODUCT.ADMINISTRATION_ROUTE', 
                status: 'Em Andamento' as RegulatoryDocItemStatus, 
                marker: '[FORMA_FARMACEUTICA]',
                requiredResources: [
                  { id: 'r4', name: 'Nome da vacina', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.NAME' },
                  { id: 'r5', name: 'Descrição da vacina', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.DESC' },
                  { id: 'r6', name: 'Insumo Farmacêutico Ativo (IFA)', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'IFA.NAME' },
                  { id: 'r7', name: 'Adjuvante utilizado', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'ADJUVANT.NAME' },
                  { id: 'r8', name: 'Via de administração', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.ADMINISTRATION_ROUTE' },
                  { id: 'r9', name: 'Temperatura de armazenamento', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.STORAGE_TEMP' }
                ]
              },
              { 
                id: 'item_1_4', 
                code: '1.4',
                name: 'Tabela de Apresentações e Embalagem Primária', 
                description: 'Volume, doses por frasco e materiais de acondicionamento',
                type: 'Tabela' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'TABLE_PRESENTATIONS', 
                status: 'Pronto' as RegulatoryDocItemStatus, 
                marker: '[TABELA_APRESENTACOES]',
                requiredResources: [
                  { id: 'r10', name: 'Apresentações', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_PRESENTATIONS' },
                  { id: 'r11', name: 'Dose', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_PRESENTATIONS' },
                  { id: 'r12', name: 'Volume', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_PRESENTATIONS' },
                  { id: 'r13', name: 'Embalagem', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_PRESENTATIONS' },
                  { id: 'r14', name: 'Número de doses', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_PRESENTATIONS' }
                ]
              }
            ]
          },
          {
            id: 'cap_2',
            code: '2.0',
            title: '2. Controle de Qualidade e Estudos de Estabilidade',
            description: 'Resultados analíticos, liberação de lotes e acompanhamento de validade',
            items: [
              { 
                id: 'item_2_1', 
                code: '2.1',
                name: 'Relatório de Estabilidade do Produto Terminado', 
                description: 'Acompanhamento do prazo de validade em condições refrigeradas e aceleradas',
                type: 'Narrativa' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'STABILITY.REPORT', 
                status: 'Em Andamento' as RegulatoryDocItemStatus, 
                marker: '[ESTABILIDADE]',
                requiredResources: [
                  { id: 'r15', name: 'Narrativa técnica do estudo de estabilidade', type: 'Narrativa Técnica' as RegulatoryResourceType, required: true, key: 'NARRATIVE.STABILITY' },
                  { id: 'r16', name: 'Tabela resumo dos ensaios de estabilidade', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_STABILITY_SUMMARY' },
                  { id: 'r17', name: 'Registro dos lotes de estabilidade do projeto', type: 'Registro Repetitivo' as RegulatoryResourceType, required: true, key: 'PROJECT.STABILITY_BATCHES' },
                  { id: 'r18', name: 'Certificado de Análise de Liberação de Lote', type: 'Anexo' as RegulatoryResourceType, required: true, key: 'ATTACHMENT.COA' }
                ]
              },
              { 
                id: 'item_2_2', 
                code: '2.2',
                name: 'Laudo de Esterilidade e Endotoxinas', 
                description: 'Comprovação de segurança microbiológica do lote piloto',
                type: 'Evidência' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'EVID_STERILITY', 
                status: 'Faltando' as RegulatoryDocItemStatus, 
                marker: '[LAUDO_ESTERILIDADE]',
                requiredResources: [
                  { id: 'r19', name: 'Relatório do ensaio de esterilidade (Anexo)', type: 'Evidência' as RegulatoryResourceType, required: true, key: 'EVID.STERILITY' }
                ]
              }
            ]
          },
          {
            id: 'cap_3',
            code: '3.0',
            title: '3. Avaliação de Segurança Pré-Clínica e Imunogenicidade',
            description: 'Resultados de modelos animais e caracterização da resposta imune',
            items: [
              { 
                id: 'item_3_1', 
                code: '3.1',
                name: 'Resumo dos Ensaios de Imunogenicidade', 
                description: 'Títulos de anticorpos neutralizantes e resposta celular',
                type: 'Narrativa' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'CLINICAL.IMMUNO', 
                status: 'Pronto' as RegulatoryDocItemStatus, 
                marker: '[IMUNOGENICIDADE]',
                requiredResources: [
                  { id: 'r20', name: 'Narrativa técnica de imunogenicidade', type: 'Narrativa Técnica' as RegulatoryResourceType, required: true, key: 'NARRATIVE.IMMUNO' },
                  { id: 'r21', name: 'Relatório do modelo animal (Evidência)', type: 'Evidência' as RegulatoryResourceType, required: false, key: 'EVID.ANIMAL_MODEL' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: `doc_ifa_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do IFA',
        type: 'Dossiê de Insumo Farmacêutico Ativo',
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
            title: '1. Caracterização e Processo de Fabricação do IFA',
            description: 'Estrutura, linhagem de expressão, meio de cultura e purification flow',
            items: [
              { 
                id: 'item_ifa_1_1', 
                code: '1.1',
                name: 'Estrutura e Caracterização Físico-Química do IFA', 
                description: 'Sequência primária, modificações pós-traducionais e massa molecular',
                type: 'Narrativa' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'IFA.STRUCTURE', 
                status: 'Pronto' as RegulatoryDocItemStatus, 
                marker: '[ESTRUTURA_IFA]',
                requiredResources: [
                  { id: 'r22', name: 'Caracterização do IFA', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'IFA.STRUCTURE' }
                ]
              },
              { 
                id: 'item_ifa_1_2', 
                code: '1.2',
                name: 'Fluxograma e Descrição do Processo de Purificação', 
                description: 'Etapas cromatográficas, ultrafiltração e inativação viral',
                type: 'Anexo' as RegulatoryDocItemType, 
                required: true, 
                sourceInternalId: 'EVID_IFA_PROCESS', 
                status: 'Faltando' as RegulatoryDocItemStatus, 
                marker: '[PROCESSO_IFA]',
                requiredResources: [
                  { id: 'r23', name: 'Fluxograma de purificação em alta resolução (Anexo)', type: 'Anexo' as RegulatoryResourceType, required: true, key: 'ATTACHMENT.IFA_FLOWCHART' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: `doc_adj_${proj.id}`,
        projectId: proj.id,
        title: 'Dossiê do Adjuvante',
        type: 'Dossiê de Adjuvante',
        description: 'Informações de composição, esterilidade e segurança do sistema adjuvante.',
        currentVersion: '0.1',
        currentVersionStatus: 'Rascunho',
        updatedAt: new Date().toISOString(),
        chapters: [
          {
            id: 'cap_adj_1',
            code: '1.0',
            title: '1. Especificações e Origem do Sistema Adjuvante',
            description: 'Identificação química, emulsão e testes de segurança',
            items: [
              {
                id: 'item_adj_1_1',
                code: '1.1',
                name: 'Composição Química e Razão Adjuvante/Antígeno',
                description: 'Identificação dos lipídios / sais de alumínio e proporção por dose',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'ADJUVANT.NAME',
                status: 'Pronto' as RegulatoryDocItemStatus,
                marker: '[COMPOSICAO_ADJUVANTE]',
                requiredResources: [
                  { id: 'r24', name: 'Nome e código do adjuvante', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'ADJUVANT.NAME' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: `doc_brochura_${proj.id}`,
        projectId: proj.id,
        title: 'Brochura do Investigador',
        type: 'Brochura Clínica (IB)',
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
                name: 'Racional da Formulação e Dose Selecionada',
                description: 'Justificativa da escolha do antígeno e adjuvante',
                type: 'Narrativa' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'NARRATIVE.INTRO',
                status: 'Pronto' as RegulatoryDocItemStatus,
                marker: '[RACIONAL_FORMULACAO]',
                requiredResources: [
                  { id: 'r25', name: 'Narrativa de introdução e racional', type: 'Narrativa Técnica' as RegulatoryResourceType, required: true, key: 'NARRATIVE.INTRO' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: `doc_deec_${proj.id}`,
        projectId: proj.id,
        title: 'DEEC - Dossiê de Ensaio Clínico',
        type: 'Documento de Submissão DEEC / Anvisa',
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
                name: 'Identificação e Objetivos do Protocolo',
                description: 'Objetivos primários, secundários e endpoint de eficácia',
                type: 'Informação Estruturada' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'PRODUCT.INDICATION',
                status: 'Pronto' as RegulatoryDocItemStatus,
                marker: '[PROTOCOLO_CLINICO]',
                requiredResources: [
                  { id: 'r26', name: 'Indicação e objetivo clínico', type: 'Informação Estruturada' as RegulatoryResourceType, required: true, key: 'PRODUCT.INDICATION' }
                ]
              }
            ]
          }
        ]
      },
      {
        id: `doc_ddcm_${proj.id}`,
        projectId: proj.id,
        title: 'DDCM - Dossiê de Desenvolvimento Clínico de Medicamento',
        type: 'Dossiê Regulatório Estratégico',
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
                name: 'Resumo do Programa de Desenvolvimento Qualitativo',
                description: 'Histórico de lotes fabricados e consistência do processo',
                type: 'Narrativa' as RegulatoryDocItemType,
                required: true,
                sourceInternalId: 'NARRATIVE.INTRO',
                status: 'Em Andamento' as RegulatoryDocItemStatus,
                marker: '[PROGRAMA_DESENVOLVIMENTO]',
                requiredResources: [
                  { id: 'r27', name: 'Narrativa do desenvolvimento', type: 'Narrativa Técnica' as RegulatoryResourceType, required: true, key: 'NARRATIVE.INTRO' },
                  { id: 'r28', name: 'Tabela de apresentações', type: 'Tabela' as RegulatoryResourceType, required: true, key: 'TABLE_PRESENTATIONS' }
                ]
              }
            ]
          }
        ]
      }
    ]).flat();
  }, [regulatoryDocs, projects, currentUser]);

  const effectiveDocs = useMemo(() => {
    return regulatoryDocs.length > 0 ? regulatoryDocs : defaultDocs;
  }, [regulatoryDocs, defaultDocs]);

  // Documents filtered for the currently selected project
  const currentProjectDocs = useMemo(() => {
    if (selectedProjectId === 'all') return effectiveDocs;
    return effectiveDocs.filter(d => d.projectId === selectedProjectId);
  }, [effectiveDocs, selectedProjectId]);

  // Ensure active doc selected
  const activeDoc = useMemo(() => {
    if (selectedDocId) {
      const found = effectiveDocs.find(d => d.id === selectedDocId);
      if (found) return found;
    }
    return currentProjectDocs.length > 0 ? currentProjectDocs[0] : null;
  }, [effectiveDocs, currentProjectDocs, selectedDocId]);

  // Default Knowledge Records for Knowledge Bank (Banco de Conhecimento Regulatório)
  const defaultKnowledgeRecords = useMemo<RegulatoryKnowledgeRecord[]>(() => {
    const currentProjId = activeProject?.id || 'p1';
    
    // Seed initial structured info, narratives, evidence and attachments
    return [
      {
        id: 'kb_1',
        projectId: currentProjId,
        internalId: 'PRODUCT.NAME',
        category: 'Informações Estruturadas',
        title: 'Nome Comercial / Técnico da Vacina',
        value: 'Vacina Malária Recombinante - UniMaV-01',
        origin: 'Definição Estratégica da Liderança do Projeto',
        updatedAt: new Date().toISOString(),
        version: 1,
        history: [{ version: 1, updatedAt: new Date().toISOString(), author: currentUser, value: 'Vacina Malária Recombinante - UniMaV-01' }],
        usedInDocs: [
          { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.1', itemName: 'Nome e Identificação da Vacina' },
          { docId: 'doc_ddcm', docTitle: 'DDCM', itemCode: '1.1', itemName: 'Resumo do Programa de Desenvolvimento' },
          { docId: 'doc_brochura', docTitle: 'Brochura do Investigador', itemCode: '1.1', itemName: 'Racional da Formulação' },
          { docId: 'doc_deec', docTitle: 'DEEC', itemCode: '1.1', itemName: 'Identificação e Objetivos' }
        ]
      },
      {
        id: 'kb_2',
        projectId: currentProjId,
        internalId: 'PRODUCT.CODE',
        category: 'Informações Estruturadas',
        title: 'Código Interno do Produto',
        value: 'CTVAC-MAL-2026',
        origin: 'Cadastro de Projeto no CTVacinas',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.1', itemName: 'Nome e Identificação' }]
      },
      {
        id: 'kb_3',
        projectId: currentProjId,
        internalId: 'PRODUCT.INDICATION',
        category: 'Informações Estruturadas',
        title: 'Indicação Terapêutica Proposta',
        value: 'Imunização ativa para prevenção da malária clínica por Plasmodium falciparum em indivíduos a partir de 2 anos de idade.',
        origin: 'Protocolo da Fase I / Comitê Científico',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [
          { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.2', itemName: 'Indicação Terapêutica' },
          { docId: 'doc_deec', docTitle: 'DEEC', itemCode: '1.1', itemName: 'Identificação e Objetivos' }
        ]
      },
      {
        id: 'kb_4',
        projectId: currentProjId,
        internalId: 'PRODUCT.DESC',
        category: 'Informações Estruturadas',
        title: 'Descrição Organoléptica do Produto',
        value: 'Suspensão injetável, homogênea, de coloração branco-opalescente, isenta de partículas estranhas visíveis.',
        origin: 'Relatório do Lote Piloto LP-001',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.3', itemName: 'Descrição da Forma Farmacêutica' }]
      },
      {
        id: 'kb_5',
        projectId: currentProjId,
        internalId: 'IFA.NAME',
        category: 'Informações Estruturadas',
        title: 'Nome do Insumo Farmacêutico Ativo (IFA)',
        value: 'Proteína Recombinante Pfs25 / MSP1-19',
        origin: 'Bancada de Biologia Molecular',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [
          { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.3', itemName: 'Descrição da Forma Farmacêutica' },
          { docId: 'doc_ifa', docTitle: 'Dossiê do IFA', itemCode: '1.1', itemName: 'Estrutura do IFA' }
        ]
      },
      {
        id: 'kb_6',
        projectId: currentProjId,
        internalId: 'ADJUVANT.NAME',
        category: 'Informações Estruturadas',
        title: 'Adjuvante e Sistema Imunoadjuvante',
        value: 'Emulsão de Esqualeno com QS-21 (Adjuvante L30-Adjuv)',
        origin: 'Formulação de Adjuvante',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [
          { docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.3', itemName: 'Descrição da Forma Farmacêutica' },
          { docId: 'doc_adj', docTitle: 'Dossiê do Adjuvante', itemCode: '1.1', itemName: 'Composição Química' }
        ]
      },
      {
        id: 'kb_7',
        projectId: currentProjId,
        internalId: 'PRODUCT.ADMINISTRATION_ROUTE',
        category: 'Informações Estruturadas',
        title: 'Via de Administração e Posologia',
        value: 'Intramuscular (IM), aplicada no músculo deltoide na dose de 0.5 mL.',
        origin: 'Manual de Procedimentos Clínicos',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.3', itemName: 'Descrição da Forma Farmacêutica' }]
      },
      {
        id: 'kb_8',
        projectId: currentProjId,
        internalId: 'PRODUCT.STORAGE_TEMP',
        category: 'Informações Estruturadas',
        title: 'Temperatura de Armazenamento e Conservação',
        value: 'Conservar sob refrigeração entre +2°C e +8°C, protegido da luz. Não congelar.',
        origin: 'Estudo de Estabilidade de 12 Meses',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '1.3', itemName: 'Descrição da Forma Farmacêutica' }]
      },
      {
        id: 'kb_9',
        projectId: currentProjId,
        internalId: 'NARRATIVE.INTRO',
        category: 'Narrativas Técnicas',
        title: 'Introdução e Racional do Desenvolvimento',
        value: 'A malária representa um importante desafio de saúde pública global. O presente projeto visa desenvolver uma vacina altamente eficaz baseada em antígenos recombinantes expressos em Pichia pastoris formulados com adjuvante esqualênico. Os testes pré-clínicos demonstraram elevada indução de anticorpos neutralizantes e excelente perfil de tolerabilidade.',
        origin: 'Elaboração Técnica / Equipe de Redação Regulatória',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [
          { docId: 'doc_brochura', docTitle: 'Brochura do Investigador', itemCode: '1.1', itemName: 'Racional da Formulação' },
          { docId: 'doc_ddcm', docTitle: 'DDCM', itemCode: '1.1', itemName: 'Resumo do Programa' }
        ]
      },
      {
        id: 'kb_10',
        projectId: currentProjId,
        internalId: 'NARRATIVE.IMMUNO',
        category: 'Narrativas Técnicas',
        title: 'Narrativa de Resumo dos Ensaios de Imunogenicidade',
        value: 'Em modelos murinos e primatas não humanos, a imunização com 3 doses da vacina UniMaV-01 produziu resposta humoral sustentada com títulos de IgG superiores a 1:100.000, além de resposta celular do tipo Th1 com secreção de IFN-gama por esplenócitos.',
        origin: 'Relatório do Ensaio de Imunogenicidade Murina',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '3.1', itemName: 'Resumo dos Ensaios de Imunogenicidade' }]
      },
      {
        id: 'kb_11',
        projectId: currentProjId,
        internalId: 'NARRATIVE.STABILITY',
        category: 'Narrativas Técnicas',
        title: 'Narrativa do Estudo de Estabilidade Acelerada e Longa Duração',
        value: 'Foram avaliados 3 lotes piloto mantidos nas temperaturas de 2-8°C e 25°C/60%UR. Após 12 meses sob refrigeração, não foram observadas alterações no pH, teor de antígeno ou esterilidade.',
        origin: 'Laboratório de Controle de Qualidade',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '2.1', itemName: 'Relatório de Estabilidade' }]
      },
      {
        id: 'kb_12',
        projectId: currentProjId,
        internalId: 'EVID.STERILITY',
        category: 'Evidências',
        title: 'Certificado de Ensaio de Esterilidade e Endotoxinas',
        value: 'https://sharepoint.ctvacinas.org/laudos/esterilidade_LP001.pdf',
        origin: 'Laudo Microbiológico nº 2026-88',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '2.2', itemName: 'Laudo de Esterilidade' }]
      },
      {
        id: 'kb_13',
        projectId: currentProjId,
        internalId: 'ATTACHMENT.COA',
        category: 'Anexos',
        title: 'Certificado de Análise (CoA) do Lote Piloto LP-001',
        value: 'https://sharepoint.ctvacinas.org/anexos/CoA_Lote_LP001.pdf',
        origin: 'Controle de Qualidade Central',
        updatedAt: new Date().toISOString(),
        version: 1,
        usedInDocs: [{ docId: 'doc_vacina', docTitle: 'Dossiê da Vacina', itemCode: '2.1', itemName: 'Relatório de Estabilidade' }]
      }
    ];
  }, [activeProject, currentUser]);

  // Knowledge Bank State
  const [knowledgeRecords, setKnowledgeRecords] = useState<RegulatoryKnowledgeRecord[]>(defaultKnowledgeRecords);

  // Sync / Edit Knowledge Record Modal
  const [showKbRecordModal, setShowKbRecordModal] = useState(false);
  const [editingKbId, setEditingKbId] = useState<string | null>(null);
  const [kbKey, setKbKey] = useState('');
  const [kbTitle, setKbTitle] = useState('');
  const [kbCategory, setKbCategory] = useState<KnowledgeCategory>('Informações Estruturadas');
  const [kbValue, setKbValue] = useState('');
  const [kbOrigin, setKbOrigin] = useState('');

  // Auto completeness checker for item
  const checkItemCompleteness = (item: RegulatoryDocumentItem) => {
    const requiredResources = item.requiredResources || [];
    if (requiredResources.length === 0) {
      // Fallback simple check
      if (item.value || item.evidenceUrl) {
        return { available: 1, total: 1, percent: 100, missingNames: [], status: 'Pronto' as const };
      }
      return { available: 0, total: 1, percent: 0, missingNames: [item.name], status: 'Faltando' as const };
    }

    let availableCount = 0;
    const missingNames: string[] = [];

    requiredResources.forEach(res => {
      let found = false;
      if (res.key) {
        // Check Knowledge Bank
        const rec = knowledgeRecords.find(k => k.internalId === res.key && (k.value !== undefined && k.value !== ''));
        if (rec) found = true;

        // Check structured tables if table type
        if (!found && res.type === 'Tabela') {
          const tbl = structuredTables.find(t => t.key === res.key && t.rows.length > 0);
          if (tbl) found = true;
        }

        // Check repeatable records
        if (!found && res.type === 'Registro Repetitivo') {
          if (repeatableRecords.length > 0) found = true;
        }
      }

      if (!found && item.value && item.value.trim().length > 0) {
        found = true;
      }

      if (found) {
        availableCount++;
      } else {
        missingNames.push(res.name);
      }
    });

    const total = requiredResources.length;
    const percent = Math.round((availableCount / total) * 100);

    let calculatedStatus: 'Pronto' | 'Em Andamento' | 'Faltando' = 'Faltando';
    if (availableCount === total) {
      calculatedStatus = 'Pronto';
    } else if (availableCount > 0) {
      calculatedStatus = 'Em Andamento';
    }

    return {
      available: availableCount,
      total,
      percent,
      missingNames,
      status: calculatedStatus
    };
  };

  // Open modal to create / edit knowledge bank record
  const handleOpenKbModal = (rec?: RegulatoryKnowledgeRecord) => {
    if (rec) {
      setEditingKbId(rec.id);
      setKbKey(rec.internalId);
      setKbTitle(rec.title);
      setKbCategory(rec.category);
      setKbValue(typeof rec.value === 'string' ? rec.value : JSON.stringify(rec.value));
      setKbOrigin(rec.origin);
    } else {
      setEditingKbId(null);
      setKbKey('');
      setKbTitle('');
      setKbCategory(kbCategoryTab);
      setKbValue('');
      setKbOrigin('Cadastro Direto no Banco de Conhecimento');
    }
    setShowKbRecordModal(true);
  };

  // Save Knowledge Bank Record with Single Source of Truth update!
  const handleSaveKbRecord = () => {
    if (!kbKey.trim() || !kbTitle.trim()) return;

    const currentProjId = activeProject?.id || 'p1';
    let updatedList = [...knowledgeRecords];

    if (editingKbId) {
      updatedList = updatedList.map(item => {
        if (item.id !== editingKbId) return item;

        const newVersion = item.version + 1;
        const newHistory = [
          ...(item.history || []),
          { version: newVersion, updatedAt: new Date().toISOString(), author: currentUser, value: kbValue.trim() }
        ];

        return {
          ...item,
          internalId: kbKey.trim().toUpperCase().replace(/\s+/g, '_'),
          title: kbTitle.trim(),
          category: kbCategory,
          value: kbValue.trim(),
          origin: kbOrigin.trim() || item.origin,
          version: newVersion,
          history: newHistory,
          updatedAt: new Date().toISOString()
        };
      });
    } else {
      const newRec: RegulatoryKnowledgeRecord = {
        id: `kb_custom_${Date.now()}`,
        projectId: currentProjId,
        internalId: kbKey.trim().toUpperCase().replace(/\s+/g, '_'),
        category: kbCategory,
        title: kbTitle.trim(),
        value: kbValue.trim(),
        origin: kbOrigin.trim() || 'Cadastro Manual',
        updatedAt: new Date().toISOString(),
        version: 1,
        history: [{ version: 1, updatedAt: new Date().toISOString(), author: currentUser, value: kbValue.trim() }],
        usedInDocs: []
      };
      updatedList.push(newRec);
    }

    setKnowledgeRecords(updatedList);
    setShowKbRecordModal(false);
  };

  // Pending Contributions coming from Projects execution
  const projectPendingContributions = useMemo(() => {
    const list: any[] = [];

    // 1. Gather from microactivities inside project macroactivities
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
              description: micro.evidenceDescription || `Microatividade: ${micro.name} na macroatividade ${macro.name}`,
              status: micro.status,
              assignee: micro.assignee || 'Não atribuído',
              evidenceUrl: micro.evidenceUrl,
              evidenceFileName: micro.evidenceFileName,
              updatedAt: micro.dueDate || new Date().toISOString()
            });
          }
        });
      });
    });

    // 2. Gather from standalone tasks
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

  // General Document Completeness Dashboard Metrics
  const completenessMetrics = useMemo(() => {
    let totalItems = 0;
    let readyItems = 0;
    let partialItems = 0;
    let missingItems = 0;

    currentProjectDocs.forEach(doc => {
      doc.chapters?.forEach(chap => {
        chap.items?.forEach(item => {
          totalItems++;
          const calc = checkItemCompleteness(item);
          if (calc.status === 'Pronto') readyItems++;
          else if (calc.status === 'Em Andamento') partialItems++;
          else missingItems++;
        });
      });
    });

    const percent = totalItems > 0 ? Math.round((readyItems / totalItems) * 100) : 0;

    return {
      totalItems,
      readyItems,
      partialItems,
      missingItems,
      percent
    };
  }, [currentProjectDocs, knowledgeRecords, structuredTables, repeatableRecords]);

  // Export JSON of all Regulatory Knowledge Data
  const handleExportKnowledgeBank = () => {
    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser,
        systemName: 'Sistema de Gestão do Conhecimento Regulatório',
        projectId: selectedProjectId,
        projectName: activeProject?.name || 'Todos os Projetos'
      },
      completenessMetrics,
      documents: currentProjectDocs,
      knowledgeRecords,
      structuredTables,
      markerMappings,
      repeatableRecords
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Conhecimento_Regulatorio_${activeProject?.name.replace(/[^a-zA-Z0-9]/g, '_') || 'Projetos'}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* System Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-amber-500/30">
                Módulo Regulatório Unificado
              </span>
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-[10px] font-black uppercase tracking-wider border border-indigo-500/30">
                Single Source of Truth
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-3">
              <FolderTree className="text-amber-400" size={32} />
              Sistema de Gestão do Conhecimento Regulatório
            </h1>
            <p className="text-xs text-slate-300 font-medium max-w-3xl leading-relaxed">
              Organização dinâmica e centralizada de informações, narrativas técnicas, tabelas e evidências para montagem e acompanhamento contínuo da completude de documentos regulatórios.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {/* Project Filter Select */}
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
              onClick={handleExportKnowledgeBank}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Download size={16} /> Exportar Banco (JSON)
            </button>
          </div>
        </div>

        {/* Realtime Completeness Progress Bar Banner */}
        <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Completude Geral</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl font-black text-amber-400">{completenessMetrics.percent}%</span>
              <span className="text-[10px] text-slate-400 font-bold">de itens prontos</span>
            </div>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Itens Prontos (✔)</span>
            <span className="text-xl font-black text-emerald-400 mt-1 block">{completenessMetrics.readyItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Em Andamento (⚠)</span>
            <span className="text-xl font-black text-amber-400 mt-1 block">{completenessMetrics.partialItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Itens Faltando (✖)</span>
            <span className="text-xl font-black text-rose-400 mt-1 block">{completenessMetrics.missingItems}</span>
          </div>

          <div className="bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50 col-span-2 sm:col-span-1">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">Contribuições de Projetos</span>
            <span className="text-xl font-black text-indigo-300 mt-1 block">{projectPendingContributions.length}</span>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs Bar */}
      <div className="bg-white p-2 rounded-3xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('doc_tree')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'doc_tree'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FolderTree size={16} />
          <span>Árvore de Documentos e Itens</span>
        </button>

        <button
          onClick={() => setActiveTab('knowledge_bank')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'knowledge_bank'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Database size={16} />
          <span>Banco de Conhecimento Regulatório</span>
        </button>

        <button
          onClick={() => setActiveTab('repeatable_records')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'repeatable_records'
              ? 'bg-teal-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <TableIcon size={16} />
          <span>Registros Repetitivos do Projeto</span>
        </button>

        <button
          onClick={() => setActiveTab('contributions')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'contributions'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Layers size={16} />
          <span>Contribuições de Projetos ({projectPendingContributions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('markers_templates')}
          className={`px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 cursor-pointer ${
            activeTab === 'markers_templates'
              ? 'bg-purple-600 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Tag size={16} />
          <span>Marcadores & Modelos Word</span>
        </button>
      </div>

      {/* =========================================================================
          VIEW 1: ÁRVORE HIERÁRQUICA DE DOCUMENTOS E ITENS
          ========================================================================= */}
      {activeTab === 'doc_tree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Documents Selection List (Left Column) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-indigo-600" />
                Documentos Regulatórios ({currentProjectDocs.length})
              </h3>

              <div className="space-y-2">
                {currentProjectDocs.map(doc => {
                  const isActive = activeDoc?.id === doc.id;
                  
                  // Calculate document completeness
                  let totalInDoc = 0;
                  let readyInDoc = 0;
                  doc.chapters?.forEach(c => c.items?.forEach(i => {
                    totalInDoc++;
                    if (checkItemCompleteness(i).status === 'Pronto') readyInDoc++;
                  }));
                  const docPercent = totalInDoc > 0 ? Math.round((readyInDoc / totalInDoc) * 100) : 0;

                  return (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocId(doc.id)}
                      className={`w-full p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        isActive 
                          ? 'bg-slate-900 text-white border-slate-900 shadow-lg scale-[1.01]' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-amber-400 text-slate-950' : 'bg-indigo-100 text-indigo-800'
                        }`}>
                          {doc.type}
                        </span>
                        <span className={`text-xs font-black ${isActive ? 'text-amber-300' : 'text-slate-600'}`}>
                          {docPercent}%
                        </span>
                      </div>

                      <h4 className="text-sm font-black mt-2 leading-snug">{doc.title}</h4>
                      <p className={`text-[10px] font-medium mt-1 line-clamp-2 ${
                        isActive ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {doc.description || 'Sem descrição cadastrada'}
                      </p>

                      <div className="w-full bg-slate-200/50 rounded-full h-1.5 mt-3 overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            docPercent === 100 ? 'bg-emerald-500' : docPercent > 40 ? 'bg-amber-400' : 'bg-rose-500'
                          }`}
                          style={{ width: `${docPercent}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Document Tree Hierarchy View (Right Column) */}
          <div className="lg:col-span-8 space-y-6">
            {activeDoc ? (
              <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                {/* Active Document Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      ESTRUTURA HIERÁRQUICA DO DOCUMENTO
                    </span>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight mt-1 flex items-center gap-2">
                      {activeDoc.title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      {activeDoc.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500">
                      Versão: <strong className="text-slate-900">{activeDoc.currentVersion || '0.1'}</strong>
                    </span>
                    <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-black uppercase rounded-full">
                      {activeDoc.currentVersionStatus || 'Rascunho'}
                    </span>
                  </div>
                </div>

                {/* Hierarchical Chapters & Items Tree */}
                <div className="space-y-4">
                  {activeDoc.chapters && activeDoc.chapters.length > 0 ? (
                    activeDoc.chapters.map(chap => {
                      const isExpanded = expandedChapters[chap.id] !== false;

                      return (
                        <div key={chap.id} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                          {/* Chapter Header */}
                          <div 
                            onClick={() => setExpandedChapters(prev => ({ ...prev, [chap.id]: !isExpanded }))}
                            className="bg-slate-100/90 px-5 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-200/80 transition"
                          >
                            <div className="flex items-center gap-3">
                              <button className="text-slate-600">
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              </button>
                              <div>
                                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-slate-900 text-white rounded-md text-[10px] font-bold">{chap.code}</span>
                                  {chap.title}
                                </h3>
                                {chap.description && (
                                  <p className="text-[10px] text-slate-500 font-medium mt-0.5">{chap.description}</p>
                                )}
                              </div>
                            </div>

                            <span className="text-[10px] font-bold text-slate-500">
                              {chap.items?.length || 0} itens mapeados
                            </span>
                          </div>

                          {/* Items List */}
                          {isExpanded && (
                            <div className="divide-y divide-slate-200/70 bg-white">
                              {chap.items?.map(item => {
                                const completeness = checkItemCompleteness(item);

                                return (
                                  <div 
                                    key={item.id} 
                                    className="p-5 hover:bg-slate-50 transition flex flex-col md:flex-row md:items-start justify-between gap-4"
                                  >
                                    <div className="space-y-2 flex-1">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        {/* Auto calculated Status Badge */}
                                        {completeness.status === 'Pronto' && (
                                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                            <CheckCircle size={12} className="text-emerald-600" /> ✔ Pronto
                                          </span>
                                        )}
                                        {completeness.status === 'Em Andamento' && (
                                          <span className="px-2.5 py-1 bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                            <AlertTriangle size={12} className="text-amber-600" /> ⚠ Parcial ({completeness.available}/{completeness.total})
                                          </span>
                                        )}
                                        {completeness.status === 'Faltando' && (
                                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 border border-rose-300 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                                            <XCircle size={12} className="text-rose-600" /> ✖ Faltando (0/{completeness.total})
                                          </span>
                                        )}

                                        <span className="text-xs font-black text-slate-900">{item.code ? `${item.code} - ` : ''}{item.name}</span>
                                        <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[8px] font-bold uppercase">{item.type}</span>
                                      </div>

                                      <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                        {item.description || 'Sem descrição cadastrada'}
                                      </p>

                                      {/* Auto Calculated Completeness Summary */}
                                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[10px] font-black uppercase text-slate-500">
                                            Completude do Item: {completeness.available} de {completeness.total} recursos disponíveis
                                          </span>
                                          <span className="text-[10px] font-bold text-slate-700">{completeness.percent}%</span>
                                        </div>

                                        {completeness.missingNames.length > 0 && (
                                          <p className="text-[10px] font-bold text-rose-600">
                                            Falta: <span className="font-semibold text-rose-800">{completeness.missingNames.join(', ')}</span>
                                          </p>
                                        )}
                                      </div>
                                    </div>

                                    <button
                                      onClick={() => setSelectedTreeItem({ doc: activeDoc, chapter: chap, item })}
                                      className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Eye size={14} /> Detalhes & Recursos
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12 text-slate-400 italic text-xs">
                      Nenhum capítulo cadastrado neste documento.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 text-slate-400 italic text-sm">
                Selecione um documento para visualizar a estrutura hierárquica.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: BANCO DE CONHECIMENTO REGULATÓRIO (REPLACES BASE DE DADOS INTERNA)
          ========================================================================= */}
      {activeTab === 'knowledge_bank' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <Database size={20} className="text-indigo-600" />
                Banco de Conhecimento Regulatório
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Repositório reutilizável de informações estruturadas, narrativas técnicas, tabelas, evidências e anexos (Single Source of Truth).
              </p>
            </div>

            <button
              onClick={() => handleOpenKbModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus size={16} /> Cadastrar Registro no Banco
            </button>
          </div>

          {/* Category Tabs for Knowledge Bank */}
          <div className="flex gap-2 border-b pb-3 overflow-x-auto">
            {(['Informações Estruturadas', 'Narrativas Técnicas', 'Tabelas', 'Evidências', 'Anexos'] as KnowledgeCategory[]).map(cat => (
              <button
                key={cat}
                onClick={() => setKbCategoryTab(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  kbCategoryTab === cat ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Knowledge Bank Records List */}
          <div className="space-y-4">
            {knowledgeRecords.filter(r => r.category === kbCategoryTab).map(rec => (
              <div key={rec.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                      ID: {rec.internalId}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                  </div>

                  <button
                    onClick={() => handleOpenKbModal(rec)}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    Editar Registro
                  </button>
                </div>

                {/* Record Value */}
                <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 whitespace-pre-wrap">
                  {rec.value}
                </div>

                <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-500 font-bold gap-2 pt-1 border-t border-slate-200/60">
                  <span>Origem: {rec.origin}</span>
                  <span>Versão: v{rec.version} | Atualizado em: {new Date(rec.updatedAt).toLocaleDateString()}</span>
                </div>

                {/* Used In Documents List */}
                {rec.usedInDocs && rec.usedInDocs.length > 0 && (
                  <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-xl text-xs space-y-1">
                    <span className="text-[9px] font-black uppercase text-indigo-700 tracking-wider block">
                      UTILIZADO AUTOMATICAMENTE NOS DOCUMENTOS:
                    </span>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {rec.usedInDocs.map((u, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-900 rounded-md text-[9px] font-bold border border-indigo-200">
                          {u.docTitle} ({u.itemCode || 'Item'})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 3: REGISTROS REPETITIVOS DO PROJETO (PROJECT LEVEL)
          ========================================================================= */}
      {activeTab === 'repeatable_records' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                <TableIcon size={20} className="text-teal-600" />
                Registros Repetitivos do Projeto
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Registros técnicos do projeto (Lotes, Apresentações, Doses, Estudos de Estabilidade, Comparabilidade e Controles de Qualidade) mantidos no nível do Projeto.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {repeatableRecords.length > 0 ? (
              repeatableRecords.map(rec => (
                <div key={rec.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                      {rec.category}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                  </div>

                  <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700">
                    {JSON.stringify(rec.data, null, 2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                Nenhum registro repetitivo cadastrado para o projeto selecionado. Os documentos consultarão estes registros automaticamente quando adicionados ao projeto.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: CONTRIBUIÇÕES PENDENTES DO MÓDULO PROJETOS
          ========================================================================= */}
      {activeTab === 'contributions' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Layers size={20} className="text-amber-600" />
              Contribuições Regulatórias Originadas no Módulo Projetos
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Microatividades marcadas como geradoras de conteúdo regulatório ou com evidências registradas nas tarefas do projeto.
            </p>
          </div>

          <div className="space-y-4">
            {projectPendingContributions.map(contrib => (
              <div key={contrib.id} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black uppercase text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      {contrib.projectName}
                    </span>
                    <span className="text-[9px] font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                      Macro: {contrib.macroName}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 mt-1">{contrib.title}</h4>
                  <p className="text-xs text-slate-600 font-medium">{contrib.description}</p>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1">Responsável: {contrib.assignee}</span>
                </div>

                <div className="flex items-center gap-2">
                  {contrib.evidenceUrl && (
                    <a
                      href={contrib.evidenceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider rounded-xl transition flex items-center gap-1.5"
                    >
                      <Paperclip size={14} /> Ver Anexo
                    </a>
                  )}
                  <button
                    onClick={() => {
                      handleOpenKbModal({
                        id: '',
                        projectId: contrib.projectId,
                        internalId: contrib.title.toUpperCase().replace(/\s+/g, '_'),
                        category: 'Informações Estruturadas',
                        title: contrib.title,
                        value: contrib.description,
                        origin: `Microatividade: ${contrib.title}`,
                        updatedAt: new Date().toISOString(),
                        version: 1
                      });
                      setActiveTab('knowledge_bank');
                    }}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle size={14} /> Registrar no Banco
                  </button>
                </div>
              </div>
            ))}

            {projectPendingContributions.length === 0 && (
              <div className="text-center py-12 text-slate-400 italic text-xs">
                Nenhuma contribuição pendente originada de microatividades de projeto.
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: MARCADORES E MODELOS WORD
          ========================================================================= */}
      {activeTab === 'markers_templates' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-6">
          <div className="border-b pb-4">
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
              <Tag size={20} className="text-purple-600" />
              Mapeamento de Marcadores e Modelos Word
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Associação de marcadores de template Word (placeholders ex: <code className="bg-slate-100 px-1 py-0.5 rounded text-purple-700">[NOME_DA_VACINA]</code>) aos registros correspondentes no Banco de Conhecimento Regulatório.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {markerMappings.map(map => (
              <div key={map.id} className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-black text-purple-900 bg-purple-100 px-2.5 py-1 rounded-lg border border-purple-300">
                    {map.marker}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{map.sourceCategory}</span>
                </div>
                <p className="text-xs font-bold text-slate-800">Origem: <code className="bg-white px-1.5 py-0.5 border rounded text-slate-900">{map.sourceKey}</code></p>
                <p className="text-[10px] text-slate-500 font-medium">{map.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal for Item Details and Resources Breakdown */}
      {selectedTreeItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <span className="text-[9px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  {selectedTreeItem.doc.title} - {selectedTreeItem.chapter.code}
                </span>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mt-1">
                  {selectedTreeItem.item.name}
                </h3>
              </div>
              <button onClick={() => setSelectedTreeItem(null)} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Descrição do Item</label>
                <p className="text-xs text-slate-700 font-medium mt-1">
                  {selectedTreeItem.item.description || 'Sem descrição'}
                </p>
              </div>

              {/* Required Resources List */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase">
                  Recursos Necessários e Status de Disponibilidade
                </label>

                <div className="space-y-2 border border-slate-200 rounded-2xl p-4 bg-slate-50">
                  {selectedTreeItem.item.requiredResources?.map(res => {
                    const isAvail = knowledgeRecords.some(k => k.internalId === res.key) || Boolean(selectedTreeItem.item.value);

                    return (
                      <div key={res.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900">{res.name}</span>
                          <span className="block text-[9px] text-slate-400 font-bold">Tipo: {res.type} | Chave: {res.key || 'N/A'}</span>
                        </div>

                        {isAvail ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-md text-[10px] font-black uppercase">
                            ✔ Disponível
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-800 rounded-md text-[10px] font-black uppercase">
                            ✖ Faltando
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setSelectedTreeItem(null)} className="px-6 py-2.5 bg-slate-900 text-white font-black text-xs rounded-xl cursor-pointer">
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal to Register or Edit Knowledge Bank Record */}
      {showKbRecordModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[120] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-lg w-full space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                {editingKbId ? 'Editar Registro no Banco' : 'Cadastrar no Banco de Conhecimento'}
              </h3>
              <button onClick={() => setShowKbRecordModal(false)} className="p-1 text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Chave de Identificação Única (ID Interno)</label>
                <input
                  type="text"
                  placeholder="ex: PRODUCT.NAME"
                  value={kbKey}
                  onChange={e => setKbKey(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Título da Informação</label>
                <input
                  type="text"
                  placeholder="ex: Nome Comercial da Vacina"
                  value={kbTitle}
                  onChange={e => setKbTitle(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Categoria</label>
                <select
                  value={kbCategory}
                  onChange={e => setKbCategory(e.target.value as KnowledgeCategory)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                >
                  <option value="Informações Estruturadas">Informações Estruturadas</option>
                  <option value="Narrativas Técnicas">Narrativas Técnicas</option>
                  <option value="Tabelas">Tabelas</option>
                  <option value="Evidências">Evidências</option>
                  <option value="Anexos">Anexos</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Conteúdo / Valor</label>
                <textarea
                  rows={4}
                  placeholder="Informe o conteúdo ou link..."
                  value={kbValue}
                  onChange={e => setKbValue(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase">Origem da Informação</label>
                <input
                  type="text"
                  placeholder="ex: Relatório Clínico Fase I / Atividade 2.3"
                  value={kbOrigin}
                  onChange={e => setKbOrigin(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowKbRecordModal(false)} className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer">Cancelar</button>
              <button onClick={handleSaveKbRecord} className="px-6 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-xl shadow-lg cursor-pointer">Salvar no Banco</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
