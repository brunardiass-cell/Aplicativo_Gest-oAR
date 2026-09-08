export interface MicroTemplateChecklistItem {
  id: string;
  item: string;
}

export interface MicroTemplateDependency {
  id: string;
  fromItem: string;
  toItem: string;
}

export interface MicroOperationalTemplate {
  id: string;
  name: string;
  targetUsage: string;
  description?: string;
  checklist: MicroTemplateChecklistItem[];
  internalDependencies: MicroTemplateDependency[];
  isCustom?: boolean;
}

export const DEFAULT_MICRO_TEMPLATES: MicroOperationalTemplate[] = [
  {
    id: 'tmpl_servico_contratacao',
    name: 'Serviço / contratação',
    targetUsage: 'Contratação de serviço',
    description: 'Template para terceirização e contratação de serviços técnicos ou CROs',
    checklist: [
      { id: 'c1', item: 'Definir escopo' },
      { id: 'c2', item: 'Solicitar orçamento' },
      { id: 'c3', item: 'Avaliar propostas' },
      { id: 'c4', item: 'Aprovar contrato' },
      { id: 'c5', item: 'Revisar relatório final' }
    ],
    internalDependencies: [
      { id: 'd1', fromItem: 'Solicitar orçamento', toItem: 'Avaliar propostas' },
      { id: 'd2', fromItem: 'Aprovar contrato', toItem: 'Revisar relatório final' }
    ]
  },
  {
    id: 'tmpl_dev_processo',
    name: 'Desenvolvimento de processo',
    targetUsage: 'Desenvolvimento técnico',
    description: 'Planejamento, execução experimental e parâmetros consolidados',
    checklist: [
      { id: 'c1', item: 'Definir objetivo e requisitos' },
      { id: 'c2', item: 'Elaborar desenho experimental (DoE)' },
      { id: 'c3', item: 'Executar bateladas de bancada' },
      { id: 'c4', item: 'Avaliar resultados estatísticos' },
      { id: 'c5', item: 'Consolidar relatório técnico' }
    ],
    internalDependencies: [
      { id: 'd1', fromItem: 'Elaborar desenho experimental (DoE)', toItem: 'Executar bateladas de bancada' },
      { id: 'd2', fromItem: 'Executar bateladas de bancada', toItem: 'Avaliar resultados estatísticos' }
    ]
  },
  {
    id: 'tmpl_controle_qualidade',
    name: 'Controle de qualidade analítico',
    targetUsage: 'Controle de qualidade',
    description: 'Ensaios físico-químicos e biológicos com liberação formal',
    checklist: [
      { id: 'c1', item: 'Elaborar protocolo de análise' },
      { id: 'c2', item: 'Calibrar equipamentos e insumos' },
      { id: 'c3', item: 'Executar ensaios analíticos' },
      { id: 'c4', item: 'Conferir critérios de aceitação' },
      { id: 'c5', item: 'Emitir laudo analítico e aprovação' }
    ],
    internalDependencies: [
      { id: 'd1', fromItem: 'Elaborar protocolo de análise', toItem: 'Executar ensaios analíticos' },
      { id: 'd2', fromItem: 'Executar ensaios analíticos', toItem: 'Emitir laudo analítico e aprovação' }
    ]
  },
  {
    id: 'tmpl_doc_regulatorio',
    name: 'Documento regulatório',
    targetUsage: 'Assuntos regulatórios',
    description: 'Elaboração, compilação de dados, revisão técnica e submissão',
    checklist: [
      { id: 'c1', item: 'Mapear requisitos da RDC/Guia Anvisa' },
      { id: 'c2', item: 'Compilar relatórios e dados primários' },
      { id: 'c3', item: 'Redigir texto técnico do dossiê' },
      { id: 'c4', item: 'Revisão multidisciplinar de garantia da qualidade' },
      { id: 'c5', item: 'Aprovação final e submissão' }
    ],
    internalDependencies: [
      { id: 'd1', fromItem: 'Compilar relatórios e dados primários', toItem: 'Redigir texto técnico do dossiê' },
      { id: 'd2', fromItem: 'Redigir texto técnico do dossiê', toItem: 'Revisão multidisciplinar de garantia da qualidade' }
    ]
  }
];

const LOCAL_STORAGE_KEY = 'ctvacinas_micro_templates';

export function loadMicroTemplates(): MicroOperationalTemplate[] {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error loading micro templates from localStorage', e);
  }
  return DEFAULT_MICRO_TEMPLATES;
}

export function saveMicroTemplates(templates: MicroOperationalTemplate[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error('Error saving micro templates to localStorage', e);
  }
}
