
import { ActivityPlanTemplate, TeamMember, AppUser, RegulatoryStandard, Meeting, TaskGroup } from './types';

export const DEFAULT_TASK_GROUPS: TaskGroup[] = [
  { id: 'group_spin_utg', name: 'SpiN-UTG', projectName: 'SpiN-UTG', color: '#0d9488', createdAt: new Date().toISOString(), createdBy: 'Sistema' },
  { id: 'group_leishtec', name: 'Leishtec', projectName: 'Leishtec', color: '#2563eb', createdAt: new Date().toISOString(), createdBy: 'Sistema' },
  { id: 'group_regulatorio', name: 'Assuntos Regulatórios', color: '#7c3aed', createdAt: new Date().toISOString(), createdBy: 'Sistema' },
  { id: 'group_geral', name: 'Geral', color: '#64748b', createdAt: new Date().toISOString(), createdBy: 'Sistema' }
];

export const DEFAULT_APP_USERS: AppUser[] = [
  {
    id: 'user_admin_bruna',
    username: 'Bruna Rodrigues',
    email: 'brunardias@outlook.com',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_admin_bruna_corp',
    username: 'Bruna Dias',
    email: 'brunadias@ctvacinas.org',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_admin_bruna_gmail',
    username: 'Bruna Dias',
    email: 'brunardiass@gmail.com',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_admin_graziella',
    username: 'Graziella Rivelli',
    email: 'graziellarivelli@ctvacinas.org',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_team_marjorie',
    username: 'Marjorie',
    email: 'marjoriecoimbra@gmail.com',
    role: 'user_team_3',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_team_ester_gmail',
    username: 'Ester Roffe',
    email: 'tecaester@gmail.com',
    role: 'user_team_2',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_user_ester',
    username: 'Ester (Acesso)',
    email: 'ester@ctvacinas.org',
    role: 'user_team_2',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_team_analuiza',
    username: 'Ana Luiza',
    email: 'analuiza@ctvacinas.org',
    role: 'user_team_4',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_team_anaterzian',
    username: 'Ana Terzian',
    email: 'anaterzian@ctvacinas.org',
    role: 'user_team_5',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_admin_priscila',
    username: 'Priscila Passos',
    email: 'priscilapassos@ctvacinas.org',
    role: 'admin',
    status: 'active',
    joinedAt: new Date().toISOString()
  },
  {
    id: 'user_user_general',
    username: 'Usuário Geral',
    email: 'geral@ctvacinas.org',
    role: 'user_general',
    status: 'active',
    joinedAt: new Date().toISOString()
  }
];

export const getAccountEmails = (account: any): string[] => {
  if (!account) return [];
  const emails = new Set<string>();

  if (account.username) {
    emails.add(account.username.toLowerCase().trim());
  }

  const claims = account.idTokenClaims as any;
  if (claims) {
    if (typeof claims.email === 'string') emails.add(claims.email.toLowerCase().trim());
    if (typeof claims.preferred_username === 'string') emails.add(claims.preferred_username.toLowerCase().trim());
    if (typeof claims.upn === 'string') emails.add(claims.upn.toLowerCase().trim());
    if (typeof claims.unique_name === 'string') emails.add(claims.unique_name.toLowerCase().trim());
    if (Array.isArray(claims.emails)) {
      claims.emails.forEach((e: any) => typeof e === 'string' && emails.add(e.toLowerCase().trim()));
    }
    if (Array.isArray(claims.otherMails)) {
      claims.otherMails.forEach((e: any) => typeof e === 'string' && emails.add(e.toLowerCase().trim()));
    }
  }

  // Handle Azure AD B2B / Guest #EXT# emails (e.g. tecaester_gmail.com#EXT#@... -> tecaester@gmail.com)
  for (const email of Array.from(emails)) {
    if (email.includes('#ext#') || email.includes('#EXT#')) {
      const prefix = email.split(/#ext#/i)[0];
      const lastUnderscore = prefix.lastIndexOf('_');
      if (lastUnderscore > 0) {
        const converted = prefix.substring(0, lastUnderscore) + '@' + prefix.substring(lastUnderscore + 1);
        emails.add(converted.toLowerCase().trim());
      }
    }
  }

  return Array.from(emails).filter(Boolean);
};

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm_1', name: 'Graziella', role: 'Líder', isLeader: true, password: 'admin' },
  { id: 'tm_2', name: 'Bruna Dias', role: 'Líder', isLeader: true, password: 'admin' },
  { id: 'tm_3', name: 'Ester', role: 'Equipe', isLeader: false },
  { id: 'tm_4', name: 'Marjorie', role: 'Equipe', isLeader: false },
  { id: 'tm_5', name: 'Ana Luiza', role: 'Equipe', isLeader: false },
  { id: 'tm_6', name: 'Ana Terzian', role: 'Equipe', isLeader: false },
  { id: 'tm_comite', name: 'Comitê Gestor', role: 'Gestão', isLeader: false, isComiteGestor: true }
];

export const normalizeName = (name?: string): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const isNameMatch = (targetName?: string, currentUserName?: string): boolean => {
  if (!targetName || !currentUserName) return false;
  const t = normalizeName(targetName);
  const c = normalizeName(currentUserName);
  if (!t || !c) return false;
  if (t === c) return true;

  // Specific profiles handling:
  // "bruna" <-> "bruna dias" / "bruna rodrigues"
  const isTBruna = t.startsWith('bruna');
  const isCBruna = c.startsWith('bruna');
  if (isTBruna && isCBruna) return true;
  if ((isTBruna && !isCBruna) || (!isTBruna && isCBruna)) return false;

  // "graziella"
  const isTGraziella = t.startsWith('graziella');
  const isCGraziella = c.startsWith('graziella');
  if (isTGraziella && isCGraziella) return true;
  if ((isTGraziella && !isCGraziella) || (!isTGraziella && isCGraziella)) return false;

  // "ester"
  const isTEster = t.startsWith('ester');
  const isCEster = c.startsWith('ester');
  if (isTEster && isCEster) return true;
  if ((isTEster && !isCEster) || (!isTEster && isCEster)) return false;

  // "marjorie"
  const isTMarjorie = t.startsWith('marjorie');
  const isCMarjorie = c.startsWith('marjorie');
  if (isTMarjorie && isCMarjorie) return true;
  if ((isTMarjorie && !isCMarjorie) || (!isTMarjorie && isCMarjorie)) return false;

  // "ana luiza" vs "ana terzian"
  const isTAnaLuiza = t.includes('ana luiza') || t.includes('ana luisa');
  const isCAnaLuiza = c.includes('ana luiza') || c.includes('ana luisa');
  if (isTAnaLuiza || isCAnaLuiza) return isTAnaLuiza && isCAnaLuiza;

  const isTAnaTerzian = t.includes('ana terzian');
  const isCAnaTerzian = c.includes('ana terzian');
  if (isTAnaTerzian || isCAnaTerzian) return isTAnaTerzian && isCAnaTerzian;

  // Fallback: check first token if not ambiguous
  const tFirst = t.split(/\s+/)[0];
  const cFirst = c.split(/\s+/)[0];
  if (tFirst && cFirst && tFirst === cFirst && tFirst !== 'ana') {
    return true;
  }

  return false;
};

export const ADMIN_WHITELIST = [
  'brunadias@ctvacinas.org',
  'brunardias@outlook.com',
  'brunardiass@gmail.com',
  'graziellarivelli@ctvacinas.org',
  'priscilapassos@ctvacinas.org'
];

