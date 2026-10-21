import React, { useState, useMemo } from 'react';
import { Task, Project, TeamMember, Priority, Status, ActivityType } from '../types';
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
  FolderKanban, 
  X, 
  Check, 
  ShieldCheck, 
  ExternalLink,
  MessageSquare,
  BarChart2,
  PieChart as PieIcon,
  ChevronDown
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

  // 1. Indicadores por status (Visão Geral)
  const statusStats = useMemo(() => {
    const total = userTasks.length;
    const completed = userTasks.filter(t => t.status === 'Concluída').length;
    const ongoing = userTasks.filter(t => t.status === 'Em Andamento').length;
    const planned = userTasks.filter(t => t.status === 'Planejada').length;
    const overdue = userTasks.filter(t => {
      if (t.status === 'Concluída' || !t.completionDate) return false;
      return new Date(t.completionDate + 'T00:00:00') < today;
    }).length;

    return { total, completed, ongoing, planned, overdue };
  }, [userTasks, today]);

  // 2. Alertas: Atividades próximas do vencimento e atrasadas
  const alerts = useMemo(() => {
    const sevenDays = new Date(today);
    sevenDays.setDate(today.getDate() + 7);

    const overdueTasks = userTasks.filter(t => {
      if (t.status === 'Concluída' || !t.completionDate) return false;
      return new Date(t.completionDate + 'T00:00:00') < today;
    });

    const dueSoonTasks = userTasks.filter(t => {
      if (t.status === 'Concluída' || !t.completionDate) return false;
      const d = new Date(t.completionDate + 'T00:00:00');
      return d >= today && d <= sevenDays;
    });

    return { overdueTasks, dueSoonTasks };
  }, [userTasks, today]);

  // 3. Filtragem da lista do histórico / calendário
  const filteredTasks = useMemo(() => {
    return userTasks.filter(t => {
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
      // Ordenação: não concluídas primeiro, ordenadas por prazo
      if (a.status === 'Concluída' && b.status !== 'Concluída') return 1;
      if (a.status !== 'Concluída' && b.status === 'Concluída') return -1;
      const dateA = a.completionDate ? new Date(a.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
      const dateB = b.completionDate ? new Date(b.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
      return dateA - dateB;
    });
  }, [userTasks, searchTerm, statusFilter, typeFilter, priorityFilter, projectFilter, groupFilter, selectedCalendarDateStr, dateRangeFilter, today]);

  // Handlers do Drawer Lateral
  const handleOpenDrawer = (task: Task) => {
    setDrawerTask(task);
    setIsEditingDrawer(false);
    setDrawerEditForm({ ...task });
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
              <span className="text-[10px] font-bold text-slate-400 mt-1">Todas as demandas no escopo</span>
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
            <div className="lg:col-span-7 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={18} className="text-teal-600" />
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight">
                    Calendário de Acompanhamento
                  </h3>
                  <span className="text-xs text-slate-500 font-bold">
                    {calendarDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Seletor Dia / Mês / Ano */}
                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-bold">
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
                  <div className="flex items-center gap-1">
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
                      className="px-2 py-1 text-[10px] font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg"
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

                        cells.push(
                          <button
                            key={dateStr}
                            type="button"
                            onClick={() => setSelectedCalendarDateStr(isSelected ? null : dateStr)}
                            className={`h-9 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center relative ${
                              isSelected
                                ? 'bg-teal-600 text-white border-teal-600 shadow-2xs font-black'
                                : isToday
                                ? 'bg-teal-50 border-teal-300 text-teal-900'
                                : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <span>{d}</span>
                            {count > 0 && (
                              <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-teal-500'}`} />
                            )}
                          </button>
                        );
                      }
                      return cells;
                    })()}
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
            <div className="lg:col-span-5 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-2xs space-y-4">
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
                    <ArrowRight size={14} className="text-rose-600 shrink-0" />
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
                    <ArrowRight size={14} className="text-amber-600 shrink-0" />
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
                </p>
              </div>

              {/* Botões rápidos de período */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
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

            {/* Tabela / Lista de Atividades */}
            <div className="overflow-x-auto custom-scrollbar pt-2">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Atividade</th>
                    <th className="py-2.5 px-2">Tipo</th>
                    <th className="py-2.5 px-2">Projeto / Grupo</th>
                    <th className="py-2.5 px-2">Responsável</th>
                    <th className="py-2.5 px-2">Prazo</th>
                    <th className="py-2.5 px-2">Prioridade</th>
                    <th className="py-2.5 px-2">Status</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTasks.map(task => {
                    const isDone = task.status === 'Concluída';
                    return (
                      <tr
                        key={task.id}
                        onClick={() => handleOpenDrawer(task)}
                        className={`hover:bg-slate-50/80 transition cursor-pointer group ${
                          isDone ? 'bg-emerald-50/40 text-emerald-950' : ''
                        }`}
                      >
                        <td className="py-3 px-3 min-w-[220px]">
                          <span className={`font-black text-xs block leading-snug ${isDone ? 'line-through text-emerald-900' : 'text-slate-900'}`}>
                            {task.activity}
                          </span>
                          {task.description && (
                            <span className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                              {task.description}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                            {task.activityType === 'meeting' ? 'Reunião' :
                             task.activityType === 'report' || task.isReport ? 'Relatório' :
                             task.activityType === 'note' ? 'Nota' : 'Geral'}
                          </span>
                        </td>

                        <td className="py-3 px-2">
                          <span className="font-bold text-slate-700 text-xs block truncate max-w-[130px]">{task.project}</span>
                          {task.group && (
                            <span className="text-[10px] text-teal-700 font-bold block">{task.group}</span>
                          )}
                        </td>

                        <td className="py-3 px-2">
                          <span className="font-semibold text-slate-700 text-xs">{task.projectLead}</span>
                        </td>

                        <td className="py-3 px-2">
                          <span className="font-semibold text-slate-600 text-xs">{formatDateBR(task.completionDate)}</span>
                        </td>

                        <td className="py-3 px-2">
                          <span className="text-[10px] font-bold text-slate-600">
                            {task.priority || 'Sem prioridade'}
                          </span>
                        </td>

                        <td className="py-3 px-2">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                            isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {task.status}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDrawer(task);
                            }}
                            className="p-1.5 text-slate-400 hover:text-teal-700 rounded-lg hover:bg-teal-50 transition"
                            title="Consultar e editar"
                          >
                            <Eye size={14} />
                          </button>
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

                  {/* Histórico de Notas */}
                  {drawerTask.updates && drawerTask.updates.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <span className="text-[10px] font-black uppercase text-slate-400 block">
                        Notas de Atualização ({drawerTask.updates.length})
                      </span>
                      <div className="space-y-2 max-h-44 overflow-y-auto custom-scrollbar">
                        {drawerTask.updates.map(u => (
                          <div key={u.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-0.5">
                            <div className="flex items-center justify-between text-[9px] font-bold text-slate-400">
                              <span>{u.user}</span>
                              <span>{new Date(u.date).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <p className="text-xs text-slate-700 font-medium">{u.note}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
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

    </div>
  );
};
