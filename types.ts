
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type Status = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Não Aplicável' | 'Pausado';
export type ReportStage = 
  | 'Em Elaboração' 
  | 'Próximo Revisor (equipe AR)' 
  | 'Revisão Colaboradores' 
  | 'Revisão Comitê Gestor' 
  | 'Concluído' 
  | 'Concluído e Assinado';

export type ReportStatus = 'Pendente' | 'Concluído' | 'N/A';
// Novo tipo para status de microatividades
export type MicroActivityStatus = 'Planejado' | 'Em andamento' | 'Concluído com restrições' | 'A repetir / retrabalho' | 'Concluído e aprovado';

export type PrerequisiteType = 'orçamento' | 'contratação' | 'logística' | 'recurso';
export type PrerequisiteStatus = 'não iniciado' | 'em andamento' | 'concluído';

export interface Prerequisite {
  id: string;
  name: string;
  type: PrerequisiteType;
  status: PrerequisiteStatus;
  completed: boolean;
  leadTimeDays: number;
  value?: number;
  date?: string;
  company?: string;
}

export type BudgetStatus = 'solicitado' | 'recebido' | 'aprovado';

export interface BudgetInfo {
  estimatedValue: number;
  supplier: string;
  budgetDate: string;
  status: BudgetStatus;
}

export interface TaskNote {
  id: string;
  date: string;
  user: string;
  note: string;
}

export interface Task {
  id: string;
  project: string;
  activity: string;
  description: string;
  projectLead: string;
  collaborators: string[];
  priority: Priority;
  status: Status;
  requestDate: string;
  plannedStartDate: string;
  actualStartDate?: string;
  completionDate: string;
  progress: number;
  nextStep: string;
  updates: TaskNote[];
  isReport: boolean;
  reportStage?: ReportStage;
  currentReviewer?: string;
  elaboratorName?: string;
  collaboratorReviewerName?: string;
  committeeReviewerName?: string;
  fileLocation?: string; // Link para o arquivo de revisão
  deleted?: boolean;
  deletionReason?: string;
  deletionDate?: string;
  completedCollaborators?: string[]; // Adicionado para rastrear quem finalizou a revisão
  generatesRegulatoryContent?: boolean;
  dossierContribution?: DossierContribution;
}

export type ViewMode = 'dashboard' | 'tasks' | 'projects' | 'quality' | 'traceability' | 'regulatory' | 'dossier_contributions' | 'dossier_assembler' | 'regulatory_docs' | 'meetings';

export type SystemModule = 'activities_projects' | 'regulatory_standards' | 'vaccines_components' | 'dossier_contributions' | 'dossier_assembler' | 'meetings';

export type MeetingType = 'Técnica' | 'Regulatória' | 'Desenvolvimento' | 'Alinhamento' | 'Comitê Gestor' | 'Qualidade' | 'Submissão';
export type MeetingStatus = 'Agendada' | 'Em Andamento' | 'Concluída' | 'Cancelada';

export interface MeetingActionItem {
  id: string;
  action: string;
  responsible: string;
  dueDate: string;
  status: 'Pendente' | 'Em Andamento' | 'Concluído';
  convertedToActivity?: boolean;
  convertedActivityId?: string;
  targetMacroId?: string;
}

export interface MeetingAgendaItem {
  id: string;
  title: string;
  description?: string;
  phase?: string;
  macroActivityId?: string;
  microActivityId?: string;
  regulatoryDocId?: string;
  linkedRegulatoryStandardIds?: string[];
  linkedPostItIds?: string[];
  discussions?: string;
  decisions?: string;
  hasRegulatoryImpact?: boolean;
  regulatoryImpactDetails?: string;
  actionItems?: MeetingActionItem[];
}

export interface Meeting {
  id: string;
  title: string;
  projectId: string;
  projectName?: string;
  date: string; // YYYY-MM-DD
  time?: string; // HH:mm
  location?: string;
  type: MeetingType;
  status: MeetingStatus;
  moderator: string;
  participants: string[];
  agendaItems: MeetingAgendaItem[];
  generalConclusions?: string;
  minutesTemplate?: string;
  minutesDocument?: string;
  createdAt: string;
  updatedAt: string;
}

export type DossierChapterId = 
  | 'cap_1' 
  | 'cap_2' 
  | 'cap_3' 
  | 'cap_4' 
  | 'cap_5' 
  | 'cap_6'
  | string;

export interface DDCMChapterDef {
  id: DossierChapterId;
  code: string;
  title: string;
  shortTitle: string;
  description: string;
}

