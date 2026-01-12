
import React, { useState } from 'react';
import { AppConfig, ProjectData } from '../types';
import { X, Mail, Save, BellRing, FolderKanban, Plus, Trash2, Edit3, Check } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AppConfig;
  onSave: (config: AppConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, config, onSave }) => {
  const [localConfig, setLocalConfig] = useState<AppConfig>(config);
  const [newProjectName, setNewProjectName] = useState('');
  const [editingProjectIndex, setEditingProjectIndex] = useState<number | null>(null);
  const [editingProjectName, setEditingProjectName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localConfig);
    onClose();
  };

  const addProject = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    if (localConfig.projectsData.some(p => p.name === newProjectName.trim())) {
      alert('Este projeto já existe.');
      return;
    }
    
    const newProject: ProjectData = {
      id: Math.random().toString(36).substring(2, 9),
      name: newProjectName.trim(),
      status: 'Em Planejamento',
      trackingChecklist: [],
      regulatoryChecklist: []
    };

    setLocalConfig({
      ...localConfig,
      projectsData: [...localConfig.projectsData, newProject]
    });
    setNewProjectName('');
  };

  const removeProject = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    const project = localConfig.projectsData.find(p => p.id === projectId);
    if (window.confirm(`Tem certeza que deseja remover o projeto "${project?.name}"?`)) {
      setLocalConfig({
        ...localConfig,
        projectsData: localConfig.projectsData.filter(p => p.id !== projectId)
      });
    }
  };

  const startEditProject = (e: React.MouseEvent, index: number, name: string) => {
    e.preventDefault();
    setEditingProjectIndex(index);
    setEditingProjectName(name);
  };

  const saveEditProject = (e?: React.FormEvent | React.FocusEvent | React.KeyboardEvent) => {
    if (e && 'preventDefault' in e) e.preventDefault();
    if (!editingProjectName.trim()) {
      setEditingProjectIndex(null);
      return;
    };
    const updatedProjects = [...localConfig.projectsData];
    updatedProjects[editingProjectIndex!] = {
      ...updatedProjects[editingProjectIndex!],
      name: editingProjectName.trim()
    };
    setLocalConfig({ ...localConfig, projectsData: updatedProjects });
    setEditingProjectIndex(null);
    setEditingProjectName('');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <BellRing size={20} className="text-indigo-600" />
            Configurações do Sistema
          </h2>
          <button type="button" onClick={onClose} className="p-2 hover:bg-slate-200 rounded-lg transition">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[80vh]">
          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
            {/* Email Settings */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-2">
                <Mail size={16} className="text-indigo-500" />
                E-mail para Notificações
              </label>
              <input
                type="email"
                required
                placeholder="exemplo@empresa.com"
                value={localConfig.notificationEmail}
                onChange={(e) => setLocalConfig({ ...localConfig, notificationEmail: e.target.value })}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition"
              />
            </div>

            {/* Project Management */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <FolderKanban size={16} className="text-indigo-600" />
                Gerenciar Nomes de Projetos
              </label>
              
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Novo nome de projeto..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addProject(e as any)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addProject}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 text-sm font-bold shadow-md"
                >
                  <Plus size={18} /> Adicionar
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="px-4 py-3">Nome do Projeto</th>
                      <th className="px-4 py-3 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {localConfig.projectsData.map((project, index) => (
                      <tr key={project.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-4 py-3">
                          {editingProjectIndex === index ? (
                            <div className="flex gap-1">
                              <input
                                type="text"
                                autoFocus
                                value={editingProjectName}
                                onChange={(e) => setEditingProjectName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveEditProject(e)}
                                className="flex-1 px-2 py-1 border border-indigo-300 rounded outline-none text-sm"
                              />
                            </div>
                          ) : (
                            <span className="font-semibold text-slate-700">{project.name}</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {editingProjectIndex === index ? (
                              <button 
                                type="button" 
                                onClick={(e) => saveEditProject(e)} 
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                title="Salvar"
                              >
                                <Check size={16} />
                              </button>
                            ) : (
                              <>
                                <button 
                                  type="button" 
                                  onClick={(e) => startEditProject(e, index, project.name)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Editar"
                                >
                                  <Edit3 size={16} />
                                </button>
                                <button 
                                  type="button" 
                                  onClick={(e) => removeProject(e, project.id)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Remover"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {localConfig.projectsData.length === 0 && (
                      <tr>
                        <td colSpan={2} className="px-4 py-8 text-center text-slate-400 italic">Nenhum projeto cadastrado. Adicione um acima.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-slate-500 hover:bg-slate-200 rounded-xl transition font-bold uppercase text-[10px] tracking-widest"
            >
              Descartar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 font-bold uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
            >
              <Save size={16} />
              Confirmar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SettingsModal;
