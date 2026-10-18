import React, { useState, useMemo, useEffect } from 'react';
import { Task, AppNotification, Status, Priority, TaskNote, ActivityType, TeamMember } from '../types';
import { TaskNotesModal } from './TaskNotesModal';
import { ChangeDeadlineModal } from './ChangeDeadlineModal';
import { GeneralActivitiesModal } from './GeneralActivitiesModal';
import { 
  ArrowRight, 
  MessageSquare, 
  FileSignature, 
  Clock, 
  X,
  Eye,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Filter,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  MoreVertical,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Cloud,
  Users,
  StickyNote,
  AlertCircle,
  Flag,
  CalendarDays,
  Sparkles,
  ChevronDown,
  UserCheck
} from 'lucide-react';

interface TaskBoardProps {
  tasks: Task[];
  currentUser: string | 'Todos';
  onEdit: (task: Task) => void;
  onView: (task: Task) => void;
  onDelete: (task: Task) => void;
  onAssignReview: (taskId: string, reviewer: string) => void;
  onNotificationClick: (notification: AppNotification) => void;
  onClearSingleNotification: (notificationId: string) => void;
  onClearAllNotifications: () => void;
  notifications: AppNotification[];
  statusFilter: 'Todos' | Status;
  leadFilter: string;
  projectFilter: string;
  onStatusFilterChange: (status: 'Todos' | Status) => void;
  onLeadFilterChange: (lead: string) => void;
  onProjectFilterChange: (project: string) => void;
  uniqueLeads: string[];
  uniqueProjects: string[];
  dateFilterType: 'all' | 'requestDate' | 'completionDate';
  onDateFilterTypeChange: (type: 'all' | 'requestDate' | 'completionDate') => void;
  startDateFilter: string;
  onStartDateFilterChange: (date: string) => void;
  endDateFilter: string;
  onEndDateFilterChange: (date: string) => void;
  onCompleteCollaboration: (taskId: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  onNewTask?: () => void;
  onSaveTask?: (task: Task) => void;
  onDownloadExcel?: () => void;
  onSyncSharePoint?: () => void;
  isSyncingSharePoint?: boolean;
  hasFullAccess?: boolean;
  isLeader?: boolean;
}

// Helpers for Priority Visuals according to Prompt 3 and 4
const getPriorityVisuals = (priority?: Priority) => {
  const p = priority || 'Sem prioridade';
  switch (p) {
    case 'Alta':
    case 'Urgente':
      return {
        badgeClass: 'bg-rose-50 text-rose-700 border-rose-200',
        dotClass: 'bg-rose-500',
        circleBg: 'bg-rose-100 text-rose-700 ring-4 ring-rose-50',
        iconColor: 'text-rose-600',
        label: 'Alta prioridade',
        shortLabel: 'Alta',
        level: 1
      };
    case 'Média':
      return {
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300',
        dotClass: 'bg-amber-500',
        circleBg: 'bg-amber-100 text-amber-800 ring-4 ring-amber-50',
        iconColor: 'text-amber-600',
        label: 'Média prioridade',
        shortLabel: 'Média',
        level: 2
      };
    case 'Baixa':
      return {
        badgeClass: 'bg-sky-50 text-sky-700 border-sky-200',
        dotClass: 'bg-sky-500',
        circleBg: 'bg-sky-100 text-sky-700 ring-4 ring-sky-50',
        iconColor: 'text-sky-600',
        label: 'Baixa prioridade',
        shortLabel: 'Baixa',
        level: 3
      };
    case 'Sem prioridade':
    default:
      return {
        badgeClass: 'bg-slate-100 text-slate-500 border-slate-200',
        dotClass: 'bg-slate-300',
        circleBg: 'bg-slate-100 text-slate-400 ring-4 ring-slate-50',
        iconColor: 'text-slate-400',
        label: 'Sem prioridade',
        shortLabel: 'Sem prioridade',
        level: 4
      };
  }
};

// Activity Type Visuals
const getActivityTypeVisuals = (type?: ActivityType, isReport?: boolean) => {
  const resolvedType = type || (isReport ? 'report' : 'general');
  switch (resolvedType) {
    case 'meeting':
      return {
        label: 'REUNIÃO',
        badge: 'bg-blue-50 text-blue-700 border-blue-200',
        icon: <Users size={12} className="shrink-0" />
      };
    case 'report':
      return {
        label: 'RELATÓRIO',
        badge: 'bg-purple-50 text-purple-700 border-purple-200',
        icon: <FileText size={12} className="shrink-0" />
      };
    case 'note':
      return {
        label: 'NOTA',
        badge: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <StickyNote size={12} className="shrink-0" />
      };
    case 'general':
    default:
      return {
        label: 'ATIVIDADE GERAL',
        badge: 'bg-teal-50 text-teal-800 border-teal-200',
        icon: <FileText size={12} className="shrink-0" />
      };
  }
};

const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return 'N/D';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

const getInitials = (name?: string) => {
  if (!name) return 'U';
  const trimmed = name.trim();
  const parts = trimmed.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
};

export const TaskBoard: React.FC<TaskBoardProps> = ({ 
  tasks, 
  currentUser, 
  onEdit, 
  onView,
  onDelete, 
  onAssignReview,
  onNotificationClick,
  onClearSingleNotification,
  onClearAllNotifications,
  notifications,
  statusFilter,
  leadFilter,
  projectFilter,
  onStatusFilterChange,
  onLeadFilterChange,
  onProjectFilterChange,
  uniqueLeads,
  uniqueProjects,
  dateFilterType,
  onDateFilterTypeChange,
  startDateFilter,
  onStartDateFilterChange,
  endDateFilter,
  onEndDateFilterChange,
  onCompleteCollaboration,
  searchTerm,
  onSearchTermChange,
  onNewTask,
  onSaveTask,
  onDownloadExcel,
  onSyncSharePoint,
  isSyncingSharePoint,
  hasFullAccess = true,
  isLeader = true
}) => {
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('cards');
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<string | null>(null);

  // Modals state
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);
  const [notesModalTask, setNotesModalTask] = useState<Task | null>(null);
  const [deadlineModalTask, setDeadlineModalTask] = useState<Task | null>(null);
  const [isGeneralActivitiesModalOpen, setIsGeneralActivitiesModalOpen] = useState(false);

