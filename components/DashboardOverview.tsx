
import React from 'react';
import { DashboardStats, Task, ProjectData } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { CheckCircle2, Clock, Target, Calendar, Activity, BarChart3, AlertTriangle, Briefcase } from 'lucide-react';

interface DashboardOverviewProps {
  stats: DashboardStats;
  tasks: Task[];
  projects: ProjectData[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, tasks, projects }) => {
  const priorityData = [
    { name: 'Urgente', count: tasks.filter(t => t.priority === 'Urgente').length, color: '#ef4444' },
    { name: 'Alta', count: tasks.filter(t => t.priority === 'Alta').length, color: '#f59e0b' },
    { name: 'Média', count: tasks.filter(t => t.priority === 'Média').length, color: '#6366f1' },
    { name: 'Baixa', count: tasks.filter(t => t.priority === 'Baixa').length, color: '#94a3b8' },
  ];

  const calculateProjectProgress = (project: ProjectData) => {
    const allMacros = [...(project.trackingMacroTasks || []), ...(project.regulatoryMacroTasks || [])];
    if (allMacros.length === 0) return 0;
    const progressSum = allMacros.reduce((acc, macro) => {
      if (!macro.microTasks || macro.microTasks.length === 0) return acc;
      const done = macro.microTasks.filter(m => m.status === 'Concluído' || m.status === 'Validado').length;
      return acc + (done / macro.microTasks.length) * 100;
    }, 0);
    return Math.round(progressSum / allMacros.length);
  };

  const projectHealth = projects.map(p => ({
    name: p.name,
    progress: calculateProjectProgress(p)
  })).filter(p => tasks.some(t => t.project === p.name));

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Cards de KPIs Principais */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Total Atividades" value={stats.totalTasks} icon={<Briefcase size={20}/>} color="bg-indigo-600" />
        <StatCard label="Entregas no Mês" value={stats.monthlyDeliveries} icon={<CheckCircle2 size={20}/>} color="bg-emerald-600" />
        <StatCard label="Em Execução" value={stats.inExecution} icon={<Activity size={20}/>} color="bg-blue-600" />
        <StatCard label="Média Progresso" value={`${stats.avgProgress}%`} icon={<Target size={20}/>} color="bg-amber-600" />
        <StatCard label="Bloqueadas" value={stats.blockedCount} icon={<AlertTriangle size={20}/>} color="bg-red-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Gráfico de Carga de Prioridade */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Carga de Prioridade</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8fafc'}} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={30}>
                  {priorityData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Saúde dos Projetos */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[2rem] shadow-sm border border-slate-200">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-8">Saúde dos Projetos (Progresso Real)</h3>
          <div className="space-y-6 max-h-[300px] overflow-y-auto pr-4 custom-scrollbar">
            {projectHealth.length > 0 ? projectHealth.map(proj => (
              <div key={proj.name} className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs font-black text-slate-700 uppercase">{proj.name}</span>
                  <span className="text-[10px] font-bold text-indigo-600">{proj.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full transition-all duration-1000 ${proj.progress > 80 ? 'bg-emerald-500' : proj.progress > 40 ? 'bg-indigo-500' : 'bg-amber-500'}`} style={{width: `${proj.progress}%`}}></div>
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-400 text-xs py-20 italic">Selecione projetos ou membros para ver a saúde.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: any, color: string }) => (
  <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
    <div className={`p-3 rounded-2xl ${color} text-white shadow-lg`}>{icon}</div>
    <div>
      <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
      <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
  </div>
);

export default DashboardOverview;
