
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type Status = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Não Aplicável' | 'Bloqueada';
export type ReportStage = 
  | 'Em Elaboração' 
  | 'Próximo Revisor' 
  | 'Revisão Colaboradores' 
  | 'Revisão Comitê Gestor' 
  | 'Concluído' 
  | 'Concluído e Assinado';

export type ReportStatus = 'Pendente' | 'Concluído' | 'N/A';
export type CompletionStatus = 'Não Finalizada' | 'Aprovada' | 'Finalizada com Restrições' | 'A ser Repetida';

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
  fileLocation?: string; // Link para o arquivo de revisão
  deleted?: boolean;
  deletionReason?: string;
  deletionDate?: string;
}

export type ViewMode = 'dashboard' | 'tasks' | 'projects' | 'quality' | 'traceability';

export interface SyncInfo {
  timestamp: string;
  user: string;
  status: 'syncing' | 'synced' | 'error';
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

export interface ActivityLog {
  id:string;
  action: 'CRIAÇÃO' | 'EDIÇÃO' | 'EXCLUSÃO' | 'RESTAURAÇÃO' | 'REVISÃO';
  taskTitle: string;
  user: string;
  timestamp: string;
  reason: string;
}

export interface ActivityPlanTemplate {
  id: string;
  name: string;
  macroActivities: string[];
}

export interface MicroActivity {
  id: string;
  name: string;
  assignee: string;
  dueDate: string;
  status: Status;
  completionStatus: CompletionStatus;
  observations: string;
  reportLink?: string;
  completionDate?: string;
}

export interface MacroActivity {
  id: string;
  name: string;
  status: Status; // Derivado das microatividades
  microActivities: MicroActivity[];
}

export interface Project {
  id: string;
  name: string;
  status: 'Em Planejamento' | 'Ativo' | 'Suspenso' | 'Concluído';
  templateId: string;
  macroActivities: MacroActivity[];
}

export type UserRole = 'Admin' | 'Membro' | 'Usuario';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string;
  role: UserRole;
  password?: string;
  status: 'active' | 'inactive';
}


// Interfaces de suporte que podem ser úteis em outros contextos
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

// FIX: Add missing type definitions for ProjectData and AppConfig.
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
  users: TeamMember[]; // Changed from AppUser to TeamMember
  authorizedEmails: string[];
  notificationEmail: string;
  projectsData: ProjectData[];
}