  // Type & Priority filter dropdowns
  const [typeFilter, setTypeFilter] = useState<'Todos' | ActivityType>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<'Todos' | 'Alta' | 'Média' | 'Baixa' | 'Sem prioridade'>('Todos');

  // Close menus on click outside
  useEffect(() => {
    const handleOutsideClick = () => setOpenMenuTaskId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const activeTasks = useMemo(() => tasks.filter(t => !t.deleted), [tasks]);
  const activeReviews = notifications.filter(n => n.userId === currentUser && !n.read && n.type === 'REVIEW_ASSIGNED');

  // Today boundaries
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Week boundaries (Monday to Sunday)
  const currentWeekInfo = useMemo(() => {
    const curr = new Date(calendarDate);
    const day = curr.getDay();
    // In JS Sunday is 0. Shift so Monday is 0
    const diffToMonday = day === 0 ? -6 : 1 - day;
    
    const monday = new Date(curr);
    monday.setDate(curr.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const weekDays: { date: Date; dateStr: string; dayName: string; dayNumber: number; isToday: boolean }[] = [];
    const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      weekDays.push({
        date: d,
        dateStr: iso,
        dayName: dayNames[i],
        dayNumber: d.getDate(),
        isToday: d.getTime() === today.getTime()
      });
    }

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    return { monday, sunday, weekDays };
  }, [calendarDate, today]);

  // Top 4 Indicators (Requirement 1)
  const indicators = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // 1. Pendentes esta semana:
    // "Importante: as atividades da semana devem incluir também aquelas criadas anteriormente que continuam pendentes, inclusive as atrasadas."
    const pendingThisWeekOrOverdue = activeTasks.filter(t => {
      if (t.status === 'Concluída') return false;
      if (!t.completionDate) return true; // Tasks without deadline pending
      const dueDate = new Date(t.completionDate + 'T00:00:00');
      // Due this week or overdue/earlier
      return dueDate <= currentWeekInfo.sunday;
    });

    // 2. Alta prioridade
    const highPriority = activeTasks.filter(t => 
      t.status !== 'Concluída' && (t.priority === 'Alta' || t.priority === 'Urgente')
    );

    // 3. Em andamento
    const inProgress = activeTasks.filter(t => t.status === 'Em Andamento');

    // 4. Concluídas no mês
    const completedThisMonth = activeTasks.filter(t => {
      if (t.status !== 'Concluída') return false;
      if (!t.completionDate) return true;
      const compDate = new Date(t.completionDate + 'T00:00:00');
      return compDate.getMonth() === currentMonth && compDate.getFullYear() === currentYear;
    });

    return {
      pendingWeek: pendingThisWeekOrOverdue.length,
      highPriority: highPriority.length,
      inProgress: inProgress.length,
      completedMonth: completedThisMonth.length
    };
  }, [activeTasks, currentWeekInfo.sunday]);

  // Próximas do Prazo (Requirement 1: Substitui "Atividades recentes")
  const upcomingTasks = useMemo(() => {
    const pendingTasks = activeTasks.filter(t => t.status !== 'Concluída' && t.completionDate);
    return pendingTasks.sort((a, b) => {
      const dateA = new Date(a.completionDate + 'T00:00:00').getTime();
      const dateB = new Date(b.completionDate + 'T00:00:00').getTime();
      return dateA - dateB;
    }).slice(0, 6);
  }, [activeTasks]);

