
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
}

export type ViewMode = 'dashboard' | 'tasks' | 'projects' | 'quality' | 'traceability' | 'regulatory';

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