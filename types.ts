
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type Status = 'Planejada' | 'Em Andamento' | 'Concluída' | 'Não Aplicável' | 'Pausado';
export type ReportStage = 
  | 'Em Elaboração' 
  | 'Próximo Revisor' 
  | 'Revisão Colaboradores' 
  | 'Revisão Comitê Gestor' 
  | 'Concluído' 
  | 'Concluído e Assinado';

export type ReportStatus = 'Pendente' | 'Concluído' | 'N/A';
// Novo tipo para status de microatividades
export type MicroActivityStatus = 'Planejado' | 'Em andamento' | 'Concluído com restrições' | 'A repetir / retrabalho' | 'Concluído e aprovado';

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
  completedCollaborators?: string[]; // Adicionado para rastrear quem finalizou a revisão
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
}

export interface MacroActivityTemplate {
  name: string;
  phase: string;
}

export interface ActivityPlanTemplate {
  id: string;
  name: string;
  phases: string[];
  macroActivities: MacroActivityTemplate[];
}

export interface MicroActivity {
  id: string;
  name: string;
  assignee: string;
  dueDate: string;
  status: MicroActivityStatus; // Alterado de Status
  observations: string;
  reportLink?: string;
  completionDate?: string;
  progress?: number;
}

export interface MacroActivity {
  id: string;
  name: string;
  phase: string; // Adicionado
  microActivities: MicroActivity[];
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
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  isLeader: boolean;
  password?: string;
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