export type DossierContributionType = 'texto' | 'documento' | 'formulario';
export type DossierContributionStatus = 'Rascunho' | 'Em Revisão' | 'Aprovado';

export interface DossierFormFields {
  title?: string;
  methodologySummary?: string;
  keyResults?: string;
  regulatoryConclusion?: string;
  specifications?: string;
  customNotes?: string;
}

export interface DossierContributionVersion {
  version: number;
  updatedAt: string;
  updatedBy: string;
  type: DossierContributionType;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  formFields?: DossierFormFields;
  status: DossierContributionStatus;
  reviewNotes?: string;
}

export interface DossierContribution {
  id: string;
  projectId: string;
  projectName?: string;
  macroActivityId?: string;
  macroActivityName?: string;
  activityId: string;
  activityName: string;
  chapterId: DossierChapterId;
  chapterTitle: string;
  type: DossierContributionType;
  content: string;
  attachmentUrl?: string;
  attachmentName?: string;
  formFields?: DossierFormFields;
  status: DossierContributionStatus;
  version: number;
  versionsHistory?: DossierContributionVersion[];
  author: string;
  reviewer?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export type RegulatoryStandardStatus = 'vigente' | 'vigente com alteração' | 'Alterador' | 'À Entrar em Vigor' | 'obsoleto';

export interface RegulatoryStandard {
  id: string;
  name: string;
  type: string; // Ex: Manual, Guia, RDC, etc.
  theme: string;
  phase: string;
  relatedActivities: string[]; // Nomes das atividades relacionadas para vínculo automático
  version: string;
  status: RegulatoryStandardStatus;
  summary: string;
  documentLink: string;
  notebookLMLink: string;
  keywords?: string[]; // Palavras-chave para busca
  appliesTo?: string; // Se aplica a...
  linkedStandards?: string[]; // Outras normas e guias vinculadas
  keyNotes?: string; // Principais notas sobre a norma
}

export interface ConceptStandardLink {
  standardId: string;
  relevantPassages?: string;
  page?: string; // Páginas Importantes
  section?: string; // Seção ou Seções Relevantes
  sections?: string[]; // Múltiplas Seções Relevantes (opcional)
}

export interface KnowledgeConcept {
  id: string;
  title: string;
  centralIdeas?: string[]; // Múltiplas ideias centrais (Ideia Central 1, 2, etc.)
  centralIdea?: string; // Mantido para compatibilidade retroativa
  practicalApplication?: string; // Mantido como opcional para compatibilidade
  observations?: string; // Opcional
  linkedStandards: ConceptStandardLink[];
  color?: string;
}

export interface RegulatoryBlockAssociation {
  standardId: string;
  importantNotes: string;
  specificPassages: string;
}

export interface RegulatoryBlock {
  id: string;
  name: string;
  concepts?: KnowledgeConcept[];
  associations?: RegulatoryBlockAssociation[];
}

export interface RegulatorySubject {
  id: string;
  name: string;
  blocks: RegulatoryBlock[];
}

export interface SyncInfo {
  timestamp: string;
  user: string;
  status: 'syncing' | 'synced' | 'error' | 'conflict' | 'cancelled';
}

export interface AppNotification {
  id: string;
  userId: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'REVIEW_ASSIGNED' | 'TASK_UPDATE' | 'RESTORED';
  refId: string;
}

export interface AccessUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: 'active' | 'inactive';
}

export type AppUserRole = 
  | 'admin' 
  | 'user_team_1'
  | 'user_team_2'
  | 'user_team_3'
  | 'user_team_4'
  | 'user_team_5'
  | 'user_general';

export interface AppUser {
  id: string;
  username: string;
  email: string;
  role: AppUserRole;
  status: 'active' | 'pending' | 'blocked';
  joinedAt: string;
}

export interface ActivityLog {
  id: string;
  action: 'CRIAÇÃO' | 'EDIÇÃO' | 'EXCLUSÃO' | 'RESTAURAÇÃO' | 'REVISÃO';
  taskTitle: string;
  user: string;
  timestamp: string;
  reason: string;
  refId?: string;
  refType?: 'task' | 'project';
}

export interface MacroActivityTemplate {
  name: string;
  phase: string;
  microActivities?: string[];
  expectedResults?: string;
  resultLinks?: string[];
  hasDeliverable?: boolean;
  deliverableType?: string;
}

