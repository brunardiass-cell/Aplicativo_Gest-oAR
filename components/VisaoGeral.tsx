import React, { useState, useMemo, useEffect } from 'react';
import {
  Task,
  Project,
  TeamMember,
  Priority,
  Status,
  ActivityType,
  TaskNote,
  MaintenancePeriod,
  Meeting,
  ViewMode,
  RegulatoryTermDefinition
} from '../types';
import { TaskNotesModal } from './TaskNotesModal';
import { SupabaseService } from '../services/supabaseService';
import { isNameMatch, INITIAL_REGULATORY_TERMS } from '../constants';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Search,
  FileText,
  Users,
  StickyNote,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  FolderKanban,
  X,
  Check,
  ShieldCheck,
  ExternalLink,
  MessageSquare,
  Plus,
  Wrench,
  Trash2,
  Flag,
  History,
  ListChecks,
  Link2
} from 'lucide-react';

export type TaskBoardQuickFilterPreset = 'open' | 'week' | 'month' | 'pending' | 'completed';

interface VisaoGeralProps {
  tasks: Task[];
  projects: Project[];
  meetings?: Meeting[];
  currentUser: string | 'Todos';
  selectedProfile?: TeamMember | null;
  onEditTask: (task: Task) => void;
  onViewTask: (task: Task) => void;
  onSaveTask: (task: Task) => void;
  onNavigateToProject?: (projectId: string) => void;
  onNavigateToView?: (view: ViewMode) => void;
  onOpenMeeting?: (meetingId?: string, tab?: 'previstas' | 'list' | 'decisions') => void;
  onNewTask?: () => void;
  onOpenTasksWithFilter?: (preset: TaskBoardQuickFilterPreset) => void;
}

interface UnifiedDecisionRecord {
  id: string;
  projectId?: string;
  projectName: string;
  title: string;
  description: string;
  justification?: string;
  date: string;
  sourceType: 'project_decision' | 'meeting_decision' | 'contribution' | 'history';
  sourceLabel: string;
  responsible?: string;
  meetingId?: string;
  meetingTitle?: string;
  evidenceLink?: string;
  actionItems?: Array<{
    id: string;
    action: string;
    responsible: string;
    dueDate: string;
    status: string;
  }>;
  status?: string;
}

interface CalendarMilestoneItem {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  macroName: string;
  dueDate: string;
  status: string;
  assignee?: string;
  isCritical?: boolean;
}

const formatDateBR = (dateStr?: string) => {
  if (!dateStr) return 'Sem prazo';
  const clean = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return dateStr;
  const [y, m, d] = clean.split('-');
  return `${d}/${m}/${y}`;
};

const formatShortDateBR = (dateStr?: string) => {
  if (!dateStr) return '—';
  const clean = dateStr.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return dateStr;
  const [, m, d] = clean.split('-');
  return `${d}/${m}`;
};

const formatRelativeDate = (dateStr: string, todayStr: string) => {
  const clean = (dateStr || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(clean)) return 'Recente';
  if (clean === todayStr) return 'Hoje';
  const d1 = new Date(`${todayStr}T00:00:00`);
  const d2 = new Date(`${clean}T00:00:00`);
  const diffDays = Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 1) return 'Ontem';
  if (diffDays > 1 && diffDays <= 7) return `Há ${diffDays} dias`;
  return formatShortDateBR(clean);
};

const toISODateLocal = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getWeekBounds = (refDate: Date) => {
  const d = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate());
  const day = d.getDay(); // 0 = Sunday
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start,
    end,
    startStr: toISODateLocal(start),
    endStr: toISODateLocal(end)
  };
};

const isProjectRelevantToUser = (project: Project, currentUser: string | 'Todos', selectedProfile?: TeamMember | null) => {
  if (project.deleted) return false;
  if (
    currentUser === 'Todos' ||
    currentUser === 'Visão Geral da Equipe' ||
    selectedProfile?.isLeader ||
    selectedProfile?.isComiteGestor
  ) {
    return true;
  }
  if (isNameMatch(project.responsible, currentUser)) return true;
  if (Array.isArray(project.team) && project.team.some(member => isNameMatch(member, currentUser))) return true;
  const hasAssignedMicro = (project.macroActivities || []).some(macro =>
    (macro.microActivities || []).some(mic => isNameMatch(mic.assignee, currentUser))
  );
  return hasAssignedMicro;
};

const calculateProjectDualProgress = (project: Project) => {
  const allMacros = project.macroActivities || [];
  let totalMicros = 0;
  let completedMicros = 0;

  allMacros.forEach(macro => {
    (macro.microActivities || []).forEach(mic => {
      totalMicros++;
      const isDone =
        mic.status === 'Concluído e aprovado' ||
        mic.status === 'Concluído com restrições';
      if (isDone) completedMicros++;
    });
  });

  const operationalProgress = totalMicros > 0 ? Math.round((completedMicros / totalMicros) * 100) : 0;

  const activeTermsList: RegulatoryTermDefinition[] =
    project.regulatoryTerms && project.regulatoryTerms.length > 0
      ? project.regulatoryTerms
      : INITIAL_REGULATORY_TERMS;

  const mandatoryTerms = activeTermsList.filter(t => t.isActive !== false && t.isMandatory !== false);
  const totalMandatoryTerms = mandatoryTerms.length;

  let approvedMandatoryTerms = 0;
  mandatoryTerms.forEach(term => {
    const rec = (project.regulatoryDatabase || []).find(
      r => r.key === term.key || r.fieldKey === term.key
    );
    if (rec && (rec.status === 'validado' || rec.status === 'Validado')) {
      const rawVal = (rec.valueText || rec.value || '').trim();
      const cleanVal = rawVal.replace(/^\[(?:Validado|VALIDADO)\]\s*/i, '').trim();
      if (
        cleanVal.length > 0 &&
        cleanVal !== '—' &&
        cleanVal !== 'Pendente de validação' &&
        cleanVal !== 'Não preenchido'
      ) {
        approvedMandatoryTerms++;
      }
    }
  });

  const regulatoryProgress =
    totalMandatoryTerms > 0
      ? Math.round((approvedMandatoryTerms / totalMandatoryTerms) * 100)
      : null;

  return {
    operationalProgress: Math.min(100, Math.max(0, operationalProgress)),
    regulatoryProgress:
      regulatoryProgress !== null ? Math.min(100, Math.max(0, regulatoryProgress)) : null,
    totalMicros,
    completedMicros,
    totalMandatoryTerms,
    approvedMandatoryTerms
  };
};