export const VACCINE_PLATFORM_PHASES = [
  'FASE 1 — Descoberta / Prova de Conceito',
  'FASE 2 — Desenvolvimento Não Clínico',
  'FASE 3 — Documentação Regulatória',
  'FASE 4 — Submissão / Aprovação',
  'FASE 5 — Estudos Clínicos Fase I',
  'FASE 6 — Estudos Clínicos Fase II',
  'FASE 7 — Estudos Clínicos Fase III'
];

export const DEFAULT_ACTIVITY_PLANS: ActivityPlanTemplate[] = [
  {
    id: 'plan_recombinant_protein',
    name: 'Plano-Base: Proteína Recombinante',
    platform: 'Proteína Recombinante',
    description: 'Plano de desenvolvimento regulatório de referência para candidatos baseados em proteínas recombinantes.',
    phases: VACCINE_PLATFORM_PHASES,
    macroActivities: [
      // FASE 1
      {
        name: 'Revisão da literatura',
        phase: VACCINE_PLATFORM_PHASES[0],
        microActivities: ['Mapeamento de alvos antigênicos', 'Levantamento de patentes e anterioridades', 'Análise de imunodominância de epítopos'],
        keyDecisions: ['A literatura suporta imunogenicidade cruzada?', 'Existe liberdade de operação (FTO) para a sequência?'],
        regulatoryPoints: ['Documentação de estado da arte para contextualização na Brochura do Investigador.'],
        technicalJustifications: ['Racional biológico e imunológico da escolha da proteína.'],
        referenceGuides: [
          { title: 'WHO TRS 924 – Guidelines on Biological Standardization', link: 'https://www.who.int' }
        ]
      },
      {
        name: 'Ideia e definição do candidato',
        phase: VACCINE_PLATFORM_PHASES[0],
        microActivities: ['Modelagem tridimensional in silico', 'Desenho de mutações estabilizadoras', 'Seleção do sistema de expressão heterólogo'],
        keyDecisions: ['Qual o sistema de expressão preferencial (E. coli, Pichia pastoris ou células de mamífero)?', 'Foi incluída tag de purificação clivável?'],
        regulatoryPoints: ['Rastreabilidade da linhagem celular e histórico do vetor de clonagem.'],
        technicalJustifications: ['Justificativa da integridade conformacional do candidato.'],
        referenceGuides: [
          { title: 'ICH Q5D – Derivation and Characterisation of Cell Substrates', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Validação do candidato',
        phase: VACCINE_PLATFORM_PHASES[0],
        microActivities: ['Expressão piloto em bancada', 'Purificação por cromatografia de afinidade', 'Ensaio preliminar de reconhecimento imune (ELISA/Western Blot)'],
        keyDecisions: ['O rendimento de expressão viabiliza escalonamento?', 'O antígeno é reconhecido por soros convalescentes?'],
        regulatoryPoints: ['Especificações preliminares de identidade e integridade proteica.'],
        technicalJustifications: ['Critérios de go/no-go para avanço à fase não clínica.'],
        referenceGuides: [
          { title: 'ICH Q6B – Specifications for Biotechnological Products', link: 'https://www.ich.org' }
        ]
      },
      // FASE 2
      {
        name: 'Banco de células, quando aplicável',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Construção do Banco Celular Mestre (MCB)', 'Construção do Banco Celular de Trabalho (WCB)', 'Qualificação e teste de agentes adventícios'],
        keyDecisions: ['O banco celular foi testado para vírus e micoplasma?', 'A estabilidade genética durante as passagens foi demonstrada?'],
        regulatoryPoints: ['Conformidade estrita com ICH Q5A (segurança viral) e ICH Q5D.'],
        technicalJustifications: ['Histórico do isolamento e certificados de ausência de derivados de ruminantes (TSE/BSE).'],
        referenceGuides: [
          { title: 'ICH Q5A – Viral Safety Evaluation', link: 'https://www.ich.org' },
          { title: 'ICH Q5D – Quality of Biotechnological Products', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Produção de lote BPL do IFA',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Fermentação/cultivo em biorreator', 'Purificação downstream multietapas', 'Filtração estéril e alíquotas'],
        keyDecisions: ['O processo downstream elimina contaminantes de processo (HCP, DNA residual)?', 'O volume gerado supre todos os estudos toxicológicos?'],
        regulatoryPoints: ['Certificado de análise emitido com parâmetros mínimos de liberação.'],
        technicalJustifications: ['Racional de equivalência entre lote de pesquisa e lote pré-clínico.'],
        referenceGuides: [
          { title: 'WHO TRS 1004 – Annex 2: Manufacturing of Biologicals', link: 'https://www.who.int' }
        ]
      },
      {
        name: 'Caracterização e impurezas',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Determinação de pureza por SEC-HPLC e RP-HPLC', 'Espectrometria de massas (MALDI-TOF / LC-MS/MS)', 'Quantificação de endotoxinas (LAL) e DNA residual da célula hospedeira'],
        keyDecisions: ['O nível de endotoxina está abaixo do limite para uso animal e clínico (< 5 EU/dose)?', 'O perfil de agregados proteicos foi caracterizado?'],
        regulatoryPoints: ['Atendimento aos critérios de aceitação da Farmacopeia Brasileira e ICH Q6B.'],
        technicalJustifications: ['Justificativa dos limites de impurezas relacionadas ao produto e ao processo.'],
        referenceGuides: [
          { title: 'ICH Q6B – Test Procedures and Acceptance Criteria', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Desenvolvimento da formulação e controle de qualidade',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Seleção de adjuvantes imunológicos', 'Testes de adsorção antígeno-adjuvante', 'Otimização de pH, osmolalidade e tensoativos'],
        keyDecisions: ['Por que foi escolhido determinado adjuvante?', 'A formulação será líquida estável ou liofilizada?'],
        regulatoryPoints: ['Adequação da via parenteral estéril e ausência de toxicidade de excipientes.'],
        technicalJustifications: ['Racional de sinergismo antígeno-adjuvante e conforto de injeção.'],
        referenceGuides: [
          { title: 'EMA Guideline on Adjuvants in Vaccines for Human Use', link: 'https://www.ema.europa.eu' },
          { title: 'ICH Q8(R2) – Pharmaceutical Development', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Estabilidade e interação entre componentes',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Estudo de estabilidade acelerada (25°C e 40°C)', 'Estudo de estabilidade sob refrigeração (2-8°C)', 'Avaliação de estresse de congelamento e descongelamento'],
        keyDecisions: ['Qual o prazo de validade provisório para os ensaios clínicos?', 'O antígeno permanece adsorvido ao longo do tempo?'],
        regulatoryPoints: ['Conformidade com RDC Anvisa 318/2019 e ICH Q5C.'],
        technicalJustifications: ['Cinética de perda de potência e identificação de rotas de degradação.'],
        referenceGuides: [
          { title: 'ICH Q5C – Stability Testing of Biotechnological Products', link: 'https://www.ich.org' },
          { title: 'RDC Anvisa nº 318/2019 – Estudos de Estabilidade', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Estudos in vivo',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Curva de dose-resposta em camundongos', 'Ensaios de imunogenicidade humoral (títulos de anticorpos neutralizantes)', 'Ensaios de imunidade celular (ELISpot / Citometria de fluxo)'],
        keyDecisions: [
          'Qual a justificativa para a seleção do modelo animal?',
          'Quais estudos são necessários para esta plataforma?',
          'Qual a justificativa para seleção da dose?',
          'Por que foi escolhido determinado adjuvante?',
          'Qual a justificativa para a via de administração e o esquema de doses?',
          'Quais normas e guias fundamentam o delineamento?'
        ],
        regulatoryPoints: [
          'Condução sob diretrizes da CEUA e padrões internacionais BPL.',
          'Validação dos métodos analíticos imunoenzimáticos utilizados.'
        ],
        technicalJustifications: [
          'Racional biológico do modelo animal e correlação com a patogênese humana.',
          'Modelagem translacional da dose segura inicial (HED).'
        ],
        referenceGuides: [
          { title: 'WHO TRS 927 – Guidelines on Nonclinical Evaluation of Vaccines', link: 'https://www.who.int' },
          { title: 'Guia Anvisa nº 23/2019 – Avaliação Não Clínica de Vacinas', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Produção BPF',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Transferência de tecnologia para planta BPF', 'Produção de lote piloto clínico sob Boas Práticas', 'Envase e rotulagem estéril em sala limpa'],
        keyDecisions: ['A planta contratada possui Certificação de Boas Práticas de Fabricação (CBPF) válida pela Anvisa?', 'Os testes de esterilidade e pirógenos foram concluídos?'],
        regulatoryPoints: ['Atendimento integral à RDC Anvisa nº 658/2019 (Diretrizes Gerais de BPF).'],
        technicalJustifications: ['Validação de processo de filtração esterilizante e simulação de envase (media fill).'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 658/2019 – Boas Práticas de Fabricação', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Estudos de segurança',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Ensaio de toxicidade de dose repetida BPL', 'Tolerância local e histopatologia no sítio de injeção', 'Monitoramento laboratorial e pesquisa de reações imunopatológicas'],
        keyDecisions: ['O NOAEL foi determinado formalmente?', 'Houve relato de reactogenicidade ou fenômeno ADE?'],
        regulatoryPoints: ['Relatório toxicológico assinado por diretor de estudo em centro BPL credenciado.'],
        technicalJustifications: ['Margem de segurança para proteção dos participantes do estudo clínico Fase 1.'],
        referenceGuides: [
          { title: 'ICH M3(R2) – Nonclinical Safety Studies for Human Clinical Trials', link: 'https://www.ich.org' },
          { title: 'ICH S6(R1) – Preclinical Safety Evaluation of Biotechnology Products', link: 'https://www.ich.org' }
        ]
      },
      // FASE 3
      {
        name: 'Brochura do Investigador',
        phase: VACCINE_PLATFORM_PHASES[2],
        microActivities: ['Compilação dos dados pré-clínicos', 'Resumo de segurança e farmacologia', 'Instruções operacionais para os centros clínicos'],
        keyDecisions: ['Todas as reações adversas observadas em animais foram relatadas com clareza?', 'As orientações de manejo clínico estão atualizadas?'],
        regulatoryPoints: ['Elaboração estritamente alinhada com ICH E6(R2) e RDC Anvisa 9/2015.'],
        technicalJustifications: ['Balanço risco-benefício favorável à administração em voluntários humanos.'],
        referenceGuides: [
          { title: 'ICH E6(R2) – Good Clinical Practice', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Dossiê do IFA',
        phase: VACCINE_PLATFORM_PHASES[2],
        microActivities: ['Documentação de estrutura e caracterização', 'Descrição do processo de fabricação e controles', 'Estabilidade e validação de métodos analíticos'],
        keyDecisions: ['Os controles em processo (IPC) cobrem todos os parâmetros críticos (CPP)?', 'O perfil de impurezas foi justificado?'],
        regulatoryPoints: ['Módulo 3 do CTD (Common Technical Document) - Seção 3.2.S.'],
        technicalJustifications: ['Rastreabilidade das matérias-primas e substâncias de partida.'],
        referenceGuides: [
          { title: 'ICH M4Q – Common Technical Document: Quality', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Dossiê da Vacina',
        phase: VACCINE_PLATFORM_PHASES[2],
        microActivities: ['Composição da formulação final e adjuvante', 'Controle de qualidade do produto terminado', 'Especificações de liberação clínica'],
        keyDecisions: ['O sistema de embalagem primária atende aos testes de integridade e estanqueidade?'],
        regulatoryPoints: ['Módulo 3 do CTD - Seção 3.2.P.'],
        technicalJustifications: ['Compatibilidade com dispositivos de aplicação parenteral.'],
        referenceGuides: [
          { title: 'ICH M4Q – The CTD: Quality Module', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'DEEC',
        phase: VACCINE_PLATFORM_PHASES[2],
        microActivities: ['Elaboração do Dossiê Específico de Ensaio Clínico', 'Protocolo clínico detalhado e formulários de relato de caso (CRF)', 'Termo de Consentimento Livre e Esclarecido (TCLE)'],
        keyDecisions: ['O protocolo prevê plano claro de monitoramento de segurança e comitê independente (DSMB)?'],
        regulatoryPoints: ['Atendimento aos requisitos específicos da RDC Anvisa nº 9/2015.'],
        technicalJustifications: ['Delineamento estatístico e cálculo do tamanho amostral.'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 9/2015 – Regulamento para Ensaios Clínicos', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Documentos complementares',
        phase: VACCINE_PLATFORM_PHASES[2],
        microActivities: ['Parecer consubstanciado da CONEP / CEP institucional', 'Seguro para participantes da pesquisa', 'Certificados de liberação de lote clínico'],
        keyDecisions: ['Todos os documentos éticos e operacionais estão vigentes?'],
        regulatoryPoints: ['Resolução CNS 466/2012 e regulamentações éticas nacionais.'],
        technicalJustifications: ['Garantia de conformidade com os direitos e segurança dos participantes.'],
        referenceGuides: [
          { title: 'Resolução CNS nº 466/2012 – Ética em Pesquisa', link: 'https://conselho.saude.gov.br' }
        ]
      },
      // FASE 4
      {
        name: 'Submissão regulatória',
        phase: VACCINE_PLATFORM_PHASES[3],
        microActivities: ['Protocolo eletrônico do DDCM junto à Anvisa', 'Organização de pastas e metadados no sistema Solicita', 'Confirmação de recebimento'],
        keyDecisions: ['Todos os módulos foram devidamente assinados digitalmente por responsáveis técnicos?'],
        regulatoryPoints: ['Protocolo formal de Dossiê de Desenvolvimento Clínico de Medicamento (DDCM).'],
        technicalJustifications: ['Cumprimento dos prazos de resposta administrativa.'],
        referenceGuides: [
          { title: 'Anvisa – Manual do Usuário do Sistema Solicita', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Respostas a exigências',
        phase: VACCINE_PLATFORM_PHASES[3],
        microActivities: ['Análise das exigências técnicas emitidas pela Anvisa', 'Condução de ensaios complementares solicitados', 'Submissão da petição secundária de resposta'],
        keyDecisions: ['As respostas atendem integralmente ao parecer da Gerência de Medicamentos Biológicos (GGMED)?'],
        regulatoryPoints: ['Prazo improrrogável de atendimento a exigências conforme legislação sanitária.'],
        technicalJustifications: ['Fundamentação técnica e científica robusta para cada questionamento da autoridade.'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 9/2015 – Seção de Notificação e Exigências', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Aprovação/autorização regulatória',
        phase: VACCINE_PLATFORM_PHASES[3],
        microActivities: ['Publicação do Comunicado Especial (CE) no Diário Oficial', 'Liberação para importação de insumos clínicos', 'Reunião de início de ensaio'],
        keyDecisions: ['Todas as condicionantes técnicas foram cumpridas para início da administração humana?'],
        regulatoryPoints: ['Documento oficial de aprovação e autorização de ensaio clínico emitido pela Anvisa.'],
        technicalJustifications: ['Arquivamento do processo regulatório no TMF (Trial Master File).'],
        referenceGuides: [
          { title: 'Anvisa – Consulta Pública de Ensaios Clínicos Autorizados', link: 'https://www.gov.br/anvisa' }
        ]
      },
      // FASES CLÍNICAS (FASES 5, 6 e 7)
      {
        name: 'Estudos Clínicos Fase I: Definição de CRO e centros de pesquisa',
        phase: VACCINE_PLATFORM_PHASES[4],
        microActivities: ['Qualificação e seleção da CRO executora', 'Visitas de pré-seleção dos centros de pesquisa clínica', 'Formalização de contratos e orçamentos'],
        keyDecisions: ['O centro de pesquisa possui UTI e suporte para eventos adversos imediatos?'],
        regulatoryPoints: ['Qualificação de prestadores de serviço e delegação de tarefas (ICH E6).'],
        technicalJustifications: ['Capacidade operacional comprovada para ensaios FIH (First-in-Human).'],
        referenceGuides: [{ title: 'ICH E6(R2) – Section 5: Sponsor Oversight', link: 'https://www.ich.org' }]
      },
      {
        name: 'Estudos Clínicos Fase I: Recrutamento e Execução',
        phase: VACCINE_PLATFORM_PHASES[4],
        microActivities: ['Registro no ReBEC / ClinicalTrials.gov', 'Triagem e inclusão de voluntários sadios', 'Escalonamento de doses e monitoramento intensivo de segurança'],
        keyDecisions: ['Os critérios de parada e segurança do protocolo foram acionados?', 'Qual a dose recomendada para avanço à Fase 2 (RP2D)?'],
        regulatoryPoints: ['Notificação imediata de eventos adversos graves inesperados (SUSAR) à Anvisa em até 7 dias.'],
        technicalJustifications: ['Relatório preliminar de segurança e determinação da dose máxima tolerada.'],
        referenceGuides: [{ title: 'RDC Anvisa nº 9/2015 – Farmacovigilância em Ensaios Clínicos', link: 'https://www.gov.br/anvisa' }]
      },
      {
        name: 'Estudos Clínicos Fase II: Execução e Imunogenicidade',
        phase: VACCINE_PLATFORM_PHASES[5],
        microActivities: ['Inclusão de coortes ampliadas (voluntários e população-alvo)', 'Avaliação comparativa com placebo/controle ativo', 'Coleta seriada para resposta imune humoral e celular'],
        keyDecisions: ['A taxa de soroconversão e os títulos de anticorpos confirmam eficácia preliminar?'],
        regulatoryPoints: ['Monitoramento contínuo por Comitê Independente de Monitoramento de Dados (IDMC).'],
        technicalJustifications: ['Poder estatístico de discriminação de resposta imunogênica entre esquemas vacinais.'],
        referenceGuides: [{ title: 'WHO Guidelines on Clinical Evaluation of Vaccines', link: 'https://www.who.int' }]
      },
      {
        name: 'Estudos Clínicos Fase III: Ensaio Multicêntrico de Eficácia',
        phase: VACCINE_PLATFORM_PHASES[6],
        microActivities: ['Ensaio randomizado duplo-cego multicêntrico de larga escala', 'Vigilância ativa de casos sintomáticos da doença', 'Análise interina e relatório final de eficácia e segurança'],
        keyDecisions: ['O desfecho primário de eficácia clínica atingiu o limiar pré-especificado (ex: > 50%)?', 'O perfil de segurança a longo prazo é sustentável?'],
        regulatoryPoints: ['Dossiê final de eficácia clínica para o pedido de Registro de Produto Biológico junto à Anvisa.'],
        technicalJustifications: ['Cálculo de taxa de ataque e eficácia vacinal ajustada.'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 55/2010 – Registro de Vacinas e Produtos Biológicos', link: 'https://www.gov.br/anvisa' },
          { title: 'ICH E9 – Statistical Principles for Clinical Trials', link: 'https://www.ich.org' }
        ]
      }
    ]
  },
  {
    id: 'plan_dna_vaccine',
    name: 'Plano-Base: Vacina de DNA',
    platform: 'DNA',
    description: 'Plano de desenvolvimento regulatório e tecnológico para vacinas baseadas em plasmídeos de DNA.',
    phases: VACCINE_PLATFORM_PHASES,
    macroActivities: [
      {
        name: 'Ideia e definição do candidato',
        phase: VACCINE_PLATFORM_PHASES[0],
        microActivities: ['Seleção do vetor plasmidial de expressão', 'Otimização de códons para mamíferos', 'Clonagem molecular e checagem de sequenciamento'],
        keyDecisions: ['O promotor e sequência líder maximizam a expressão?', 'O vetor possui marcador de seleção livre de antibióticos beta-lactâmicos?'],
        regulatoryPoints: ['Normas da CTNBio sobre Organismos Geneticamente Modificados (OGM).'],
        technicalJustifications: ['Racional de expressão e minimização de riscos de integração genômica.'],
        referenceGuides: [{ title: 'WHO Guidelines for Assuring Quality of DNA Vaccines', link: 'https://www.who.int' }]
      },
      {
        name: 'Estudos in vivo',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Ensaios de imunogenicidade com eletroporação / injetores sem agulha', 'Curva dose-resposta e avaliação de adjuvantes moleculares', 'Pesquisa de anticorpos anti-DNA e tolerância sistêmica'],
        keyDecisions: [
          'Qual a justificativa para a seleção do modelo animal?',
          'Quais estudos são necessários para esta plataforma?',
          'Qual a justificativa para seleção da dose?',
          'Por que foi escolhido determinado adjuvante?',
          'Qual a justificativa para a via de administração e o esquema de doses?',
          'Quais normas e guias fundamentam o delineamento?'
        ],
        regulatoryPoints: ['Investigação mandatória de ausência de integração genômica e persistência plasmidial.'],
        technicalJustifications: ['Demonstração de biossegurança de vetor de DNA.'],
        referenceGuides: [
          { title: 'WHO TRS 941 – Guidelines for DNA Vaccines', link: 'https://www.who.int' },
          { title: 'FDA Guidance on Considerations for Plasmid DNA Vaccines', link: 'https://www.fda.gov' }
        ]
      }
    ]
  },
  {
    id: 'plan_attenuated_virus',
    name: 'Plano-Base: Vírus Atenuado',
    platform: 'Vírus Atenuado',
    description: 'Plano de desenvolvimento regulatório de candidatos a vacinas com vírus atenuados ou quiméricos.',
    phases: VACCINE_PLATFORM_PHASES,
    macroActivities: [
      {
        name: 'Caracterização do Banco Viral Mestre/Trabalho',
        phase: VACCINE_PLATFORM_PHASES[1],
        microActivities: ['Criopreservação de sementes virais', 'Sequenciamento genômico completo de alta profundidade', 'Testes de agentes adventícios e neurovirulência'],
        keyDecisions: ['A estabilidade genética de atenuação se mantém após 10 passagens sucessivas?'],
        regulatoryPoints: ['Conformidade com Farmacopeia e ensaios de segurança viral OMS.'],
        technicalJustifications: ['Rastreabilidade da linhagem viral e histórico de passagens.'],
        referenceGuides: [{ title: 'WHO TRS 962 – Annex 2: Virus seed lots and cell substrates', link: 'https://www.who.int' }]
      }
    ]
  }
];

export const DEFAULT_REGULATORY_SUBJECTS = [
  {
    id: 'subj_1',
    name: 'Proteínas Recombinantes',
    blocks: [
      {
        id: 'block_1_1',
        name: 'Estudo de Segurança',
        concepts: [
          {
            id: 'concept_1',
            title: 'Toxicidade Local',
            centralIdeas: [
              'Avaliação do potencial de irritação e tolerabilidade tecidual no sítio de administração em modelos pré-clínicos.',
              'Definição da via de administração segura e determinação do tampão de formulação ideal.'
            ],
            observations: 'Recomenda-se utilizar a formulação e concentração idênticas às pretendidas para uso humano.',
            color: 'yellow',
            linkedStandards: [
              {
                standardId: 'std_1',
                relevantPassages: 'Estudos de tolerância local devem utilizar a via clínica pretendida e avaliar alterações histopatológicas no sítio de injeção.',
                page: 'Página 14',
                section: 'Seção 4.3'
              }
            ]
          },
          {
            id: 'concept_2',
            title: 'Estudos de Dose Repetida',
            centralIdeas: [
              'Análise dos efeitos tóxicos decorrentes da administração continuada do biofármaco para identificação de órgãos-alvo.',
              'Determinação do NOAEL para cálculo da dose inicial em ensaios humanos (FIH).'
            ],
            observations: 'A duração dos estudos pré-clínicos deve refletir a duração prevista do tratamento clínico humano.',
            color: 'blue',
            linkedStandards: [
              {
                standardId: 'std_1',
                relevantPassages: 'Doses repetidas devem ser administradas em espécies relevantes com monitoramento de perfil imunogênico.',
                page: 'Página 18',
                section: 'Seção 5.2'
              }
            ]
          }
        ]
      },
      {
        id: 'block_1_2',
        name: 'Estudo de Estabilidade',
        concepts: [
          {
            id: 'concept_3',
            title: 'Potência',
            centralIdeas: [
              'Quantificação da atividade biológica específica da molécula com base no mecanismo de ação pretendido.',
              'Controle de qualidade essencial para liberação de lote e monitoramento da estabilidade.'
            ],
            observations: 'Deve ser estabelecido um padrão de referência devidamente caracterizado para calibração do ensaio.',
            color: 'green',
            linkedStandards: [
              {
                standardId: 'std_2',
                relevantPassages: 'O ensaio de potência é requisito obrigatório para liberação do lote de insumo farmacêutico ativo e produto acabado.',
                page: 'Página 9',
                section: 'Item 3.1'
              }
            ]
          },
          {
            id: 'concept_4',
            title: 'Solventes e Impurezas Residuais',
            centralIdeas: [
              'Limites aceitáveis para impurezas do processo e reagentes remanescentes após as etapas de purificação.'
            ],
            observations: 'Impurezas relacionadas ao processo (ex.: DNA da célula hospedeira, HCP) devem ser quantificadas em validação.',
            color: 'pink',
            linkedStandards: [
              {
                standardId: 'std_2',
                relevantPassages: 'Níveis de impurezas derivadas do hospedeiro devem ser validados quanto à remoção e estar abaixo dos limites toxicológicos.',
                page: 'Página 22',
                section: 'Seção 6.4'
              }
            ]
          }
        ]
      }
    ]
  }
];

export const DEFAULT_VACCINE_CANDIDATES = [
  {
    id: 'cand_spin_utg',
    name: 'SpiN-UTG (Vacina COVID-19 / Pan-coronavírus)',
    codeName: 'CTV-SPIN-01',
    platform: 'Proteína Recombinante' as const,
    targetPathogen: 'SARS-CoV-2 / Coronavírus',
    phase: 'Ensaio Clínico Fase 1' as const,
    status: 'Em Ensaio' as const,
    vaccineOriginType: 'interna' as const,
    approvalAgency: 'ANVISA (Em ensaio clínico DDCM)',
    leadResearcher: 'Dr. Ricardo Gazzinelli / Dra. Ana Paula Salles',
    description: 'Vacina brasileira desenvolvida com proteína quimérica recombinante fundindo a proteína SpiN do SARS-CoV-2 com o nucleocapsídeo.',
    associatedComponentIds: ['comp_spin_prot', 'comp_adj_mpla', 'comp_exc_pbs', 'comp_exc_poly80'],
    componentUsages: [
      { componentId: 'comp_spin_prot', componentName: 'Proteína Quimérica SpiN-UTG Recombinante', concentration: '50 µg/dose' },
      { componentId: 'comp_adj_mpla', componentName: 'Adjuvante Alumínio + MPLA', concentration: '500 µg Al+3 + 50 µg MPLA/dose' },
      { componentId: 'comp_exc_pbs', componentName: 'Tampão Fosfato Salino (PBS)', concentration: 'q.s.p 0,5 mL' },
      { componentId: 'comp_exc_poly80', componentName: 'Polissorbato 80 (Tween 80)', concentration: '0,05% p/v' }
    ],
    anvisaStatus: 'DDCM Aprovado - Fase 1/2',
    technicalNotes: 'Estudos de imunogenicidade e neutralização em andamento.',
    createdDate: '2025-01-15',
    updatedDate: '2026-03-10'
  },
  {
    id: 'cand_leishtec',
    name: 'Leishtec (Vacina Leishmaniose Visceral)',
    codeName: 'CTV-LEISH-02',
    platform: 'Proteína Recombinante' as const,
    targetPathogen: 'Leishmania infantum',
    phase: 'Registro / Produção' as const,
    status: 'Aprovado' as const,
    vaccineOriginType: 'aprovada' as const,
    approvalAgency: 'ANVISA / MAPA',
    leadResearcher: 'Dr. Alexandre Machado',
    description: 'Vacina de proteína recombinante A2 para prevenção e controle da leishmaniose visceral.',
    associatedComponentIds: ['comp_a2_prot', 'comp_adj_sap', 'comp_adj_alum', 'comp_exc_pbs'],
    componentUsages: [
      { componentId: 'comp_a2_prot', componentName: 'Proteína Recombinante A2 (Leishmania)', concentration: '100 µg/dose' },
      { componentId: 'comp_adj_sap', componentName: 'Saponina Adjuvante Purificada (Saponin/QS-21)', concentration: '250 µg/dose' },
      { componentId: 'comp_adj_alum', componentName: 'Hidróxido de Alumínio (Alhydrogel)', concentration: '0.5 mg Al+3/dose' },
      { componentId: 'comp_exc_pbs', componentName: 'Tampão Fosfato Salino (PBS)', concentration: 'q.s.p 1,0 mL' }
    ],
    anvisaStatus: 'Registro MAPA / ANVISA Aprovado',
    technicalNotes: 'Produto em comercialização e uso veterinário/humano.',
    createdDate: '2024-06-10',
    updatedDate: '2026-01-20'
  },
  {
    id: 'cand_chagasvac',
    name: 'ChagasVac (Candidato a Vacina Doença de Chagas)',
    codeName: 'CTV-CHAGAS-03',
    platform: 'Vetor Viral' as const,
    targetPathogen: 'Trypanosoma cruzi',
    phase: 'Pré-clínico In Vivo' as const,
    status: 'Em Desenvolvimento' as const,
    vaccineOriginType: 'interna' as const,
    approvalAgency: 'CEUA / CONCEA (Pré-clínico)',
    leadResearcher: 'Dra. Bruna Dias / Dr. Santuza Teixeira',
    description: 'Candidato vacinal baseado em vetor viral recombinante expressando antígenos Tc24 e TS para Doença de Chagas.',
    associatedComponentIds: ['comp_ad5_vetor', 'comp_exc_sucrose', 'comp_exc_pbs'],
    componentUsages: [
      { componentId: 'comp_ad5_vetor', componentName: 'Vetor Adenoviral Ad5 Recombinante Tc24/TS', concentration: '1 x 10^10 VP/dose' },
      { componentId: 'comp_exc_sucrose', componentName: 'Sacarose Ultra Pura (Estabilizante)', concentration: '9% p/v' },
      { componentId: 'comp_exc_pbs', componentName: 'Tampão Fosfato Salino (PBS)', concentration: 'q.s.p 0,5 mL' }
    ],
    anvisaStatus: 'Estudo Pré-Clínico de Eficácia e Tolerabilidade',
    technicalNotes: 'Resultados promissores de redução de carga parasitária.',
    createdDate: '2025-08-01',
    updatedDate: '2026-04-12'
  }
];

export const DEFAULT_VACCINE_IMPURITIES = [
  {
    id: 'imp_sm29_hcp',
    item: 'Possíveis impurezas relacionadas ao processo de fabricação da proteína Sm29 (HCP E. coli)',
    vaccineId: 'cand_spin_utg',
    vaccineName: 'SpiN-UTG (Vacina COVID-19 / Pan-coronavírus)',
    category: 'Relacionada ao Processo' as const,
    subCategory: 'Proteínas de Célula Hospedeira (HCP)',
    safetyData: 'NOAEL determinado em ensaios toxicológicos de doses repetidas em roedores, sem sinais de imunogenicidade adversa.',
    noael: '50 mg/kg/dia',
    pdeAdi: 'PDE: 0.5 mg/dia',
    acceptanceCriteria: '≤ 100 ppm (ng HCP/mg proteína). Justificativa: Nível biologicamente seguro alinhado à Farmacopéia e guias ICH Q3D.',
    reference: 'Dossiê de Processo Sm29 / Guias ANVISA RDC 55 e ICH Q3D',
    createdDate: '2025-02-10',
    updatedDate: '2026-03-01'
  },
  {
    id: 'imp_host_dna',
    item: 'DNA Residual da Célula Hospedeira (Host Cell DNA)',
    vaccineId: 'cand_spin_utg',
    vaccineName: 'SpiN-UTG (Vacina COVID-19 / Pan-coronavírus)',
    category: 'DNA/HCP Celular' as const,
    subCategory: 'Ácidos Nucleicos Residuais',
    safetyData: 'Tamanho de fragmentos mantido estritamente < 200 pb via digestão enzimática (Benzonase) eliminando potencial oncogênico.',
    noael: 'N/A (parâmetro genotóxico de pureza)',
    pdeAdi: '≤ 10 ng por dose humana (OMS)',
    acceptanceCriteria: '≤ 10 ng de DNA por dose (fragmentos < 200 pb). Justificativa: Recomendação e diretriz técnica internacional OMS/ANVISA.',
    reference: 'WHO Technical Report Series 980 / Bula Técnica SpiN-UTG',
    createdDate: '2025-02-12',
    updatedDate: '2026-03-05'
  },
  {
    id: 'imp_formaldehyd',
    item: 'Formaldeído Residual Livre do Processo de Inativação',
    vaccineId: 'cand_leishtec',
    vaccineName: 'Leishtec (Vacina Leishmaniose Visceral)',
    category: 'Reagentes Residual' as const,
    subCategory: 'Inativador Químico',
    safetyData: 'Monitoramento de limites para prevenção de irritação local e reações imunogênicas cruzadas.',
    noael: '15 mg/kg/dia',
    pdeAdi: 'PDE: 0.2 mg/dia',
    acceptanceCriteria: '≤ 0.1 mg por dose (≤ 100 µg/dose). Justificativa: Limite de segurança regulatório estabelecido pela Farmacopéia e ANVISA.',
    reference: 'Dossiê Regulatório de Liberação de Lote MAPA/ANVISA Leishtec',
    createdDate: '2024-07-01',
    updatedDate: '2026-01-15'
  }
];

export const DEFAULT_VACCINE_COMPONENTS = [
  {
    id: 'comp_spin_prot',
    name: 'Proteína Quimérica SpiN-UTG Recombinante',
    code: 'PROT-SPIN-01',
    category: 'Antígeno' as const,
    originHostSystem: 'Pichia pastoris',
    grade: 'GMP / Grau Clínico' as const,
    storageTemperature: '-80°C',
    batchNumber: 'LOTE-SPIN-2026-01',
    stockQuantity: '15.000',
    unit: 'doses',
    description: 'Antígeno recombinante purificado com elevado grau de pureza para formulação vacinal.'
  },
  {
    id: 'comp_adj_mpla',
    name: 'Adjuvante Alumínio + MPLA',
    code: 'ADJ-MPLA-004',
    category: 'Adjuvante' as const,
    originHostSystem: 'Sintético / Purificado',
    grade: 'Pre-GMP' as const,
    storageTemperature: '2-8°C',
    batchNumber: 'ADJ-2025-11',
    stockQuantity: '800',
    unit: 'mL',
    description: 'Sistema adjuvante imunoestimulante para indução de resposta celular Th1.'
  },
  {
    id: 'comp_a2_prot',
    name: 'Proteína Recombinante A2',
    code: 'PROT-A2-02',
    category: 'Antígeno' as const,
    originHostSystem: 'E. coli',
    grade: 'GMP / Grau Clínico' as const,
    storageTemperature: '-20°C',
    batchNumber: 'LOTE-A2-2025-09',
    stockQuantity: '25.000',
    unit: 'doses',
    description: 'Antígeno recombinante específico de Leishmania.'
  },
  {
    id: 'comp_adj_sap',
    name: 'Adjuvante Saponina QA-21',
    code: 'ADJ-QA21-02',
    category: 'Adjuvante' as const,
    originHostSystem: 'Extrato Vegetal Purificado',
    grade: 'Grau Científico / Pesquisa' as const,
    storageTemperature: '-20°C',
    batchNumber: 'SAP-QA21-02',
    stockQuantity: '150',
    unit: 'mL',
    description: 'Adjuvante natural purificado.'
  },
  {
    id: 'comp_ad5_vetor',
    name: 'Vetor Adenovírus Ad5-T.cruzi',
    code: 'VET-AD5-TC24',
    category: 'Vetor de Expressão' as const,
    originHostSystem: 'HEK293',
    grade: 'Pre-GMP' as const,
    storageTemperature: '-80°C',
    batchNumber: 'VET-AD5-03',
    stockQuantity: '120',
    unit: 'frascos',
    description: 'Vetor viral não replicativo expressando Tc24.'
  },
  {
    id: 'comp_adj_alum',
    name: 'Hidróxido de Alumínio (Alhydrogel 2%)',
    code: 'ADJ-ALUM-001',
    category: 'Adjuvante' as const,
    originHostSystem: 'Mineral Purificado',
    grade: 'GMP / Grau Clínico' as const,
    storageTemperature: '2-8°C',
    batchNumber: 'ALUM-2025-08',
    stockQuantity: '2.500',
    unit: 'mL',
    description: 'Adjuvante mineral clássico para adsorção de antígenos proteicos e indução de resposta humoral.'
  },
  {
    id: 'comp_exc_pbs',
    name: 'Tampão Fosfato Salino (PBS 1x pH 7.4)',
    code: 'EXC-PBS-01',
    category: 'Tampão / Estabilizante' as const,
    originHostSystem: 'Sintético / Grau Reagente USP',
    grade: 'Farmacopéico USP/EP' as const,
    storageTemperature: '15-25°C',
    batchNumber: 'PBS-2026-02',
    stockQuantity: '50.000',
    unit: 'mL',
    description: 'Excipiente e diluente tampão fisiológico estéril para formulação vacinal.'
  },
  {
    id: 'comp_exc_sucrose',
    name: 'Sacarose Ultra Pura (Cryoprotectant)',
    code: 'EXC-SUC-02',
    category: 'Tampão / Estabilizante' as const,
    originHostSystem: 'Vegetal Purificado',
    grade: 'Farmacopéico USP/EP' as const,
    storageTemperature: '15-25°C',
    batchNumber: 'SUC-2025-12',
    stockQuantity: '50',
    unit: 'kg',
    description: 'Excipiente liofilizante e crioprotetor para estabilização de antígenos e vetores virais.'
  },
  {
    id: 'comp_exc_poly80',
    name: 'Polissorbato 80 (Tween 80 Surfactante)',
    code: 'EXC-P80-05',
    category: 'Conservante' as const,
    originHostSystem: 'Sintético',
    grade: 'GMP / Grau Clínico' as const,
    storageTemperature: '15-25°C',
    batchNumber: 'P80-2025-10',
    stockQuantity: '10',
    unit: 'L',
    description: 'Surfactante não iônico utilizado para prevenir agregação proteica em vacinas.'
  }
];

export const DEFAULT_FORMULATION_BATCHES = [
  {
    id: 'batch_01',
    batchCode: 'LOTE-FORM-SPIN-2026-A',
    vaccineId: 'cand_spin_utg',
    preparationDate: '2026-02-15',
    expiryDate: '2027-02-15',
    componentsUsed: [
      { componentId: 'comp_spin_prot', quantityUsed: '5.000 doses' },
      { componentId: 'comp_adj_mpla', quantityUsed: '250 mL' }
    ],
    qualityControlStatus: 'Conforme' as const,
    sterilityStatus: 'Aprovado (Esterilidade ok)',
    potencyResult: 'Potência 98% de acordo com o padrão',
    responsibleTechnician: 'Dra. Bruna Dias / Garantia da Qualidade',
    notes: 'Lote liberado para início da Fase 1 de ensaios clínicos.'
  }
];

export const DEFAULT_REGULATORY_STANDARDS: RegulatoryStandard[] = [
  {
    id: 'std_rdc_658',
    name: 'RDC Nº 658, de 30 de março de 2022',
    type: 'RDC',
    theme: 'Boas Práticas de Fabricação de Medicamentos.',
    phase: 'Fase 1: Prova de Conceito',
    relatedActivities: ['Desenvolvimento de Dossiê de Insumo (DIFA)', 'Validação de Processo Produtivo'],
    version: '1.0',
    status: 'vigente',
    summary: 'Boas Práticas de Fabricação de Medicamentos.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['BPF', 'Medicamentos', 'RDC 658'],
    appliesTo: 'Medicamentos e Produtos Biológicos'
  },
  {
    id: 'std_rdc_654',
    name: 'RDC Nº 654, de 24 de março de 2022',
    type: 'RDC',
    theme: 'Boas Práticas de Fabricação de Insumos Farmacêuticos Ativos.',
    phase: 'Fase 1: Prova de Conceito',
    relatedActivities: ['Desenvolvimento de Dossiê de Insumo (DIFA)'],
    version: '1.0',
    status: 'vigente',
    summary: 'Boas Práticas de Fabricação de Insumos Farmacêuticos Ativos.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['IFA', 'Insumos', 'RDC 654'],
    appliesTo: 'Insumos Farmacêuticos Ativos'
  },
  {
    id: 'std_in_127',
    name: 'IN Nº 127, de 30 de março de 2022',
    type: 'IN',
    theme: 'Boas Práticas Complementares a Insumos.',
    phase: 'Fase 2: Fase Não Clínica',
    relatedActivities: ['Coordenação de Estudo de Estabilidade'],
    version: '1.0',
    status: 'vigente',
    summary: 'Boas Práticas Complementares a Insumos.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['IN 127', 'Insumos', 'Complementares'],
    appliesTo: 'Insumos Biológicos'
  },
  {
    id: 'std_rdc_55',
    name: 'RDC Nº 55, de 16 de dezembro de 2010',
    type: 'RDC',
    theme: 'Boas Práticas de Fabricação de Medicamentos.',
    phase: 'Fase 1: Prova de Conceito',
    relatedActivities: [],
    version: '1.0',
    status: 'obsoleto',
    summary: 'Boas Práticas de Fabricação de Medicamentos.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['Biológicos', 'Registro', 'RDC 55'],
    appliesTo: 'Produtos Biológicos'
  },
  {
    id: 'std_in_429',
    name: 'IN Nº 429, de 23 de março de 2026',
    type: 'IN',
    theme: 'Boas Práticas de Fabricação de Produtos Biológicos.',
    phase: 'Fase 2: Fase Não Clínica',
    relatedActivities: ['Caracterização do Banco Viral Mestre/Trabalho'],
    version: '1.0',
    status: 'vigente',
    summary: 'Boas Práticas de Fabricação de Produtos Biológicos.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['Vacinas', 'Biológicos', 'IN 429'],
    appliesTo: 'Vacinas e Biotecnologia'
  },
  {
    id: 'std_guia_42',
    name: 'Guia Nº 42/2023',
    type: 'Guia',
    theme: 'Validação de Processos e Limpeza de Equipamentos.',
    phase: 'Fase 1: Prova de Conceito',
    relatedActivities: ['Validação de Processo Produtivo'],
    version: '1.0',
    status: 'vigente',
    summary: 'Validação de Processos e Limpeza de Equipamentos.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['Limpeza', 'Validação', 'Guia 42'],
    appliesTo: 'Plantas Piloto e Industriais'
  },
  {
    id: 'std_rdc_1001',
    name: 'RDC Nº 1.001, de 11 de dezembro de 2025',
    type: 'RDC',
    theme: 'Enquadramento na Categoria Prioritária.',
    phase: 'Fase 3: Fase Clínica I',
    relatedActivities: ['Submissão Regulatória Final'],
    version: '1.0',
    status: 'vigente com alteração',
    summary: 'Enquadramento, na Categoria Prioritária.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['Prioritária', 'Anvisa', 'RDC 1001'],
    appliesTo: 'Vacinas Prioritárias do SUS'
  },
  {
    id: 'std_guia_dossies',
    name: 'Guia para Elaboração de Dossiês Regulatórios',
    type: 'Guia',
    theme: 'Requisitos para Submissão de Dossiês à ANVISA.',
    phase: 'Fase 3: Fase Clínica I',
    relatedActivities: ['Compilação e Submissão de Dossiê'],
    version: '1.0',
    status: 'vigente',
    summary: 'Requisitos para Submissão de Dossiês à ANVISA.',
    documentLink: 'https://www.in.gov.br',
    notebookLMLink: '',
    keywords: ['Dossiê', 'Submissão', 'ANVISA'],
    appliesTo: 'Dossiês de Ensaios Clínicos (DDCM)'
  }
];

export const DEFAULT_MINUTES_TEMPLATE = `===================================================================
                       ATA DE REUNIÃO TÉCNICA E REGULATÓRIA
===================================================================

PROJETO: [NOME_DO_PROJETO]
TÍTULO DA REUNIÃO: [TITULO_REUNIAO]
TIPO: [TIPO_REUNIAO]
DATA: [DATA_REUNIAO] às [HORA_REUNIAO]
LOCAL/CANAL: [LOCAL_REUNIAO]
MODERADOR: [MODERADOR]
PARTICIPANTES: [PARTICIPANTES]

-------------------------------------------------------------------
1. PAUTAS, DISCUSSÕES E DECISÕES:
-------------------------------------------------------------------
[PAUTAS_E_DECISOES]

-------------------------------------------------------------------
2. REGISTRO DE IMPACTOS REGULATÓRIOS:
-------------------------------------------------------------------
[IMPACTOS_REGULATORIOS]

-------------------------------------------------------------------
3. ENCAMINHAMENTOS E PLANO DE AÇÃO:
-------------------------------------------------------------------
[ENCAMINHAMENTOS]

-------------------------------------------------------------------
4. CONCLUSÕES GERAIS E PRÓXIMOS PASSOS:
-------------------------------------------------------------------
[CONCLUSOES_GERAIS]

===================================================================
Documento gerado automaticamente via Módulo de Reuniões CTVacinas.
`;

export const DEFAULT_MEETINGS: Meeting[] = [
  {
    id: 'mtg_101',
    title: 'Alinhamento Regulatório do Dossiê DIFA - Vacina Proteica',
    projectId: 'p_proteina',
    projectName: 'Vacina Proteína Recombinante',
    date: '2026-07-15',
    time: '14:00',
    location: 'Sala de Reuniões Principal / MS Teams',
    type: 'Regulatória',
    status: 'Concluída',
    moderator: 'Graziella',
    participants: ['Graziella', 'Bruna Dias', 'Ester', 'Marjorie'],
    generalConclusions: 'Definida a estratégia de validação do processo de purificação e submissão dos laços de estabilidade prévia para o DDCM.',
    createdAt: '2026-07-10T10:00:00.000Z',
    updatedAt: '2026-07-15T16:30:00.000Z',
    agendaItems: [
      {
        id: 'pauta_1',
        title: 'Análise de Impurezas e Validação do Lote Piloto de Proteína',
        description: 'Revisão dos dados de perfil cromatográfico e especificação de pureza para inclusão no capítulo 3 do DDCM.',
        phase: 'Fase 1: Prova de Conceito',
        macroActivityId: 'macro_1',
        microActivityId: 'micro_1_1',
        regulatoryDocId: 'cap_3',
        linkedRegulatoryStandardIds: ['std_rdc_9', 'std_guia_42'],
        linkedPostItIds: ['postit_pureza_1'],
        discussions: 'Bruna Dias apresentou os gráficos de pureza obtidos por SEC-HPLC (>98%). Graziella recomendou detalhar os métodos de inativação e remoção de reagentes residuais.',
        decisions: 'Aprovado o critério de aceitação de pureza em >95%. O laudo analítico do Lote #03 será incorporado como anexo oficial ao Dossiê.',
        hasRegulatoryImpact: true,
        regulatoryImpactDetails: 'Criação de seção específica no DDCM Capítulo 3 com especificação do limite de proteína residual de hospedeiro.',
        actionItems: [
          {
            id: 'act_1',
            action: 'Compilar laudos analíticos do lote piloto #03 e enviar para revisão da Assessoria Regulatória',
            responsible: 'Bruna Dias',
            dueDate: '2026-07-25',
            status: 'Concluído',
            convertedToActivity: true
          }
        ]
      },
      {
        id: 'pauta_2',
        title: 'Acompanhamento do Protocolo de Estabilidade Acelerada (40°C)',
        description: 'Verificação dos pontos de 30 e 60 dias para inclusão no dossiê de submissão.',
        phase: 'Fase 1: Prova de Conceito',
        macroActivityId: 'macro_2',
        microActivityId: 'micro_2_1',
        regulatoryDocId: 'cap_4',
        linkedRegulatoryStandardIds: ['std_in_429'],
        discussions: 'Ester reportou ausência de degradação significativa no ponto de 30 dias mantido a 5°C e 25°C.',
        decisions: 'Continuar amostragem até 180 dias. Incluir os dados preliminares na Seção de Estabilidade do Dossiê.',
        hasRegulatoryImpact: true,
        regulatoryImpactDetails: 'Atualização do cronograma de protocolo de estabilidade no Dossiê de Desenvolvimento Clínico (DDCM).',
        actionItems: [
          {
            id: 'act_2',
            action: 'Elaborar relatório intermediário de estabilidade físico-química de 60 dias',
            responsible: 'Ester',
            dueDate: '2026-08-10',
            status: 'Em Andamento',
            convertedToActivity: false
          }
        ]
      }
    ]
  },
  {
    id: 'mtg_102',
    title: 'Comitê de Avaliação de Lote Viral Mestre (MCB)',
    projectId: 'p_virus',
    projectName: 'Vacina Vírus Recombinante',
    date: '2026-07-28',
    time: '10:00',
    location: 'Auditório CTVacinas Bloco B',
    type: 'Técnica',
    status: 'Concluída',
    moderator: 'Ana Terzian',
    participants: ['Ana Terzian', 'Ana Luiza', 'Marjorie'],
    generalConclusions: 'Aprovados os ensaios de esterilidade e sequenciamento do Banco Viral Mestre (MCB).',
    createdAt: '2026-07-20T09:00:00.000Z',
    updatedAt: '2026-07-28T12:00:00.000Z',
    agendaItems: [
      {
        id: 'pauta_3',
        title: 'Verificação de Agentes Adventícios e Micoplasmas',
        description: 'Análise dos laudos de contaminação viral e bacteriana do MCB.',
        phase: 'Fase 1: Prova de Conceito',
        macroActivityId: 'macro_v1',
        microActivityId: 'micro_v1_1',
        regulatoryDocId: 'cap_2',
        linkedRegulatoryStandardIds: ['std_in_429'],
        discussions: 'Ana Luiza confirmou resultado negativo para ausência de bacteriófagos e mycoplasma por PCR quantitativo.',
        decisions: 'Banco viral declarado livre de adventícios e apto para estocagem no Biobanco Nível 2.',
        hasRegulatoryImpact: true,
        regulatoryImpactDetails: 'Laudo de segurança virológica anexado à Ficha de Segurança Biológica do Projeto.',
        actionItems: [
          {
            id: 'act_3',
            action: 'Cadastrar laudo no sistema de rastreabilidade de insumos',
            responsible: 'Ana Luiza',
            dueDate: '2026-08-05',
            status: 'Pendente',
            convertedToActivity: false
          }
        ]
      }
    ]
  }
];