  // Filtered & Automatically Sorted Tasks (Requirement 3: Alta -> Média -> Baixa -> Sem prioridade; dentro de cada uma, prazo mais próximo)
  const sortedAndFilteredTasks = useMemo(() => {
    // 1. Filter
    const filtered = activeTasks.filter(t => {
      // Search
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matches = 
          t.activity.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.project.toLowerCase().includes(term) ||
          t.projectLead?.toLowerCase().includes(term) ||
          t.nextStep?.toLowerCase().includes(term);
        if (!matches) return false;
      }

      // Type filter
      if (typeFilter !== 'Todos') {
        const tType = t.activityType || (t.isReport ? 'report' : 'general');
        if (tType !== typeFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'Todos') {
        const p = t.priority || 'Sem prioridade';
        if (priorityFilter === 'Alta') {
          if (p !== 'Alta' && p !== 'Urgente') return false;
        } else if (p !== priorityFilter) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'Todos' && t.status !== statusFilter) return false;

      // Project filter
      if (projectFilter !== 'Todos' && t.project !== projectFilter) return false;

      // Lead filter
      if (leadFilter !== 'Todos' && t.projectLead !== leadFilter) return false;

      // Selected calendar day filter if active
      if (selectedCalendarDay) {
        if (selectedCalendarDay === 'overdue') {
          if (t.status === 'Concluída') return false;
          if (!t.completionDate) return false;
          return new Date(t.completionDate + 'T00:00:00') < currentWeekInfo.monday;
        }
        if (t.completionDate !== selectedCalendarDay) return false;
      }

      return true;
    });

    // 2. Sort according to Requirement 3:
    // Completed cards are grouped or separated, but for active cards:
    // Organizadas automaticamente por prioridade (Alta -> Média -> Baixa -> Sem prioridade)
    // Dentro de cada classificação, ordenar pelo prazo mais próximo.
    return [...filtered].sort((a, b) => {
      const aIsCompleted = a.status === 'Concluída';
      const bIsCompleted = b.status === 'Concluída';
      if (aIsCompleted !== bIsCompleted) {
        return aIsCompleted ? 1 : -1;
      }

      const pA = getPriorityVisuals(a.priority).level;
      const pB = getPriorityVisuals(b.priority).level;
      if (pA !== pB) {
        return pA - pB;
      }

      // Within same priority, order by closest deadline
      const dateA = a.completionDate ? new Date(a.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.completionDate ? new Date(b.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
  }, [activeTasks, searchTerm, typeFilter, priorityFilter, statusFilter, projectFilter, leadFilter, selectedCalendarDay, currentWeekInfo.monday]);

  // Handle Priority Change by Leadership (Requirement 3)
  const handleSetPriority = (e: React.MouseEvent, task: Task, newPriority: Priority) => {
    e.stopPropagation();
    if (!onSaveTask) return;

    const previousPriority = task.priority || 'Sem prioridade';
    const updatedTask: Task = {
      ...task,
      priority: newPriority,
      changeHistory: [
        {
          id: `ch_prio_${Date.now()}`,
          field: 'priority',
          previousValue: previousPriority,
          newValue: newPriority,
          changedBy: currentUser,
          changedAt: new Date().toISOString(),
          reason: 'Prioridade definida pela liderança'
        },
        ...(task.changeHistory || [])
      ]
    };

    onSaveTask(updatedTask);
    setOpenMenuTaskId(null);
  };

  // Handle Save Deadline Change from Modal (Requirement 5)
  const handleSaveDeadlineChange = (taskId: string, newDate: string, reason?: string) => {
    if (!onSaveTask) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    const previousDate = task.completionDate || '';
    const updatedTask: Task = {
      ...task,
      completionDate: newDate,
      deadlineHistory: [
        {
          id: `dl_${Date.now()}`,
          previousDate,
          newDate,
          changedBy: currentUser,
          changedAt: new Date().toISOString(),
          reason: reason || 'Prazo alterado'
        },
        ...(task.deadlineHistory || [])
      ],
      changeHistory: [
        {
          id: `ch_dl_${Date.now()}`,
          field: 'deadline',
          previousValue: previousDate || 'Sem prazo',
          newValue: newDate,
          changedBy: currentUser,
          changedAt: new Date().toISOString(),
          reason: reason || 'Prazo alterado'
        },
        ...(task.changeHistory || [])
      ]
    };

    onSaveTask(updatedTask);
  };

  // Clear all filters
  const handleResetFilters = () => {
    onSearchTermChange('');
    setTypeFilter('Todos');
    setPriorityFilter('Todos');
    onStatusFilterChange('Todos');
    onProjectFilterChange('Todos');
    onLeadFilterChange('Todos');
    setSelectedCalendarDay(null);
  };

  // Activities due per day in the week
  const weekDayTasksCount = useMemo(() => {
    const map: Record<string, number> = {};
    activeTasks.forEach(t => {
      if (t.completionDate) {
        map[t.completionDate] = (map[t.completionDate] || 0) + 1;
      }
    });
    return map;
  }, [activeTasks]);

  // Overdue / Prior Pending tasks
  const overduePriorPendingTasks = useMemo(() => {
    return activeTasks.filter(t => {
      if (t.status === 'Concluída') return false;
      if (!t.completionDate) return false;
      const d = new Date(t.completionDate + 'T00:00:00');
      return d < currentWeekInfo.monday;
    });
  }, [activeTasks, currentWeekInfo.monday]);

  return (
    <div className="space-y-6">
      
      {/* 1. SUB HEADER & ACTION BUTTONS */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-transparent">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse"></span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Painel de Atividades
            </h2>
          </div>
          <p className="text-xs font-bold text-slate-500 mt-0.5">
            Acompanhamento centralizado por prioridades, prazos e tipos de atividade.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {onDownloadExcel && (
            <button
              type="button"
              onClick={onDownloadExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition"
              title="Baixar planilha Excel"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span className="hidden sm:inline">Excel</span>
            </button>
          )}

          {onSyncSharePoint && (
            <button
              type="button"
              onClick={onSyncSharePoint}
              disabled={isSyncingSharePoint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl shadow-2xs transition disabled:opacity-50"
              title="Sincronizar com SharePoint"
            >
              <Cloud size={15} className={`text-teal-600 ${isSyncingSharePoint ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{isSyncingSharePoint ? 'Sincronizando...' : 'SharePoint'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsGeneralActivitiesModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
            title="Consultar todas as atividades gerais"
          >
            <Search size={14} className="text-slate-600" />
            <span>Consultar Gerais</span>
          </button>

          {onNewTask && (
            <button
              type="button"
              onClick={onNewTask}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl shadow-sm transition active:scale-95"
            >
              <Plus size={16} />
              <span>Nova Atividade</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. OS QUATRO INDICADORES SUPERIORES (Requirement 1 & Responsividade: 2 colunas no celular) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Pendentes esta semana */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-black border border-amber-200">
              <Clock size={19} />
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-tight block">
                Pendentes esta semana
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mt-1 block">
                {indicators.pendingWeek}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-amber-700">
            <span>Inclui atrasadas anteriores</span>
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Card 2: Alta prioridade */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-black border border-rose-200">
              <AlertTriangle size={19} />
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-tight block">
                Alta prioridade
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 leading-none mt-1 block">
                {indicators.highPriority}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-rose-700">
            <span>Atenção prioritária</span>
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Card 3: Em andamento */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-black border border-blue-200">
              <ArrowRight size={19} />
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-tight block">
                Em andamento
              </span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 leading-none mt-1 block">
                {indicators.inProgress}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-blue-700">
            <span>Execução ativa</span>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Card 4: Concluídas no mês */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[105px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black border border-emerald-200">
              <CheckCircle size={19} />
            </div>
            <div className="text-right">
              <span className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-tight block">
                Concluídas no mês
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-700 leading-none mt-1 block">
                {indicators.completedMonth}
              </span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-bold text-emerald-700">
            <span>Finalizadas com sucesso</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

      </div>

      {/* 3. CALENDÁRIO COMPACTO E SEÇÃO PRÓXIMAS DO PRAZO (Requirement 1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* Coluna do Calendário da Semana / Mês (lg:col-span-8) */}
        <div className="lg:col-span-8 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays size={18} className="text-teal-600" />
              <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">
                Calendário de Atividades
              </h3>
              <span className="text-xs text-slate-400 font-bold ml-1">
                {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1.5 self-end sm:self-auto">
              <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCalendarMode('week')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    calendarMode === 'week' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Semana
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarMode('month')}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    calendarMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Mês
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(calendarDate);
                    if (calendarMode === 'week') prev.setDate(prev.getDate() - 7);
                    else prev.setMonth(prev.getMonth() - 1);
                    setCalendarDate(prev);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  title="Anterior"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => setCalendarDate(new Date())}
                  className="px-2 py-1 text-[10px] font-bold text-slate-600 border border-slate-200 rounded-lg bg-white hover:bg-slate-50"
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarDate);
                    if (calendarMode === 'week') next.setDate(next.getDate() + 7);
                    else next.setMonth(next.getMonth() + 1);
                    setCalendarDate(next);
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                  title="Próxima"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Semana Compacta */}
          {calendarMode === 'week' ? (
            <div className="space-y-3">
              {/* Grid dos 7 dias da semana + Pendentes Anteriores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                {currentWeekInfo.weekDays.map(day => {
                  const count = weekDayTasksCount[day.dateStr] || 0;
                  const isSelected = selectedCalendarDay === day.dateStr;
                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => setSelectedCalendarDay(isSelected ? null : day.dateStr)}
                      className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-between min-h-[75px] ${
                        isSelected 
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm ring-2 ring-teal-200'
                          : day.isToday
                          ? 'bg-teal-50/70 border-teal-300 text-slate-900'
                          : 'bg-slate-50/60 border-slate-200 hover:border-slate-300 text-slate-700'
                      }`}
                    >
                      <div className="w-full flex items-center justify-between text-[10px] font-black uppercase tracking-tight">
                        <span className={isSelected ? 'text-teal-100' : 'text-slate-400'}>{day.dayName}</span>
                        {day.isToday && (
                          <span className={`text-[8px] font-black px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white text-teal-800' : 'bg-teal-600 text-white'}`}>
                            HOJE
                          </span>
                        )}
                      </div>
                      <span className="text-base sm:text-lg font-black my-0.5">
                        {day.dayNumber}
                      </span>
                      <div className="w-full flex items-center justify-center gap-1">
                        {count > 0 ? (
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white/20 text-white' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {count} ativ.
                          </span>
                        ) : (
                          <span className={`text-[9px] ${isSelected ? 'text-teal-100' : 'text-slate-400'}`}>
                            -
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Bloco dedicado: Pendentes Anteriores / Atrasadas (Requirement 1) */}
              {overduePriorPendingTasks.length > 0 && (
                <div 
                  onClick={() => setSelectedCalendarDay(selectedCalendarDay === 'overdue' ? null : 'overdue')}
                  className={`p-3 rounded-2xl border transition cursor-pointer flex items-center justify-between ${
                    selectedCalendarDay === 'overdue'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-rose-50/70 border-rose-200 text-rose-900 hover:bg-rose-100/70'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className={selectedCalendarDay === 'overdue' ? 'text-white' : 'text-rose-600'} />
                    <div>
                      <span className="text-xs font-black uppercase tracking-tight block">
                        {overduePriorPendingTasks.length} Pendentes anteriores / Atrasadas
                      </span>
                      <span className={`text-[10px] font-medium block ${selectedCalendarDay === 'overdue' ? 'text-rose-100' : 'text-rose-700'}`}>
                        Atividades criadas em períodos anteriores que necessitam de conclusão
                      </span>
                    </div>
                  </div>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-xl uppercase ${
                    selectedCalendarDay === 'overdue' ? 'bg-white text-rose-700' : 'bg-rose-200 text-rose-900'
                  }`}>
                    {selectedCalendarDay === 'overdue' ? 'Filtrando' : 'Ver Todas'}
                  </span>
                </div>
              )}
            </div>
          ) : (
            /* Visualização por Mês */
            <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200 text-center space-y-2">
              <p className="text-xs font-bold text-slate-700">
                Visualização Mensal de Atividades — {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[11px] text-slate-500">
                Use o botão "Consultar Gerais" ou os filtros abaixo para visualizar todas as atividades por período.
              </p>
              <button
                type="button"
                onClick={() => setCalendarMode('week')}
                className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Voltar à Semana Compacta
              </button>
            </div>
          )}

          {selectedCalendarDay && (
            <div className="flex items-center justify-between text-xs pt-1 px-1 text-teal-800 font-bold">
              <span>
                Filtro ativo por data: <strong>{selectedCalendarDay === 'overdue' ? 'Pendentes anteriores' : formatDateBR(selectedCalendarDay)}</strong>
              </span>
              <button 
                onClick={() => setSelectedCalendarDay(null)} 
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-bold"
              >
                <X size={12} /> Remover filtro de data
              </button>
            </div>
          )}
        </div>

        {/* Coluna Próximas do Prazo (lg:col-span-4) - Substitui "Atividades recentes" */}
        <div className="lg:col-span-4 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Clock size={15} className="text-teal-600" /> Próximas do Prazo
              </h3>
              <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                Urgência
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingTasks.slice(0, 5).map(task => {
                const priorityVisuals = getPriorityVisuals(task.priority);
                const typeVisuals = getActivityTypeVisuals(task.activityType, task.isReport);
                
                const dueDate = new Date(task.completionDate + 'T00:00:00');
                const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = diffDays < 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => onView(task)}
                    className="p-3 bg-slate-50/70 hover:bg-teal-50/50 rounded-2xl border border-slate-200/80 hover:border-teal-300 transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-full ${priorityVisuals.dotClass} shrink-0`} title={priorityVisuals.label} />
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-600">
                          {typeVisuals.label}
                        </span>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        isOverdue 
                          ? 'bg-rose-100 text-rose-700 animate-pulse'
                          : diffDays === 0
                          ? 'bg-amber-100 text-amber-800 font-black'
                          : diffDays <= 3
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isOverdue 
                          ? `Atrasada (${Math.abs(diffDays)}d)` 
                          : diffDays === 0 
                          ? 'Hoje' 
                          : diffDays === 1 
                          ? 'Amanhã' 
                          : `Em ${diffDays} dias`}
                      </span>
                    </div>

                    <h4 className="text-xs font-black text-slate-900 group-hover:text-teal-700 transition truncate leading-snug">
                      {task.activity}
                    </h4>

                    <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-bold">
                      <span className="truncate max-w-[130px]">{task.project}</span>
                      <span className="text-slate-600">{formatDateBR(task.completionDate)}</span>
                    </div>
                  </div>
                );
              })}

              {upcomingTasks.length === 0 && (
                <div className="py-6 text-center text-slate-400">
                  <CheckCircle size={24} className="mx-auto text-emerald-500 mb-1" />
                  <p className="text-xs font-bold">Nenhum prazo pendente próximo!</p>
                </div>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsGeneralActivitiesModalOpen(true)}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1"
          >
            Ver todas as atividades gerais &rarr;
          </button>
        </div>

      </div>

      {/* 4. ACTIVE REVIEWS BANNER IF ANY */}
      {activeReviews.length > 0 && currentUser !== 'Todos' && (
        <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-md space-y-4 animate-in slide-in-from-top-2">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
                <FileSignature size={18} />
              </div>
              <div>
                <h3 className="text-white font-black text-sm uppercase">Relatórios para sua revisão</h3>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">{activeReviews.length} documento(s) aguardando sua análise</p>
              </div>
            </div>
            <button 
              onClick={onClearAllNotifications} 
              className="px-3 py-1.5 bg-white/10 text-slate-300 rounded-xl text-xs font-bold hover:bg-white/20 transition self-start sm:self-auto"
            >
              Limpar Notificações
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeReviews.map(notif => (
              <div key={notif.id} className="bg-slate-800/80 p-3 rounded-xl flex items-center justify-between group">
                <button onClick={() => onNotificationClick(notif)} className="flex-1 flex items-center justify-between pr-4 text-left">
                  <span className="text-slate-200 text-xs font-bold uppercase truncate">{notif.message}</span>
                  <ArrowRight size={14} className="text-amber-400 group-hover:translate-x-1 transition shrink-0 ml-2" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); onClearSingleNotification(notif.id); }} className="text-slate-400 hover:text-white p-1" title="Limpar"><X size={14} /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. SEARCH & ADVANCED FILTERS BAR */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => onSearchTermChange(e.target.value)} 
              placeholder="Buscar por título, descrição, projeto, responsável..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-500 transition"
            />
          </div>

          {/* Filtro: Tipo de Atividade */}
          <div className="lg:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Tipo: Todos</option>
              <option value="general">Atividade Geral</option>
              <option value="meeting">Reunião</option>
              <option value="report">Relatório</option>
              <option value="note">Nota</option>
            </select>
          </div>

          {/* Filtro: Prioridade */}
          <div className="lg:col-span-2">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Prioridade: Todas</option>
              <option value="Alta">🔴 Alta prioridade</option>
              <option value="Média">🟡 Média prioridade</option>
              <option value="Baixa">🔵 Baixa prioridade</option>
              <option value="Sem prioridade">⚪ Sem prioridade</option>
            </select>
          </div>

          {/* Filtro: Projeto */}
          <div className="lg:col-span-2">
            <select 
              value={projectFilter} 
              onChange={(e) => onProjectFilterChange(e.target.value)} 
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Projeto: Todos</option>
              {uniqueProjects.filter(p => p !== 'Todos').map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Filtro: Responsável */}
          <div className="lg:col-span-2">
            <select 
              value={leadFilter} 
              onChange={(e) => onLeadFilterChange(e.target.value)} 
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Responsável: Todos</option>
              {uniqueLeads.filter(l => l !== 'Todos').map(l => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

        </div>

        {/* View Switcher & Counter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-800">
              {sortedAndFilteredTasks.length} atividade(s) encontrada(s)
            </span>
            {(searchTerm || typeFilter !== 'Todos' || priorityFilter !== 'Todos' || projectFilter !== 'Todos' || leadFilter !== 'Todos' || statusFilter !== 'Todos' || selectedCalendarDay) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-[11px] font-bold text-rose-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={12} /> Limpar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-[10px] font-black uppercase text-slate-400">Visualização:</span>
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  viewMode === 'cards' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <LayoutGrid size={13} /> Cards
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition ${
                  viewMode === 'list' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <List size={13} /> Lista
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 6. CARDS DE ATIVIDADES (Requirement 4 & Imagem 3 de Referência) */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {sortedAndFilteredTasks.map((task) => {
            const isCompleted = task.status === 'Concluída';
            const priorityVisuals = getPriorityVisuals(task.priority);
            const typeVisuals = getActivityTypeVisuals(task.activityType, task.isReport);

            const isOverdue = !isCompleted && task.completionDate && new Date(task.completionDate + 'T00:00:00') < today;
            const noteCount = task.updates?.length || 0;
            const hasImportantNote = Boolean(task.updates?.some((u: TaskNote) => u.isImportant));

            // Card background:
            // "Atividades concluídas com o card inteiro em verde-claro" (Requirement 4)
            let cardBg = 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-md';
            if (isCompleted) {
              cardBg = 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-250 hover:bg-emerald-50 shadow-2xs';
            } else if (isOverdue) {
              cardBg = 'bg-white border-rose-300 ring-2 ring-rose-100 hover:shadow-md';
            }

            return (
              <div
                key={task.id}
                className={`rounded-3xl border p-5 shadow-2xs transition-all flex flex-col justify-between relative group ${cardBg}`}
              >
                {/* Top Row: Priority Icon on Left + Type Pill + 3-Dots Menu */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  
                  {/* Left: Ícone grande representando exclusivamente a prioridade (Requirement 4) */}
                  <div className="flex items-center gap-3">
                    <div 
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black shrink-0 transition-transform ${priorityVisuals.circleBg}`}
                      title={`Prioridade: ${priorityVisuals.label}`}
                    >
                      {task.priority === 'Alta' || task.priority === 'Urgente' ? (
                        <span className="text-rose-600 text-lg leading-none">🔴</span>
                      ) : task.priority === 'Média' ? (
                        <span className="text-amber-500 text-lg leading-none">🟡</span>
                      ) : task.priority === 'Baixa' ? (
                        <span className="text-sky-500 text-lg leading-none">🔵</span>
                      ) : (
                        <span className="text-slate-300 text-lg leading-none">⚪</span>
                      )}
                    </div>

                    {/* Tag pequena identificando tipo de atividade */}
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${typeVisuals.badge}`}>
                        {typeVisuals.icon}
                        {typeVisuals.label}
                      </span>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight mt-0.5 truncate max-w-[120px]">
                        {task.project}
                      </span>
                    </div>
                  </div>

                  {/* 3-Dots Menu & Status */}
                  <div className="flex items-center gap-1.5 relative">
                    {isCompleted && (
                      <span className="p-1 rounded-full bg-emerald-600 text-white" title="Concluída">
                        <CheckCircle size={14} />
                      </span>
                    )}

                    {/* Three dots button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuTaskId(openMenuTaskId === task.id ? null : task.id);
                      }}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Opções da atividade"
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown Menu */}
                    {openMenuTaskId === task.id && (
                      <div 
                        onClick={(e) => e.stopPropagation()}
                        className="absolute right-0 top-8 z-50 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 py-1.5 animate-in fade-in zoom-in-95 duration-100 text-xs font-bold"
                      >
                        {/* Editar */}
                        <button
                          type="button"
                          onClick={() => {
                            onEdit(task);
                            setOpenMenuTaskId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Edit2 size={13} className="text-amber-600" />
                          <span>Editar Atividade</span>
                        </button>

                        {/* Alterar Prazo com Motivo (Requirement 5) */}
                        <button
                          type="button"
                          onClick={() => {
                            setDeadlineModalTask(task);
                            setOpenMenuTaskId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Clock size={13} className="text-teal-600" />
                          <span>Alterar Prazo</span>
                        </button>

                        {/* Notas / Observações */}
                        <button
                          type="button"
                          onClick={() => {
                            setNotesModalTask(task);
                            setOpenMenuTaskId(null);
                          }}
                          className="w-full px-3.5 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <MessageSquare size={13} className="text-blue-600" />
                          <span>Notas e Atualizações ({task.updates?.length || 0})</span>
                        </button>

                        {/* Sub-menu Definir Prioridade (Somente Liderança - Requirement 3) */}
                        {isLeader && (
                          <div className="pt-1 mt-1 border-t border-slate-100 px-3.5 py-1.5">
                            <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">
                              Definir Prioridade (Líder)
                            </span>
                            <div className="grid grid-cols-2 gap-1 text-[11px]">
                              <button
                                type="button"
                                onClick={(e) => handleSetPriority(e, task, 'Alta')}
                                className="px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-800 text-left flex items-center gap-1"
                              >
                                <span>🔴</span> Alta
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSetPriority(e, task, 'Média')}
                                className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-left flex items-center gap-1"
                              >
                                <span>🟡</span> Média
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSetPriority(e, task, 'Baixa')}
                                className="px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-left flex items-center gap-1"
                              >
                                <span>🔵</span> Baixa
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleSetPriority(e, task, 'Sem prioridade')}
                                className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-left flex items-center gap-1"
                              >
                                <span>⚪</span> Nenhuma
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Excluir */}
                        <div className="pt-1 mt-1 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              onDelete(task);
                              setOpenMenuTaskId(null);
                            }}
                            className="w-full px-3.5 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                          >
                            <Trash2 size={13} />
                            <span>Excluir Atividade</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Main Content: Title & Description */}
                <div className="space-y-1.5 mb-4 flex-1">
                  <h3 
                    onClick={() => onView(task)}
                    className={`font-black text-sm tracking-tight uppercase leading-snug cursor-pointer transition hover:text-teal-700 ${
                      isCompleted ? 'text-emerald-950 line-through opacity-85' : 'text-slate-900'
                    }`}
                    title={task.activity}
                  >
                    {task.activity}
                  </h3>

                  {task.description && (
                    <p className={`text-[11px] leading-relaxed line-clamp-2 ${isCompleted ? 'text-emerald-800' : 'text-slate-500'}`}>
                      {task.description}
                    </p>
                  )}
                </div>

                {/* Progress bar (when applicable - notes don't need progress bar) */}
                {task.activityType !== 'note' && (
                  <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="text-slate-400 uppercase tracking-wider">Progresso</span>
                      <span className={isCompleted ? 'text-emerald-700 font-black' : 'text-slate-700 font-black'}>
                        {task.progress || 0}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 ${isCompleted ? 'bg-emerald-600' : 'bg-teal-600'}`} 
                        style={{ width: `${task.progress || 0}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Bottom Row: Responsible & Due Date & Notes badge */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Responsible */}
                  <div className="flex items-center gap-1.5 min-w-0" title={`Responsável: ${task.projectLead}`}>
                    <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center text-[9px] font-black uppercase shrink-0">
                      {getInitials(task.projectLead)}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 truncate max-w-[90px]">
                      {task.projectLead}
                    </span>
                  </div>

                  {/* Due Date or Status */}
                  <div className="flex items-center gap-2 shrink-0">
                    {task.completionDate ? (
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                        isCompleted 
                          ? 'text-emerald-800' 
                          : isOverdue 
                          ? 'text-rose-600 font-black' 
                          : 'text-slate-500'
                      }`}>
                        <Clock size={12} className={isOverdue ? 'text-rose-500' : 'text-slate-400'} />
                        {formatDateBR(task.completionDate)}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400">
                        {task.activityType === 'note' ? 'Concluída' : 'Sem prazo'}
                      </span>
                    )}

                    {/* Notes Count button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setNotesModalTask(task);
                      }}
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                        hasImportantNote
                          ? 'bg-amber-300 text-amber-950 border-amber-400 font-black'
                          : noteCount > 0
                          ? 'bg-teal-50 text-teal-800 border-teal-200'
                          : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
                      }`}
                      title="Notas e atualizações"
                    >
                      <MessageSquare size={11} />
                      <span>{noteCount}</span>
                    </button>
                  </div>
                </div>

              </div>
            );
          })}

          {sortedAndFilteredTasks.length === 0 && (
            <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200/80 p-8">
              <AlertCircle size={36} className="mx-auto mb-2 text-slate-300" />
              <h4 className="text-sm font-black uppercase text-slate-700">Nenhuma atividade encontrada</h4>
              <p className="text-xs font-semibold text-slate-400 mt-1 max-w-sm mx-auto">
                Tente ajustar os filtros selecionados ou clique em "Nova Atividade" para adicionar uma nova demanda.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition"
              >
                Limpar todos os filtros
              </button>
            </div>
          )}
        </div>
      )}

      {/* 7. MODO LISTA ALTERNATIVO (Mantém compatibilidade e visualização em tabela) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="w-full overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse select-none text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Prioridade</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-4">Atividade</th>
                  <th className="py-3 px-3">Projeto</th>
                  <th className="py-3 px-3">Responsável</th>
                  <th className="py-3 px-3">Prazo</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedAndFilteredTasks.map(task => {
                  const isCompleted = task.status === 'Concluída';
                  const priorityVisuals = getPriorityVisuals(task.priority);
                  const typeVisuals = getActivityTypeVisuals(task.activityType, task.isReport);
                  const isOverdue = !isCompleted && task.completionDate && new Date(task.completionDate + 'T00:00:00') < today;

                  return (
                    <tr 
                      key={task.id}
                      className={`hover:bg-slate-50 transition cursor-pointer ${
                        isCompleted ? 'bg-emerald-50/50' : ''
                      }`}
                      onClick={() => onView(task)}
                    >
                      {/* Prioridade */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border ${priorityVisuals.badgeClass}`}>
                          <span className={`w-2 h-2 rounded-full ${priorityVisuals.dotClass}`} />
                          {priorityVisuals.shortLabel}
                        </span>
                      </td>

                      {/* Tipo */}
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-black uppercase border ${typeVisuals.badge}`}>
                          {typeVisuals.label}
                        </span>
                      </td>

                      {/* Atividade */}
                      <td className="py-3 px-4 min-w-[200px]">
                        <span className={`font-black text-xs block ${isCompleted ? 'text-emerald-950 line-through opacity-80' : 'text-slate-900'}`}>
                          {task.activity}
                        </span>
                        {task.description && (
                          <span className="text-[10px] text-slate-400 line-clamp-1">
                            {task.description}
                          </span>
                        )}
                      </td>

                      {/* Projeto */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-700 text-xs">{task.project}</span>
                      </td>

                      {/* Responsável */}
                      <td className="py-3 px-3">
                        <span className="font-bold text-slate-700 text-xs">{task.projectLead}</span>
                      </td>

                      {/* Prazo */}
                      <td className="py-3 px-3">
                        <span className={`font-bold text-xs ${isOverdue ? 'text-rose-600 font-black' : 'text-slate-600'}`}>
                          {formatDateBR(task.completionDate)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {task.status}
                        </span>
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setNotesModalTask(task)}
                            className="p-1 text-slate-400 hover:text-teal-600"
                            title="Notas"
                          >
                            <MessageSquare size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onEdit(task)}
                            className="p-1 text-slate-400 hover:text-amber-600"
                            title="Editar"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDelete(task)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Excluir"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAIS COMPLEMENTARES */}
      {/* 1. Modal de Notas e Atualizações */}
      {notesModalTask && (
        <TaskNotesModal
          isOpen={Boolean(notesModalTask)}
          onClose={() => setNotesModalTask(null)}
          task={notesModalTask}
          currentUser={currentUser}
          onSaveTask={(updatedTask) => {
            if (onSaveTask) {
              onSaveTask(updatedTask);
            }
          }}
        />
      )}

      {/* 2. Modal de Alteração de Prazo com Motivo (Requirement 5) */}
      {deadlineModalTask && (
        <ChangeDeadlineModal
          isOpen={Boolean(deadlineModalTask)}
          onClose={() => setDeadlineModalTask(null)}
          task={deadlineModalTask}
          onSave={handleSaveDeadlineChange}
        />
      )}

      {/* 3. Modal de Consulta a Todas as Atividades Gerais (Requirement 1) */}
      <GeneralActivitiesModal
        isOpen={isGeneralActivitiesModalOpen}
        onClose={() => setIsGeneralActivitiesModalOpen(false)}
        tasks={tasks}
        onViewTask={onView}
      />

    </div>
  );
};

export default TaskBoard;
