
import React, { useMemo, useState } from 'react';
import { Task, AppNotification, Project } from '../types';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Briefcase, CheckCircle, FolderKanban, Activity, AlertTriangle, FileSignature } from 'lucide-react';
import AlertsDetailModal from './AlertsDetailModal';

interface DashboardProps {
  tasks: Task[];
  projects: Project[];
  filteredUser: string | 'Todos';
  notifications: AppNotification[];
  onViewTaskDetails: (task: Task) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ tasks, projects, filteredUser, notifications, onViewTaskDetails }) => {
  const [isAlertModalOpen, setAlertModalOpen] = useState(false);
  const [alertModalContent, setAlertModalContent] = useState<{ title: string; items: any[] }>({ title: '', items: [] });
  
  const userTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.deleted) return false;
      if (filteredUser === 'Todos') return true;
      return t.projectLead === filteredUser || (Array.isArray(t.collaborators) && t.collaborators.includes(filteredUser)) || t.currentReviewer === filteredUser;
    });
  }, [tasks, filteredUser]);

  const lastMonthTasks = useMemo(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return userTasks.filter(t => new Date(t.requestDate) >= thirtyDaysAgo);
  }, [userTasks]);

  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const lateTasks = lastMonthTasks.filter(t => t.completionDate && new Date(t.completionDate + 'T00:00:00') < today && t.status !== 'Concluída');
    
    const projectsTracked = filteredUser === 'Todos'
        ? projects.length
        : projects.filter(p => p.responsible === filteredUser).length;

    return {
      total: lastMonthTasks.length,
      done: lastMonthTasks.filter(t => t.status === 'Concluída').length,
      ongoing: lastMonthTasks.filter(t => t.status === 'Em Andamento').length,
      late: lateTasks.length,
      projects: projectsTracked,
    };
  }, [lastMonthTasks, projects, filteredUser]);

  const priorityData = useMemo(() => [
    { name: 'Urgente', value: lastMonthTasks.filter(t => t.priority === 'Urgente').length, color: '#ef4444' },
    { name: 'Alta', value: lastMonthTasks.filter(t => t.priority === 'Alta').length, color: '#f59e0b' },
    { name: 'Média', value: lastMonthTasks.filter(t => t.priority === 'Média').length, color: '#6366f1' },
    { name: 'Baixa', value: lastMonthTasks.filter(t => t.priority === 'Baixa').length, color: '#94a3b8' },
  ], [lastMonthTasks]);

  const statusChartData = useMemo(() => [
    { name: 'Finalizadas', value: stats.done, color: '#10b981' },
    { name: 'Em Andamento', value: stats.ongoing, color: '#3b82f6' },
    { name: 'Atrasadas', value: stats.late, color: '#f43f5e' },
  ], [stats]);

  const upcomingTasks = useMemo(() => {
    const today = new Date();
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    return userTasks
      .filter(t => t.status !== 'Concluída' && t.completionDate && new Date(t.completionDate + 'T00:00:00') >= today && new Date(t.completionDate + 'T00:00:00') <= sevenDaysFromNow)
      .sort((a, b) => new Date(a.completionDate + 'T00:00:00').getTime() - new Date(b.completionDate + 'T00:00:00').getTime())
      .slice(0, 5);
  }, [userTasks]);

  const alerts = useMemo(() => {
    const overdue = userTasks.filter(t => t.completionDate && new Date(t.completionDate + 'T00:00:00') < new Date() && t.status !== 'Concluída');
    const pendingReviewNotifs = notifications.filter(n => (filteredUser === 'Todos' || n.userId === filteredUser) && !n.read && n.type === 'REVIEW_ASSIGNED');
    const pendingReviews = tasks.filter(task => pendingReviewNotifs.some(notif => notif.refId === task.id));
    const projectsAtRisk = [...new Set(overdue.map(t => t.project))].map(p => ({ id: p, name: p }));
    
    return {
      overdue,
      pendingReviews,
      projectsAtRisk,
    };
  }, [userTasks, notifications, filteredUser, tasks]);

  const handleAlertClick = (type: 'overdue' | 'pending' | 'risk') => {
    let title = '';
    let items: any[] = [];
    if (type === 'overdue') {
        title = 'Atividades Vencidas';
        items = alerts.overdue;
    } else if (type === 'pending') {
        title = 'Relatórios com Revisão Pendente';
        items = alerts.pendingReviews;
    } else if (type === 'risk') {
        title = 'Projetos em Risco de Atraso';
        items = alerts.projectsAtRisk;
    }
    setAlertModalContent({ title, items });
    setAlertModalOpen(true);
  };

  return (
    <div className="space-y-8">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Atividades no Mês" value={stats.total} icon={<Briefcase size={20}/>} color="bg-indigo-600" />
        <StatCard label="Finalizadas no Mês" value={stats.done} icon={<CheckCircle size={20}/>} color="bg-emerald-600" />
        <StatCard label="Projetos Acompanhados" value={stats.projects} icon={<FolderKanban size={20}/>} color="bg-sky-600" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChartContainer title="Nível de Prioridade das Atividades">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={priorityData} layout="vertical" margin={{ top: 0, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} width={80} stroke="#64748b" />
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} cursor={{fill: 'rgba(0,0,0,0.02)'}} />
              <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={25}>
                {priorityData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Status das Atividades (Mês)">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {statusChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Atividades Próximas do Prazo (7 dias)</h3>
           <div className="space-y-4">
             {upcomingTasks.length > 0 ? upcomingTasks.map(task => {
                const daysLeft = Math.ceil((new Date(task.completionDate + 'T00:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={task.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">{task.activity}</p>
                      <p className="text-[9px] font-bold text-blue-600 uppercase">{task.project}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase ${daysLeft <= 2 ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                       {daysLeft <= 1 ? 'Vence hoje/amanhã' : `Vence em ${daysLeft} dias`}
                    </div>
                  </div>
                )
             }) : <p className="text-center text-slate-400 text-xs py-10 italic">Nenhuma entrega nos próximos 7 dias.</p>}
           </div>
        </div>

        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
           <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Alertas e Notificações</h3>
           <div className="space-y-4">
             <AlertItem value={alerts.overdue.length} label="Atividade(s) Vencida(s)" icon={<AlertTriangle size={18}/>} color="text-red-500" onClick={() => handleAlertClick('overdue')}/>
             <AlertItem value={alerts.pendingReviews.length} label="Relatório(s) Pendente(s)" icon={<FileSignature size={18}/>} color="text-amber-500" onClick={() => handleAlertClick('pending')}/>
             <AlertItem value={alerts.projectsAtRisk.length} label="Projeto(s) em Atraso" icon={<Activity size={18}/>} color="text-blue-500" onClick={() => handleAlertClick('risk')}/>
           </div>
        </div>
      </div>

      {isAlertModalOpen && (
        <AlertsDetailModal 
            isOpen={isAlertModalOpen}
            onClose={() => setAlertModalOpen(false)}
            title={alertModalContent.title}
            items={alertModalContent.items}
            onItemClick={(task) => {
                setAlertModalOpen(false);
                onViewTaskDetails(task);
            }}
        />
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-5">
    <div className={`p-4 rounded-2xl ${color} text-white shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
  </div>
);

const ChartContainer: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">{title}</h3>
    {children}
  </div>
);

const AlertItem = ({ value, label, icon, color, onClick }: { value: number; label: string; icon: React.ReactNode; color: string; onClick?: () => void }) => (
  <button
    onClick={onClick}
    disabled={value === 0}
    className="w-full text-left bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center justify-between transition-all hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none"
  >
    <div className="flex items-center gap-4">
      <div className={`shrink-0 ${color}`}>{icon}</div>
      <p className="text-xs font-bold text-slate-900">{label}</p>
    </div>
    <div className={`px-4 py-1 rounded-full text-sm font-black ${value > 0 ? `${color} bg-white` : 'text-slate-400 bg-transparent'}`}>
      {value}
    </div>
  </button>
);

export default Dashboard;
