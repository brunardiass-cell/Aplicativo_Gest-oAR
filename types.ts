
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type Status = 'Não Iniciada' | 'Em Andamento' | 'Bloqueada' | 'Concluída';
export type ProjectStatus = 'Em Planejamento' | 'Ativo' | 'Suspenso' | 'Concluído' | 'Atrasado';
export type ItemStatus = 'Pendente' | 'Em Andamento' | 'Validado' | 'Concluído';

export interface TaskUpdate {
  id: string;
  date: string;
  note: string;
  user?: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  user: string;
  timestamp: string;
  reason: string;
  action: 'EXCLUSÃO' | 'ALTERAÇÃO_STATUS';
}

export interface Task {
  id: string;
  requestDate: string;
  project: string; 
  activity: string;
  description: string;
  projectLead: string;
  collaborators: string[];
  priority: Priority;
  status: Status;
  plannedStartDate: string;
  realStartDate?: string;
  completionDate: string;
  progress: number;
  nextStep: string;
  updates: TaskUpdate[];
  emailOnJoin: boolean;
  emailOnDeadline: boolean;
}

export interface Person {
  id: string;
  name: string;
  email: string;
  notificationsEnabled: boolean;
  active: boolean;
}

export interface MicroTask {
  id: string;
  text: string;
  status: ItemStatus;
  owner: string;
  deadline: string;
}

export interface MacroTask {
  id: string;
  title: string;
  description?: string;
  microTasks: MicroTask[];
}

export interface RegulatoryNorm {
  id: string;
  title: string;
  link: string;
  lastVerifiedDate: string;
}

export interface ProjectData {
  id: string;
  name: string;
  status: ProjectStatus;
  trackingMacroTasks: MacroTask[];
  regulatoryMacroTasks: MacroTask[];
  norms?: RegulatoryNorm[];
}

export interface DashboardStats {
  totalTasks: number;
  monthlyDeliveries: number;
  inExecution: number;
  avgProgress: number;
  blockedCount: number;
}

export interface AppUser {
  username: string;
  role: 'admin' | 'user' | 'visitor';
  passwordHash: string;
  canViewAll?: boolean;
}

export interface AppConfig {
  notificationEmail: string;
  people: Person[];
  projectsData: ProjectData[];
  users: AppUser[];
}

export type ViewMode = 'selection' | 'dashboard' | 'tasks' | 'projects' | 'people' | 'logs' | 'access-control';
