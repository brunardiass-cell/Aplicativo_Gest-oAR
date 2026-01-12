
export type Priority = 'Baixa' | 'Média' | 'Alta' | 'Urgente';
export type Status = 'Não Iniciada' | 'Em Andamento' | 'Bloqueada' | 'Concluída';
export type ProjectStatus = 'Em Planejamento' | 'Ativo' | 'Suspenso' | 'Concluído' | 'Atrasado';

export interface TaskUpdate {
  id: string;
  date: string;
  note: string;
}

export interface ActivityLog {
  id: string;
  taskId: string;
  taskTitle: string;
  user: string;
  timestamp: string;
  reason: string;
  action: 'EXCLUSÃO';
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
}

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface ProjectData {
  id: string;
  name: string;
  status: ProjectStatus;
  trackingChecklist: ChecklistItem[];
  regulatoryChecklist: ChecklistItem[];
}

export interface DashboardStats {
  totalLastMonth: number;
  completed: number;
  inProgress: number;
  blocked: number;
  avgProgress: number;
}

export interface AppUser {
  username: string;
  role: 'admin' | 'user' | 'visitor';
  passwordHash: string;
}

export interface AppConfig {
  notificationEmail: string;
  people: Person[];
  projectsData: ProjectData[];
  users: AppUser[];
}

export type ViewMode = 'selection' | 'dashboard' | 'tasks' | 'projects' | 'people' | 'logs' | 'access-control';
