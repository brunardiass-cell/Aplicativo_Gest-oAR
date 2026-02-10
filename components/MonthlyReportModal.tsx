
import React from 'react';
import { Task, Status } from '../types';
import { X, Printer, FileText } from 'lucide-react';

interface MonthlyReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  filteredUser: string | 'Todos';
  filters: {
    dateFilterType: 'all' | 'requestDate' | 'completionDate';
    startDateFilter: string;
    endDateFilter: string;
    projectFilter: string;
    statusFilter: 'Todos' | Status;
    leadFilter: string;
  };
}

const generateMonthlyReport = (tasks: Task[], filteredUser: string | 'Todos', filters: MonthlyReportModalProps['filters']): string => {
  const reportDate = new Date().toLocaleDateString('pt-BR');
  
  let reportTitle = `RELATÓRIO DE ATIVIDADES - ${filteredUser === 'Todos' ? 'GERAL' : filteredUser.toUpperCase()}\n`;
  reportTitle += `Gerado em: ${reportDate}\n\n`;

  let filterSummary = 'FILTROS APLICADOS:\n';
  let hasFilters = false;

  if (filters.projectFilter !== 'Todos') {
    filterSummary += `  - Projeto: ${filters.projectFilter}\n`;
    hasFilters = true;
  }
  if (filters.statusFilter !== 'Todos') {
    filterSummary += `  - Status: ${filters.statusFilter}\n`;
    hasFilters = true;
  }
  if (filteredUser === 'Todos' && filters.leadFilter !== 'Todos') {
    filterSummary += `  - Responsável: ${filters.leadFilter}\n`;
    hasFilters = true;
  }

  if (filters.dateFilterType !== 'all' && (filters.startDateFilter || filters.endDateFilter)) {
    const type = filters.dateFilterType === 'requestDate' ? 'Solicitação' : 'Entrega';
    const start = filters.startDateFilter ? new Date(filters.startDateFilter + 'T00:00:00').toLocaleDateString('pt-BR') : 'Início';
    const end = filters.endDateFilter ? new Date(filters.endDateFilter + 'T00:00:00').toLocaleDateString('pt-BR') : 'Fim';
    filterSummary += `  - Período de ${type}: ${start} a ${end}\n`;
    hasFilters = true;
  }

  if (!hasFilters) {
    filterSummary += '  - Nenhum filtro de período, projeto ou status aplicado.\n';
  }

  reportTitle += filterSummary;
  reportTitle += `\nTotal de ${tasks.length} atividades encontradas.\n`;
  reportTitle += '==================================================\n\n';
  
  let reportText = reportTitle;

  if (tasks.length === 0) {
    reportText += 'Nenhuma atividade encontrada para os filtros selecionados.';
    return reportText;
  }

  tasks.forEach(task => {
    reportText += `ATIVIDADE: ${task.activity.toUpperCase()}\n`;
    reportText += `--------------------------------------------------\n`;

    const isCollaborator = filteredUser !== 'Todos' && task.collaborators?.includes(filteredUser) && task.projectLead !== filteredUser;
    if (isCollaborator) {
      reportText += `  - SEU PAPEL:  Colaborador\n`;
    }

    reportText += `  - Projeto:    ${task.project}\n`;
    reportText += `  - Status:     ${task.status} (${task.progress}%)\n`;
    reportText += `  - Prioridade: ${task.priority}\n`;
    reportText += `  - Solicitação: ${task.requestDate ? new Date(task.requestDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}\n`;
    reportText += `  - Prazo:      ${task.completionDate ? new Date(task.completionDate + 'T00:00:00').toLocaleDateString('pt-BR') : 'N/D'}\n`;
    reportText += `  - Líder:      ${task.projectLead}\n`;
    reportText += `  - Próximo Passo: ${task.nextStep || 'Não definido.'}\n\n`;
  });
  
  return reportText;
};

const MonthlyReportModal: React.FC<MonthlyReportModalProps> = ({ isOpen, onClose, tasks, filteredUser, filters }) => {
  if (!isOpen) return null;

  const reportContent = generateMonthlyReport(tasks, filteredUser, filters);
  
  const handlePrint = () => {
    const printableContent = `
      <html>
        <head>
          <title>Relatório Mensal de Atividades</title>
          <style>
            body { font-family: monospace; line-height: 1.6; color: #333; }
            pre { white-space: pre-wrap; word-wrap: break-word; }
          </style>
        </head>
        <body>
          <pre>${reportContent}</pre>
        </body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(printableContent);
    printWindow?.document.close();
    printWindow?.focus();
    printWindow?.print();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in-slow">
        <header className="px-8 py-6 border-b border-slate-700 flex justify-between items-center bg-slate-800 text-white">
          <div className="flex items-center gap-4">
            <div className="p-2 bg-brand-primary/80 rounded-lg shadow-lg">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Relatório de Atividades</h2>
              <p className="text-xs text-slate-400 font-medium">Resumo baseado nos filtros atuais</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50">
          <pre className="whitespace-pre-wrap text-slate-600 leading-relaxed font-mono text-sm bg-white p-6 rounded-lg border border-slate-200">
            {reportContent}
          </pre>
        </div>

        <footer className="px-8 py-4 border-t border-slate-200 bg-white flex justify-end items-center gap-3">
          <button 
            onClick={handlePrint}
            className="px-5 py-2.5 text-slate-600 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm"
          >
            <Printer size={16} />
            Imprimir Relatório
          </button>
          <button 
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition shadow-lg text-xs font-bold uppercase tracking-wider"
          >
            Fechar
          </button>
        </footer>
      </div>
    </div>
  );
};

export default MonthlyReportModal;
