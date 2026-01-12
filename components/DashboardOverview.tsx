
import React from 'react';
import { DashboardStats, Task } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CheckCircle2, Clock, AlertCircle, Layers, Calendar } from 'lucide-react';

interface DashboardOverviewProps {
  stats: DashboardStats;
  tasks: Task[];
}

const DashboardOverview: React.FC<DashboardOverviewProps> = ({ stats, tasks }) => {
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Tarefas Últimos 30 dias" 
          value={stats.totalLastMonth} 
          icon={<Calendar className="text-indigo-600" size={24} />}
          color="bg-indigo-50"
        />
        <StatCard 
          label="Em Andamento" 
          value={stats.inProgress} 
          icon={<Clock className="text-amber-600" size={24} />}
          color="bg-amber-50"
        />
        <StatCard 
          label="Concluídas" 
          value={stats.completed} 
          icon={<CheckCircle2 className="text-emerald-600" size={24} />}
          color="bg-emerald-50"
        />
        <StatCard 
          label="Progresso Médio" 
          value={`${stats.avgProgress}%`} 
          icon={<AlertCircle className="text-blue-600" size={24} />}
          color="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Atividades do Mês por Prioridade</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-6">Status do Mês</h3>
          <div className="h-72 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-col gap-2 ml-4">
              {statusData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                  <span className="text-sm text-slate-600">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 text-slate-400 uppercase tracking-widest text-xs">Tarefas do Mês</h3>
        <div className="space-y-4">
          {tasks.slice(0, 5).map(task => (
            <div key={task.id} className="flex items-start gap-4 p-4 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
              <div className={`mt-1 p-2 rounded-full ${task.priority === 'Urgente' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
                <AlertCircle size={16} />
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium text-slate-900">{task.activity}</h4>
                  <span className="text-[10px] font-bold text-indigo-600 px-2 py-0.5 bg-indigo-50 rounded uppercase">{task.project}</span>
                </div>
                <p className="text-sm text-slate-500 mt-1 line-clamp-1 italic">{task.description}</p>
              </div>
            </div>
          ))}
          {tasks.length === 0 && <p className="text-center py-8 text-slate-400">Nenhuma tarefa registrada nos últimos 30 dias.</p>}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string | number; icon: React.ReactNode; color: string }> = ({ label, value, icon, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
    <div>
      <p className="text-[11px] uppercase tracking-widest font-bold text-slate-400">{label}</p>
      <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{value}</h3>
    </div>
    <div className={`p-4 rounded-2xl ${color} shadow-sm`}>
      {icon}
    </div>
  </div>
);

export default DashboardOverview;
