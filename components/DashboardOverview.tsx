
import React from 'react';
import { DashboardStats, Task, ProjectData, MacroTask } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Layers, Calendar, Target, FolderKanban } from 'lucide-react';

interface DashboardOverviewProps {
  stats: DashboardStats;
  tasks: Task[];
  projects: ProjectData[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, tasks, projects }) => {
  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444'];

  const statusData = [
    { name: 'Em Andamento', value: stats.inProgress },
    { name: 'Concluída', value: stats.completed },
    { name: 'Não Iniciada', value: tasks.filter(t => t.status === 'Não Iniciada').length },
    { name: 'Bloqueada', value: stats.blocked },
  ].filter(d => d.value > 0);

  const priorityData = [
    { name: 'Urgente', count: tasks.filter(t => t.priority === 'Urgente').length },
    { name: 'Alta', count: tasks.filter(t => t.priority === 'Alta').length },
    { name: 'Média', count: tasks.filter(t => t.priority === 'Média').length },
    { name: 'Baixa', count: tasks.filter(t => t.priority === 'Baixa').length },
  ];

  const calculateProjectProgress = (project: ProjectData) => {
    const allMacros = [...(project.trackingMacroTasks || []), ...(project.regulatoryMacroTasks || [])];
    if (allMacros.length === 0) return 0;
    
    const progressSum = allMacros.reduce((acc, macro) => {
      if (!macro.microTasks || macro.microTasks.length === 0) return acc;
      const completed = macro.microTasks.filter(m => m.status === 'Concluído').length;
      const validated = macro.microTasks.filter(m => m.status === 'Validado').length;
      const macroProgress = ((completed + validated * 0.8) / macro.microTasks.length) * 100;
      return acc + macroProgress;
    }, 0);

    return Math.round(progressSum / allMacros.length);
  };

  const activeProjects = projects.filter(p => p.status !== 'Concluído');

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Volume Total" 
          value={tasks.length} 
          icon={<Calendar className="text-indigo-600" size={24} />}
          color="bg-indigo-50"
        />
        <StatCard 
          label="Em Execução" 
          value={stats.inProgress} 
          icon={<Clock className="text-amber-600" size={24} />}
          color="bg-amber-50"
        />
        <StatCard 
          label="Entregas Mês" 
          value={stats.completed} 
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
          color="bg-emerald-50"
        />
        <StatCard 
          label="Média de Progresso" 
          value={`${stats.avgProgress}%`} 
          icon={<Target className="text-blue-600" size={24} />}
          color="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
            <FolderKanban size={14} className="text-indigo-600" /> Saúde dos Projetos Estratégicos
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {activeProjects.length > 0 ? activeProjects.map(proj => {
              const prog = calculateProjectProgress(proj);
              return (
                <div key={proj.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-tight truncate max-w-[180px]">{proj.name}</span>
                    <span className="text-[10px] font-black text-indigo-600 bg-white px-2 py-0.5 rounded border border-indigo-100">{prog}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 transition-all duration-1000" style={{width: `${prog}%`}}></div>
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase">Status: {proj.status}</p>
                </div>
              );
            }) : (
              <div className="col-span-full py-10 text-center border-2 border-dashed border-slate-100 rounded-xl">
                <p className="text-[10px] font-bold text-slate-300 uppercase italic">Sem projetos ativos.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Carga por Prioridade</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={10} fontWeight="black" axisLine={false} tickLine={false} width={60} />
                <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 6, 6, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between group hover:shadow-md transition-all">
    <div>
      <p className="text-[9px] uppercase tracking-[0.2em] font-black text-slate-400 mb-1">{label}</p>
      <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${color} transition-transform group-hover:scale-110 shadow-sm`}>
      {icon}
    </div>
  </div>
);

export default DashboardOverview;
