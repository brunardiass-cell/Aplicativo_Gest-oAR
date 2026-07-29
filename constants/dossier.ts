import { DossierChapterId, DDCMChapterDef, Project } from '../types';

export const DDCM_CHAPTERS: DDCMChapterDef[] = [
  {
    id: 'cap_1',
    code: '1.0',
    title: 'Capítulo 1 - Informações Gerais e Administrativas',
    shortTitle: 'Informações Gerais e Administrativas',
    description: 'Apresentação do ensaio clínico, identificação do patrocinador, justificativa regulatória e caracterização do produto vacinal.'
  },
  {
    id: 'cap_2',
    code: '2.0',
    title: 'Capítulo 2 - Dados Biológicos e Insumo Farmacêutico Ativo (IFA)',
    shortTitle: 'Dados Biológicos e IFA',
    description: 'Caracterização do antígeno, linhagem celular, vetores de expressão, processo de fermentação e purificação do IFA.'
  },
  {
    id: 'cap_3',
    code: '3.0',
    title: 'Capítulo 3 - Produto Terminado / Vacina Formulada',
    shortTitle: 'Produto Terminado / Vacina',
    description: 'Composição da vacina, adjuvantes, conservantes, envase, especificações de liberação e estudos de estabilidade.'
  },
  {
    id: 'cap_4',
    code: '4.0',
    title: 'Capítulo 4 - Estudos Não-Clínicos (Farmacologia e Toxicologia)',
    shortTitle: 'Estudos Não-Clínicos',
    description: 'Ensaios de imunogenicidade in vivo/in vitro, estudos de toxicidade de doses repetidas, tolerabilidade e segurança não-clínica.'
  },
  {
    id: 'cap_5',
    code: '5.0',
    title: 'Capítulo 5 - Estudos Clínicos e Plano de Desenvolvimento',
    shortTitle: 'Estudos Clínicos e Plano',
    description: 'Protocolo clínico proposto, brochura do investigador, plano de farmacovigilância e gerenciamento de riscos.'
  },
  {
    id: 'cap_6',
    code: '6.0',
    title: 'Capítulo 6 - Anexos e Documentos de Suporte Regulatório',
    shortTitle: 'Anexos e Documentos Suporte',
    description: 'Relatórios técnicos na íntegra, artigos de referência, certificados de análise (CoA) e correspondências da Anvisa.'
  }
];

export function getProjectDossierChapters(project?: Project): DDCMChapterDef[] {
  if (project?.dossierChapters && project.dossierChapters.length > 0) {
    return project.dossierChapters;
  }
  return DDCM_CHAPTERS;
}