export interface RegulatoryChecklistItem {
  id: string;
  item: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface TransversalActivity {
  id: string;
  iconName: string;
  label: string;
  desc: string;
}

export interface ActivityPlanTemplate {
  id: string;
  name: string;
  phases: string[];
  macroActivities: MacroActivityTemplate[];
  regulatoryChecklist?: RegulatoryChecklistItem[];
  objective?: string;
  transversalActivities?: TransversalActivity[];
}

export interface MicroActivity {
  id: string;
  name: string;
  assignee: string;
  startDate?: string;
  dueDate: string;
  status: MicroActivityStatus; // Alterado de Status
  observations: string;
  reportLink?: string;
  completionDate?: string;
  progress?: number;
  prerequisites?: Prerequisite[];
  budget?: BudgetInfo;
  realStartDate?: string;
  realEndDate?: string;
  generatesRegulatoryContent?: boolean;
  dossierContribution?: DossierContribution;
  evidenceUrl?: string;
  evidenceDescription?: string;
  evidenceFileName?: string;
}

export interface MacroActivity {
  id: string;
  name: string;
  phase: string; // Adicionado
  microActivities: MicroActivity[];
  prerequisites?: Prerequisite[];
  dueDate?: string;
  expectedResults?: string;
  resultLinks?: string[];
  resultsFulfilled?: boolean;
  completionExplanation?: string;
  hasDeliverable?: boolean;
  deliverableType?: string;
  isDeliverableRegistered?: boolean;
}

export interface Project {
  id: string;
  name: string;
  responsible?: string;
  status: 'Em Planejamento' | 'Ativo' | 'Suspenso' | 'Concluído';
  templateId: string;
  phases: string[]; // Adicionado
  macroActivities: MacroActivity[];
  team?: string[];
  deleted?: boolean;
  deletionReason?: string;
  deletionDate?: string;
  regulatoryChecklist?: RegulatoryChecklistItem[];
  objective?: string;
  transversalActivities?: TransversalActivity[];
  description?: string;
  dossierChapters?: DDCMChapterDef[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isLeader: boolean;
  password?: string;
  isComiteGestor?: boolean;
}


export interface DashboardStats {
  totalTasks: number;
  monthlyDeliveries: number;
  inExecution: number;
  avgProgress: number;
  blockedCount: number;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  notificationsEnabled: boolean;
  active: boolean;
}

export type MicroTaskStatus = 'Pendente' | 'Em Andamento' | 'Concluído' | 'Validado';

export interface MicroTask {
  id: string;
  name: string;
  status: MicroTaskStatus;
}

export interface MacroTask {
  id: string;
  name: string;
  microTasks: MicroTask[];
}

export interface ProjectData {
  id: string;
  name: string;
  status: 'Em Planejamento' | 'Ativo' | 'Suspenso' | 'Concluído';
  trackingMacroTasks: MacroTask[];
  regulatoryMacroTasks: MacroTask[];
}

export interface AppConfig {
  users: AppUser[];
  authorizedEmails: string[];
  notificationEmail: string;
  projectsData: ProjectData[];
}

// Módulo de Vacinas e Componentes
export type VaccinePlatform = 
  | 'Proteína Recombinante' 
  | 'Vetor Viral' 
  | 'RNA/mRNA' 
  | 'DNA' 
  | 'Inativada' 
  | 'Atenuada' 
  | 'Subunidade / VLP';

export type VaccinePhase = 
  | 'Pesquisa Básica'
  | 'Desenvolvimento Inicial' 
  | 'Prova de Conceito' 
  | 'Pré-clínico In Vitro' 
  | 'Pré-clínico In Vivo' 
  | 'Ensaio Clínico Fase 1' 
  | 'Ensaio Clínico Fase 2' 
  | 'Ensaio Clínico Fase 3' 
  | 'Registro / Produção';

export type VaccineStatus = 
  | 'Em Desenvolvimento' 
  | 'Em Ensaio' 
  | 'Aprovado' 
  | 'Pausado' 
  | 'Descontinuado';

export type ComponentCategory = 
  | 'Antígeno' 
  | 'Adjuvante' 
  | 'Vetor de Expressão' 
  | 'Linhagem Celular'
  | 'Tampão / Estabilizante' 
  | 'Conservante' 
  | 'Solvente / Diluente';

export type ComponentGrade = 
  | 'GMP / Grau Clínico' 
  | 'Pre-GMP' 
  | 'Grau Científico / Pesquisa' 
  | 'Farmacopéico USP/EP';

export interface ComponentUsageInVaccine {
  componentId: string;
  componentName?: string;
  concentration: string;
}

export interface VaccineCandidate {
  id: string;
  name: string;
  codeName: string;
  platform: VaccinePlatform;
  targetPathogen: string;
  phase: VaccinePhase;
  status: VaccineStatus;
  leadResearcher: string;
  description: string;
  associatedComponentIds: string[];
  componentUsages?: ComponentUsageInVaccine[];
  vaccineOriginType?: 'interna' | 'aprovada';
  approvalAgency?: string;
  associatedProjectId?: string;
  anvisaStatus?: string;
  technicalNotes?: string;
  createdDate: string;
  updatedDate: string;
}

export interface VaccineComponent {
  id: string;
  name: string;
  code: string;
  category: ComponentCategory;
  originHostSystem?: string;
  grade: ComponentGrade;
  storageTemperature: string;
  batchNumber: string;
  expiryDate?: string;
  stockQuantity: string;
  unit: string;
  description: string;
  supplier?: string;
  coaUrl?: string;
  safetyDataSheetLink?: string;
}

export type ImpurityCategory = 
  | 'Relacionada ao Processo' 
  | 'Relacionada ao Produto' 
  | 'Reagentes Residual' 
  | 'DNA/HCP Celular' 
  | 'Lixiviáveis / Extraíveis' 
  | 'Outros';

export interface VaccineImpurity {
  id: string;
  item: string; // ex: Item Possíveis impurezas relacionadas ao processo de fabricação da proteína Sm29
  vaccineId: string;
  vaccineName: string;
  category: ImpurityCategory;
  subCategory?: string;
  safetyData?: string; // Dados de segurança
  noael?: string; // NOAEL, quando houver
  pdeAdi?: string; // PDE / ADI (se disponível)
  acceptanceCriteria: string; // Critérios de aceitação e justificativa
  reference: string; // Referência das impurezas por vacina
  createdDate: string;
  updatedDate: string;
}

export interface FormulationBatchComponentUsage {
  componentId: string;
  quantityUsed: string;
}

export interface FormulationBatch {
  id: string;
  batchCode: string;
  vaccineId: string;
  preparationDate: string;
  expiryDate: string;
  componentsUsed: FormulationBatchComponentUsage[];
  qualityControlStatus: 'Em Análise' | 'Conforme' | 'Não Conforme' | 'Quarentena';
  sterilityStatus?: string;
  potencyResult?: string;
  responsibleTechnician: string;
  notes?: string;
}

// --- MÓDULO DE GESTÃO DE DOCUMENTOS REGULATÓRIOS ---

export interface RegulatoryEvidence {
  id: string;
  title: string;
  description: string;
  originActivityId: string;
  originActivityName: string;
  macroActivityId?: string;
  macroActivityName?: string;
  fileUrl?: string;
  fileName?: string;
  date: string;
  responsible: string;
  useInRegulatoryDoc: boolean; // Sim / Não
  projectId: string;
}

export interface MacroActivityConfigField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea';
  options?: string[];
  required?: boolean;
}

export interface MacroActivityConfig {
  id: string;
  macroActivityName: string;
  phase?: string;
  requiredFields: MacroActivityConfigField[];
}

export interface RegulatoryInfoItem {
  id: string;
  internalId: string; // ex: PRODUCT.NAME, IFA.DESCRIPTION, STABILITY.TABLE
  name: string;
  category: string; // Produto, IFA, Adjuvante, Processo, etc.
  type: string; // Parâmetro, Texto, Tabela, Especificação
  value: string;
  origin: string; // Cadastro do Produto, Ensaio, Lote, etc.
  version: number;
  supportingEvidenceId?: string;
  supportingEvidenceTitle?: string;
  updatedAt: string;
  projectId: string;
}

export interface RepeatableRecord {
  id: string;
  projectId: string;
  category: 'Lotes' | 'Doses' | 'Apresentações' | 'Estabilidades' | 'ControleQualidade' | 'Comparabilidade' | string;
  title: string;
  data: Record<string, any>;
  updatedAt: string;
}

export interface RegulatoryNarrativeRevision {
  version: number;
  date: string;
  author: string;
  text: string;
  notes?: string;
}

export interface RegulatoryNarrative {
  id: string;
  projectId: string;
  title: string;
  category: string; // Introdução, Histórico, IFA, Adjuvante, Vacina, Risco, Conclusões
  text: string;
  version: number;
  revisionHistory: RegulatoryNarrativeRevision[];
  approvalStatus: 'Rascunho' | 'Em Revisão' | 'Aprovado';
  updatedAt: string;
}

export type RegulatoryResourceType = 
  | 'Informação Estruturada' 
  | 'Narrativa Técnica' 
  | 'Registro Repetitivo' 
  | 'Tabela' 
  | 'Evidência' 
  | 'Anexo';

export interface RegulatoryItemResource {
  id: string;
  name: string; // ex: "Nome da vacina", "IFA", "Temperatura de armazenamento"
  type: RegulatoryResourceType;
  required: boolean;
  key?: string; // ex: "PRODUCT.NAME", "PRODUCT.STORAGE_TEMP"
  value?: any;
  isAvailable?: boolean;
  sourceOrigin?: string;
  notes?: string;
}

export type RegulatoryDocItemType = 'Informação Regulatória' | 'Narrativa' | 'Evidência' | 'Tabela' | 'Figura' | 'Referência' | 'Informação Estruturada' | 'Anexo';
export type RegulatoryDocItemStatus = 'Pronto' | 'Em Andamento' | 'Faltando' | 'Pendente' | 'Concluído';

export interface RegulatoryDocumentItem {
  id: string;
  code?: string; // ex: "2.1"
  name: string;
  description?: string; // ex: "Descrição da forma farmacêutica e apresentação"
  type: RegulatoryDocItemType;
  required: boolean; // Obrigatório ou opcional
  sourceInternalId: string; // Ponteiro para Identificador Interno ou ID de Narrativa/Evidência
  status: RegulatoryDocItemStatus;
  marker?: string; // ex: [NOME_DA_VACINA]
  value?: string; // Conteúdo / Valor do Item
  evidenceUrl?: string; // URL da evidencia/arquivo
  evidenceFileName?: string; // Nome do arquivo anexo
  notes?: string;
  requiredResources?: RegulatoryItemResource[]; // Recursos necessários para preenchimento com cálculo de completude
}

export interface RegulatoryDocumentChapter {
  id: string;
  code: string;
  title: string;
  description?: string;
  items: RegulatoryDocumentItem[];
  subchapters?: RegulatoryDocumentChapter[];
}

export interface RegulatoryDocumentVersion {
  version: string; // ex: "0.1", "0.2", "1.0", "1.1"
  date: string;
  status: 'Rascunho' | 'Complementação' | 'Revisão Técnica' | 'Submetido' | 'Aprovado' | string;
  author?: string;
  notes?: string;
}

export interface RegulatoryDocument {
  id: string;
  projectId: string;
  title: string; // DDCM, Dossiê da Vacina, Dossiê do IFA, Dossiê do Adjuvante, Brochura do Investigador, DEEC
  type: string;
  description?: string;
  currentVersion?: string; // ex: "0.1"
  currentVersionStatus?: string; // ex: "Rascunho", "Submetido"
  versionHistory?: RegulatoryDocumentVersion[];
  chapters: RegulatoryDocumentChapter[];
  updatedAt: string;
}

export type KnowledgeCategory = 
  | 'Informações Estruturadas' 
  | 'Narrativas Técnicas' 
  | 'Tabelas' 
  | 'Evidências' 
  | 'Anexos';

export interface KnowledgeRecordHistory {
  version: number;
  updatedAt: string;
  author?: string;
  value: any;
  notes?: string;
}

export interface KnowledgeUsedInDoc {
  docId: string;
  docTitle: string;
  itemCode?: string;
  itemName?: string;
}

export interface RegulatoryKnowledgeRecord {
  id: string;
  projectId: string;
  internalId: string; // identificador único ex: "PRODUCT.NAME"
  category: KnowledgeCategory;
  title: string;
  value: any; // texto, estrutura de tabela ou URL
  origin: string; // ex: "Atividade de Caracterização", "Projeto X", "Cadastro Manual"
  updatedAt: string;
  version: number;
  history?: KnowledgeRecordHistory[];
  usedInDocs?: KnowledgeUsedInDoc[];
}

export interface RegulatoryStructuredTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date';
}

export interface RegulatoryStructuredTable {
  id: string;
  projectId: string;
  key: string; // ex: "TABLE_PRESENTATIONS"
  title: string;
  description?: string;
  columns: RegulatoryStructuredTableColumn[];
  rows: Record<string, any>[];
  updatedAt: string;
}

export interface RegulatoryMarkerMapping {
  id: string;
  marker: string; // ex: [NOME_DA_VACINA], [TABELAS], [INTRODUÇÃO_PROJETO]
  sourceCategory: KnowledgeCategory | 'Registro Repetitivo';
  sourceKey: string;
  description?: string;
}