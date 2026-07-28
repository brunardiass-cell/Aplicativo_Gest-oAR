import React, { useState, useMemo, useEffect } from 'react';
import { Task, AppNotification, Status } from '../types';
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
  SlidersHorizontal,
  CheckCircle,
  UserCheck,
  Calendar,
  Filter,
  RotateCcw,
  Search,
  LayoutGrid,
  List,
  Kanban,
  MoreVertical,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  Layers
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
}

const getTaskStatusVisuals = (status: Status, isReport?: boolean, reportStage?: string) => {
  if (status === 'Concluída') {
    return {
      accentBar: 'bg-emerald-500',
      borderColor: 'border-emerald-250 hover:border-emerald-350',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      iconBox: 'bg-emerald-100 text-emerald-700',
      label: 'CONCLUÍDA'
    };
  }
  if (status === 'Em Andamento') {
    if (isReport && reportStage?.includes('Revisão')) {
      return {
        accentBar: 'bg-purple-500',
        borderColor: 'border-purple-250 hover:border-purple-350',
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-100',
        iconBox: 'bg-purple-100 text-purple-700',
        label: 'EM REVISÃO'
      };
    }
    return {
      accentBar: 'bg-blue-500',
      borderColor: 'border-blue-250 hover:border-blue-350',
      badgeClass: 'bg-blue-50 text-blue-700 border-blue-100',
      iconBox: 'bg-blue-100 text-blue-700',
      label: 'EM ANDAMENTO'
    };
  }
  if (status === 'Pausado') {
    return {
      accentBar: 'bg-purple-500',
      borderColor: 'border-purple-250 hover:border-purple-350',
      badgeClass: 'bg-purple-50 text-purple-700 border-purple-100',
      iconBox: 'bg-purple-100 text-purple-700',
      label: 'EM REVISÃO'
    };
  }
  if (status === 'Planejada') {
    return {
      accentBar: 'bg-amber-500',
      borderColor: 'border-amber-250 hover:border-amber-350',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-100',
      iconBox: 'bg-amber-100 text-amber-700',
      label: 'PLANEJADA'
    };
  }
  return {
    accentBar: 'bg-slate-350',
    borderColor: 'border-slate-200 hover:border-slate-300',
    badgeClass: 'bg-slate-50 text-slate-500 border-slate-100',
    iconBox: 'bg-slate-100 text-slate-500',
    label: status.toUpperCase()
  };
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
  return trimmed ? trimmed.charAt(0).toUpperCase() : 'U';
};

