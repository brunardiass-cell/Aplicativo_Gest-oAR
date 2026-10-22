import React, { useState } from 'react';
import { Task, TaskGroup, Project, ActivityType, Status, Priority } from '../types';
import { X, Upload, FileSpreadsheet, FileText, Check, AlertCircle, Trash2, ArrowRight } from 'lucide-react';
import * as XLSX from 'xlsx';

interface RetroactiveImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  groups: TaskGroup[];
  projects: Project[];
  defaultGroup?: string;
  currentUser: string;
  onImport: (tasks: Task[]) => void;
}

interface PreviewItem {
  id: string;
  activity: string;
  type: ActivityType;
  group: string;
  project: string;
  status: Status;
  completionDate: string;
  requestDate: string;
  description: string;
}

export const RetroactiveImportModal: React.FC<RetroactiveImportModalProps> = ({
  isOpen,
  onClose,
  groups,
  projects,
  defaultGroup,
  currentUser,
  onImport
}) => {
  const [importMode, setImportMode] = useState<'text' | 'spreadsheet'>('text');
  
  // Text mode state
  const [textInput, setTextInput] = useState('');
  const [textDefaultType, setTextDefaultType] = useState<ActivityType>('general');
  const [textDefaultGroup, setTextDefaultGroup] = useState<string>(defaultGroup || (groups[0]?.name || 'Geral'));
  const [textDefaultProject, setTextDefaultProject] = useState<string>('Geral');
  const [textDefaultStatus, setTextDefaultStatus] = useState<Status>('Planejada');
  const [textDefaultDate, setTextDefaultDate] = useState<string>(''); // Vazio por padrão conforme solicitação

  // Preview items
  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [fileName, setFileName] = useState('');

  // Sincronizar grupo padrão e projeto quando o modal é aberto ou defaultGroup muda
  React.useEffect(() => {
    if (isOpen) {
      const initialGroup = defaultGroup || (groups[0]?.name || 'Geral');
      setTextDefaultGroup(initialGroup);
      const matched = groups.find(g => g.name === initialGroup);
      if (matched?.projectName) {
        setTextDefaultProject(matched.projectName);
      } else if (projects.length > 0) {
        setTextDefaultProject(projects[0].name);
      } else {
        setTextDefaultProject('Geral');
      }
      setTextDefaultDate(''); // Prazo vazio por padrão
      setTextDefaultStatus('Planejada');
    }
  }, [isOpen, defaultGroup, groups, projects]);

  if (!isOpen) return null;

  // Process text input into preview items
  const handleProcessText = () => {
    if (!textInput.trim()) return;

    const lines = textInput.split('\n').map(l => l.trim()).filter(Boolean);
    const items: PreviewItem[] = lines.map((line, idx) => {
      // Check if line has separators like ';' or '|'
      let title = line;
      let date = textDefaultDate || '';
      let status = textDefaultStatus;

      if (line.includes(';')) {
        const parts = line.split(';').map(p => p.trim());
        title = parts[0] || line;
        if (parts[1]) date = parts[1];
        if (parts[2]) status = parts[2] as Status;
      }

      return {
        id: `prev_text_${Date.now()}_${idx}`,
        activity: title,
        type: textDefaultType,
        group: textDefaultGroup,
        project: textDefaultProject,
        status: status,
        completionDate: date,
        requestDate: new Date().toISOString().split('T')[0],
        description: `Importada retroativamente via texto por ${currentUser}`
      };
    });

    setPreviewItems(items);
  };

  // Process Excel / CSV upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json: any[] = XLSX.utils.sheet_to_json(worksheet);

        const items: PreviewItem[] = json.map((row, idx) => {
          const title = row['Titulo'] || row['Título'] || row['Atividade'] || row['Nome'] || row['activity'] || `Atividade #${idx + 1}`;
          const group = row['Grupo'] || row['grupo'] || textDefaultGroup || 'Geral';
          const matchedGroup = groups.find(g => g.name === group);
          const project = row['Projeto'] || row['projeto'] || row['Project'] || matchedGroup?.projectName || textDefaultProject || 'Geral';
          const typeRaw = (row['Tipo'] || row['tipo'] || 'general').toLowerCase();
          
          let type: ActivityType = 'general';
          if (typeRaw.includes('reuni') || typeRaw.includes('meet')) type = 'meeting';
          else if (typeRaw.includes('relat') || typeRaw.includes('report')) type = 'report';
          else if (typeRaw.includes('nota') || typeRaw.includes('note')) type = 'note';

          const statusRaw = row['Status'] || row['status'] || 'Planejada';
          const date = row['Data'] || row['Conclusao'] || row['Conclusão'] || row['Prazo'] || '';
          const desc = row['Descricao'] || row['Descrição'] || row['description'] || `Importado via planilha ${file.name}`;

          return {
            id: `prev_sheet_${Date.now()}_${idx}`,
            activity: String(title).trim(),
            type,
            group: String(group).trim(),
            project: String(project).trim(),
            status: (statusRaw.includes('Concl') ? 'Concluída' : statusRaw.includes('Andamento') ? 'Em Andamento' : 'Planejada') as Status,
            completionDate: date ? String(date).trim() : '',
            requestDate: new Date().toISOString().split('T')[0],
            description: String(desc).trim()
          };
        });

        setPreviewItems(items);
      } catch (err) {
        console.error('Erro ao processar o arquivo:', err);
      }
    };

    reader.readAsBinaryString(file);
  };

  // Remove single item from preview
  const handleRemovePreviewItem = (id: string) => {
    setPreviewItems(prev => prev.filter(i => i.id !== id));
  };

  // Final confirmation: convert preview items to actual Tasks
  const handleConfirmImport = () => {
    if (previewItems.length === 0) return;

    const newTasks: Task[] = previewItems.map(item => {
      const isDone = item.status === 'Concluída';
      const matchedGroup = groups.find(g => g.name === item.group);
      const chosenProject = item.project || matchedGroup?.projectName || 'Geral';

      return {
        id: `task_retro_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        activity: item.activity,
        project: chosenProject,
        description: item.description,
        projectLead: currentUser || 'Usuário',
        collaborators: [],
        priority: 'Sem prioridade', // Vazia / Sem prioridade por padrão
        status: item.status,
        requestDate: item.requestDate || new Date().toISOString().split('T')[0],
        plannedStartDate: item.requestDate || new Date().toISOString().split('T')[0],
        completionDate: item.completionDate || '', // Vazio por padrão
        progress: isDone ? 100 : 0,
        nextStep: '',
        updates: [
          {
            id: `note_import_${Date.now()}_${Math.random()}`,
            date: new Date().toISOString(),
            user: currentUser,
            note: `Atividade retroativa importada em lote (Projeto: ${chosenProject}, Grupo: ${item.group || 'Geral'}${item.completionDate ? `, Prazo: ${item.completionDate}` : ', Sem prazo'}).`
          }
        ],
        isReport: item.type === 'report',
        activityType: item.type,
        group: item.group || 'Geral',
        groupId: matchedGroup?.id,
        isRegulatoryContribution: false, // Vazio / Não por padrão
        generatesRegulatoryContent: false
      };
    });

    onImport(newTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden border border-slate-100 flex flex-col animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <header className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
              Importação de Atividades Retroativas
            </h3>
            <p className="text-[11px] text-slate-400 font-semibold">
              Registre atividades já realizadas ou planejadas por texto ou planilha, vinculadas ao projeto e grupo corretos.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
          >
            <X size={16} />
          </button>
        </header>

        {/* Mode Selector Tabs */}
        <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => { setImportMode('text'); setPreviewItems([]); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              importMode === 'text' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={14} /> Importar por Texto
          </button>

          <button
            type="button"
            onClick={() => { setImportMode('spreadsheet'); setPreviewItems([]); }}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 ${
              importMode === 'spreadsheet' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileSpreadsheet size={14} className="text-emerald-600" /> Importar por Planilha (Excel/CSV)
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-5">
          
          {/* TAB 1: TEXTO */}
          {importMode === 'text' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Grupo Padrão</label>
                  <select
                    value={textDefaultGroup}
                    onChange={e => {
                      const gName = e.target.value;
                      setTextDefaultGroup(gName);
                      const matched = groups.find(g => g.name === gName);
                      if (matched?.projectName) {
                        setTextDefaultProject(matched.projectName);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    {groups.map(g => (
                      <option key={g.id} value={g.name}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Projeto</label>
                  <select
                    value={textDefaultProject}
                    onChange={e => setTextDefaultProject(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="Geral">Geral (Sem projeto)</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Tipo</label>
                  <select
                    value={textDefaultType}
                    onChange={e => setTextDefaultType(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="general">Tarefa / Geral</option>
                    <option value="meeting">Reunião</option>
                    <option value="report">Relatório</option>
                    <option value="note">Nota</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Status Padrão</label>
                  <select
                    value={textDefaultStatus}
                    onChange={e => setTextDefaultStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="Planejada">Planejada</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">Prazo (Opcional)</label>
                  <input
                    type="date"
                    value={textDefaultDate}
                    onChange={e => setTextDefaultDate(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-tight text-slate-700 block mb-1">
                  Cole as atividades (uma por linha)
                </label>
                <textarea
                  rows={6}
                  value={textInput}
                  onChange={e => setTextInput(e.target.value)}
                  placeholder="Exemplo:&#10;Ensaio de potência do lote L25-001&#10;Reunião com comitê gestor sobre adjuvante&#10;Relatório de validação analítica SpiN-UTG"
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p className="text-[10px] text-slate-400 mt-1">
                  Dica: Para definir prazos específicos por linha, use ponto-e-vírgula: <code>Título da atividade; 2024-05-15</code>
                </p>
              </div>

              <button
                type="button"
                onClick={handleProcessText}
                disabled={!textInput.trim()}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition"
              >
                Gerar Pré-visualização
              </button>
            </div>
          )}

          {/* TAB 2: PLANILHA */}
          {importMode === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center space-y-3 hover:border-teal-400 transition bg-slate-50/50">
                <FileSpreadsheet size={36} className="mx-auto text-emerald-600" />
                <div>
                  <p className="text-xs font-bold text-slate-700">Selecione ou arraste seu arquivo Excel (.xlsx, .xls) ou CSV</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Colunas suportadas: Titulo, Grupo, Projeto, Tipo, Prazo/Data, Status, Descricao</p>
                </div>
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black uppercase tracking-wider cursor-pointer transition">
                  <Upload size={14} /> Selecionar Arquivo
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                {fileName && <p className="text-xs font-black text-teal-700">Arquivo carregado: {fileName}</p>}
              </div>
            </div>
          )}

          {/* PRÉ-VISUALIZAÇÃO ANTES DA CONFIRMAÇÃO */}
          {previewItems.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                  <Check size={14} className="text-teal-600" />
                  Pré-visualização dos Registros ({previewItems.length})
                </h4>
                <span className="text-[10px] font-bold text-slate-400">Revise os dados antes de salvar</span>
              </div>

              <div className="border border-slate-200 rounded-2xl overflow-hidden max-h-56 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase text-slate-400">
                      <th className="py-2 px-3">Atividade</th>
                      <th className="py-2 px-2">Tipo</th>
                      <th className="py-2 px-2">Grupo</th>
                      <th className="py-2 px-2">Projeto</th>
                      <th className="py-2 px-2">Prazo</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewItems.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50">
                        <td className="py-2 px-3 font-bold text-slate-900">{item.activity}</td>
                        <td className="py-2 px-2">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-700">
                            {item.type}
                          </span>
                        </td>
                        <td className="py-2 px-2 font-semibold text-slate-600">{item.group}</td>
                        <td className="py-2 px-2 font-semibold text-teal-700">{item.project || 'Geral'}</td>
                        <td className="py-2 px-2 font-semibold text-slate-500">
                          {item.completionDate || <span className="text-slate-400 italic">Sem prazo</span>}
                        </td>
                        <td className="py-2 px-2">
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase ${
                            item.status === 'Concluída' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemovePreviewItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                            title="Remover da lista"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition"
          >
            Cancelar
          </button>
          
          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={previewItems.length === 0}
            className="px-6 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-sm flex items-center gap-2"
          >
            <Check size={14} />
            Confirmar Importação ({previewItems.length} registros)
          </button>
        </div>

      </div>
    </div>
  );
};
