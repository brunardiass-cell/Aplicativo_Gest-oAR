import React, { useState, useMemo, useEffect } from 'react';
import { Task, Project, TeamMember, Priority, Status, ActivityType, TaskNote, MaintenancePeriod } from '../types';
import { TaskNotesModal } from './TaskNotesModal';
import { SupabaseService } from '../services/supabaseService';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight, 
  Search, 
  Filter, 
  FileText, 
  Users, 
  StickyNote, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit2, 
  Edit3,
  FolderKanban, 
  X, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  BarChart2,
  PieChart as PieIcon,
  ChevronDown,
  Plus,
  Star,
  UserCheck,
  Wrench,
  Trash2,
  Flag
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { isNameMatch } from '../constants';

interface VisaoGeralProps {
  tasks: Task[];
  projects: Project[];
  currentUser: string | 'Todos';
  selectedProfile?: TeamMember | null;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onSaveTask: (task: Task) => void;
  onNavigateToProject?: (projectId: string) => void;
}

export const VisaoGeral: React.FC<VisaoGeralProps> = ({
  tasks,
  projects,
  currentUser,
  selectedProfile,
  onEditTask,
  onViewTask,
  onSaveTask,
  onNavigateToProject
}) => {
  // Tabs internas: 'visao_geral' | 'projetos'
  const [internalTab, setInternalTab] = useState<'visao_geral' | 'projetos'>('visao_geral');

  // Filtros de usuário (respeitando perfil e permissões)
  const userTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.deleted) return false;
      if (currentUser === 'Todos' || currentUser === 'Visão Geral da Equipe') return true;
      const isLead = isNameMatch(t.projectLead, currentUser);
      const isCollab = Array.isArray(t.collaborators) && t.collaborators.some(c => isNameMatch(c, currentUser));
      const isReviewer = isNameMatch(t.currentReviewer, currentUser);
      return isLead || isCollab || isReviewer;
    });
  }, [tasks, currentUser]);

  // Calendário compacto: modo 'day' | 'month' | 'year'
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'month' | 'year'>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string | null>(null);

  // Períodos de Manutenção do Sistema no Calendário de Acompanhamento
  const [maintenancePeriods, setMaintenancePeriods] = useState<MaintenancePeriod[]>(() => {
    try {
      const saved = localStorage.getItem('ctvacinas_maintenance_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  });
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Partial<MaintenancePeriod> | null>(null);

  // Período de Início Real do Sistema (atividades anteriores ficam em laranja e fora dos indicadores)
  const [systemRealStartDate, setSystemRealStartDate] = useState<string>(() => {
    try {
      return localStorage.getItem('ctvacinas_system_real_start_date') || '';
    } catch (e) {
      return '';
    }
  });
  const [systemRealStartNote, setSystemRealStartNote] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('ctvacinas_system_real_start_note') ||
        'Criada antes do aplicativo estar 100% funcionando'
      );
    } catch (e) {
      return 'Criada antes do aplicativo estar 100% funcionando';
    }
  });
  const [isSystemStartModalOpen, setIsSystemStartModalOpen] = useState(false);
  const [tempSystemStartDate, setTempSystemStartDate] = useState('');
  const [tempSystemStartNote, setTempSystemStartNote] = useState('');
  const [showPreStartInTable, setShowPreStartInTable] = useState(true);

  // Sincroniza configurações do calendário (início real e manutenção) com o Supabase app_config
  useEffect(() => {
    let active = true;
    const syncCalendarConfigFromSupabase = async () => {
      if (!SupabaseService.isConfigured()) return;
      try {
        const [maintRes, startRes, noteRes] = await Promise.all([
          SupabaseService.getAppConfig('maintenance_periods'),
          SupabaseService.getAppConfig('system_real_start_date'),
          SupabaseService.getAppConfig('system_real_start_note')
        ]);
        if (!active) return;

        if (maintRes.found && Array.isArray(maintRes.value)) {
          setMaintenancePeriods(maintRes.value);
          try {
            localStorage.setItem('ctvacinas_maintenance_periods', JSON.stringify(maintRes.value));
          } catch {}
        } else {
          // Migra dados já salvos localmente no navegador caso o Supabase ainda não tenha a chave
          try {
            const localMaint = localStorage.getItem('ctvacinas_maintenance_periods');
            if (localMaint) {
              const parsed = JSON.parse(localMaint);
              if (Array.isArray(parsed) && parsed.length > 0) {
                SupabaseService.saveAppConfig('maintenance_periods', parsed, currentUser || 'Sistema').catch(() => {});
              }
            }
          } catch {}
        }

        if (startRes.found && typeof startRes.value === 'string') {
          setSystemRealStartDate(startRes.value);
          try {
            if (startRes.value) {
              localStorage.setItem('ctvacinas_system_real_start_date', startRes.value);
            } else {
              localStorage.removeItem('ctvacinas_system_real_start_date');
            }
          } catch {}
        } else {
          try {
            const localStart = localStorage.getItem('ctvacinas_system_real_start_date');
            if (localStart) {
              SupabaseService.saveAppConfig('system_real_start_date', localStart, currentUser || 'Sistema').catch(() => {});
            }
          } catch {}
        }

        if (noteRes.found && typeof noteRes.value === 'string' && noteRes.value.trim()) {
          setSystemRealStartNote(noteRes.value);
          try {
            localStorage.setItem('ctvacinas_system_real_start_note', noteRes.value);
          } catch {}
        }
      } catch (e) {
        console.warn('Aviso ao sincronizar configurações do calendário com Supabase:', e);
      }
    };
    syncCalendarConfigFromSupabase();
    return () => { active = false; };
  }, [currentUser]);

  const saveSystemRealStart = (dateVal: string, noteVal?: string) => {
    const cleanDate = dateVal.trim();
    const cleanNote = (noteVal ?? systemRealStartNote).trim() || 'Criada antes do aplicativo estar 100% funcionando';
    setSystemRealStartDate(cleanDate);
    setSystemRealStartNote(cleanNote);
    try {
      if (cleanDate) {
        localStorage.setItem('ctvacinas_system_real_start_date', cleanDate);
      } else {
        localStorage.removeItem('ctvacinas_system_real_start_date');
      }
      localStorage.setItem('ctvacinas_system_real_start_note', cleanNote);
    } catch (e) {}
    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAppConfig('system_real_start_date', cleanDate, currentUser || 'Sistema').catch(() => {});
      SupabaseService.saveAppConfig('system_real_start_note', cleanNote, currentUser || 'Sistema').catch(() => {});
    }
  };

  const getTaskOriginDateStr = (task: Task): string => {
    const candidates = [
      task.requestDate,
      task.plannedStartDate,
      task.completedAt ? task.completedAt.slice(0, 10) : '',
      task.completionDate
    ];
    for (const c of candidates) {
      if (c && /^\d{4}-\d{2}-\d{2}/.test(c)) {
        return c.slice(0, 10);
      }
    }
    return '';
  };

  const isTaskBeforeSystemStart = (task: Task): boolean => {
    if (!systemRealStartDate) return false;
    const originDate = getTaskOriginDateStr(task);
    if (!originDate) return false;
    return originDate < systemRealStartDate;
  };

  // Atividades consideradas nos indicadores e alertas (apenas a partir do início real do sistema, quando configurado)
  const effectiveUserTasks = useMemo(() => {
    if (!systemRealStartDate) return userTasks;
    return userTasks.filter(t => !isTaskBeforeSystemStart(t));
  }, [userTasks, systemRealStartDate]);

  const preStartTasksCount = useMemo(() => {
    if (!systemRealStartDate) return 0;
    return userTasks.filter(t => isTaskBeforeSystemStart(t)).length;
  }, [userTasks, systemRealStartDate]);

  const saveMaintenancePeriods = (updated: MaintenancePeriod[]) => {
    setMaintenancePeriods(updated);
    try {
      localStorage.setItem('ctvacinas_maintenance_periods', JSON.stringify(updated));
    } catch (e) {}
    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAppConfig('maintenance_periods', updated, currentUser || 'Sistema').catch(() => {});
    }
  };

  const getMaintenanceForDate = (dateStr: string) => {
    return maintenancePeriods.filter(m => dateStr >= m.startDate && dateStr <= m.endDate);
  };

  // Filtros avançados do histórico completo
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Todos' | Status>('Todos');
  const [typeFilter, setTypeFilter] = useState<'Todos' | ActivityType>('Todos');
  const [priorityFilter, setPriorityFilter] = useState<'Todos' | Priority>('Todos');
  const [projectFilter, setProjectFilter] = useState<string>('Todos');
  const [groupFilter, setGroupFilter] = useState<string>('Todos');
  const [dateRangeFilter, setDateRangeFilter] = useState<'all' | 'today' | 'this_week' | 'this_month' | 'overdue'>('all');

  // Painel lateral de detalhes / edição rápida
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [isEditingDrawer, setIsEditingDrawer] = useState(false);
  const [drawerEditForm, setDrawerEditForm] = useState<Partial<Task>>({});

  // Notas de atualização (Requisito 2)
  const [notesModalTask, setNotesModalTask] = useState<Task | null>(null);
  const [drawerNewNoteText, setDrawerNewNoteText] = useState('');
  const [drawerNewNoteIsImportant, setDrawerNewNoteIsImportant] = useState(false);

  // Lista única de projetos e grupos para filtros
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    projects.forEach(p => set.add(p.name));
    tasks.forEach(t => { if (t.project) set.add(t.project); });
    return ['Todos', ...Array.from(set).sort()];
  }, [projects, tasks]);

  const uniqueGroups = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach(t => { if (t.group) set.add(t.group); });
    return ['Todos', ...Array.from(set).sort()];
  }, [tasks]);

  // Today helpers
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // 1. Indicadores por status (Visão Geral — considerando apenas a partir do início real do sistema)
  const statusStats = useMemo(() => {
    const total = effectiveUserTasks.length;
    const completed = effectiveUserTasks.filter(t => t.status === 'Concluída').length;
    const ongoing = effectiveUserTasks.filter(t => t.status === 'Em Andamento').length;
    const planned = effectiveUserTasks.filter(t => t.status === 'Planejada').length;
    const overdue = effectiveUserTasks.filter(t => {
      if (t.status === 'Concluída' || !t.completionDate) return false;
      return new Date(t.completionDate + 'T00:00:00') < today;
    }).length;

    return { total, completed, ongoing, planned, overdue };
  }, [effectiveUserTasks, today]);

  // 2. Alertas: Atividades próximas do vencimento e atrasadas (apenas a partir do início real do sistema)
  const alerts = useMemo(() => {
    const sevenDays = new Date(today);
    sevenDays.setDate(today.getDate() + 7);

    const overdueTasks = effectiveUserTasks.filter(t => {
      if (t.status === 'Concluída' || !t.completionDate) return false;
      return new Date(t.completionDate + 'T00:00:00') < today;
    });

    const dueSoonTasks = effectiveUserTasks.filter(t => {
      if (t.status === 'Concluída' || !t.completionDate) return false;
      const d = new Date(t.completionDate + 'T00:00:00');
      return d >= today && d <= sevenDays;
    });

    return { overdueTasks, dueSoonTasks };
  }, [effectiveUserTasks, today]);

  // 3. Filtragem da lista do histórico / calendário
  const filteredTasks = useMemo(() => {
    return userTasks.filter(t => {
      // Se o filtro de ocultar pré-início estiver ativo (e não houver uma data específica selecionada no calendário)
      if (!showPreStartInTable && !selectedCalendarDateStr && isTaskBeforeSystemStart(t)) {
        return false;
      }
      // Busca textual
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match = 
          t.activity.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.project?.toLowerCase().includes(term) ||
          t.projectLead?.toLowerCase().includes(term) ||
          t.group?.toLowerCase().includes(term);
        if (!match) return false;
      }

      // Filtro de Status
      if (statusFilter !== 'Todos' && t.status !== statusFilter) return false;

      // Filtro de Tipo
      if (typeFilter !== 'Todos') {
        const type = t.activityType || (t.isReport ? 'report' : 'general');
        if (type !== typeFilter) return false;
      }

      // Filtro de Prioridade
      if (priorityFilter !== 'Todos' && (t.priority || 'Sem prioridade') !== priorityFilter) return false;

      // Filtro de Projeto
      if (projectFilter !== 'Todos' && t.project !== projectFilter) return false;

      // Filtro de Grupo
      if (groupFilter !== 'Todos' && t.group !== groupFilter) return false;

      // Filtro de data pelo calendário compacto se houver dia selecionado
      if (selectedCalendarDateStr) {
        if (t.completionDate !== selectedCalendarDateStr) return false;
      }

      // Filtro por faixa de período predefinido
      if (dateRangeFilter !== 'all') {
        if (!t.completionDate) return false;
        const d = new Date(t.completionDate + 'T00:00:00');
        if (dateRangeFilter === 'today') {
          return d.getTime() === today.getTime();
        }
        if (dateRangeFilter === 'overdue') {
          return t.status !== 'Concluída' && d < today;
        }
        if (dateRangeFilter === 'this_month') {
          return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
        }
      }

      return true;
    }).sort((a, b) => {
      const aIsDone = a.status === 'Concluída';
      const bIsDone = b.status === 'Concluída';

      // 1. Atividades em aberto primeiro, concluídas depois
      if (!aIsDone && bIsDone) return -1;
      if (aIsDone && !bIsDone) return 1;

      // 2. Se ambas em aberto: priorizar as atrasadas e próximas do vencimento
      if (!aIsDone && !bIsDone) {
        const timeToday = today.getTime();
        const dateA = a.completionDate ? new Date(a.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.completionDate ? new Date(b.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;

        const aIsOverdue = dateA < timeToday;
        const bIsOverdue = dateB < timeToday;

        // Atrasadas vêm primeiro
        if (aIsOverdue && !bIsOverdue) return -1;
        if (!aIsOverdue && bIsOverdue) return 1;

        // Se ambas atrasadas ou ambas não atrasadas: ordenar pelo prazo mais próximo
        if (dateA !== dateB) return dateA - dateB;

        // Desempate por prioridade
        const priorityRank: Record<string, number> = {
          'Urgente': 1,
          'Alta': 1,
          'Média': 2,
          'Baixa': 3,
          'Sem prioridade': 4
        };
        const pA = priorityRank[a.priority || 'Sem prioridade'] || 4;
        const pB = priorityRank[b.priority || 'Sem prioridade'] || 4;
        return pA - pB;
      }

      // 3. Se ambas concluídas: ordenadas pela data de conclusão, da mais recente para a mais antiga
      const getCompletionTimestamp = (t: Task) => {
        if (t.completedAt) {
          const ms = new Date(t.completedAt).getTime();
          if (!isNaN(ms)) return ms;
        }
        if (t.completionDate) {
          const ms = new Date(t.completionDate + 'T00:00:00').getTime();
          if (!isNaN(ms)) return ms;
        }
        if (t.updates && t.updates.length > 0) {
          const ms = new Date(t.updates[0].date).getTime();
          if (!isNaN(ms)) return ms;
        }
        return 0;
      };

      const compA = getCompletionTimestamp(a);
      const compB = getCompletionTimestamp(b);
      return compB - compA; // Da mais recente para a mais antiga
    });
  }, [userTasks, searchTerm, statusFilter, typeFilter, priorityFilter, projectFilter, groupFilter, selectedCalendarDateStr, dateRangeFilter, today, showPreStartInTable, systemRealStartDate]);

  // Handlers do Drawer Lateral
  const handleOpenDrawer = (task: Task) => {
    setDrawerTask(task);
    setIsEditingDrawer(false);
    setDrawerEditForm({ ...task });
    setDrawerNewNoteText('');
    setDrawerNewNoteIsImportant(false);
  };

  // Adicionar nota de atualização pelo Drawer
  const handleAddDrawerNote = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!drawerTask || !drawerNewNoteText.trim()) return;

    const newNote: TaskNote = {
      id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      date: new Date().toISOString(),
      user: currentUser && currentUser !== 'Todos' ? currentUser : 'Usuário',
      note: drawerNewNoteText.trim(),
      isImportant: drawerNewNoteIsImportant,
      acknowledgedBy: drawerNewNoteIsImportant && currentUser && currentUser !== 'Todos' ? [currentUser] : []
    };

    const updated: Task = {
      ...drawerTask,
      updates: [newNote, ...(drawerTask.updates || [])]
    };

    onSaveTask(updated);
    setDrawerTask(updated);
    setDrawerNewNoteText('');
    setDrawerNewNoteIsImportant(false);
  };

  const handleSaveDrawerEdit = () => {
    if (!drawerTask || !drawerEditForm.activity?.trim()) return;
    const updated: Task = {
      ...drawerTask,
      ...drawerEditForm,
      activity: drawerEditForm.activity.trim()
    };
    onSaveTask(updated);
    setDrawerTask(updated);
    setIsEditingDrawer(false);
  };

  // Helper para formatar data BR
  const formatDateBR = (dateStr?: string) => {
    if (!dateStr) return 'Sem prazo';
    const parts = dateStr.split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
  };

  // =========================================================================
  // DADOS DA ABA VISÃO GERAL → PROJETOS (Imagem 2 - Contribuições Regulatórias)
  // =========================================================================
  const [selectedRegulatoryProject, setSelectedRegulatoryProject] = useState<string>('Todos');
  const [regulatorySearch, setRegulatorySearch] = useState('');
  const [regulatoryStatusFilter, setRegulatoryStatusFilter] = useState<'Todos' | 'pending' | 'approved' | 'rejected'>('Todos');

  // Todas as atividades marcadas como contribuição regulatória
  const allRegulatoryContributions = useMemo(() => {
    return tasks.filter(t => !t.deleted && (t.isRegulatoryContribution || t.generatesRegulatoryContent));
  }, [tasks]);

  // Gráfico: contribuições por projeto
  const projectContributionsChartData = useMemo(() => {
    const map: Record<string, number> = {};
    allRegulatoryContributions.forEach(t => {
      const p = t.project || 'Sem Projeto';
      map[p] = (map[p] || 0) + 1;
    });

    return Object.entries(map).map(([name, count]) => ({
      name,
      count
    }));
  }, [allRegulatoryContributions]);

  // Contribuições do projeto selecionado
  const filteredProjectContributions = useMemo(() => {
    return allRegulatoryContributions.filter(t => {
      if (selectedRegulatoryProject !== 'Todos' && t.project !== selectedRegulatoryProject) return false;
      if (regulatoryStatusFilter !== 'Todos') {
        const status = t.regulatoryStatus || 'pending';
        if (status !== regulatoryStatusFilter) return false;
      }
      if (regulatorySearch) {
        const term = regulatorySearch.toLowerCase();
        const match = 
          t.activity.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.projectLead?.toLowerCase().includes(term);
        if (!match) return false;
      }
      return true;
    });
  }, [allRegulatoryContributions, selectedRegulatoryProject, regulatoryStatusFilter, regulatorySearch]);

  const regulatoryProjectStats = useMemo(() => {
    const list = selectedRegulatoryProject === 'Todos' 
      ? allRegulatoryContributions 
      : allRegulatoryContributions.filter(t => t.project === selectedRegulatoryProject);

    const completed = list.filter(t => t.status === 'Concluída').length;
    const ongoing = list.filter(t => t.status === 'Em Andamento').length;
    const overdue = list.filter(t => t.status !== 'Concluída' && t.completionDate && new Date(t.completionDate + 'T00:00:00') < today).length;
    const approved = list.filter(t => t.regulatoryStatus === 'approved').length;
    const pending = list.filter(t => !t.regulatoryStatus || t.regulatoryStatus === 'pending').length;

    return { total: list.length, completed, ongoing, overdue, approved, pending };
  }, [allRegulatoryContributions, selectedRegulatoryProject, today]);

  return (
    <div className="space-y-6">
      
      {/* HEADER & TABS INTERNAS (Visão Geral | Projetos) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            Visão Geral CTVacinas
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Consulta, indicadores e acompanhamento de atividades e contribuições regulatórias.
          </p>
        </div>

        {/* Abas Internas da Visão Geral */}
        <div className="bg-white p-1 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-1">
          <button
            type="button"
            onClick={() => setInternalTab('visao_geral')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              internalTab === 'visao_geral'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Clock size={14} /> Visão Geral
          </button>

          <button
            type="button"
            onClick={() => setInternalTab('projetos')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              internalTab === 'projetos'
                ? 'bg-teal-600 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FolderKanban size={14} /> Projetos
          </button>
        </div>
      </div>

      {/* =========================================================================
          ABA 1: VISÃO GERAL (Imagem 1)
          ========================================================================= */}
      {internalTab === 'visao_geral' && (
        <div className="space-y-6">
          
          {/* INDICADORES POR STATUS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Total de Atividades</span>
                <span className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold">
                  <FileText size={16} />
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 block">{statusStats.total}</span>
              <span className="text-[10px] font-bold text-slate-400 mt-1">
                {systemRealStartDate
                  ? `A partir de ${formatDateBR(systemRealStartDate)}`
                  : 'Todas as demandas no escopo'}
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-300" />
            </div>

            {/* Concluídas */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Concluídas</span>
                <span className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle size={16} />
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 block">{statusStats.completed}</span>
              <span className="text-[10px] font-bold text-emerald-700 mt-1">
                {statusStats.total > 0 ? Math.round((statusStats.completed / statusStats.total) * 100) : 0}% do total finalizado
              </span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
            </div>

            {/* Em Andamento */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Em Andamento</span>
                <span className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <ArrowRight size={16} />
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 mt-2 block">{statusStats.ongoing}</span>
              <span className="text-[10px] font-bold text-blue-700 mt-1">Em execução pela equipe</span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
            </div>

            {/* Atrasadas / Críticas */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-2xs relative overflow-hidden flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-black uppercase tracking-wider text-slate-400">Atrasadas</span>
                <span className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <AlertTriangle size={16} />
                </span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 mt-2 block">{statusStats.overdue}</span>
              <span className="text-[10px] font-bold text-rose-700 mt-1">Atenção ao prazo regulatório</span>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
            </div>
          </div>

          {/* GRID: CALENDÁRIO COMPACTO & PAINEL DE ALERTAS */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Calendário Compacto (lg:col-span-7) */}
            <div className="lg:col-span-7 min-w-0 bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="space-y-2.5">
                {/* Linha 1: Título + Mês/Ano + Dia/Mês/Ano + Navegação */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <CalendarIcon size={18} className="text-teal-600 shrink-0" />
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight truncate">
                      Calendário de Acompanhamento
                    </h3>
                    <span className="text-xs text-slate-500 font-bold capitalize whitespace-nowrap">
                      {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Seletor Dia / Mês / Ano */}
                    <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold shrink-0">
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('day')}
                        className={`px-2 py-1 rounded-lg transition ${
                          calendarViewMode === 'day' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500'
                        }`}
                      >
                        Dia
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('month')}
                        className={`px-2 py-1 rounded-lg transition ${
                          calendarViewMode === 'month' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500'
                        }`}
                      >
                        Mês
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarViewMode('year')}
                        className={`px-2 py-1 rounded-lg transition ${
                          calendarViewMode === 'year' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-500'
                        }`}
                      >
                        Ano
                      </button>
                    </div>

                    {/* Setas de navegação */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(calendarDate);
                          if (calendarViewMode === 'day') d.setDate(d.getDate() - 1);
                          else if (calendarViewMode === 'month') d.setMonth(d.getMonth() - 1);
                          else d.setFullYear(d.getFullYear() - 1);
                          setCalendarDate(d);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCalendarDate(new Date())}
                        className="px-2 py-1 text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg whitespace-nowrap"
                      >
                        Hoje
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const d = new Date(calendarDate);
                          if (calendarViewMode === 'day') d.setDate(d.getDate() + 1);
                          else if (calendarViewMode === 'month') d.setMonth(d.getMonth() + 1);
                          else d.setFullYear(d.getFullYear() + 1);
                          setCalendarDate(d);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                      >
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Linha 2: Botões de Início Real e Manutenção alinhados dentro do card */}
                <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setTempSystemStartDate(systemRealStartDate || today.toISOString().split('T')[0]);
                      setTempSystemStartNote(systemRealStartNote || 'Criada antes do aplicativo estar 100% funcionando');
                      setIsSystemStartModalOpen(true);
                    }}
                    className={`px-3 py-1.5 border rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap ${
                      systemRealStartDate
                        ? 'bg-orange-100 hover:bg-orange-200 text-orange-900 border-orange-300'
                        : 'bg-orange-50 hover:bg-orange-100 text-orange-800 border-orange-200'
                    }`}
                    title="Definir a data de início real do sistema (atividades anteriores ficam em laranja e fora dos indicadores)"
                  >
                    <Flag size={12} className="text-orange-600 shrink-0" />
                    <span>{systemRealStartDate ? `Início Real: ${formatDateBR(systemRealStartDate)}` : 'Início Real'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingMaintenance({
                        startDate: today.toISOString().split('T')[0],
                        endDate: today.toISOString().split('T')[0],
                        title: '',
                        description: '',
                        status: 'Programada',
                        impactLevel: 'Indisponibilidade Total'
                      });
                      setIsMaintenanceModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
                    title="Gerenciar períodos de manutenção do sistema"
                  >
                    <Wrench size={12} className="text-amber-600 shrink-0" />
                    <span>Manutenção</span>
                  </button>
                </div>
              </div>

              {/* Calendário Grid Mensal Compacto */}
              {calendarViewMode === 'month' && (
                <div>
                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-black uppercase text-slate-400 mb-1">
                    <span>Dom</span><span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sáb</span>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {(() => {
                      const year = calendarDate.getFullYear();
                      const month = calendarDate.getMonth();
                      const firstDayIndex = new Date(year, month, 1).getDay();
                      const daysInMonth = new Date(year, month + 1, 0).getDate();
                      const cells = [];

                      // Blank padding before first day
                      for (let i = 0; i < firstDayIndex; i++) {
                        cells.push(<div key={`blank-${i}`} className="h-9 rounded-xl bg-slate-50/40" />);
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const count = userTasks.filter(t => t.completionDate === dateStr).length;
                        const isSelected = selectedCalendarDateStr === dateStr;
                        const isToday = today.toISOString().split('T')[0] === dateStr;
                        const dayMaintenances = getMaintenanceForDate(dateStr);
                        const isUnderMaintenance = dayMaintenances.length > 0;
                        const isPreSystemStart = !!(systemRealStartDate && dateStr < systemRealStartDate);

                        const tooltipParts: string[] = [];
                        if (isPreSystemStart) {
                          tooltipParts.push(`Anterior ao início real do sistema (${formatDateBR(systemRealStartDate)}) — ${systemRealStartNote}`);
                        }
                        if (isUnderMaintenance) {
                          tooltipParts.push(`Manutenção: ${dayMaintenances.map(m => m.title).join(' | ')}`);
                        }

                        cells.push(
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedCalendarDateStr(isSelected ? null : dateStr)}
                            className={`h-9 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center relative ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-black'
                                : isPreSystemStart
                                ? 'bg-orange-50/90 border-orange-300 text-orange-950 font-black hover:bg-orange-100'
                                : isUnderMaintenance
                                ? 'bg-amber-50/90 border-amber-300 text-amber-950 font-black hover:bg-amber-100'
                                : isToday
                                ? 'bg-teal-50 border-teal-300 text-teal-900'
                                : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                            }`}
                            title={tooltipParts.length > 0 ? tooltipParts.join(' • ') : undefined}
                          >
                            <span>{d}</span>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {count > 0 && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'}`} />
                              )}
                              {isPreSystemStart && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-orange-200' : 'bg-orange-500'}`} />
                              )}
                              {isUnderMaintenance && !isPreSystemStart && (
                                <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-600'}`} />
                              )}
                            </div>
                            {isUnderMaintenance && !isSelected && (
                              <span className="absolute top-0.5 right-1 text-[8px] text-amber-600 font-black">
                                🔧
                              </span>
                            )}
                          </button>
                        );
                      }
                      return cells;
                    })()}
                  </div>

                  {/* Legenda do Calendário */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" />
                      <span>Atividade registrada</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-orange-800">
                      <span className="w-3 h-3 rounded-sm bg-orange-50 border border-orange-300 inline-flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      </span>
                      <span>Anterior ao início real do sistema (antes do app estar 100% funcionando)</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-300 inline-flex items-center justify-center text-[7px]">
                        🔧
                      </span>
                      <span>Período de manutenção</span>
                    </span>
                  </div>
                </div>
              )}

              {calendarViewMode === 'day' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <span className="text-xs font-black uppercase text-slate-800">
                    {calendarDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Atividades programadas para esta data: {userTasks.filter(t => t.completionDate === calendarDate.toISOString().split('T')[0]).length}
                  </p>
                </div>
              )}

              {calendarViewMode === 'year' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                  <span className="text-xs font-black uppercase text-slate-800">
                    Ano de {calendarDate.getFullYear()}
                  </span>
                  <p className="text-[11px] text-slate-500">
                    Total de demandas no ano: {userTasks.filter(t => t.completionDate?.startsWith(String(calendarDate.getFullYear()))).length}
                  </p>
                </div>
              )}

              {selectedCalendarDateStr && (
                <div className="flex items-center justify-between text-xs pt-2 text-teal-800 font-bold border-t border-slate-100">
                  <span>Filtrando por data: {formatDateBR(selectedCalendarDateStr)}</span>
                  <button 
                    onClick={() => setSelectedCalendarDateStr(null)}
                    className="text-rose-600 hover:underline flex items-center gap-1 font-bold"
                  >
                    <X size={12} /> Limpar data
                  </button>
                </div>
              )}
            </div>

            {/* Alertas de Vencimento e Atraso (lg:col-span-5) */}
            <div className="lg:col-span-5 min-w-0 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={18} className="text-rose-600" />
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    Painel de Alertas
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                  {alerts.overdueTasks.length + alerts.dueSoonTasks.length} Notificações
                </span>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                {/* Atrasadas */}
                {alerts.overdueTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenDrawer(task)}
                    className="p-3 rounded-2xl border border-rose-200 bg-rose-50/60 hover:bg-rose-100/60 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-rose-200 text-rose-900">
                        Atrasada
                      </span>
                      <h4 className="text-xs font-black text-rose-950 truncate mt-1">{task.activity}</h4>
                      <p className="text-[10px] text-rose-700 font-semibold">{task.project} • {formatDateBR(task.completionDate)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotesModalTask(task);
                        }}
                        className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-rose-700 hover:text-rose-900 border border-rose-200/60 shadow-2xs transition flex items-center gap-1 text-[10px] font-bold"
                        title="Notas de atualização"
                      >
                        <MessageSquare size={13} />
                        {task.updates && task.updates.length > 0 && <span>{task.updates.length}</span>}
                      </button>
                      <ArrowRight size={14} className="text-rose-600" />
                    </div>
                  </div>
                ))}

                {/* Próximas do vencimento */}
                {alerts.dueSoonTasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => handleOpenDrawer(task)}
                    className="p-3 rounded-2xl border border-amber-200 bg-amber-50/60 hover:bg-amber-100/60 transition cursor-pointer flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md bg-amber-200 text-amber-900">
                        Vencendo em breve
                      </span>
                      <h4 className="text-xs font-black text-amber-950 truncate mt-1">{task.activity}</h4>
                      <p className="text-[10px] text-amber-700 font-semibold">{task.project} • Prazo: {formatDateBR(task.completionDate)}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setNotesModalTask(task);
                        }}
                        className="p-1.5 rounded-xl bg-white/80 hover:bg-white text-amber-700 hover:text-amber-900 border border-amber-200/60 shadow-2xs transition flex items-center gap-1 text-[10px] font-bold"
                        title="Notas de atualização"
                      >
                        <MessageSquare size={13} />
                        {task.updates && task.updates.length > 0 && <span>{task.updates.length}</span>}
                      </button>
                      <ArrowRight size={14} className="text-amber-600" />
                    </div>
                  </div>
                ))}

                {alerts.overdueTasks.length === 0 && alerts.dueSoonTasks.length === 0 && (
                  <div className="py-12 text-center text-slate-400">
                    <CheckCircle size={32} className="mx-auto text-emerald-500 mb-1" />
                    <p className="text-xs font-bold text-slate-600">Nenhuma atividade atrasada ou em risco!</p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* HISTÓRICO COMPLETO DE ATIVIDADES COM FILTROS */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <FileText size={16} className="text-teal-600" />
                  Histórico Completo de Atividades
                </h3>
                <p className="text-xs text-slate-400 font-bold">
                  {filteredTasks.length} atividade(s) encontrada(s)
                  {systemRealStartDate && (
                    <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-bold text-orange-700">
                      • <span className="w-2 h-2 rounded-full bg-orange-500 inline-block" /> Em laranja: criadas antes de {formatDateBR(systemRealStartDate)} ({systemRealStartNote})
                    </span>
                  )}
                </p>
              </div>

              {/* Botões rápidos de período */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
                {systemRealStartDate && (
                  <button
                    type="button"
                    onClick={() => setShowPreStartInTable(prev => !prev)}
                    className={`px-2.5 py-1 rounded-xl border transition ${
                      showPreStartInTable
                        ? 'bg-orange-50 border-orange-300 text-orange-800 hover:bg-orange-100'
                        : 'bg-teal-50 border-teal-300 text-teal-800 hover:bg-teal-100'
                    }`}
                    title="Alternar exibição de atividades registradas antes do início real do sistema"
                  >
                    {showPreStartInTable ? 'Exibindo pré-início (laranja)' : `Apenas a partir de ${formatDateBR(systemRealStartDate)}`}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDateRangeFilter('all')}
                  className={`px-2.5 py-1 rounded-xl transition ${
                    dateRangeFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  type="button"
                  onClick={() => setDateRangeFilter('today')}
                  className={`px-2.5 py-1 rounded-xl transition ${
                    dateRangeFilter === 'today' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setDateRangeFilter('this_month')}
                  className={`px-2.5 py-1 rounded-xl transition ${
                    dateRangeFilter === 'this_month' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Este Mês
                </button>
                <button
                  type="button"
                  onClick={() => setDateRangeFilter('overdue')}
                  className={`px-2.5 py-1 rounded-xl transition ${
                    dateRangeFilter === 'overdue' ? 'bg-rose-600 text-white shadow-2xs' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                  }`}
                >
                  Atrasadas
                </button>
              </div>
            </div>

            {/* Barra de Filtros */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-slate-100">
              {/* Busca */}
              <div className="sm:col-span-2 relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Pesquisar atividades..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              {/* Status */}
              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Todos">Status: Todos</option>
                  <option value="Planejada">Planejada</option>
                  <option value="Em Andamento">Em Andamento</option>
                  <option value="Concluída">Concluída</option>
                  <option value="Pausado">Pausado</option>
                </select>
              </div>

              {/* Tipo */}
              <div>
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value as any)}
                  className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Todos">Tipo: Todos</option>
                  <option value="general">Geral / Tarefa</option>
                  <option value="meeting">Reunião</option>
                  <option value="report">Relatório</option>
                  <option value="note">Nota</option>
                </select>
              </div>

              {/* Grupo */}
              <div>
                <select
                  value={groupFilter}
                  onChange={e => setGroupFilter(e.target.value)}
                  className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Todos">Grupo: Todos</option>
                  {uniqueGroups.filter(g => g !== 'Todos').map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Projeto */}
              <div>
                <select
                  value={projectFilter}
                  onChange={e => setProjectFilter(e.target.value)}
                  className="w-full py-2 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Todos">Projeto: Todos</option>
                  {uniqueProjects.filter(p => p !== 'Todos').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tabela / Lista de Atividades (100% visível sem rolagem horizontal) */}
            <div className="pt-2">
              {/* Versão Desktop / Tablet: tabela 100% ajustada à largura da tela */}
              <table className="hidden md:table w-full table-fixed text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-2.5 w-[31%]">Atividade</th>
                    <th className="py-2.5 px-1.5 w-[9%]">Tipo</th>
                    <th className="py-2.5 px-1.5 w-[13%]">Projeto / Grupo</th>
                    <th className="py-2.5 px-1.5 w-[10%]">Responsável</th>
                    <th className="py-2.5 px-1.5 w-[9%]">Prazo</th>
                    <th className="py-2.5 px-1.5 w-[9%]">Prioridade</th>
                    <th className="py-2.5 px-1.5 w-[10%]">Status</th>
                    <th className="py-2.5 px-2 w-[9%] text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => {
                    const isDone = task.status === 'Concluída';
                    const isPreStart = isTaskBeforeSystemStart(task);
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenDrawer(task)}
                        className={`transition cursor-pointer group ${
                          isPreStart
                            ? 'bg-orange-50/75 hover:bg-orange-100/70 border-l-4 border-l-orange-400'
                            : isDone
                            ? 'bg-emerald-50/40 text-emerald-950 hover:bg-emerald-50/80'
                            : 'hover:bg-slate-50/80'
                        }`}
                      >
                        <td className="py-3 px-2.5 align-top">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={`font-black text-xs leading-snug break-words ${
                              isPreStart
                                ? isDone ? 'line-through text-orange-900/80' : 'text-orange-950'
                                : isDone ? 'line-through text-emerald-900' : 'text-slate-900'
                            }`}>
                              {task.activity}
                            </span>
                            {isPreStart && (
                              <span
                                className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-orange-200/90 text-orange-900 border border-orange-300 shrink-0"
                                title={`${systemRealStartNote} (antes de ${formatDateBR(systemRealStartDate)})`}
                              >
                                Pré-início
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 block break-words">
                              {task.description}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-1.5 align-top">
                          <div className="space-y-1">
                            <span className="inline-block px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                              {task.activityType === 'meeting' ? 'Reunião' :
                               task.activityType === 'report' || task.isReport ? 'Relatório' :
                               task.activityType === 'note' ? 'Nota' : 'Geral'}
                            </span>
                            {(task.activityType === 'report' || task.isReport) && (
                              <span className="block text-[10px] font-bold text-purple-700 truncate">
                                {task.reportReviewer || task.currentReviewer 
                                  ? `Rev: ${task.reportReviewer || task.currentReviewer}` 
                                  : `Com: ${task.projectLead || 'A definir'}`}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-1.5 align-top">
                          <span className="font-bold text-slate-700 text-[11px] block truncate" title={task.project}>{task.project}</span>
                          {task.group && (
                            <span className="text-[10px] text-teal-700 font-bold block truncate" title={task.group}>{task.group}</span>
                          )}
                        </td>

                        <td className="py-3 px-1.5 align-top">
                          <span className="font-semibold text-slate-700 text-[11px] block truncate" title={task.projectLead}>{task.projectLead}</span>
                        </td>

                        <td className="py-3 px-1.5 align-top">
                          <span className="font-semibold text-slate-600 text-[11px] whitespace-nowrap">{formatDateBR(task.completionDate)}</span>
                        </td>

                        <td className="py-3 px-1.5 align-top">
                          <span className="text-[10px] font-bold text-slate-600 block truncate" title={task.priority || 'Sem prioridade'}>
                            {task.priority || 'Sem prioridade'}
                          </span>
                        </td>

                        <td className="py-3 px-1.5 align-top">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-black uppercase leading-tight ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.status}
                          </span>
                        </td>

                        <td className="py-3 px-2 text-right align-top">
                          <div className="flex items-center justify-end gap-0.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotesModalTask(task);
                              }}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition flex items-center gap-0.5"
                              title="Visualizar e adicionar notas de atualização"
                            >
                              <MessageSquare size={13} />
                              {task.updates && task.updates.length > 0 && (
                                <span className="text-[10px] font-bold text-teal-700">{task.updates.length}</span>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenDrawer(task);
                              }}
                              className="p-1 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition"
                              title="Consultar e editar detalhes"
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {filteredTasks.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-10 text-center text-slate-400 font-semibold text-xs">
                        Nenhuma atividade encontrada com os filtros selecionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Versão Mobile: cards responsivos sem rolagem lateral */}
              <div className="md:hidden space-y-2.5">
                {filteredTasks.map(task => {
                  const isDone = task.status === 'Concluída';
                  const isPreStart = isTaskBeforeSystemStart(task);
                  return (
                    <div
                      key={task.id}
                      onClick={() => handleOpenDrawer(task)}
                      className={`p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
                        isPreStart
                          ? 'bg-orange-50/75 border-orange-200 border-l-4 border-l-orange-400'
                          : isDone
                          ? 'bg-emerald-50/40 border-emerald-200/80'
                          : 'bg-slate-50/60 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                              {task.activityType === 'meeting' ? 'Reunião' :
                               task.activityType === 'report' || task.isReport ? 'Relatório' :
                               task.activityType === 'note' ? 'Nota' : 'Geral'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                              isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {task.status}
                            </span>
                            {isPreStart && (
                              <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase bg-orange-200/90 text-orange-900 border border-orange-300">
                                Pré-início
                              </span>
                            )}
                          </div>
                          <h4 className={`font-black text-xs leading-snug break-words ${
                            isPreStart
                              ? isDone ? 'line-through text-orange-900/80' : 'text-orange-950'
                              : isDone ? 'line-through text-emerald-900' : 'text-slate-900'
                          }`}>
                            {task.activity}
                          </h4>
                          {task.description && (
                            <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{task.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setNotesModalTask(task);
                            }}
                            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-teal-700 rounded-lg flex items-center gap-1"
                            title="Notas de atualização"
                          >
                            <MessageSquare size={13} />
                            {task.updates && task.updates.length > 0 && (
                              <span className="text-[10px] font-bold text-teal-700">{task.updates.length}</span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(task);
                            }}
                            className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:text-teal-700 rounded-lg"
                            title="Consultar detalhes"
                          >
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] font-semibold text-slate-600 pt-1 border-t border-slate-200/60">
                        <span><strong>Projeto:</strong> {task.project}{task.group ? ` (${task.group})` : ''}</span>
                        <span><strong>Resp:</strong> {task.projectLead}</span>
                        <span><strong>Prazo:</strong> {formatDateBR(task.completionDate)}</span>
                        <span><strong>Prioridade:</strong> {task.priority || 'Sem prioridade'}</span>
                      </div>
                    </div>
                  );
                })}
                {filteredTasks.length === 0 && (
                  <div className="py-10 text-center text-slate-400 font-semibold text-xs">
                    Nenhuma atividade encontrada com os filtros selecionados.
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* =========================================================================
          ABA 2: VISÃO GERAL → PROJETOS (Imagem 2 - Contribuições Regulatórias)
          ========================================================================= */}
      {internalTab === 'projetos' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          
          {/* Top Info Banner */}
          <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <ShieldCheck size={20} className="text-blue-600 shrink-0" />
              <div>
                <span className="font-black uppercase tracking-wider block">Acompanhamento de Contribuições Regulatórias</span>
                <span className="text-[11px] text-blue-700">
                  Consulte as atividades marcadas com impacto regulatório vinculadas a cada projeto.
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={selectedRegulatoryProject}
                onChange={e => setSelectedRegulatoryProject(e.target.value)}
                className="py-1.5 px-3 bg-white border border-blue-200 rounded-xl text-xs font-black text-blue-900 outline-none cursor-pointer"
              >
                <option value="Todos">Todos os Projetos</option>
                {uniqueProjects.filter(p => p !== 'Todos').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Indicadores de Contribuições */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Total de Contribuições</span>
              <span className="text-2xl sm:text-3xl font-black text-slate-900 block mt-1">{regulatoryProjectStats.total}</span>
              <span className="text-[10px] text-slate-400">Demandas com impacto regulatório</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Concluídas</span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 block mt-1">{regulatoryProjectStats.completed}</span>
              <span className="text-[10px] text-emerald-700 font-bold">Atividades finalizadas</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Em Andamento</span>
              <span className="text-2xl sm:text-3xl font-black text-blue-600 block mt-1">{regulatoryProjectStats.ongoing}</span>
              <span className="text-[10px] text-blue-700 font-bold">Execução em curso</span>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200/90 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 uppercase">Atrasadas</span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 block mt-1">{regulatoryProjectStats.overdue}</span>
              <span className="text-[10px] text-rose-700 font-bold">Atenção ao cronograma</span>
            </div>
          </div>

          {/* Gráfico de Contribuições por Projeto & Lista */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Gráfico (lg:col-span-5) */}
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                  <BarChart2 size={16} className="text-teal-600" />
                  Contribuições por Projeto
                </h3>
              </div>

              <div className="h-64 w-full pt-2">
                {projectContributionsChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={projectContributionsChartData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#334155', fontWeight: 'bold' }} width={90} />
                      <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 11 }} />
                      <Bar dataKey="count" fill="#0d9488" radius={[0, 8, 8, 0]} barSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                    Nenhuma contribuição regulatória registrada ainda.
                  </div>
                )}
              </div>
            </div>

            {/* Lista de Contribuições Regulatórias do Projeto (lg:col-span-7) */}
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    Lista de Contribuições Regulatórias
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold">
                    {filteredProjectContributions.length} registro(s) listado(s)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={regulatoryStatusFilter}
                    onChange={e => setRegulatoryStatusFilter(e.target.value as any)}
                    className="py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="Todos">Avaliação: Todas</option>
                    <option value="pending">🟡 Pendente</option>
                    <option value="approved">🟢 Aprovada</option>
                    <option value="rejected">🔴 Rejeitada</option>
                  </select>
                </div>
              </div>

              {/* Input de busca */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={regulatorySearch}
                  onChange={e => setRegulatorySearch(e.target.value)}
                  placeholder="Pesquisar contribuição regulatória..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                />
              </div>

              {/* Lista */}
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto custom-scrollbar pr-1">
                {filteredProjectContributions.map(contrib => {
                  const regStatus = contrib.regulatoryStatus || 'pending';
                  return (
                    <div
                      key={contrib.id}
                      onClick={() => handleOpenDrawer(contrib)}
                      className="p-3.5 bg-slate-50/80 hover:bg-blue-50/50 rounded-2xl border border-slate-200/80 hover:border-blue-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-teal-100 text-teal-900">
                            {contrib.project}
                          </span>
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${
                            regStatus === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            regStatus === 'rejected' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {regStatus === 'approved' ? 'Aprovada' : regStatus === 'rejected' ? 'Rejeitada' : 'Pendente de Avaliação'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black text-slate-900 leading-snug">{contrib.activity}</h4>
                        <p className="text-[10px] text-slate-500">{contrib.description || 'Sem descrição'}</p>
                      </div>

                      <div className="flex items-center gap-3 text-xs shrink-0 self-end sm:self-auto">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 block uppercase">Prazo</span>
                          <span className="font-semibold text-slate-700">{formatDateBR(contrib.completionDate)}</span>
                        </div>
                        <button className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-blue-600">
                          <Eye size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredProjectContributions.length === 0 && (
                  <div className="py-12 text-center text-slate-400 text-xs font-semibold">
                    Nenhuma contribuição regulatória encontrada para os filtros.
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* =========================================================================
          PAINEL LATERAL (DRAWER) PARA CONSULTAR E EDITAR REGISTROS EXISTENTES
          ========================================================================= */}
      {drawerTask && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
            
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-teal-400 block">
                  {drawerTask.project}
                </span>
                <h3 className="text-sm font-black uppercase text-white truncate max-w-sm">
                  {drawerTask.activity}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerTask(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Conteúdo do Drawer */}
            <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
              
              {!isEditingDrawer ? (
                /* MODO VISUALIZAÇÃO */
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Título</span>
                    <p className="text-sm font-black text-slate-900 mt-0.5">{drawerTask.activity}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Descrição</span>
                    <p className="text-slate-700 leading-relaxed mt-0.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      {drawerTask.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Responsável</span>
                      <span className="font-bold text-slate-800">{drawerTask.projectLead}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Prazo</span>
                      <span className="font-bold text-slate-800">{formatDateBR(drawerTask.completionDate)}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Prioridade</span>
                      <span className="font-bold text-slate-800">{drawerTask.priority || 'Sem prioridade'}</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Status</span>
                      <span className="font-bold text-slate-800">{drawerTask.status}</span>
                    </div>
                  </div>

                  {drawerTask.group && (
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-400 block">Grupo</span>
                      <span className="font-bold text-teal-800">{drawerTask.group}</span>
                    </div>
                  )}

                  {/* Detalhes de Relatório - Com quem está e Revisão */}
                  {(drawerTask.activityType === 'report' || drawerTask.isReport) && (
                    <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/60 space-y-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-purple-900 block flex items-center gap-1.5">
                        <UserCheck size={14} className="text-purple-600" /> Acompanhamento do Relatório
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[9px] font-black uppercase text-purple-600 block">Com quem está</span>
                          <span className="font-bold text-purple-950">
                            {drawerTask.reportReviewer || drawerTask.currentReviewer || drawerTask.projectLead || 'A definir'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] font-black uppercase text-purple-600 block">Situação de Revisão</span>
                          <span className="font-bold text-purple-950">
                            {drawerTask.reportReviewer || drawerTask.currentReviewer ? 'Em revisão' : 'Em elaboração'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Detalhes de Reunião */}
                  {drawerTask.activityType === 'meeting' && (
                    <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 space-y-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block flex items-center gap-1.5">
                        <Users size={14} className="text-blue-600" /> Detalhes da Reunião
                      </span>
                      <span className="text-xs font-bold text-blue-950 block">
                        {drawerTask.isMeetingOrganizer ? 'Usuário é o organizador desta reunião' : 'Participante da reunião'}
                      </span>
                    </div>
                  )}

                  {/* Contribuição Regulatória */}
                  <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/60 space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-900 block flex items-center gap-1.5">
                      <ShieldCheck size={14} /> Contribuição Regulatória
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-950">
                        {drawerTask.isRegulatoryContribution || drawerTask.generatesRegulatoryContent ? 'Sim (Impacto regulatório)' : 'Não'}
                      </span>
                      {drawerTask.regulatoryStatus && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-200 text-blue-900">
                          Status: {drawerTask.regulatoryStatus}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Histórico e Adição de Notas de Atualização (Requisito 2) */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={14} className="text-teal-600" />
                        <span className="text-[10px] font-black uppercase text-slate-800 tracking-wider">
                          Notas de Atualização ({drawerTask.updates?.length || 0})
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setNotesModalTask(drawerTask)}
                        className="text-[10px] font-black uppercase text-teal-700 hover:text-teal-900 transition flex items-center gap-1 hover:underline"
                      >
                        Gerenciar Notas
                      </button>
                    </div>

                    {/* Formulário rápido para adicionar nota */}
                    <form onSubmit={handleAddDrawerNote} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                      <textarea
                        rows={2}
                        value={drawerNewNoteText}
                        onChange={e => setDrawerNewNoteText(e.target.value)}
                        placeholder="Adicionar nota de atualização a esta atividade..."
                        className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-teal-500 resize-none transition"
                      />
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={drawerNewNoteIsImportant}
                            onChange={e => setDrawerNewNoteIsImportant(e.target.checked)}
                            className="rounded text-teal-600 focus:ring-teal-500"
                          />
                          <span>Marcar como importante</span>
                        </label>
                        <button
                          type="submit"
                          disabled={!drawerNewNoteText.trim()}
                          className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-2xs flex items-center gap-1"
                        >
                          <Plus size={12} /> Salvar Nota
                        </button>
                      </div>
                    </form>

                    {/* Lista de Notas Existentes */}
                    {drawerTask.updates && drawerTask.updates.length > 0 ? (
                      <div className="space-y-2 max-h-52 overflow-y-auto custom-scrollbar pr-1">
                        {drawerTask.updates.map(u => (
                          <div 
                            key={u.id} 
                            className={`p-2.5 rounded-xl border space-y-1 transition ${
                              u.isImportant 
                                ? 'bg-amber-50/80 border-amber-300 shadow-2xs' 
                                : 'bg-slate-50 border-slate-200/80'
                            }`}
                          >
                            <div className="flex items-center justify-between text-[9px] font-bold">
                              <span className={u.isImportant ? 'text-amber-900 font-black flex items-center gap-1' : 'text-slate-500'}>
                                {u.isImportant && <Star size={10} className="fill-amber-500 text-amber-500" />}
                                {u.user}
                              </span>
                              <span className="text-slate-400">
                                {new Date(u.date).toLocaleDateString('pt-BR')} às {new Date(u.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">{u.note}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic text-center py-2">
                        Nenhuma nota de atualização registrada ainda.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                /* MODO EDIÇÃO */
                <div className="space-y-4 text-xs">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Título</label>
                    <input
                      type="text"
                      value={drawerEditForm.activity || ''}
                      onChange={e => setDrawerEditForm({ ...drawerEditForm, activity: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Descrição</label>
                    <textarea
                      rows={3}
                      value={drawerEditForm.description || ''}
                      onChange={e => setDrawerEditForm({ ...drawerEditForm, description: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Prazo</label>
                      <input
                        type="date"
                        value={drawerEditForm.completionDate || ''}
                        onChange={e => setDrawerEditForm({ ...drawerEditForm, completionDate: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Prioridade</label>
                      <select
                        value={drawerEditForm.priority || 'Sem prioridade'}
                        onChange={e => setDrawerEditForm({ ...drawerEditForm, priority: e.target.value as Priority })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                      >
                        <option value="Sem prioridade">Sem prioridade</option>
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Status</label>
                      <select
                        value={drawerEditForm.status || 'Planejada'}
                        onChange={e => setDrawerEditForm({ ...drawerEditForm, status: e.target.value as Status })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                      >
                        <option value="Planejada">Planejada</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Concluída">Concluída</option>
                        <option value="Pausado">Pausado</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase text-slate-500">Contribuição Regulatória</label>
                      <select
                        value={drawerEditForm.isRegulatoryContribution ? 'sim' : 'nao'}
                        onChange={e => setDrawerEditForm({ 
                          ...drawerEditForm, 
                          isRegulatoryContribution: e.target.value === 'sim',
                          generatesRegulatoryContent: e.target.value === 'sim'
                        })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                      >
                        <option value="nao">Não</option>
                        <option value="sim">Sim</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer do Drawer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              {!isEditingDrawer ? (
                <>
                  <button
                    type="button"
                    onClick={() => setDrawerTask(null)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditingDrawer(true)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
                  >
                    <Edit2 size={13} /> Editar Registro
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setIsEditingDrawer(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveDrawerEdit}
                    className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-1.5"
                  >
                    <Check size={14} /> Salvar Alterações
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE NOTAS DE ATUALIZAÇÃO (Requisito 2) */}
      {notesModalTask && (
        <TaskNotesModal 
          isOpen={true}
          task={notesModalTask}
          currentUser={currentUser && currentUser !== 'Todos' ? currentUser : 'Usuário'}
          onClose={() => setNotesModalTask(null)}
          onSaveTask={(updated) => {
            onSaveTask(updated);
            setNotesModalTask(updated);
            if (drawerTask && drawerTask.id === updated.id) {
              setDrawerTask(updated);
            }
          }}
        />
      )}

      {/* MODAL DE CADASTRO E GERENCIAMENTO DE PERÍODOS DE MANUTENÇÃO */}
      {isMaintenanceModalOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => { setIsMaintenanceModalOpen(false); setEditingMaintenance(null); }}
        >
          <div 
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 space-y-4 my-auto animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <Wrench size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    {editingMaintenance?.id ? 'Editar Período de Manutenção' : 'Registrar Período de Manutenção'}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Acompanhamento visual de indisponibilidade e manutenção no calendário
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsMaintenanceModalOpen(false); setEditingMaintenance(null); }}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!editingMaintenance?.title?.trim()) {
                  alert('Por favor, informe o título ou motivo da manutenção.');
                  return;
                }
                if (!editingMaintenance.startDate || !editingMaintenance.endDate) {
                  alert('Por favor, informe a data de início e de término do período.');
                  return;
                }
                if (editingMaintenance.startDate > editingMaintenance.endDate) {
                  alert('A data de início não pode ser posterior à data de término.');
                  return;
                }

                if (editingMaintenance.id) {
                  const updated = maintenancePeriods.map(mp => 
                    mp.id === editingMaintenance.id ? (editingMaintenance as MaintenancePeriod) : mp
                  );
                  saveMaintenancePeriods(updated);
                } else {
                  const newPeriod: MaintenancePeriod = {
                    id: `maint_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                    startDate: editingMaintenance.startDate,
                    endDate: editingMaintenance.endDate,
                    title: editingMaintenance.title.trim(),
                    description: editingMaintenance.description?.trim() || '',
                    status: editingMaintenance.status || 'Programada',
                    impactLevel: editingMaintenance.impactLevel || 'Indisponibilidade Total',
                    createdAt: new Date().toISOString(),
                    createdBy: currentUser && currentUser !== 'Todos' ? currentUser : 'Usuário'
                  };
                  saveMaintenancePeriods([newPeriod, ...maintenancePeriods]);
                }

                setIsMaintenanceModalOpen(false);
                setEditingMaintenance(null);
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  Motivo / Título da Manutenção *
                </label>
                <input
                  type="text"
                  required
                  value={editingMaintenance?.title || ''}
                  onChange={e => setEditingMaintenance(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Manutenção de Servidores e Banco de Dados"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    Data Início *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingMaintenance?.startDate || ''}
                    onChange={e => setEditingMaintenance(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    Data Término *
                  </label>
                  <input
                    type="date"
                    required
                    value={editingMaintenance?.endDate || ''}
                    onChange={e => setEditingMaintenance(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    Status
                  </label>
                  <select
                    value={editingMaintenance?.status || 'Programada'}
                    onChange={e => setEditingMaintenance(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500"
                  >
                    <option value="Programada">Programada</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                    Nível de Impacto
                  </label>
                  <select
                    value={editingMaintenance?.impactLevel || 'Indisponibilidade Total'}
                    onChange={e => setEditingMaintenance(prev => ({ ...prev, impactLevel: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-amber-500"
                  >
                    <option value="Indisponibilidade Total">Indisponibilidade Total</option>
                    <option value="Alto">Alto</option>
                    <option value="Médio">Médio</option>
                    <option value="Baixo">Baixo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  Detalhes / Observações
                </label>
                <textarea
                  rows={2}
                  value={editingMaintenance?.description || ''}
                  onChange={e => setEditingMaintenance(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva as ações realizadas ou o motivo da parada..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setIsMaintenanceModalOpen(false); setEditingMaintenance(null); }}
                  className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>Salvar Período</span>
                </button>
              </div>
            </form>

            {maintenancePeriods.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-black uppercase text-amber-900 tracking-wider block">
                  Períodos Cadastrados ({maintenancePeriods.length})
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {maintenancePeriods.map(mp => {
                    const startFormatted = mp.startDate.split('-').reverse().join('/');
                    const endFormatted = mp.endDate.split('-').reverse().join('/');
                    return (
                      <div
                        key={mp.id}
                        className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <div className="font-extrabold text-amber-950 truncate">{mp.title}</div>
                          <div className="text-[10px] text-amber-900/75 font-semibold">
                            {startFormatted} até {endFormatted} • {mp.status}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => setEditingMaintenance(mp)}
                            className="p-1 text-amber-700 hover:bg-amber-200/60 rounded-lg transition"
                            title="Editar período"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Deseja remover o registro de manutenção "${mp.title}"?`)) {
                                saveMaintenancePeriods(maintenancePeriods.filter(item => item.id !== mp.id));
                                if (editingMaintenance?.id === mp.id) {
                                  setEditingMaintenance({
                                    startDate: today.toISOString().split('T')[0],
                                    endDate: today.toISOString().split('T')[0],
                                    title: '',
                                    description: '',
                                    status: 'Programada',
                                    impactLevel: 'Indisponibilidade Total'
                                  });
                                }
                              }
                            }}
                            className="p-1 text-rose-500 hover:bg-rose-100 rounded-lg transition"
                            title="Excluir período"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE CONFIGURAÇÃO DO INÍCIO REAL DO SISTEMA */}
      {isSystemStartModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsSystemStartModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg p-5 sm:p-6 space-y-4 my-auto animate-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
                  <Flag size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    Início Real do Sistema
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Defina a partir de qual data o aplicativo passou a operar 100%
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSystemStartModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={e => {
                e.preventDefault();
                if (!tempSystemStartDate) {
                  alert('Por favor, informe a data de início real do sistema.');
                  return;
                }
                saveSystemRealStart(tempSystemStartDate, tempSystemStartNote);
                setIsSystemStartModalOpen(false);
              }}
              className="space-y-3.5 text-xs"
            >
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-2xl text-[11px] text-orange-900 font-semibold leading-relaxed">
                Todas as atividades registradas <strong>antes</strong> desta data serão mantidas no histórico e destacadas em <strong>laranja</strong> (com legenda), mas os indicadores da Visão Geral (Total, Concluídas, Em Andamento e Atrasadas) considerarão apenas as atividades a partir desta data.
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  Data de Início Real do Sistema *
                </label>
                <input
                  type="date"
                  required
                  value={tempSystemStartDate}
                  onChange={e => setTempSystemStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-black uppercase text-slate-600 block mb-1">
                  Texto da Legenda para Atividades Anteriores
                </label>
                <input
                  type="text"
                  value={tempSystemStartNote}
                  onChange={e => setTempSystemStartNote(e.target.value)}
                  placeholder="Ex: Criada antes do aplicativo estar 100% funcionando"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800 outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                {systemRealStartDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      saveSystemRealStart('');
                      setIsSystemStartModalOpen(false);
                    }}
                    className="px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl font-bold transition"
                  >
                    Remover Data
                  </button>
                ) : (
                  <span />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSystemStartModalOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:text-slate-800 font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-black uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
                  >
                    <Check size={14} />
                    <span>Salvar Início Real</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