const TaskBoard: React.FC<TaskBoardProps> = ({ 
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
  onNewTask
}) => {
  const [viewMode, setViewMode] = useState<'list' | 'cards' | 'kanban' | 'timeline'>('list');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [openMenuTaskId, setOpenMenuTaskId] = useState<string | null>(null);

  const activeTasks = useMemo(() => tasks.filter(t => !t.deleted), [tasks]);
  const activeReviews = notifications.filter(n => n.userId === currentUser && !n.read && n.type === 'REVIEW_ASSIGNED');
  const isTeamView = currentUser === 'Visão Geral da Equipe';

  // Statistics
  const stats = useMemo(() => {
    const total = activeTasks.length;
    const planned = activeTasks.filter(t => t.status === 'Planejada').length;
    const inProgress = activeTasks.filter(t => t.status === 'Em Andamento' && (!t.isReport || !t.reportStage?.includes('Revisão'))).length;
    const inReview = activeTasks.filter(t => t.status === 'Pausado' || (t.isReport && t.reportStage?.includes('Revisão'))).length;
    const completed = activeTasks.filter(t => t.status === 'Concluída').length;

    const getPct = (cnt: number) => (total > 0 ? Math.round((cnt / total) * 100) : 0);

    return {
      total,
      planned,
      plannedPct: getPct(planned),
      inProgress,
      inProgressPct: getPct(inProgress),
      inReview,
      inReviewPct: getPct(inReview),
      completed,
      completedPct: getPct(completed)
    };
  }, [activeTasks]);

  const filteredTasks = useMemo(() => {
    if (!searchTerm) return activeTasks;
    const term = searchTerm.toLowerCase();
    return activeTasks.filter(t => 
      t.activity.toLowerCase().includes(term) || 
      t.description.toLowerCase().includes(term) ||
      t.project.toLowerCase().includes(term) ||
      t.nextStep?.toLowerCase().includes(term) ||
      t.projectLead?.toLowerCase().includes(term)
    );
  }, [activeTasks, searchTerm]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((a, b) => {
        const aIsCompleted = a.status === 'Concluída';
        const bIsCompleted = b.status === 'Concluída';

        if (aIsCompleted !== bIsCompleted) {
            return aIsCompleted ? 1 : -1;
        }

        if (aIsCompleted) {
            const dateA = a.completionDate ? new Date(a.completionDate + 'T00:00:00').getTime() : 0;
            const dateB = b.completionDate ? new Date(b.completionDate + 'T00:00:00').getTime() : 0;
            return dateB - dateA;
        }

        const dateA = a.completionDate ? new Date(a.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        const dateB = b.completionDate ? new Date(b.completionDate + 'T00:00:00').getTime() : Number.MAX_SAFE_INTEGER;
        
        if (dateA === dateB) return 0;
        return dateA - dateB;
    });
  }, [filteredTasks]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, leadFilter, projectFilter, dateFilterType, startDateFilter, endDateFilter]);

  const totalItems = sortedTasks.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);

  const paginatedTasks = useMemo(() => {
    return sortedTasks.slice(startIndex, endIndex);
  }, [sortedTasks, startIndex, endIndex]);

  const handleClearFilters = () => {
    onProjectFilterChange('Todos');
    onStatusFilterChange('Todos');
    if (isTeamView) onLeadFilterChange('Todos');
    onDateFilterTypeChange('all');
    onStartDateFilterChange('');
    onEndDateFilterChange('');
    onSearchTermChange('');
  };

  const isCollaborator = (task: Task) => currentUser !== 'Todos' && task.collaborators?.includes(currentUser) && task.projectLead !== currentUser;

  return (
    <div className="space-y-6">
      
      {/* 1. TOP HEADER BANNER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-transparent">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Atividades</h2>
          <p className="text-xs font-bold text-slate-500 mt-1">Acompanhe e gerencie suas atividades e prazos.</p>
        </div>

        {onNewTask && (
          <button 
            onClick={onNewTask}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 shrink-0"
          >
            <Plus size={16} /> Nova Atividade
          </button>
        )}
      </div>

      {/* 2. STATS SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Planejadas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-black">
              <Calendar size={18} />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">Planejadas</span>
              <span className="text-2xl font-black text-slate-900">{stats.planned}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>{stats.plannedPct}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Em andamento */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-black">
              <ArrowRight size={18} />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">Em andamento</span>
              <span className="text-2xl font-black text-slate-900">{stats.inProgress}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>{stats.inProgressPct}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500" />
        </div>

        {/* Em revisão */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center font-black">
              <FileText size={18} />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">Em revisão</span>
              <span className="text-2xl font-black text-slate-900">{stats.inReview}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>{stats.inReviewPct}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-purple-500" />
        </div>

        {/* Concluídas */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-black">
              <CheckCircle size={18} />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">Concluídas</span>
              <span className="text-2xl font-black text-slate-900">{stats.completed}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>{stats.completedPct}% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>

        {/* Total */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-black">
              <List size={18} />
            </div>
            <div className="text-right">
              <span className="text-[11px] font-black text-slate-500 uppercase tracking-tight block">Total</span>
              <span className="text-2xl font-black text-slate-900">{stats.total}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] font-bold text-slate-400">
            <span>100% do total</span>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-400" />
        </div>
      </div>

      {/* ACTIVE REVIEWS BANNER IF ANY */}
      {activeReviews.length > 0 && currentUser !== 'Todos' && (
        <div className="bg-[#1e293b] rounded-2xl p-6 shadow-lg animate-in slide-in-from-top duration-500 space-y-4">
           <div className="flex justify-between items-center">
             <div className="flex items-center gap-4">
                <button className="px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-2">
                   <FileSignature size={14} /> {activeReviews.length} RELATÓRIOS PARA VOCÊ ANALISAR
                </button>
                <button onClick={onClearAllNotifications} className="px-4 py-2 bg-white/10 text-slate-300 rounded-lg text-xs font-bold hover:bg-white/20 transition">Limpar Notificações</button>
             </div>
           </div>
           
           <div className="bg-[#0f172a] p-4 rounded-xl space-y-3">
              <div className="flex items-center gap-3 px-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white shadow-lg"><FileSignature size={16}/></div>
                <div>
                  <h3 className="text-white font-bold text-sm">RELATÓRIOS PENDENTES PARA SUA REVISÃO</h3>
                  <p className="text-amber-400 text-[10px] font-bold uppercase tracking-wider">Ação necessária em {activeReviews.length} documentos</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                 {activeReviews.map(notif => (
                   <div key={notif.id} className="bg-[#1e293b] p-3 rounded-lg flex items-center justify-between group">
                     <button onClick={() => onNotificationClick(notif)} className="flex-1 flex items-center justify-between pr-6 text-left">
                       <p className="text-slate-300 text-xs font-bold uppercase truncate">{notif.message}</p>
                       <ArrowRight size={16} className="text-amber-500 group-hover:translate-x-1 transition shrink-0" />
                     </button>
                     <button onClick={(e) => { e.stopPropagation(); onClearSingleNotification(notif.id); }} className="p-1 text-slate-500 hover:text-white hover:bg-slate-700 rounded-full transition-colors" title="Limpar notificação"><X size={14} /></button>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

      {/* 3. VIEW MODE SWITCHER TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button 
          onClick={() => setViewMode('cards')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'cards' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <LayoutGrid size={15} /> Cards
        </button>

        <button 
          onClick={() => setViewMode('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'list' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <List size={15} /> Lista
        </button>

        <button 
          onClick={() => setViewMode('kanban')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'kanban' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Kanban size={15} /> Kanban
        </button>

        <button 
          onClick={() => setViewMode('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${
            viewMode === 'timeline' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/80 shadow-xs' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Clock size={15} /> Timeline
        </button>
      </div>

      {/* 4. SEARCH AND FILTERS BAR */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          
          {/* Search Input */}
          <div className="lg:col-span-4 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => onSearchTermChange(e.target.value)} 
              placeholder="Buscar por nome, descrição, projeto..." 
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-teal-500 transition"
            />
          </div>

          {/* Dropdown: Projeto */}
          <div className="lg:col-span-2">
            <select 
              value={projectFilter} 
              onChange={(e) => onProjectFilterChange(e.target.value)} 
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Projeto: Todos</option>
              {uniqueProjects.filter(p => p !== 'Todos').map(project => (
                <option key={project} value={project}>{project}</option>
              ))}
            </select>
          </div>

          {/* Dropdown: Responsável */}
          <div className="lg:col-span-2">
            <select 
              value={leadFilter} 
              onChange={(e) => onLeadFilterChange(e.target.value)} 
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Responsável: Todos</option>
              {uniqueLeads.filter(l => l !== 'Todos').map(lead => (
                <option key={lead} value={lead}>{lead}</option>
              ))}
            </select>
          </div>

          {/* Dropdown: Status */}
          <div className="lg:col-span-2">
            <select 
              value={statusFilter} 
              onChange={(e) => onStatusFilterChange(e.target.value as 'Todos' | Status)} 
              className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-800 outline-none focus:bg-white focus:border-teal-500 transition cursor-pointer"
            >
              <option value="Todos">Status: Todos</option>
              <option value="Planejada">Planejada</option>
              <option value="Em Andamento">Em Andamento</option>
              <option value="Concluída">Concluída</option>
              <option value="Pausado">Pausado</option>
              <option value="Não Aplicável">Não Aplicável</option>
            </select>
          </div>

          {/* Action buttons: Filtros & Limpar */}
          <div className="lg:col-span-2 flex items-center gap-2 justify-end">
            <button 
              onClick={handleClearFilters} 
              className="px-3 py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition"
              title="Limpar todos os filtros"
            >
              <RotateCcw size={14} /> Limpar filtros
            </button>
          </div>

        </div>
      </div>

      {/* 5. MAIN CONTENT AREA (LIST VIEW DEFAULT / CARDS / KANBAN) */}
      {viewMode === 'list' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden space-y-0">
          
          {/* List Header Count Banner */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 tracking-tight">
              {sortedTasks.length} atividades encontradas
            </span>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <th className="py-3.5 px-6">ATIVIDADE</th>
                  <th className="py-3.5 px-4">PROJETO</th>
                  <th className="py-3.5 px-4">RESPONSÁVEL</th>
                  <th className="py-3.5 px-4">STATUS</th>
                  <th className="py-3.5 px-4">PRAZO</th>
                  <th className="py-3.5 px-4">PROGRESSO</th>
                  <th className="py-3.5 px-6 text-right">AÇÕES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedTasks.map((task) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isCompleted = task.status === 'Concluída';
                  const isOverdue = !isCompleted && task.completionDate && new Date(task.completionDate + 'T00:00:00') < today;
                  
                  const visuals = getTaskStatusVisuals(task.status, task.isReport, task.reportStage);

                  return (
                    <tr 
                      key={task.id} 
                      className="hover:bg-slate-50/80 transition group relative"
                    >
                      {/* ATIVIDADE COLUMN */}
                      <td className="py-4 px-6 relative">
                        {/* Left color bar indicator */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${visuals.accentBar}`} />
                        
                        <div className="flex items-center gap-3">
                          {/* Status Icon Box */}
                          <div className={`w-9 h-9 rounded-xl ${visuals.iconBox} flex items-center justify-center shrink-0 shadow-xs font-bold`}>
                            {task.status === 'Concluída' ? (
                              <CheckCircle size={16} />
                            ) : task.status === 'Em Andamento' ? (
                              <ArrowRight size={16} />
                            ) : task.status === 'Planejada' ? (
                              <AlertTriangle size={16} />
                            ) : (
                              <FileText size={16} />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <button
                              onClick={() => onView(task)}
                              className="text-left font-black text-slate-900 text-xs sm:text-sm hover:text-teal-700 transition block truncate max-w-[320px]"
                              title={task.activity}
                            >
                              {task.activity}
                            </button>
                            {task.description && (
                              <p className="text-[11px] font-medium text-slate-400 truncate max-w-[320px] mt-0.5">
                                {task.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* PROJETO COLUMN */}
                      <td className="py-4 px-4 text-xs font-black text-slate-700">
                        {task.project}
                      </td>

                      {/* RESPONSÁVEL COLUMN */}
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-emerald-800 text-white flex items-center justify-center text-[10px] font-black uppercase shrink-0 shadow-xs">
                            {getInitials(task.projectLead)}
                          </div>
                          <span className="text-xs font-bold text-slate-800 truncate max-w-[120px]">
                            {task.projectLead}
                          </span>
                        </div>
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="py-4 px-4">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border inline-block ${visuals.badgeClass}`}>
                          {visuals.label}
                        </span>
                      </td>

                      {/* PRAZO COLUMN */}
                      <td className="py-4 px-4">
                        <div className={`flex items-center gap-1.5 text-xs font-bold ${isOverdue ? 'text-red-500' : 'text-slate-600'}`}>
                          <Calendar size={14} className={isOverdue ? 'text-red-500' : 'text-slate-400'} />
                          <span>{formatDateBR(task.completionDate)}</span>
                        </div>
                      </td>

                      {/* PROGRESSO COLUMN */}
                      <td className="py-4 px-4 min-w-[130px]">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-800 block">
                            {task.progress}%
                          </span>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-500 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-teal-600'}`}
                              style={{ width: `${task.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* AÇÕES COLUMN */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Updates / Comments count */}
                          <div className="flex items-center gap-1 text-xs font-bold text-slate-400 mr-2">
                            <MessageSquare size={14} />
                            <span>{task.updates ? task.updates.length : 0}</span>
                          </div>

                          <button 
                            onClick={() => onView(task)} 
                            className="p-1.5 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition" 
                            title="Visualizar"
                          >
                            <Eye size={16}/>
                          </button>

                          <button 
                            onClick={() => onEdit(task)} 
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition" 
                            title="Editar"
                          >
                            <Edit2 size={16}/>
                          </button>

                          <button 
                            onClick={() => onDelete(task)} 
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" 
                            title="Excluir"
                          >
                            <Trash2 size={16}/>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-slate-400">
                      <AlertTriangle className="mx-auto text-slate-300 mb-3" size={40} />
                      <p className="text-xs font-black uppercase tracking-widest">Nenhuma atividade encontrada para os filtros selecionados.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          {totalItems > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
              <span className="text-xs font-bold text-slate-500">
                Mostrando {startIndex + 1} a {endIndex} de {totalItems} atividades
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronLeft size={16} />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <React.Fragment key={page}>
                        {showEllipsis && <span className="text-xs text-slate-400 px-1">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-xl text-xs font-black transition ${
                            currentPage === page
                              ? 'bg-emerald-800 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-700 outline-none"
                >
                  <option value={10}>10 por página</option>
                  <option value={25}>25 por página</option>
                  <option value={50}>50 por página</option>
                  <option value={100}>100 por página</option>
                </select>
              </div>
            </div>
          )}

        </div>
      )}

      {/* 6. CARDS VIEW MODE */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {sortedTasks.map(task => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isCompleted = task.status === 'Concluída';
            const isOverdue = !isCompleted && task.completionDate && new Date(task.completionDate + 'T00:00:00') < today;
            
            const nextWeek = new Date(today);
            nextWeek.setDate(today.getDate() + 7);
            const isDueSoon = !isCompleted && !isOverdue && task.completionDate && new Date(task.completionDate + 'T00:00:00') <= nextWeek;

            const isReviewer = task.isReport && task.currentReviewer === currentUser;
            const hasCompletedReview = task.completedCollaborators?.includes(currentUser || '');

            const visuals = getTaskStatusVisuals(task.status, task.isReport, task.reportStage);

            let cardClasses = 'rounded-3xl border p-6 pl-8 shadow-xs transition-all duration-300 group flex flex-col h-full relative overflow-hidden bg-white';
            if (isCompleted) cardClasses = 'rounded-3xl border p-6 pl-8 shadow-xs transition-all duration-300 group flex flex-col h-full relative overflow-hidden bg-slate-50 opacity-80 border-slate-200';
            else if (isOverdue) cardClasses = 'rounded-3xl border p-6 pl-8 shadow-xs transition-all duration-300 group flex flex-col h-full relative overflow-hidden bg-white border-red-350 ring-2 ring-red-100';
            else cardClasses = `rounded-3xl border p-6 pl-8 shadow-xs hover:shadow-md transition-all duration-300 group flex flex-col h-full relative overflow-hidden bg-white ${visuals.borderColor}`;

            return (
              <div key={task.id} className={cardClasses}>
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${visuals.accentBar}`} />

                {isCompleted && (
                  <div className="absolute top-4 right-4 bg-emerald-500 text-white rounded-full p-1.5 z-10 shadow-lg">
                    <CheckCircle size={16} />
                  </div>
                )}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${visuals.badgeClass}`}>
                        {task.status}
                      </span>
                      {isOverdue && <AlertTriangle size={14} className="text-red-500" />}
                      {isDueSoon && <div className="w-3.5 h-3.5 rounded-full bg-amber-400 flex items-center justify-center text-white text-[8px] font-bold">!</div>}
                    </div>
                    {isReviewer && !hasCompletedReview && ( <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">REVISÃO PENDENTE (VOCÊ)</span> )}
                    {isReviewer && hasCompletedReview && ( <span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">VOCÊ CONCLUIU SUA COLABORAÇÃO</span> )}
                    {isCollaborator(task) && !isReviewer && (<span className="px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-indigo-50 text-indigo-600 border border-indigo-100">Você é Colaborador</span>)}
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onView(task)} className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition" title="Visualizar"><Eye size={16}/></button>
                    <button onClick={() => onEdit(task)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition" title="Editar"><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(task)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition" title="Excluir"><Trash2 size={16}/></button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[9px] font-black text-teal-800 uppercase tracking-widest mb-1">{task.project}</p>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight leading-tight uppercase" title={task.activity}>{task.activity}</h3>
                  <p className="text-[10px] font-medium text-slate-500 mt-1.5 leading-relaxed whitespace-pre-wrap">{task.description}</p>
                </div>

                <div className="space-y-1 mb-5">
                   <div className="flex justify-between items-end"><span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Avanço</span><span className="text-[10px] font-black text-slate-900">{task.progress}%</span></div>
                   <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden"><div className={`h-full transition-all duration-700 ${task.progress === 100 ? 'bg-emerald-500' : 'bg-teal-700'}`} style={{width: `${task.progress}%`}}></div></div>
                </div>

                <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100">
                   <div className="flex flex-col">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Líder</span>
                      <div className="flex items-center gap-2 mt-1">
                         <div className="w-5 h-5 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center text-[9px] font-black uppercase">{getInitials(task.projectLead)}</div>
                         <span className="text-[9px] font-bold text-slate-700 uppercase">{task.projectLead}</span>
                      </div>
                   </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-auto mb-4">
                   <p className="text-[8px] font-black text-teal-800 uppercase tracking-widest flex items-center gap-1.5 mb-1"><ArrowRight size={10} /> Próximo Passo</p>
                   <p className="text-[10px] font-black text-slate-800 leading-tight italic">"{task.nextStep || 'Não definido'}"</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  {!isCompleted && (
                    <div className={`flex items-center gap-2 ${isOverdue ? 'text-red-500' : 'text-slate-400'}`}>
                        {isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />}
                        <span className="text-[8px] font-bold uppercase">Prazo: {formatDateBR(task.completionDate)}</span>
                    </div>
                  )}
                  {isCompleted && <div className="flex-1"></div>}
                  {task.updates && task.updates.length > 0 && (<div className="flex items-center gap-1.5 text-teal-700 ml-auto"><MessageSquare size={12} /><span className="text-[9px] font-black">{task.updates.length}</span></div>)}
                </div>
              </div>
            );
          })}
          {sortedTasks.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
              <AlertTriangle className="mx-auto text-slate-300 mb-4" size={48} />
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest italic">Nenhuma atividade encontrada para os filtros selecionados.</p>
            </div>
          )}
        </div>
      )}

      {/* 7. KANBAN VIEW MODE */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['Planejada', 'Em Andamento', 'Pausado', 'Concluída'] as Status[]).map((colStatus) => {
            const colTasks = sortedTasks.filter(t => t.status === colStatus);
            const colLabel = colStatus === 'Pausado' ? 'Em Revisão / Pausado' : colStatus;

            return (
              <div key={colStatus} className="bg-slate-50 p-4 rounded-3xl border border-slate-200/80 space-y-3 min-h-[450px]">
                <div className="flex items-center justify-between px-2 pb-2 border-b border-slate-200/80">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">{colLabel}</h3>
                  <span className="text-[10px] font-black text-slate-500 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full">
                    {colTasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      onClick={() => onView(task)}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition cursor-pointer space-y-2.5"
                    >
                      <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest block">{task.project}</span>
                      <h4 className="text-xs font-black text-slate-900 leading-snug">{task.activity}</h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 font-bold">
                        <span>{task.projectLead}</span>
                        <span>{formatDateBR(task.completionDate)}</span>
                      </div>
                    </div>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="py-12 text-center text-slate-400 text-xs font-bold italic">
                      Nenhuma atividade
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 8. TIMELINE VIEW MODE */}
      {viewMode === 'timeline' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">Cronograma de Prazos</h3>
          <div className="relative border-l-2 border-slate-200 ml-4 space-y-6 py-2">
            {sortedTasks.map(task => (
              <div key={task.id} className="relative pl-6 group">
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 hover:bg-white hover:shadow-xs transition flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-[9px] font-black text-teal-800 uppercase tracking-widest">{task.project}</span>
                    <h4 className="text-sm font-black text-slate-900">{task.activity}</h4>
                    <p className="text-xs font-medium text-slate-500 mt-0.5">{task.description}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-slate-800 block">{formatDateBR(task.completionDate)}</span>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{task.status}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default TaskBoard;