export const VisaoGeral: React.FC<VisaoGeralProps> = ({
  tasks,
  projects,
  meetings = [],
  currentUser,
  selectedProfile,
  onEditTask,
  onViewTask,
  onSaveTask,
  onNavigateToProject,
  onNavigateToView,
  onOpenMeeting,
  onNewTask,
  onOpenTasksWithFilter
}) => {
  const todayStr = useMemo(() => toISODateLocal(new Date()), []);
  const next7DaysStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return toISODateLocal(d);
  }, []);

  // Calendário de acompanhamento: Dia | Semana | Mês | Ano
  const [calendarViewMode, setCalendarViewMode] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [calendarDate, setCalendarDate] = useState<Date>(() => new Date());
  const [selectedCalendarDateStr, setSelectedCalendarDateStr] = useState<string | null>(null);

  // Minha agenda regulatória: 3 abas
  const [agendaTab, setAgendaTab] = useState<'month' | 'week' | 'pending'>('month');

  // Modais de detalhamento e histórico
  const [notesModalTask, setNotesModalTask] = useState<Task | null>(null);
  const [selectedDecision, setSelectedDecision] = useState<UnifiedDecisionRecord | null>(null);
  const [isAllDecisionsModalOpen, setIsAllDecisionsModalOpen] = useState(false);
  const [historyModalTab, setHistoryModalTab] = useState<'tasks' | 'meetings' | null>(null);
  const [historySearch, setHistorySearch] = useState('');
  const [historyProjectFilter, setHistoryProjectFilter] = useState('Todos');

  // Períodos de Manutenção do Sistema no Calendário (sincronizado com Supabase app_config + cache local)
  const [maintenancePeriods, setMaintenancePeriods] = useState<MaintenancePeriod[]>(() => {
    try {
      const saved = localStorage.getItem('ctvacinas_maintenance_periods');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState<Partial<MaintenancePeriod> | null>(null);

  // Período de Início Real do Sistema (atividades anteriores ficam em laranja e fora dos indicadores)
  const [systemRealStartDate, setSystemRealStartDate] = useState<string>(() => {
    try {
      return localStorage.getItem('ctvacinas_system_real_start_date') || '';
    } catch {
      return '';
    }
  });
  const [systemRealStartNote, setSystemRealStartNote] = useState<string>(() => {
    try {
      return (
        localStorage.getItem('ctvacinas_system_real_start_note') ||
        'Criada antes do aplicativo estar 100% funcionando'
      );
    } catch {
      return 'Criada antes do aplicativo estar 100% funcionando';
    }
  });
  const [isSystemStartModalOpen, setIsSystemStartModalOpen] = useState(false);
  const [tempSystemStartDate, setTempSystemStartDate] = useState('');
  const [tempSystemStartNote, setTempSystemStartNote] = useState('');

  // Sincronização somente-leitura / configuração do calendário com app_config existente do Supabase
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
        }

        if (noteRes.found && typeof noteRes.value === 'string' && noteRes.value.trim()) {
          setSystemRealStartNote(noteRes.value);
          try {
            localStorage.setItem('ctvacinas_system_real_start_note', noteRes.value);
          } catch {}
        }
      } catch (e) {
        console.warn('Aviso ao sincronizar configurações do calendário:', e);
      }
    };
    syncCalendarConfigFromSupabase();
    const handleRemoteConfigUpdate = () => {
      try {
        const savedMaint = localStorage.getItem('ctvacinas_maintenance_periods');
        if (savedMaint) {
          const parsed = JSON.parse(savedMaint);
          if (Array.isArray(parsed)) setMaintenancePeriods(parsed);
        }
        const savedStart = localStorage.getItem('ctvacinas_system_real_start_date') || '';
        setSystemRealStartDate(savedStart);
        const savedNote = localStorage.getItem('ctvacinas_system_real_start_note');
        if (savedNote && savedNote.trim()) setSystemRealStartNote(savedNote);
      } catch {}
    };
    window.addEventListener('ctvacinas_app_config_updated', handleRemoteConfigUpdate);
    return () => {
      active = false;
      window.removeEventListener('ctvacinas_app_config_updated', handleRemoteConfigUpdate);
    };
  }, [currentUser]);

  const saveSystemRealStart = (dateVal: string, noteVal?: string) => {
    const cleanDate = dateVal.trim();
    const cleanNote =
      (noteVal ?? systemRealStartNote).trim() ||
      'Criada antes do aplicativo estar 100% funcionando';
    setSystemRealStartDate(cleanDate);
    setSystemRealStartNote(cleanNote);
    try {
      if (cleanDate) {
        localStorage.setItem('ctvacinas_system_real_start_date', cleanDate);
      } else {
        localStorage.removeItem('ctvacinas_system_real_start_date');
      }
      localStorage.setItem('ctvacinas_system_real_start_note', cleanNote);
    } catch {}
    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAppConfig('system_real_start_date', cleanDate, currentUser || 'Sistema').catch(() => {});
      SupabaseService.saveAppConfig('system_real_start_note', cleanNote, currentUser || 'Sistema').catch(() => {});
    }
  };

  const saveMaintenancePeriods = (updated: MaintenancePeriod[]) => {
    setMaintenancePeriods(updated);
    try {
      localStorage.setItem('ctvacinas_maintenance_periods', JSON.stringify(updated));
    } catch {}
    if (SupabaseService.isConfigured()) {
      SupabaseService.saveAppConfig('maintenance_periods', updated, currentUser || 'Sistema').catch(() => {});
    }
  };

  const getMaintenanceForDate = (dateStr: string) =>
    maintenancePeriods.filter(m => dateStr >= m.startDate && dateStr <= m.endDate);

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

  const getTaskEffectiveDateStr = (task: Task): string => {
    const candidates = [
      task.completionDate,
      task.plannedStartDate,
      task.requestDate,
      task.completedAt ? task.completedAt.slice(0, 10) : ''
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

  // ---------------------------------------------------------------------------
  // DADOS REAIS FILTRADOS PARA O USUÁRIO / PERFIL ATIVO
  // ---------------------------------------------------------------------------
  const userProjects = useMemo(() => {
    return projects.filter(p => isProjectRelevantToUser(p, currentUser, selectedProfile));
  }, [projects, currentUser, selectedProfile]);

  const userProjectIds = useMemo(() => new Set(userProjects.map(p => p.id)), [userProjects]);
  const userProjectNamesLower = useMemo(
    () => new Set(userProjects.map(p => p.name.trim().toLowerCase())),
    [userProjects]
  );

  const userTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.deleted) return false;
      if (currentUser === 'Todos' || currentUser === 'Visão Geral da Equipe') return true;
      const isLead = isNameMatch(t.projectLead, currentUser);
      const isCollab =
        Array.isArray(t.collaborators) && t.collaborators.some(c => isNameMatch(c, currentUser));
      const isReviewer = isNameMatch(t.currentReviewer, currentUser) || isNameMatch(t.reportReviewer, currentUser);
      const inManagedProject =
        Boolean(selectedProfile?.isLeader) &&
        Boolean(t.project && userProjectNamesLower.has(t.project.trim().toLowerCase()));
      return isLead || isCollab || isReviewer || inManagedProject;
    });
  }, [tasks, currentUser, selectedProfile, userProjectNamesLower]);

  // Atividades válidas para indicadores (respeita Início Real do Sistema se configurado)
  const effectiveUserTasks = useMemo(() => {
    if (!systemRealStartDate) return userTasks;
    return userTasks.filter(t => !isTaskBeforeSystemStart(t));
  }, [userTasks, systemRealStartDate]);

  const userMeetings = useMemo(() => {
    return (meetings || []).filter(m => {
      if (currentUser === 'Todos' || currentUser === 'Visão Geral da Equipe' || selectedProfile?.isComiteGestor) {
        return true;
      }
      const inProject = userProjectIds.has(m.projectId);
      const isMod = isNameMatch(m.moderator, currentUser);
      const isPart = Array.isArray(m.participants) && m.participants.some(p => isNameMatch(p, currentUser));
      const isOther = m.projectId === 'outros' || !m.projectId;
      return inProject || isMod || isPart || isOther;
    });
  }, [meetings, currentUser, selectedProfile, userProjectIds]);

  // Entregas / Marcos de projetos (microatividades reais com data de entrega)
  const projectMilestones = useMemo<CalendarMilestoneItem[]>(() => {
    const items: CalendarMilestoneItem[] = [];
    userProjects.forEach(proj => {
      (proj.macroActivities || []).forEach(macro => {
        (macro.microActivities || []).forEach(mic => {
          const due = (mic.dueDate || mic.realEndDate || '').slice(0, 10);
          if (!due || !/^\d{4}-\d{2}-\d{2}$/.test(due)) return;
          items.push({
            id: `${proj.id}_${macro.id}_${mic.id}`,
            title: mic.name,
            projectId: proj.id,
            projectName: proj.name,
            macroName: macro.name,
            dueDate: due,
            status: mic.status,
            assignee: mic.assignee,
            isCritical: mic.isCritical
          });
        });
      });
    });
    return items;
  }, [userProjects]);

  // Decisões e encaminhamentos reais consolidados de Projetos + Reuniões
  const unifiedDecisions = useMemo<UnifiedDecisionRecord[]>(() => {
    const list: UnifiedDecisionRecord[] = [];
    const seenIds = new Set<string>();

    // 1. Decisões estratégicas registradas nas macroatividades dos projetos
    userProjects.forEach(proj => {
      (proj.macroActivities || []).forEach(macro => {
        (macro.decisionsList || []).forEach(dec => {
          const text = (dec.decision || '').trim();
          const isResolved =
            text.length > 0 ||
            dec.status === 'Decidido' ||
            dec.status === 'Validado' ||
            dec.status === 'Aprovado';
          if (!isResolved) return;
          const id = `proj_dec_${proj.id}_${dec.id}`;
          if (seenIds.has(id)) return;
          seenIds.add(id);
          list.push({
            id,
            projectId: proj.id,
            projectName: proj.name,
            title: dec.question || dec.targetFieldLabel || 'Decisão técnica/regulatória',
            description: text || dec.question,
            justification: dec.justification,
            date: (dec.validatedAt || dec.date || todayStr).slice(0, 10),
            sourceType: 'project_decision',
            sourceLabel: `Projeto · ${macro.name}`,
            responsible: dec.responsible || dec.validatedBy,
            evidenceLink: dec.evidenceLink || dec.sharepointDocUrl || dec.sharepointLink,
            status: dec.status || 'Decidido'
          });
        });
      });

      // 2. Contribuições validadas para a base regulatória do projeto
      (proj.contributions || []).forEach(contrib => {
        const isValidated =
          contrib.status === 'Validado para a Base Regulatória' ||
          contrib.status === 'validada';
        if (!isValidated) return;
        const id = `proj_contrib_${proj.id}_${contrib.id}`;
        if (seenIds.has(id)) return;
        seenIds.add(id);
        list.push({
          id,
          projectId: proj.id,
          projectName: proj.name,
          title: contrib.title || 'Contribuição regulatória validada',
          description: contrib.content || contrib.title,
          justification: contrib.justification,
          date: (contrib.validatedAt || contrib.date || contrib.createdAt || todayStr).slice(0, 10),
          sourceType: 'contribution',
          sourceLabel: contrib.origin ? `${contrib.origin}${contrib.linkedMacroName ? ` · ${contrib.linkedMacroName}` : ''}` : 'Base Regulatória',
          responsible: contrib.author || contrib.validatedBy,
          evidenceLink: contrib.evidenceLink || contrib.link,
          status: 'Validado'
        });
      });
    });

    // 3. Decisões e encaminhamentos registrados nas pautas de Reuniões
    userMeetings.forEach(mtg => {
      const projObj = projects.find(p => p.id === mtg.projectId);
      const projName = projObj?.name || mtg.projectName || 'Outros Projetos';

      (mtg.agendaItems || []).forEach(ag => {
        const decText = (ag.decisions || '').trim();
        const actions = ag.actionItems || [];
        if (!decText && actions.length === 0) return;

        const id = `mtg_dec_${mtg.id}_${ag.id}`;
        if (seenIds.has(id)) return;
        seenIds.add(id);

        list.push({
          id,
          projectId: projObj?.id,
          projectName: projName,
          title: decText ? ag.title : `Encaminhamentos: ${ag.title}`,
          description:
            decText ||
            actions
              .map(a => a.action)
              .filter(Boolean)
              .join(' • '),
          justification: ag.regulatoryImpactDetails || ag.discussions || mtg.generalConclusions,
          date: (mtg.date || mtg.updatedAt || todayStr).slice(0, 10),
          sourceType: 'meeting_decision',
          sourceLabel: `Reunião · ${mtg.title}`,
          responsible: mtg.moderator,
          meetingId: mtg.id,
          meetingTitle: mtg.title,
          actionItems: actions.map(a => ({
            id: a.id,
            action: a.action,
            responsible: a.responsible,
            dueDate: a.dueDate,
            status: a.status
          })),
          status: ag.hasRegulatoryImpact ? 'Impacto Regulatório' : mtg.status
        });
      });
    });

    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [userProjects, userMeetings, projects, todayStr]);

  // ---------------------------------------------------------------------------
  // MÊS / SEMANA DE REFERÊNCIA (SINCRONIZADO COM O CALENDÁRIO)
  // ---------------------------------------------------------------------------
  const currentYear = calendarDate.getFullYear();
  const currentMonth = calendarDate.getMonth();
  const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  const currentMonthLabel = calendarDate.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  });
  const currentWeek = useMemo(() => getWeekBounds(new Date()), []);

  // Atividades do mês selecionado
  const monthTasks = useMemo(() => {
    return effectiveUserTasks.filter(t => {
      const effDate = getTaskEffectiveDateStr(t);
      const reqDate = (t.requestDate || '').slice(0, 10);
      const compAt = (t.completedAt || '').slice(0, 10);
      return (
        effDate.startsWith(monthPrefix) ||
        reqDate.startsWith(monthPrefix) ||
        compAt.startsWith(monthPrefix)
      );
    });
  }, [effectiveUserTasks, monthPrefix]);

  // Reuniões do mês selecionado
  const monthMeetings = useMemo(() => {
    return userMeetings
      .filter(m => (m.date || '').slice(0, 7) === monthPrefix && m.status !== 'Cancelada')
      .sort((a, b) => {
        const keyA = `${a.date || ''}T${a.time || '00:00'}`;
        const keyB = `${b.date || ''}T${b.time || '00:00'}`;
        return keyA.localeCompare(keyB);
      });
  }, [userMeetings, monthPrefix]);

  // ---------------------------------------------------------------------------
  // 1. INDICADORES SUPERIORES (5 KPIs 100% REAIS)
  // ---------------------------------------------------------------------------
  const topKpis = useMemo(() => {
    const activeProjectsCount = userProjects.filter(
      p => p.status === 'Ativo' || p.status === 'Em Planejamento'
    ).length;

    const monthTasksTotal = monthTasks.length;
    const monthTasksPending = monthTasks.filter(
      t => t.status !== 'Concluída' && t.status !== 'Não Aplicável'
    ).length;

    const monthMeetingsTotal = monthMeetings.length;
    const monthMeetingsCompleted = monthMeetings.filter(m => m.status === 'Concluída').length;
    const monthMeetingsScheduled = monthMeetings.filter(
      m => m.status === 'Agendada' || m.status === 'Em Andamento'
    ).length;

    const criticalPendingTasks = effectiveUserTasks.filter(t => {
      if (t.status === 'Concluída' || t.status === 'Não Aplicável') return false;
      const isOverdue = Boolean(t.completionDate && t.completionDate.slice(0, 10) < todayStr);
      return Boolean(t.isCritical) || t.priority === 'Urgente' || isOverdue;
    });

    const upcomingTasksCount = effectiveUserTasks.filter(t => {
      if (t.status === 'Concluída' || t.status === 'Não Aplicável') return false;
      const d = (t.completionDate || '').slice(0, 10);
      return Boolean(d && d >= todayStr && d <= next7DaysStr);
    }).length;

    const upcomingMeetingsCount = userMeetings.filter(m => {
      if (m.status === 'Concluída' || m.status === 'Cancelada') return false;
      const d = (m.date || '').slice(0, 10);
      return Boolean(d && d >= todayStr && d <= next7DaysStr);
    }).length;

    const upcomingMilestonesCount = projectMilestones.filter(ms => {
      const done = ms.status === 'Concluído e aprovado' || ms.status === 'Concluído com restrições';
      if (done) return false;
      return ms.dueDate >= todayStr && ms.dueDate <= next7DaysStr;
    }).length;

    return {
      activeProjectsCount,
      monthTasksTotal,
      monthTasksPending,
      monthMeetingsTotal,
      monthMeetingsCompleted,
      monthMeetingsScheduled,
      criticalPendingCount: criticalPendingTasks.length,
      upcomingDeadlinesCount: upcomingTasksCount + upcomingMeetingsCount + upcomingMilestonesCount
    };
  }, [userProjects, monthTasks, monthMeetings, effectiveUserTasks, userMeetings, projectMilestones, todayStr, next7DaysStr]);

  // ---------------------------------------------------------------------------
  // 2. CALENDÁRIO DE ACOMPANHAMENTO (MAPEAMENTO DE EVENTOS POR DATA)
  // ---------------------------------------------------------------------------
  const eventsByDate = useMemo(() => {
    const map: Record<
      string,
      {
        tasks: Task[];
        meetings: Meeting[];
        milestones: CalendarMilestoneItem[];
        decisions: UnifiedDecisionRecord[];
      }
    > = {};

    const ensureBucket = (dateKey: string) => {
      if (!map[dateKey]) {
        map[dateKey] = { tasks: [], meetings: [], milestones: [], decisions: [] };
      }
      return map[dateKey];
    };

    userTasks.forEach(t => {
      const dKey = getTaskEffectiveDateStr(t);
      if (!dKey) return;
      ensureBucket(dKey).tasks.push(t);
    });

    userMeetings.forEach(m => {
      if (m.status === 'Cancelada') return;
      const dKey = (m.date || '').slice(0, 10);
      if (!dKey || !/^\d{4}-\d{2}-\d{2}$/.test(dKey)) return;
      ensureBucket(dKey).meetings.push(m);
    });

    projectMilestones.forEach(ms => {
      ensureBucket(ms.dueDate).milestones.push(ms);
    });

    unifiedDecisions.forEach(dec => {
      const dKey = (dec.date || '').slice(0, 10);
      if (!dKey || !/^\d{4}-\d{2}-\d{2}$/.test(dKey)) return;
      ensureBucket(dKey).decisions.push(dec);
    });

    return map;
  }, [userTasks, userMeetings, projectMilestones, unifiedDecisions]);

  const monthDaysGrid = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr });
    }
    return cells;
  }, [currentYear, currentMonth]);

  const activeWeekDays = useMemo(() => {
    const { start } = getWeekBounds(calendarDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        date: d,
        dateStr: toISODateLocal(d),
        dayNum: d.getDate(),
        weekday: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'][i]
      };
    });
  }, [calendarDate]);

  const navigateCalendar = (direction: -1 | 1) => {
    if (calendarViewMode === 'day') {
      const next = new Date(calendarDate);
      next.setDate(next.getDate() + direction);
      setCalendarDate(next);
    } else if (calendarViewMode === 'week') {
      const next = new Date(calendarDate);
      next.setDate(next.getDate() + direction * 7);
      setCalendarDate(next);
    } else if (calendarViewMode === 'month') {
      setCalendarDate(new Date(currentYear, currentMonth + direction, 1));
    } else {
      setCalendarDate(new Date(currentYear + direction, currentMonth, 1));
    }
  };

  const getDayVisualState = (dateStr: string) => {
    const bucket = eventsByDate[dateStr];
    const maint = getMaintenanceForDate(dateStr);
    const hasMaintenance = maint.length > 0;
    const isPreStart = Boolean(systemRealStartDate && dateStr < systemRealStartDate);

    if (!bucket) {
      return {
        hasAny: false,
        hasMaintenance,
        isPreStart,
        status: hasMaintenance ? ('maintenance' as const) : ('empty' as const)
      };
    }

    const totalItems =
      bucket.tasks.length +
      bucket.meetings.length +
      bucket.milestones.length +
      bucket.decisions.length;

    const hasCriticalOrOverdue =
      bucket.tasks.some(
        t =>
          t.status !== 'Concluída' &&
          t.status !== 'Não Aplicável' &&
          (t.isCritical || t.priority === 'Urgente' || (t.completionDate && t.completionDate.slice(0, 10) < todayStr))
      ) ||
      bucket.milestones.some(
        ms =>
          ms.status !== 'Concluído e aprovado' &&
          ms.status !== 'Concluído com restrições' &&
          (ms.isCritical || ms.dueDate < todayStr)
      );

    const hasInProgress =
      bucket.tasks.some(t => t.status === 'Em Andamento') ||
      bucket.milestones.some(ms => ms.status === 'Em andamento');

    const hasPending =
      bucket.tasks.some(t => t.status === 'Planejada' || t.status === 'Pausado') ||
      bucket.meetings.some(m => m.status === 'Agendada') ||
      bucket.milestones.some(ms => ms.status === 'Planejado' || ms.status === 'A repetir / retrabalho');

    const allCompleted =
      totalItems > 0 &&
      !hasCriticalOrOverdue &&
      !hasInProgress &&
      !hasPending;

    let status: 'maintenance' | 'critical' | 'in_progress' | 'pending' | 'completed' | 'pre_start' | 'empty' = 'empty';
    if (hasMaintenance) status = 'maintenance';
    else if (hasCriticalOrOverdue) status = 'critical';
    else if (isPreStart && totalItems > 0) status = 'pre_start';
    else if (allCompleted) status = 'completed';
    else if (hasInProgress) status = 'in_progress';
    else if (hasPending) status = 'pending';

    return {
      hasAny: totalItems > 0,
      hasMaintenance,
      isPreStart,
      status
    };
  };

  // ---------------------------------------------------------------------------
  // 3. MINHA AGENDA REGULATÓRIA (DO MÊS | DA SEMANA | PENDÊNCIAS)
  // ---------------------------------------------------------------------------
  const agendaLists = useMemo(() => {
    const sortAgenda = (arr: Task[]) =>
      [...arr].sort((a, b) => {
        // Abertas primeiro
        const aDone = a.status === 'Concluída' ? 1 : 0;
        const bDone = b.status === 'Concluída' ? 1 : 0;
        if (aDone !== bDone) return aDone - bDone;

        // Críticas / Urgentes primeiro
        const aCrit = a.isCritical || a.priority === 'Urgente' ? 0 : 1;
        const bCrit = b.isCritical || b.priority === 'Urgente' ? 0 : 1;
        if (aCrit !== bCrit) return aCrit - bCrit;

        // Prazo mais próximo primeiro
        const da = (a.completionDate || '9999-12-31').slice(0, 10);
        const db = (b.completionDate || '9999-12-31').slice(0, 10);
        return da.localeCompare(db);
      });

    const ofMonth = sortAgenda(
      monthTasks.filter(t => t.status !== 'Não Aplicável')
    );

    const ofWeek = sortAgenda(
      effectiveUserTasks.filter(t => {
        if (t.status === 'Não Aplicável') return false;
        const d = getTaskEffectiveDateStr(t);
        return Boolean(d && d >= currentWeek.startStr && d <= currentWeek.endStr);
      })
    );

    const pending = sortAgenda(
      effectiveUserTasks.filter(t => {
        if (t.status === 'Concluída' || t.status === 'Não Aplicável') return false;
        const isOverdue = Boolean(t.completionDate && t.completionDate.slice(0, 10) < todayStr);
        return Boolean(t.isCritical) || t.priority === 'Urgente' || isOverdue || t.priority === 'Alta';
      })
    );

    return { ofMonth, ofWeek, pending };
  }, [monthTasks, effectiveUserTasks, currentWeek, todayStr]);

  const activeAgendaItems =
    agendaTab === 'month'
      ? agendaLists.ofMonth
      : agendaTab === 'week'
        ? agendaLists.ofWeek
        : agendaLists.pending;

  // ---------------------------------------------------------------------------
  // 4. STATUS DOS PROJETOS (PROGRESSO OPERACIONAL + REGULATÓRIO REAL)
  // ---------------------------------------------------------------------------
  const projectSummaryRows = useMemo(() => {
    return userProjects
      .map(project => ({
        project,
        ...calculateProjectDualProgress(project)
      }))
      .sort((a, b) => {
        const order = { Ativo: 0, 'Em Planejamento': 1, Suspenso: 2, Concluído: 3 };
        return (order[a.project.status] ?? 4) - (order[b.project.status] ?? 4);
      });
  }, [userProjects]);

  // ---------------------------------------------------------------------------
  // 5. REUNIÕES DO MÊS (PRÓXIMAS REUNIÕES)
  // ---------------------------------------------------------------------------
  const upcomingMonthMeetings = useMemo(() => {
    const scheduled = monthMeetings.filter(
      m => m.status === 'Agendada' || m.status === 'Em Andamento'
    );
    if (scheduled.length > 0) return scheduled.slice(0, 4);
    // Se não houver futuras no mês selecionado, exibe as mais recentes do mês para consulta rápida
    return [...monthMeetings].reverse().slice(0, 4);
  }, [monthMeetings]);

  // ---------------------------------------------------------------------------
  // 7. ATIVIDADES POR STATUS (MÊS SELECIONADO)
  // ---------------------------------------------------------------------------
  const statusBreakdown = useMemo(() => {
    let concluidas = 0;
    let emAndamento = 0;
    let emAnalise = 0;
    let atrasadas = 0;

    monthTasks.forEach(t => {
      if (t.status === 'Não Aplicável') return;
      if (t.status === 'Concluída') {
        concluidas++;
        return;
      }
      const isOverdue = Boolean(t.completionDate && t.completionDate.slice(0, 10) < todayStr);
      if (isOverdue) {
        atrasadas++;
        return;
      }
      const isUnderReview =
        t.status === 'Planejada' ||
        t.status === 'Pausado' ||
        t.regulatoryStatus === 'pending' ||
        (t.isReport && t.reportStage && !t.reportStage.startsWith('Concluído') && t.reportStage !== 'Em Elaboração');

      if (isUnderReview && t.status !== 'Em Andamento') {
        emAnalise++;
      } else if (t.status === 'Em Andamento') {
        emAndamento++;
      } else {
        emAnalise++;
      }
    });

    const total = concluidas + emAndamento + emAnalise + atrasadas;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

    return {
      total,
      items: [
        { key: 'concluidas', label: 'Concluídas', count: concluidas, pct: pct(concluidas), barClass: 'bg-emerald-500', textClass: 'text-emerald-700', dotClass: 'bg-emerald-500' },
        { key: 'andamento', label: 'Em andamento', count: emAndamento, pct: pct(emAndamento), barClass: 'bg-teal-500', textClass: 'text-teal-700', dotClass: 'bg-teal-500' },
        { key: 'analise', label: 'Em análise', count: emAnalise, pct: pct(emAnalise), barClass: 'bg-amber-400', textClass: 'text-amber-700', dotClass: 'bg-amber-400' },
        { key: 'atrasadas', label: 'Atrasadas', count: atrasadas, pct: pct(atrasadas), barClass: 'bg-rose-500', textClass: 'text-rose-700', dotClass: 'bg-rose-500' }
      ]
    };
  }, [monthTasks, todayStr]);

  // ---------------------------------------------------------------------------
  // 8. HISTÓRICO E REGISTROS (ATIVIDADES E REUNIÕES FINALIZADAS)
  // ---------------------------------------------------------------------------
  const finalizedTasks = useMemo(() => {
    return userTasks
      .filter(t => t.status === 'Concluída')
      .sort((a, b) => {
        const da = (a.completedAt || a.completionDate || '').slice(0, 10);
        const db = (b.completedAt || b.completionDate || '').slice(0, 10);
        return db.localeCompare(da);
      });
  }, [userTasks]);

  const finalizedMeetings = useMemo(() => {
    return userMeetings
      .filter(m => m.status === 'Concluída')
      .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [userMeetings]);

  const filteredHistoryTasks = useMemo(() => {
    return finalizedTasks.filter(t => {
      if (historyProjectFilter !== 'Todos' && (t.project || 'Geral') !== historyProjectFilter) {
        return false;
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const match =
          t.activity.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t.project || '').toLowerCase().includes(q) ||
          (t.updates || []).some(u => (u.note || '').toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });
  }, [finalizedTasks, historyProjectFilter, historySearch]);

  const filteredHistoryMeetings = useMemo(() => {
    return finalizedMeetings.filter(m => {
      const pName = projects.find(p => p.id === m.projectId)?.name || m.projectName || 'Outros Projetos';
      if (historyProjectFilter !== 'Todos' && pName !== historyProjectFilter) {
        return false;
      }
      if (historySearch.trim()) {
        const q = historySearch.toLowerCase();
        const match =
          m.title.toLowerCase().includes(q) ||
          pName.toLowerCase().includes(q) ||
          (m.freeNotes || '').toLowerCase().includes(q) ||
          (m.generalConclusions || '').toLowerCase().includes(q) ||
          (m.agendaItems || []).some(
            ag =>
              (ag.title || '').toLowerCase().includes(q) ||
              (ag.decisions || '').toLowerCase().includes(q)
          );
        if (!match) return false;
      }
      return true;
    });
  }, [finalizedMeetings, historyProjectFilter, historySearch, projects]);

  const historyProjectOptions = useMemo(() => {
    const names = new Set<string>();
    finalizedTasks.forEach(t => names.add(t.project || 'Geral'));
    finalizedMeetings.forEach(m => {
      const pName = projects.find(p => p.id === m.projectId)?.name || m.projectName || 'Outros Projetos';
      names.add(pName);
    });
    return Array.from(names).sort();
  }, [finalizedTasks, finalizedMeetings, projects]);

  const handleToggleTaskDone = (task: Task) => {
    const isNowDone = task.status !== 'Concluída';
    onSaveTask({
      ...task,
      status: isNowDone ? 'Concluída' : 'Em Andamento',
      progress: isNowDone ? 100 : Math.min(task.progress || 50, 90),
      completedAt: isNowDone ? new Date().toISOString() : undefined
    });
  };

  const handleSaveTaskFromNotes = (updatedTask: Task) => {
    onSaveTask(updatedTask);
    setNotesModalTask(updatedTask);
  };

  const getPriorityBadgeStyle = (task: Task) => {
    const isOverdue =
      task.status !== 'Concluída' &&
      Boolean(task.completionDate && task.completionDate.slice(0, 10) < todayStr);
    if (task.isCritical || task.priority === 'Urgente' || isOverdue) {
      return {
        label: isOverdue ? 'Atrasada' : 'Crítica',
        className: 'bg-rose-50 text-rose-700 border-rose-200/80'
      };
    }
    if (task.priority === 'Alta') {
      return { label: 'Alta', className: 'bg-orange-50 text-orange-700 border-orange-200/80' };
    }
    if (task.priority === 'Média') {
      return { label: 'Média', className: 'bg-amber-50 text-amber-700 border-amber-200/80' };
    }
    if (task.priority === 'Baixa') {
      return { label: 'Baixa', className: 'bg-sky-50 text-sky-700 border-sky-200/80' };
    }
    return { label: 'Normal', className: 'bg-slate-100 text-slate-600 border-slate-200/80' };
  };

  const getProjectStatusBadge = (status: Project['status']) => {
    if (status === 'Concluído') {
      return { label: 'Concluído', className: 'bg-emerald-50 text-emerald-700 border-emerald-200/80' };
    }
    if (status === 'Ativo') {
      return { label: 'Em andamento', className: 'bg-sky-50 text-sky-700 border-sky-200/80' };
    }
    if (status === 'Suspenso') {
      return { label: 'Suspenso', className: 'bg-rose-50 text-rose-700 border-rose-200/80' };
    }
    return { label: 'Planejamento', className: 'bg-amber-50 text-amber-700 border-amber-200/80' };
  };

  const selectedDayBucket = selectedCalendarDateStr ? eventsByDate[selectedCalendarDateStr] : null;
  const selectedDayMaint = selectedCalendarDateStr
    ? getMaintenanceForDate(selectedCalendarDateStr)
    : [];

  return (
    <div className="space-y-5 pb-10">
      {/* =====================================================================
          CABEÇALHO DA VISÃO GERAL REGULATÓRIA
          ===================================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Visão Geral Regulatória
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Acompanhe seus projetos, atividades, reuniões, pendências e principais decisões.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center bg-white border border-slate-200/90 rounded-xl p-1 shadow-2xs">
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(currentYear, currentMonth - 1, 1))}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Mês anterior"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="px-2.5 text-xs font-semibold text-slate-700 capitalize whitespace-nowrap tabular-nums">
              {currentMonthLabel}
            </span>
            <button
              type="button"
              onClick={() => setCalendarDate(new Date(currentYear, currentMonth + 1, 1))}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
              title="Próximo mês"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setTempSystemStartDate(systemRealStartDate);
              setTempSystemStartNote(systemRealStartNote);
              setIsSystemStartModalOpen(true);
            }}
            className={`px-3 py-2 rounded-xl border text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              systemRealStartDate
                ? 'bg-orange-50 border-orange-200 text-orange-800 hover:bg-orange-100'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            title="Configurar data de início real do sistema"
          >
            <Flag size={13} className={systemRealStartDate ? 'text-orange-600' : 'text-slate-400'} />
            <span>{systemRealStartDate ? `Início: ${formatShortDateBR(systemRealStartDate)}` : 'Início real'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingMaintenance({
                title: '',
                startDate: todayStr,
                endDate: todayStr,
                description: '',
                status: 'Programada',
                impactLevel: 'Indisponibilidade Total'
              });
              setIsMaintenanceModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl border border-amber-200 bg-amber-50/70 hover:bg-amber-100 text-amber-800 text-xs font-semibold transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="Gerenciar períodos de manutenção do sistema"
          >
            <Wrench size={13} className="text-amber-600" />
            <span>Manutenção{maintenancePeriods.length > 0 ? ` (${maintenancePeriods.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          1. INDICADORES SUPERIORES (5 CARDS)
          ===================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Projetos ativos */}
        <button
          type="button"
          onClick={() => onNavigateToView?.('projects')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 text-left hover:border-emerald-300 hover:shadow-xs transition group"
        >
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition">
            <FolderKanban size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Projetos ativos</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">
              {topKpis.activeProjectsCount}
            </p>
            <p className="text-[11px] text-slate-400 truncate mt-0.5">
              {userProjects.length} no total
            </p>
          </div>
        </button>

        {/* 2. Atividades do mês */}
        <button
          type="button"
          onClick={() => {
            if (onOpenTasksWithFilter) onOpenTasksWithFilter('month');
            else setAgendaTab('month');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 text-left hover:border-teal-300 hover:shadow-xs transition group"
        >
          <div className="w-11 h-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 group-hover:bg-teal-100 transition">
            <CheckCircle2 size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Atividades do mês</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">
              {topKpis.monthTasksTotal}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 tabular-nums">
              ({topKpis.monthTasksPending} pendentes)
            </p>
          </div>
        </button>

        {/* 3. Reuniões do mês */}
        <button
          type="button"
          onClick={() => onOpenMeeting?.(undefined, 'previstas')}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 text-left hover:border-blue-300 hover:shadow-xs transition group"
        >
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition">
            <CalendarIcon size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Reuniões do mês</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">
              {topKpis.monthMeetingsTotal}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5 tabular-nums">
              ({topKpis.monthMeetingsCompleted} realizadas)
            </p>
          </div>
        </button>

        {/* 4. Pendências críticas */}
        <button
          type="button"
          onClick={() => {
            if (onOpenTasksWithFilter) onOpenTasksWithFilter('pending');
            else setAgendaTab('pending');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 text-left hover:border-rose-300 hover:shadow-xs transition group"
        >
          <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 group-hover:bg-rose-100 transition">
            <AlertTriangle size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Pendências críticas</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">
              {topKpis.criticalPendingCount}
            </p>
            <p className="text-[11px] text-rose-600/80 truncate mt-0.5">
              {topKpis.criticalPendingCount > 0 ? 'Exigem atenção' : 'Tudo sob controle'}
            </p>
          </div>
        </button>

        {/* 5. Próximos prazos */}
        <button
          type="button"
          onClick={() => {
            if (onOpenTasksWithFilter) onOpenTasksWithFilter('week');
            else setAgendaTab('week');
          }}
          className="bg-white rounded-2xl border border-slate-200/80 p-4 flex items-center gap-3.5 text-left hover:border-amber-300 hover:shadow-xs transition group"
        >
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-100 transition">
            <Clock size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 truncate">Próximos prazos</p>
            <p className="text-2xl font-bold text-slate-900 tabular-nums leading-tight mt-0.5">
              {topKpis.upcomingDeadlinesCount}
            </p>
            <p className="text-[11px] text-slate-500 truncate mt-0.5">
              (nos próximos 7 dias)
            </p>
          </div>
        </button>
      </div>

      {/* =====================================================================
          2 & 3. CALENDÁRIO DE ACOMPANHAMENTO + MINHA AGENDA REGULATÓRIA
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CALENDÁRIO DE ACOMPANHAMENTO */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between">
          <div>
            {/* Barra superior do calendário */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <CalendarIcon size={17} className="text-teal-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Calendário de acompanhamento
                </h2>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-slate-600 capitalize tabular-nums">
                  {calendarViewMode === 'year'
                    ? String(currentYear)
                    : calendarViewMode === 'day'
                      ? formatDateBR(toISODateLocal(calendarDate))
                      : currentMonthLabel}
                </span>

                <div className="inline-flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => navigateCalendar(-1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition"
                    title="Anterior"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarDate(new Date())}
                    className="px-2.5 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition whitespace-nowrap"
                  >
                    Hoje
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateCalendar(1)}
                    className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 flex items-center justify-center transition"
                    title="Próximo"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            </div>

            {/* Seletor de visualização: Dia | Semana | Mês | Ano */}
            <div className="flex justify-center mb-4">
              <div className="inline-flex items-center bg-slate-100 p-1 rounded-xl gap-0.5">
                {(
                  [
                    { id: 'day', label: 'Dia' },
                    { id: 'week', label: 'Semana' },
                    { id: 'month', label: 'Mês' },
                    { id: 'year', label: 'Ano' }
                  ] as const
                ).map(mode => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCalendarViewMode(mode.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                      calendarViewMode === mode.id
                        ? 'bg-teal-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>

            {/* MODO MÊS */}
            {calendarViewMode === 'month' && (
              <div>
                <div className="grid grid-cols-7 gap-1.5 mb-1.5">
                  {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(dow => (
                    <div
                      key={dow}
                      className="text-center text-[10px] font-semibold text-slate-400 tracking-wider py-1"
                    >
                      {dow}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1.5">
                  {monthDaysGrid.map((cell, idx) => {
                    if (!cell.dateStr || cell.day === null) {
                      return <div key={`empty_${idx}`} className="h-14 rounded-xl bg-transparent" />;
                    }
                    const dateStr = cell.dateStr;
                    const bucket = eventsByDate[dateStr];
                    const visual = getDayVisualState(dateStr);
                    const isToday = dateStr === todayStr;

                    let cellBg = 'bg-slate-50/40 border-slate-100 hover:border-slate-300';
                    if (visual.status === 'maintenance') {
                      cellBg = 'bg-orange-50/95 border-orange-300/90 hover:border-orange-400';
                    } else if (visual.status === 'critical') {
                      cellBg = 'bg-rose-50/80 border-rose-300 hover:border-rose-400';
                    } else if (visual.status === 'pre_start') {
                      cellBg = 'bg-orange-50/60 border-orange-200 hover:border-orange-300';
                    } else if (visual.status === 'completed') {
                      cellBg = 'bg-emerald-50/75 border-emerald-300/80 hover:border-emerald-400';
                    } else if (visual.status === 'in_progress') {
                      cellBg = 'bg-amber-50/60 border-amber-200/90 hover:border-amber-300';
                    } else if (visual.status === 'pending') {
                      cellBg = 'bg-amber-50/40 border-amber-200/70 hover:border-amber-300';
                    }

                    const hasTasks = Boolean(bucket && bucket.tasks.length > 0);
                    const hasMilestones = Boolean(bucket && bucket.milestones.length > 0);
                    const hasMeetings = Boolean(bucket && bucket.meetings.length > 0);
                    const hasDecisions = Boolean(bucket && bucket.decisions.length > 0);

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedCalendarDateStr(dateStr)}
                        className={`h-14 rounded-xl border p-1.5 flex flex-col items-center justify-between transition relative ${cellBg} ${
                          isToday ? 'ring-2 ring-teal-500 ring-offset-1' : ''
                        }`}
                        title={
                          visual.hasMaintenance
                            ? 'Manutenção — sistema indisponível'
                            : `Ver registros de ${formatDateBR(dateStr)}`
                        }
                      >
                        <div className="w-full flex items-center justify-between">
                          {visual.status === 'critical' ? (
                            <AlertTriangle size={10} className="text-rose-500 shrink-0" />
                          ) : (
                            <span className="w-2.5" />
                          )}
                          <span
                            className={`text-xs font-semibold tabular-nums leading-none ${
                              isToday
                                ? 'text-teal-700 font-bold'
                                : visual.hasMaintenance
                                  ? 'text-orange-800'
                                  : 'text-slate-700'
                            }`}
                          >
                            {cell.day}
                          </span>
                          {visual.hasMaintenance ? (
                            <Wrench size={10} className="text-orange-500 shrink-0" />
                          ) : (
                            <span className="w-2.5" />
                          )}
                        </div>

                        {/* Marcadores distintos por tipo de evento */}
                        <div className="flex items-center justify-center gap-1 min-h-[8px]">
                          {hasTasks && (
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" title="Atividade" />
                          )}
                          {hasMilestones && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="Entrega / Marco" />
                          )}
                          {hasMeetings && (
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" title="Reunião" />
                          )}
                          {hasDecisions && (
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" title="Decisão" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* MODO SEMANA */}
            {calendarViewMode === 'week' && (
              <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
                {activeWeekDays.map(dayObj => {
                  const bucket = eventsByDate[dayObj.dateStr];
                  const visual = getDayVisualState(dayObj.dateStr);
                  const isToday = dayObj.dateStr === todayStr;

                  return (
                    <button
                      key={dayObj.dateStr}
                      type="button"
                      onClick={() => setSelectedCalendarDateStr(dayObj.dateStr)}
                      className={`min-h-[140px] rounded-xl border p-2.5 flex flex-col items-start justify-between text-left transition ${
                        visual.hasMaintenance
                          ? 'bg-orange-50/90 border-orange-300'
                          : visual.status === 'critical'
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-slate-50/50 border-slate-200 hover:border-teal-300'
                      } ${isToday ? 'ring-2 ring-teal-500' : ''}`}
                    >
                      <div className="w-full flex items-center justify-between border-b border-slate-200/70 pb-1.5 mb-1.5">
                        <div>
                          <span className="text-[10px] font-semibold text-slate-400 block">
                            {dayObj.weekday}
                          </span>
                          <span className="text-sm font-bold text-slate-800 tabular-nums">
                            {dayObj.dayNum}
                          </span>
                        </div>
                        {visual.hasMaintenance && <Wrench size={12} className="text-orange-600" />}
                      </div>

                      <div className="space-y-1 w-full flex-1">
                        {visual.hasMaintenance && (
                          <p className="text-[10px] font-semibold text-orange-700 leading-tight">
                            Manutenção
                          </p>
                        )}
                        {(bucket?.tasks || []).slice(0, 2).map(t => (
                          <div key={t.id} className="text-[10px] text-slate-700 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            <span className="truncate">{t.activity}</span>
                          </div>
                        ))}
                        {(bucket?.meetings || []).slice(0, 2).map(m => (
                          <div key={m.id} className="text-[10px] text-purple-800 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0" />
                            <span className="truncate">{m.title}</span>
                          </div>
                        ))}
                        {(bucket?.milestones || []).slice(0, 1).map(ms => (
                          <div key={ms.id} className="text-[10px] text-blue-800 truncate flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                            <span className="truncate">{ms.title}</span>
                          </div>
                        ))}
                        {!bucket && !visual.hasMaintenance && (
                          <span className="text-[10px] text-slate-400">Sem registros</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* MODO DIA */}
            {calendarViewMode === 'day' && (() => {
              const dStr = toISODateLocal(calendarDate);
              const bucket = eventsByDate[dStr];
              const maint = getMaintenanceForDate(dStr);
              return (
                <div className="space-y-3 border border-slate-200/80 rounded-xl p-4 bg-slate-50/40">
                  {maint.length > 0 && (
                    <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 flex items-center gap-2.5 text-xs text-orange-800">
                      <Wrench size={15} className="text-orange-600 shrink-0" />
                      <div>
                        <p className="font-semibold">Manutenção — sistema indisponível</p>
                        <p className="text-[11px] text-orange-700">
                          {maint.map(m => m.title).join(', ')} · A ausência de registros neste período não indica falta de acompanhamento.
                        </p>
                      </div>
                    </div>
                  )}

                  {bucket && (bucket.tasks.length + bucket.meetings.length + bucket.milestones.length + bucket.decisions.length) > 0 ? (
                    <div className="space-y-2.5">
                      {bucket.tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={() => onViewTask(t)}
                          className="p-3 rounded-xl bg-white border border-slate-200 hover:border-teal-300 cursor-pointer flex items-center justify-between gap-3 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{t.activity}</p>
                            <p className="text-[11px] text-slate-500 truncate">
                              Atividade · {t.project || 'Geral'} · {t.status}
                            </p>
                          </div>
                          <Eye size={14} className="text-slate-400 shrink-0" />
                        </div>
                      ))}
                      {bucket.meetings.map(m => (
                        <div
                          key={m.id}
                          onClick={() => onOpenMeeting?.(m.id)}
                          className="p-3 rounded-xl bg-white border border-purple-200/80 hover:border-purple-400 cursor-pointer flex items-center justify-between gap-3 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{m.title}</p>
                            <p className="text-[11px] text-purple-700 truncate">
                              Reunião · {m.time || 'Horário a definir'} · {m.status}
                            </p>
                          </div>
                          <ArrowRight size={14} className="text-purple-500 shrink-0" />
                        </div>
                      ))}
                      {bucket.milestones.map(ms => (
                        <div
                          key={ms.id}
                          onClick={() => onNavigateToProject?.(ms.projectId)}
                          className="p-3 rounded-xl bg-white border border-blue-200/80 hover:border-blue-400 cursor-pointer flex items-center justify-between gap-3 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{ms.title}</p>
                            <p className="text-[11px] text-blue-700 truncate">
                              Entrega/Marco · {ms.projectName} · {ms.status}
                            </p>
                          </div>
                          <ArrowRight size={14} className="text-blue-500 shrink-0" />
                        </div>
                      ))}
                      {bucket.decisions.map(dec => (
                        <div
                          key={dec.id}
                          onClick={() => setSelectedDecision(dec)}
                          className="p-3 rounded-xl bg-white border border-indigo-200/80 hover:border-indigo-400 cursor-pointer flex items-center justify-between gap-3 transition"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-900 truncate">{dec.title}</p>
                            <p className="text-[11px] text-indigo-700 truncate">
                              Decisão · {dec.projectName}
                            </p>
                          </div>
                          <Eye size={14} className="text-indigo-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-10 text-center text-xs text-slate-400">
                      Nenhum registro encontrado para {formatDateBR(dStr)}.
                    </div>
                  )}
                </div>
              );
            })()}

            {/* MODO ANO */}
            {calendarViewMode === 'year' && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {Array.from({ length: 12 }, (_, mIdx) => {
                  const prefix = `${currentYear}-${String(mIdx + 1).padStart(2, '0')}`;
                  let countTasks = 0;
                  let countMeetings = 0;
                  let hasMaint = false;

                  Object.entries(eventsByDate).forEach(([dKey, b]) => {
                    if (dKey.startsWith(prefix)) {
                      countTasks += b.tasks.length + b.milestones.length;
                      countMeetings += b.meetings.length;
                    }
                  });
                  maintenancePeriods.forEach(mp => {
                    if (mp.startDate.slice(0, 7) <= prefix && mp.endDate.slice(0, 7) >= prefix) {
                      hasMaint = true;
                    }
                  });

                  const mName = new Date(currentYear, mIdx, 1).toLocaleDateString('pt-BR', {
                    month: 'short'
                  });
                  const isSelectedMonth = mIdx === currentMonth;

                  return (
                    <button
                      key={mIdx}
                      type="button"
                      onClick={() => {
                        setCalendarDate(new Date(currentYear, mIdx, 1));
                        setCalendarViewMode('month');
                      }}
                      className={`p-3 rounded-xl border text-left transition ${
                        isSelectedMonth
                          ? 'bg-teal-50/70 border-teal-400'
                          : hasMaint
                            ? 'bg-orange-50/50 border-orange-200 hover:border-orange-300'
                            : 'bg-slate-50/50 border-slate-200 hover:border-teal-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 capitalize">{mName}</span>
                        {hasMaint && <Wrench size={11} className="text-orange-500" />}
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5 tabular-nums">
                        {countTasks} ativ. · {countMeetings} reun.
                      </p>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Legenda permanente compacta abaixo do calendário */}
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] text-slate-600">
            <div>
              <p className="font-semibold text-slate-700 mb-1.5">Marcadores de eventos</p>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" /> Atividade
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" /> Entrega/Marco
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-purple-500" /> Reunião
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" /> Decisão
                </span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-slate-700 mb-1.5">Status do dia</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-emerald-400 bg-emerald-50" /> Concluída
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-amber-300 bg-amber-50" /> Em andamento / Pendente
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded border border-rose-400 bg-rose-50" /> Crítica / Atraso
                </span>
                <span className="inline-flex items-center gap-1.5 text-orange-800 font-medium">
                  <span className="w-3.5 h-3.5 rounded border border-orange-300 bg-orange-100 inline-flex items-center justify-center">
                    <Wrench size={9} className="text-orange-600" />
                  </span>
                  Manutenção — sistema indisponível
                </span>
                {systemRealStartDate && (
                  <span className="inline-flex items-center gap-1.5 text-orange-700">
                    <span className="w-2.5 h-2.5 rounded border border-orange-300 bg-orange-50" /> Pré-início ({formatShortDateBR(systemRealStartDate)})
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* MINHA AGENDA REGULATÓRIA */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <ListChecks size={17} className="text-teal-600 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                Minha agenda regulatória
              </h2>
            </div>

            {onNewTask && (
              <button
                type="button"
                onClick={onNewTask}
                className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/80 text-xs font-semibold transition flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                <Plus size={13} /> Nova atividade
              </button>
            )}
          </div>

          {/* 3 Abas: Do mês | Da semana | Pendências */}
          <div className="flex items-center gap-4 border-b border-slate-200/80 mb-3">
            {(
              [
                { id: 'month', label: 'Do mês', count: agendaLists.ofMonth.length },
                { id: 'week', label: 'Da semana', count: agendaLists.ofWeek.length },
                { id: 'pending', label: 'Pendências', count: agendaLists.pending.length }
              ] as const
            ).map(tab => {
              const active = agendaTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAgendaTab(tab.id)}
                  className={`pb-2.5 text-xs font-semibold transition border-b-2 whitespace-nowrap tabular-nums ${
                    active
                      ? 'border-teal-600 text-teal-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              );
            })}
          </div>

          {/* Lista de atividades da agenda */}
          <div className="flex-1 divide-y divide-slate-100 overflow-y-auto max-h-[380px] pr-0.5 custom-scrollbar">
            {activeAgendaItems.slice(0, 12).map(task => {
              const prio = getPriorityBadgeStyle(task);
              const isDone = task.status === 'Concluída';
              const isReg = Boolean(task.isRegulatoryContribution || task.generatesRegulatoryContent);
              const matchedProj = projects.find(
                p => p.name.trim().toLowerCase() === (task.project || '').trim().toLowerCase()
              );

              return (
                <div
                  key={task.id}
                  className="py-2.5 flex items-center justify-between gap-2.5 group hover:bg-slate-50/70 px-1.5 rounded-lg transition"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleToggleTaskDone(task)}
                      className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 transition ${
                        isDone
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 hover:border-teal-500 bg-white'
                      }`}
                      title={isDone ? 'Reabrir atividade' : 'Marcar como concluída'}
                    >
                      {isDone && <Check size={10} />}
                    </button>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onViewTask(task)}
                        className={`text-xs font-semibold text-left block truncate w-full transition ${
                          isDone
                            ? 'line-through text-slate-400'
                            : 'text-slate-800 hover:text-teal-700'
                        }`}
                        title={task.activity}
                      >
                        {task.activity}
                      </button>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-[11px] text-slate-500 mt-0.5">
                        {matchedProj && onNavigateToProject ? (
                          <button
                            type="button"
                            onClick={() => onNavigateToProject(matchedProj.id)}
                            className="hover:text-teal-700 hover:underline truncate max-w-[165px]"
                          >
                            Projeto: {matchedProj.name}
                          </button>
                        ) : (
                          <span className="truncate max-w-[165px]">
                            Projeto: {task.project || 'Geral'}
                          </span>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{task.status}</span>
                        {isReg && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-teal-700 font-medium inline-flex items-center gap-0.5">
                              <ShieldCheck size={11} /> Regulatória
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] text-slate-500 tabular-nums hidden sm:inline-flex items-center gap-1 whitespace-nowrap">
                      <CalendarIcon size={11} className="text-slate-400" />
                      {formatShortDateBR(task.completionDate)}
                    </span>

                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${prio.className}`}
                    >
                      {prio.label}
                    </span>

                    <button
                      type="button"
                      onClick={() => onViewTask(task)}
                      className="p-1 rounded-lg text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition"
                      title="Visualizar detalhes"
                    >
                      <Eye size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEditTask(task)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
                      title="Editar atividade"
                    >
                      <Edit2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}

            {activeAgendaItems.length === 0 && (
              <div className="py-12 text-center space-y-1.5">
                <CheckCircle size={28} className="mx-auto text-emerald-400" />
                <p className="text-xs font-semibold text-slate-600">
                  Nenhuma atividade nesta aba.
                </p>
                <p className="text-[11px] text-slate-400">
                  As atividades registradas aparecerão aqui automaticamente.
                </p>
              </div>
            )}
          </div>

          {activeAgendaItems.length > 0 && onOpenTasksWithFilter && (
            <div className="pt-3 mt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  onOpenTasksWithFilter(
                    agendaTab === 'month' ? 'month' : agendaTab === 'week' ? 'week' : 'pending'
                  )
                }
                className="text-xs font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1 transition"
              >
                Abrir em Atividades <ArrowRight size={13} />
              </button>
            </div>
          )}
        </section>
      </div>

      {/* =====================================================================
          4 & 5. STATUS DOS PROJETOS (REGULATÓRIO) + REUNIÕES DO MÊS
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* STATUS DOS PROJETOS */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <FolderKanban size={17} className="text-teal-600 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Status dos projetos (Regulatório)
              </h2>
            </div>

            {onNavigateToView && (
              <button
                type="button"
                onClick={() => onNavigateToView('projects')}
                className="text-xs font-semibold text-slate-500 hover:text-teal-700 inline-flex items-center gap-1 transition whitespace-nowrap"
              >
                Ver todos <ArrowRight size={13} />
              </button>
            )}
          </div>

          {projectSummaryRows.length > 0 ? (
            <div className="w-full">
              <table className="w-full table-fixed text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-500">
                    <th className="pb-2.5 pr-3 w-[34%]">Projeto</th>
                    <th className="pb-2.5 px-2 w-[24%]">Progresso Operacional</th>
                    <th className="pb-2.5 px-2 w-[24%]">Progresso Regulatório</th>
                    <th className="pb-2.5 pl-2 w-[18%] text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {projectSummaryRows.slice(0, 6).map(row => {
                    const statusBadge = getProjectStatusBadge(row.project.status);
                    return (
                      <tr
                        key={row.project.id}
                        onClick={() => onNavigateToProject?.(row.project.id)}
                        className="hover:bg-slate-50/80 transition cursor-pointer group"
                      >
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-slate-800 group-hover:text-teal-700 truncate transition">
                            {row.project.name}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate tabular-nums">
                            {row.completedMicros}/{row.totalMicros} atividades · {row.approvedMandatoryTerms}/{row.totalMandatoryTerms} termos
                          </p>
                        </td>

                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${row.operationalProgress}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 tabular-nums w-8 text-right shrink-0">
                              {row.operationalProgress}%
                            </span>
                          </div>
                        </td>

                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-teal-600 rounded-full"
                                style={{ width: `${row.regulatoryProgress ?? 0}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 tabular-nums w-8 text-right shrink-0">
                              {row.regulatoryProgress !== null ? `${row.regulatoryProgress}%` : '—'}
                            </span>
                          </div>
                        </td>

                        <td className="py-3 pl-2 text-right">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              Nenhum projeto vinculado ao perfil atual.
            </div>
          )}
        </section>

        {/* REUNIÕES DO MÊS */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col">
          <div className="flex items-center justify-between gap-2 mb-3.5">
            <div className="flex items-center gap-2">
              <Users size={17} className="text-blue-600 shrink-0" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Reuniões do mês
              </h2>
            </div>

            <button
              type="button"
              onClick={() => onOpenMeeting?.(undefined, 'previstas')}
              className="text-xs font-semibold text-slate-500 hover:text-teal-700 inline-flex items-center gap-1 transition whitespace-nowrap"
            >
              Ver todas <ArrowRight size={13} />
            </button>
          </div>

          {/* 3 indicadores resumidos do mês */}
          <div className="grid grid-cols-3 gap-2 pb-3.5 mb-3 border-b border-slate-100">
            <div className="bg-slate-50/80 rounded-xl p-2.5 text-center">
              <p className="text-[11px] text-slate-500">Total</p>
              <p className="text-lg font-bold text-slate-900 tabular-nums">
                {topKpis.monthMeetingsTotal}
              </p>
            </div>
            <div className="bg-emerald-50/60 rounded-xl p-2.5 text-center">
              <p className="text-[11px] text-emerald-700">Realizadas</p>
              <p className="text-lg font-bold text-emerald-800 tabular-nums">
                {topKpis.monthMeetingsCompleted}
              </p>
            </div>
            <div className="bg-blue-50/60 rounded-xl p-2.5 text-center">
              <p className="text-[11px] text-blue-700">Programadas</p>
              <p className="text-lg font-bold text-blue-800 tabular-nums">
                {topKpis.monthMeetingsScheduled}
              </p>
            </div>
          </div>

          <p className="text-[11px] font-semibold text-slate-500 mb-2">
            Próximas reuniões e registros do mês
          </p>

          <div className="space-y-2 flex-1">
            {upcomingMonthMeetings.map(mtg => {
              const pName =
                projects.find(p => p.id === mtg.projectId)?.name ||
                mtg.projectName ||
                'Outros Projetos';
              return (
                <button
                  key={mtg.id}
                  type="button"
                  onClick={() => onOpenMeeting?.(mtg.id)}
                  className="w-full p-2.5 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition flex items-center justify-between gap-3 text-left group"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-slate-800 group-hover:text-blue-700 truncate transition">
                      {mtg.title}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5 tabular-nums">
                      {formatShortDateBR(mtg.date)}
                      {mtg.time ? ` às ${mtg.time}` : ''} · {pName}
                    </p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap shrink-0 ${
                      mtg.status === 'Concluída'
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'bg-blue-50 text-blue-700'
                    }`}
                  >
                    {mtg.status}
                  </span>
                </button>
              );
            })}

            {upcomingMonthMeetings.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400">
                Nenhuma reunião registrada em {currentMonthLabel}.
              </div>
            )}
          </div>
        </section>
      </div>

      {/* =====================================================================
          6, 7 & 8. ATIVIDADES POR STATUS + DECISÕES RECENTES + HISTÓRICO E REGISTROS
          ===================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* 7. ATIVIDADES POR STATUS (MÊS) */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Atividades por status
                </h2>
                <p className="text-xs text-slate-500 capitalize">
                  Distribuição das atividades regulatórias de {currentMonthLabel}
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 tabular-nums">
                {statusBreakdown.total} {statusBreakdown.total === 1 ? 'atividade' : 'atividades'}
              </span>
            </div>

            {/* Barra consolidada */}
            <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden flex mb-5">
              {statusBreakdown.items.map(item =>
                item.pct > 0 ? (
                  <div
                    key={item.key}
                    className={`${item.barClass} h-full transition-all`}
                    style={{ width: `${item.pct}%` }}
                    title={`${item.label}: ${item.count} (${item.pct}%)`}
                  />
                ) : null
              )}
            </div>

            {/* Detalhamento individual por situação */}
            <div className="space-y-3.5">
              {statusBreakdown.items.map(item => (
                <div key={item.key} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="inline-flex items-center gap-2 font-medium text-slate-700">
                      <span className={`w-2.5 h-2.5 rounded-full ${item.dotClass}`} />
                      {item.label}
                    </span>
                    <span className="font-semibold text-slate-800 tabular-nums">
                      {item.count}{' '}
                      <span className="text-slate-400 font-normal">({item.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`${item.barClass} h-full rounded-full`}
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Atualizado automaticamente com base nos registros reais.</span>
            {onOpenTasksWithFilter && (
              <button
                type="button"
                onClick={() => onOpenTasksWithFilter('month')}
                className="font-semibold text-teal-700 hover:text-teal-800 inline-flex items-center gap-1"
              >
                Ver atividades <ArrowRight size={12} />
              </button>
            )}
          </div>
        </section>

        {/* 6 & 8. COLUNA DIREITA: DECISÕES RECENTES + HISTÓRICO E REGISTROS */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* 6. DECISÕES E ENCAMINHAMENTOS RECENTES */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2 min-w-0">
                <ShieldCheck size={17} className="text-teal-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900 truncate">
                  Decisões e encaminhamentos recentes
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAllDecisionsModalOpen(true)}
                className="text-xs font-semibold text-slate-500 hover:text-teal-700 inline-flex items-center gap-1 whitespace-nowrap shrink-0"
              >
                Ver todas <ArrowRight size={13} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {unifiedDecisions.slice(0, 4).map(dec => (
                <button
                  key={dec.id}
                  type="button"
                  onClick={() => setSelectedDecision(dec)}
                  className="w-full py-2.5 flex items-center justify-between gap-3 text-left hover:bg-slate-50/80 px-1.5 rounded-lg transition group"
                >
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-slate-800 group-hover:text-teal-700 truncate transition">
                        {dec.description}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">
                        {dec.projectName} · {dec.sourceLabel}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 tabular-nums whitespace-nowrap shrink-0">
                    {formatRelativeDate(dec.date, todayStr)}
                  </span>
                </button>
              ))}

              {unifiedDecisions.length === 0 && (
                <div className="py-6 text-center text-xs text-slate-400">
                  Nenhuma decisão registrada até o momento. As decisões de projetos e reuniões aparecerão aqui automaticamente.
                </div>
              )}
            </div>
          </section>

          {/* 8. HISTÓRICO E REGISTROS (SUBSTITUI NORMAS E GUIAS) */}
          <section className="bg-white rounded-2xl border border-slate-200/80 p-5 flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <History size={17} className="text-teal-600 shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Histórico e registros
                </h2>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                Acesse atividades e reuniões finalizadas, com atas, decisões, comentários e evidências.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setHistorySearch('');
                  setHistoryProjectFilter('Todos');
                  setHistoryModalTab('tasks');
                }}
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-emerald-300 hover:bg-emerald-50/30 transition flex items-center justify-between gap-2.5 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800 truncate">
                      Atividades finalizadas
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {finalizedTasks.length} {finalizedTasks.length === 1 ? 'registro' : 'registros'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:text-emerald-600 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setHistorySearch('');
                  setHistoryProjectFilter('Todos');
                  setHistoryModalTab('meetings');
                }}
                className="p-3.5 rounded-xl border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/30 transition flex items-center justify-between gap-2.5 text-left group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <CalendarIcon size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-blue-800 truncate">
                      Reuniões finalizadas
                    </p>
                    <p className="text-[11px] text-slate-500 tabular-nums">
                      {finalizedMeetings.length} {finalizedMeetings.length === 1 ? 'registro' : 'registros'}
                    </p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:text-blue-600 shrink-0" />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================================
          MODAL: DETALHES DO DIA NO CALENDÁRIO
          ===================================================================== */}
      {selectedCalendarDateStr && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedCalendarDateStr(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Registros de {formatDateBR(selectedCalendarDateStr)}
                </h3>
                <p className="text-xs text-slate-500">
                  Atividades, reuniões, entregas, decisões e pendências da data selecionada
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCalendarDateStr(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center transition"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-5 overflow-y-auto space-y-4 custom-scrollbar">
              {selectedDayMaint.length > 0 && (
                <div className="p-3.5 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-2.5 text-xs text-orange-900">
                  <Wrench size={15} className="text-orange-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Manutenção — sistema indisponível</p>
                    {selectedDayMaint.map(m => (
                      <p key={m.id} className="text-[11px] text-orange-800 mt-0.5">
                        {m.title} ({formatDateBR(m.startDate)} a {formatDateBR(m.endDate)})
                        {m.description ? ` — ${m.description}` : ''}
                      </p>
                    ))}
                    <p className="text-[11px] text-orange-700 mt-1">
                      A ausência de registros durante períodos de manutenção não é considerada falta de acompanhamento.
                    </p>
                  </div>
                </div>
              )}

              {selectedDayBucket && selectedDayBucket.tasks.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Atividades ({selectedDayBucket.tasks.length})
                  </h4>
                  {selectedDayBucket.tasks.map(t => (
                    <div
                      key={t.id}
                      className="p-3 rounded-xl border border-slate-200/80 hover:border-teal-300 flex items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-slate-900 truncate">{t.activity}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {t.project || 'Geral'} · {t.status} · {t.projectLead}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDateStr(null);
                            onViewTask(t);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-teal-50 hover:text-teal-700"
                          title="Visualizar detalhes"
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCalendarDateStr(null);
                            onEditTask(t);
                          }}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedDayBucket && selectedDayBucket.meetings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500" />
                    Reuniões ({selectedDayBucket.meetings.length})
                  </h4>
                  {selectedDayBucket.meetings.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => {
                        setSelectedCalendarDateStr(null);
                        onOpenMeeting?.(m.id);
                      }}
                      className="w-full p-3 rounded-xl border border-purple-200/80 hover:bg-purple-50/40 flex items-center justify-between gap-3 text-left transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{m.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {m.time || 'Horário a definir'} · {m.projectName || 'Outros Projetos'} · {m.status}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-purple-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {selectedDayBucket && selectedDayBucket.milestones.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Entregas e Marcos ({selectedDayBucket.milestones.length})
                  </h4>
                  {selectedDayBucket.milestones.map(ms => (
                    <button
                      key={ms.id}
                      type="button"
                      onClick={() => {
                        setSelectedCalendarDateStr(null);
                        onNavigateToProject?.(ms.projectId);
                      }}
                      className="w-full p-3 rounded-xl border border-blue-200/80 hover:bg-blue-50/40 flex items-center justify-between gap-3 text-left transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{ms.title}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {ms.projectName} · {ms.macroName} · {ms.status}
                        </p>
                      </div>
                      <ArrowRight size={14} className="text-blue-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {selectedDayBucket && selectedDayBucket.decisions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-600" />
                    Decisões ({selectedDayBucket.decisions.length})
                  </h4>
                  {selectedDayBucket.decisions.map(dec => (
                    <button
                      key={dec.id}
                      type="button"
                      onClick={() => {
                        setSelectedCalendarDateStr(null);
                        setSelectedDecision(dec);
                      }}
                      className="w-full p-3 rounded-xl border border-indigo-200/80 hover:bg-indigo-50/40 flex items-center justify-between gap-3 text-left transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 truncate">{dec.description}</p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {dec.projectName} · {dec.sourceLabel}
                        </p>
                      </div>
                      <Eye size={14} className="text-indigo-600 shrink-0" />
                    </button>
                  ))}
                </div>
              )}

              {(!selectedDayBucket ||
                (selectedDayBucket.tasks.length === 0 &&
                  selectedDayBucket.meetings.length === 0 &&
                  selectedDayBucket.milestones.length === 0 &&
                  selectedDayBucket.decisions.length === 0)) &&
                selectedDayMaint.length === 0 && (
                  <div className="py-10 text-center text-xs text-slate-400">
                    Nenhum registro vinculado a esta data.
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DETALHES DA DECISÃO / ENCAMINHAMENTO
          ===================================================================== */}
      {selectedDecision && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedDecision(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden"
          >
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold text-teal-700">
                  {selectedDecision.projectName} · {formatDateBR(selectedDecision.date)}
                </p>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                  {selectedDecision.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDecision(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto custom-scrollbar">
              <div>
                <p className="text-[11px] font-semibold text-slate-500 mb-1">Decisão / Registro</p>
                <p className="text-slate-800 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {selectedDecision.description}
                </p>
              </div>

              {selectedDecision.justification && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1">Justificativa / Contexto</p>
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {selectedDecision.justification}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-[11px]">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Origem</span>
                  <span className="font-semibold text-slate-800">{selectedDecision.sourceLabel}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block">Responsável</span>
                  <span className="font-semibold text-slate-800">{selectedDecision.responsible || 'Equipe Regulatória'}</span>
                </div>
              </div>

              {selectedDecision.actionItems && selectedDecision.actionItems.length > 0 && (
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 mb-1.5">
                    Encaminhamentos associados ({selectedDecision.actionItems.length})
                  </p>
                  <div className="space-y-1.5">
                    {selectedDecision.actionItems.map(act => (
                      <div
                        key={act.id}
                        className="p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800">{act.action}</p>
                          <p className="text-[11px] text-slate-500">
                            {act.responsible} · Prazo: {formatDateBR(act.dueDate)}
                          </p>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-600 shrink-0">
                          {act.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDecision.evidenceLink && (
                <a
                  href={selectedDecision.evidenceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-teal-700 hover:underline font-semibold"
                >
                  <Link2 size={13} /> Abrir evidência vinculada <ExternalLink size={12} />
                </a>
              )}
            </div>

            <footer className="px-5 py-3.5 border-t border-slate-100 bg-slate-50/70 flex items-center justify-end gap-2">
              {selectedDecision.meetingId && onOpenMeeting && (
                <button
                  type="button"
                  onClick={() => {
                    const mId = selectedDecision.meetingId;
                    setSelectedDecision(null);
                    onOpenMeeting(mId);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold transition"
                >
                  Abrir reunião original
                </button>
              )}
              {selectedDecision.projectId && onNavigateToProject && (
                <button
                  type="button"
                  onClick={() => {
                    const pId = selectedDecision.projectId!;
                    setSelectedDecision(null);
                    onNavigateToProject(pId);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition"
                >
                  Abrir projeto
                </button>
              )}
              <button
                type="button"
                onClick={() => setSelectedDecision(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold transition"
              >
                Fechar
              </button>
            </footer>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: TODAS AS DECISÕES RECENTES
          ===================================================================== */}
      {isAllDecisionsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsAllDecisionsModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Decisões e encaminhamentos regulatórios ({unifiedDecisions.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Histórico consolidado de decisões de projetos e reuniões
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAllDecisionsModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-5 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
              {unifiedDecisions.map(dec => (
                <button
                  key={dec.id}
                  type="button"
                  onClick={() => {
                    setIsAllDecisionsModalOpen(false);
                    setSelectedDecision(dec);
                  }}
                  className="w-full py-3 flex items-start justify-between gap-3 text-left hover:bg-slate-50 px-2 rounded-xl transition"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-900">{dec.title}</p>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{dec.description}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {dec.projectName} · {dec.sourceLabel}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                    {formatDateBR(dec.date)}
                  </span>
                </button>
              ))}
              {unifiedDecisions.length === 0 && (
                <div className="py-12 text-center text-xs text-slate-400">
                  Nenhuma decisão registrada ainda.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: HISTÓRICO E REGISTROS (ATIVIDADES E REUNIÕES FINALIZADAS)
          ===================================================================== */}
      {historyModalTab && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setHistoryModalTab(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
          >
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">Histórico e registros</h3>
                <p className="text-xs text-slate-500">
                  Consulte registros finalizados, atas, decisões, comentários, justificativas e evidências
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryModalTab(null)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </header>

            <div className="px-5 py-3 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-1">
                <button
                  type="button"
                  onClick={() => setHistoryModalTab('tasks')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    historyModalTab === 'tasks'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Atividades finalizadas ({finalizedTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setHistoryModalTab('meetings')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    historyModalTab === 'meetings'
                      ? 'bg-teal-600 text-white'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Reuniões finalizadas ({finalizedMeetings.length})
                </button>
              </div>

              <div className="flex items-center gap-2 flex-1 sm:flex-initial">
                <div className="relative flex-1 sm:w-56">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={historySearch}
                    onChange={e => setHistorySearch(e.target.value)}
                    placeholder="Pesquisar no histórico..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-teal-500"
                  />
                </div>
                <select
                  value={historyProjectFilter}
                  onChange={e => setHistoryProjectFilter(e.target.value)}
                  className="py-1.5 px-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 outline-none"
                >
                  <option value="Todos">Projeto: Todos</option>
                  {historyProjectOptions.map(p => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-2.5 custom-scrollbar">
              {historyModalTab === 'tasks' && (
                <>
                  {filteredHistoryTasks.map(t => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-xl border border-slate-200/80 hover:border-teal-300 transition flex items-start justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-900">{t.activity}</p>
                        {t.description && (
                          <p className="text-xs text-slate-600 line-clamp-2 mt-0.5">{t.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 mt-1.5 tabular-nums">
                          <span>Projeto: {t.project || 'Geral'}</span>
                          <span>·</span>
                          <span>Responsável: {t.projectLead}</span>
                          <span>·</span>
                          <span>Finalizada em {formatDateBR(t.completedAt || t.completionDate)}</span>
                          {(t.isRegulatoryContribution || t.generatesRegulatoryContent) && (
                            <>
                              <span>·</span>
                              <span className="text-teal-700 font-semibold">Impacto Regulatório</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {t.updates && t.updates.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setNotesModalTask(t)}
                            className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-700 text-[11px] font-semibold inline-flex items-center gap-1"
                            title="Ver comentários e notas"
                          >
                            <MessageSquare size={12} /> {t.updates.length}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryModalTab(null);
                            onViewTask(t);
                          }}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-teal-300 hover:bg-teal-50 text-xs font-semibold text-slate-700 hover:text-teal-800 inline-flex items-center gap-1"
                        >
                          <Eye size={13} /> Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredHistoryTasks.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Nenhuma atividade finalizada encontrada com os filtros atuais.
                    </div>
                  )}
                </>
              )}

              {historyModalTab === 'meetings' && (
                <>
                  {filteredHistoryMeetings.map(m => {
                    const pName =
                      projects.find(p => p.id === m.projectId)?.name ||
                      m.projectName ||
                      'Outros Projetos';
                    const decisionsCount = (m.agendaItems || []).filter(
                      ag => (ag.decisions || '').trim().length > 0
                    ).length;
                    const actionsCount = (m.agendaItems || []).reduce(
                      (acc, ag) => acc + (ag.actionItems?.length || 0),
                      0
                    );
                    return (
                      <div
                        key={m.id}
                        className="p-3.5 rounded-xl border border-slate-200/80 hover:border-blue-300 transition flex items-start justify-between gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900">{m.title}</p>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[11px] text-slate-500 mt-1 tabular-nums">
                            <span>Projeto: {pName}</span>
                            <span>·</span>
                            <span>{formatDateBR(m.date)}</span>
                            <span>·</span>
                            <span>{decisionsCount} decisões</span>
                            <span>·</span>
                            <span>{actionsCount} encaminhamentos</span>
                          </div>
                          {m.generalConclusions && (
                            <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                              {m.generalConclusions}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHistoryModalTab(null);
                            onOpenMeeting?.(m.id, 'list');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-800 text-xs font-semibold inline-flex items-center gap-1 shrink-0"
                        >
                          <FileText size={13} /> Abrir ata
                        </button>
                      </div>
                    );
                  })}
                  {filteredHistoryMeetings.length === 0 && (
                    <div className="py-12 text-center text-xs text-slate-400">
                      Nenhuma reunião finalizada encontrada com os filtros atuais.
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: PERÍODOS DE MANUTENÇÃO DO SISTEMA
          ===================================================================== */}
      {isMaintenanceModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsMaintenanceModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[85vh] flex flex-col overflow-hidden"
          >
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench size={16} className="text-orange-600" />
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Períodos de manutenção do sistema
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsMaintenanceModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </header>

            <div className="p-5 overflow-y-auto space-y-4 text-xs custom-scrollbar">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (!editingMaintenance?.title?.trim() || !editingMaintenance?.startDate || !editingMaintenance?.endDate) {
                    return;
                  }
                  const computedStatus: MaintenancePeriod['status'] =
                    editingMaintenance.endDate < todayStr
                      ? 'Concluída'
                      : editingMaintenance.startDate > todayStr
                        ? 'Programada'
                        : 'Em Andamento';
                  if (editingMaintenance.id) {
                    saveMaintenancePeriods(
                      maintenancePeriods.map(mp =>
                        mp.id === editingMaintenance.id
                          ? {
                              ...mp,
                              title: editingMaintenance.title!.trim(),
                              startDate: editingMaintenance.startDate!,
                              endDate: editingMaintenance.endDate!,
                              description: editingMaintenance.description || '',
                              status: editingMaintenance.status || computedStatus,
                              impactLevel: editingMaintenance.impactLevel || 'Indisponibilidade Total'
                            }
                          : mp
                      )
                    );
                  } else {
                    const newPeriod: MaintenancePeriod = {
                      id: `maint_${Date.now()}`,
                      title: editingMaintenance.title.trim(),
                      startDate: editingMaintenance.startDate,
                      endDate: editingMaintenance.endDate,
                      description: editingMaintenance.description || '',
                      status: editingMaintenance.status || computedStatus,
                      impactLevel: editingMaintenance.impactLevel || 'Indisponibilidade Total',
                      createdAt: new Date().toISOString(),
                      createdBy: currentUser || 'Sistema'
                    };
                    saveMaintenancePeriods([newPeriod, ...maintenancePeriods]);
                  }
                  setEditingMaintenance({
                    title: '',
                    startDate: todayStr,
                    endDate: todayStr,
                    description: '',
                    status: 'Programada',
                    impactLevel: 'Indisponibilidade Total'
                  });
                }}
                className="space-y-3 p-4 rounded-xl bg-slate-50 border border-slate-200/80"
              >
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Descrição / Motivo</label>
                  <input
                    type="text"
                    required
                    value={editingMaintenance?.title || ''}
                    onChange={e =>
                      setEditingMaintenance(prev => ({ ...(prev || {}), title: e.target.value }))
                    }
                    placeholder="Ex: Atualização de infraestrutura e sincronização"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-orange-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Data inicial</label>
                    <input
                      type="date"
                      required
                      value={editingMaintenance?.startDate || ''}
                      onChange={e =>
                        setEditingMaintenance(prev => ({ ...(prev || {}), startDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Data final</label>
                    <input
                      type="date"
                      required
                      value={editingMaintenance?.endDate || ''}
                      onChange={e =>
                        setEditingMaintenance(prev => ({ ...(prev || {}), endDate: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-orange-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Observações (opcional)</label>
                  <input
                    type="text"
                    value={editingMaintenance?.description || ''}
                    onChange={e =>
                      setEditingMaintenance(prev => ({ ...(prev || {}), description: e.target.value }))
                    }
                    placeholder="Detalhes adicionais sobre a indisponibilidade"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  {editingMaintenance?.id && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingMaintenance({
                          title: '',
                          startDate: todayStr,
                          endDate: todayStr,
                          description: '',
                          status: 'Programada',
                          impactLevel: 'Indisponibilidade Total'
                        })
                      }
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-semibold"
                    >
                      Cancelar edição
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-semibold transition"
                  >
                    {editingMaintenance?.id ? 'Atualizar período' : 'Adicionar período'}
                  </button>
                </div>
              </form>

              {maintenancePeriods.length > 0 && (
                <div className="space-y-2">
                  <p className="font-semibold text-slate-700">
                    Períodos cadastrados ({maintenancePeriods.length})
                  </p>
                  {maintenancePeriods.map(mp => (
                    <div
                      key={mp.id}
                      className="p-3 rounded-xl border border-orange-200 bg-orange-50/50 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 truncate">{mp.title}</p>
                        <p className="text-[11px] text-slate-600 tabular-nums">
                          {formatDateBR(mp.startDate)} até {formatDateBR(mp.endDate)}
                          {mp.description ? ` · ${mp.description}` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingMaintenance(mp)}
                          className="p-1.5 rounded-lg hover:bg-orange-100 text-orange-700"
                          title="Editar"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            saveMaintenancePeriods(maintenancePeriods.filter(i => i.id !== mp.id))
                          }
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-rose-600"
                          title="Remover"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: INÍCIO REAL DO SISTEMA
          ===================================================================== */}
      {isSystemStartModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsSystemStartModalOpen(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden"
          >
            <header className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flag size={16} className="text-orange-600" />
                <h3 className="text-sm font-bold text-slate-900">Início real do sistema</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSystemStartModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-500 flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </header>

            <form
              onSubmit={e => {
                e.preventDefault();
                saveSystemRealStart(tempSystemStartDate, tempSystemStartNote);
                setIsSystemStartModalOpen(false);
              }}
              className="p-5 space-y-4 text-xs"
            >
              <p className="text-slate-600 leading-relaxed">
                Atividades anteriores a esta data permanecem preservadas no calendário e histórico com destaque em laranja, sem distorcer os indicadores operacionais atuais.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data de início real</label>
                <input
                  type="date"
                  value={tempSystemStartDate}
                  onChange={e => setTempSystemStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Legenda</label>
                <input
                  type="text"
                  value={tempSystemStartNote}
                  onChange={e => setTempSystemStartNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 outline-none focus:border-orange-500"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                {systemRealStartDate ? (
                  <button
                    type="button"
                    onClick={() => {
                      saveSystemRealStart('', '');
                      setIsSystemStartModalOpen(false);
                    }}
                    className="text-rose-600 hover:underline font-semibold"
                  >
                    Remover data
                  </button>
                ) : (
                  <span />
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsSystemStartModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE NOTAS DE ATUALIZAÇÃO */}
      <TaskNotesModal
        isOpen={Boolean(notesModalTask)}
        task={notesModalTask}
        currentUser={currentUser === 'Todos' ? 'Usuário' : currentUser}
        onClose={() => setNotesModalTask(null)}
        onSaveTask={handleSaveTaskFromNotes}
      />
    </div>
  );
};
