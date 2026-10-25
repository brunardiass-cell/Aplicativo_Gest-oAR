
import { ActivityPlanTemplate, TeamMember, AppUser, RegulatoryStandard, Meeting, TaskGroup } from './types';
import { FlaskConical, ShieldCheck, Dna, Sparkles, Syringe, Atom, Microscope } from 'lucide-react';

export const AVAILABLE_PROJECT_ICONS = [
  { key: 'FlaskConical', label: 'Frasco', icon: FlaskConical },
  { key: 'ShieldCheck', label: 'Imunidade', icon: ShieldCheck },
  { key: 'Dna', label: 'DNA/RNA', icon: Dna },
  { key: 'Sparkles', label: 'Inovação', icon: Sparkles },
  { key: 'Syringe', label: 'Vacina', icon: Syringe },
  { key: 'Atom', label: 'Molecular', icon: Atom },
  { key: 'Microscope', label: 'Pesquisa', icon: Microscope },
];

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
  'Descoberta / Prova de Conceito',
  'Desenvolvimento Não Clínico',
  'Documentação Regulatória',
  'Submissão / Aprovação',
  'Ensaio Clínico Fase 1',
  'Ensaio Clínico Fase 2',
  'Ensaio Clínico Fase 3'
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
        icon: 'BookOpen',
        microActivities: ['Mapeamento de alvos antigênicos', 'Levantamento de patentes e anterioridades', 'Análise de imunodominância de epítopos'],
        keyDecisions: ['A literatura suporta imunogenicidade cruzada?', 'Existe liberdade de operação (FTO) para a sequência?'],
        decisionsList: [
          {
            id: 'dec_rev_1',
            question: 'A literatura suporta imunogenicidade cruzada entre variantes?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: false,
            targetFieldKey: 'ALVO_ANTIGENICO',
            targetFieldLabel: 'Alvo Antigênico e Imunogenicidade',
            responseType: 'ambos'
          },
          {
            id: 'dec_rev_2',
            question: 'Existe liberdade de operação (FTO) para a sequência antigênica?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: false,
            targetFieldKey: 'RACIONAL_PLATAFORMA',
            targetFieldLabel: 'Racional e Anterioridades',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Documentação de estado da arte para contextualização na Brochura do Investigador.'],
        technicalJustifications: ['Racional biológico e imunológico da escolha da proteína.'],
        referenceGuides: [
          { title: 'WHO TRS 924 – Guidelines on Biological Standardization', link: 'https://www.who.int' }
        ]
      },
      {
        name: 'Ideia e definição do candidato',
        phase: VACCINE_PLATFORM_PHASES[0],
        icon: 'Sparkles',
        microActivities: ['Modelagem tridimensional in silico', 'Desenho de mutações estabilizadoras', 'Seleção do sistema de expressão heterólogo'],
        keyDecisions: ['Qual o sistema de expressão preferencial (E. coli, Pichia pastoris ou células de mamífero)?', 'Foi incluída tag de purificação clivável?'],
        decisionsList: [
          {
            id: 'dec_idea_1',
            question: 'Qual o sistema de expressão heterólogo preferencial selecionado e qual a justificativa?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'SISTEMA_EXPRESSAO',
            targetFieldLabel: 'Sistema de Expressão Heterólogo',
            responseType: 'ambos'
          },
          {
            id: 'dec_idea_2',
            question: 'Foi incluída tag de purificação clivável ou estratégia de expressão direta sem fusão estranha?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'ALVO_ANTIGENICO',
            targetFieldLabel: 'Construção Antigênica e Tags',
            responseType: 'texto'
          }
        ],
        regulatoryPoints: ['Rastreabilidade da linhagem celular e histórico do vetor de clonagem.'],
        technicalJustifications: ['Justificativa da integridade conformacional do candidato.'],
        referenceGuides: [
          { title: 'ICH Q5D – Derivation and Characterisation of Cell Substrates', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Validação do candidato',
        phase: VACCINE_PLATFORM_PHASES[0],
        icon: 'FlaskConical',
        microActivities: ['Expressão piloto em bancada', 'Purificação por cromatografia de afinidade', 'Ensaio preliminar de reconhecimento imune (ELISA/Western Blot)'],
        keyDecisions: ['O rendimento de expressão viabiliza escalonamento?', 'O antígeno é reconhecido por soros convalescentes?'],
        decisionsList: [
          {
            id: 'dec_val_1',
            question: 'O rendimento de expressão obtido viabiliza escalonamento fabril preliminar?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'PROCESSO_UPSTREAM',
            targetFieldLabel: 'Rendimento e Escalabilidade Inicial',
            responseType: 'ambos'
          },
          {
            id: 'dec_val_2',
            question: 'O antígeno expresso preserva o reconhecimento imune por anticorpos funcionais de soros convalescentes?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'RESPOSTA_IMUNE',
            targetFieldLabel: 'Validação de Ligação Antígeno-Anticorpo',
            responseType: 'ambos'
          }
        ],
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
        icon: 'Layers',
        microActivities: ['Construção do Banco Celular Mestre (MCB)', 'Construção do Banco Celular de Trabalho (WCB)', 'Qualificação e teste de agentes adventícios'],
        keyDecisions: ['O banco celular foi testado para vírus e micoplasma?', 'A estabilidade genética durante as passagens foi demonstrada?'],
        decisionsList: [
          {
            id: 'dec_banco_1',
            question: 'O banco celular (MCB/WCB) foi qualificado e testado para vírus adventícios e micoplasma conforme ICH Q5A/Q5D?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'BANCO_CELULAR',
            targetFieldLabel: 'Qualificação do Banco Celular',
            responseType: 'ambos'
          }
        ],
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
        icon: 'TestTube',
        microActivities: ['Fermentação/cultivo em biorreator', 'Purificação downstream multietapas', 'Filtração estéril e alíquotas'],
        keyDecisions: ['O processo downstream elimina contaminantes de processo (HCP, DNA residual)?', 'O volume gerado supre todos os estudos toxicológicos?'],
        decisionsList: [
          {
            id: 'dec_ifa_1',
            question: 'O processo downstream elimina satisfatoriamente contaminantes de processo (HCP e DNA residual da célula hospedeira)?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'PROCESSO_DOWNSTREAM',
            targetFieldLabel: 'Purificação Downstream e Contaminantes',
            responseType: 'ambos'
          },
          {
            id: 'dec_ifa_2',
            question: 'O volume do lote BPL gerado é suficiente para suprir todos os estudos toxicológicos e estabilidade?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'PROCESSO_UPSTREAM',
            targetFieldLabel: 'Escala de Produção BPL',
            responseType: 'texto'
          }
        ],
        regulatoryPoints: ['Certificado de análise emitido com parâmetros mínimos de liberação.'],
        technicalJustifications: ['Racional de equivalência entre lote de pesquisa e lote pré-clínico.'],
        referenceGuides: [
          { title: 'WHO TRS 1004 – Annex 2: Manufacturing of Biologicals', link: 'https://www.who.int' }
        ]
      },
      {
        name: 'Caracterização e impurezas',
        phase: VACCINE_PLATFORM_PHASES[1],
        icon: 'Microscope',
        microActivities: ['Determinação de pureza por SEC-HPLC e RP-HPLC', 'Espectrometria de massas (MALDI-TOF / LC-MS/MS)', 'Quantificação de endotoxinas (LAL) e DNA residual da célula hospedeira'],
        keyDecisions: ['O nível de endotoxina está abaixo do limite para uso animal e clínico (< 5 EU/dose)?', 'O perfil de agregados proteicos foi caracterizado?'],
        decisionsList: [
          {
            id: 'dec_imp_1',
            question: 'O nível de endotoxina bacteriana está rigorosamente abaixo do limite máximo (< 5 EU/dose)?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'IMPUREZAS_RESIDUAIS',
            targetFieldLabel: 'Controle de Endotoxinas e Impurezas',
            responseType: 'ambos'
          },
          {
            id: 'dec_imp_2',
            question: 'O perfil de monômeros versus agregados proteicos foi caracterizado por SEC-HPLC e atende à especificação (>95% monômero)?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'ESPECIFICACOES_LIBERACAO',
            targetFieldLabel: 'Especificações Físico-Químicas do IFA',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Atendimento aos critérios de aceitação da Farmacopeia Brasileira e ICH Q6B.'],
        technicalJustifications: ['Justificativa dos limites de impurezas relacionadas ao produto e ao processo.'],
        referenceGuides: [
          { title: 'ICH Q6B – Test Procedures and Acceptance Criteria', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Desenvolvimento da formulação e controle de qualidade',
        phase: VACCINE_PLATFORM_PHASES[1],
        icon: 'Beaker',
        microActivities: ['Seleção de adjuvantes imunológicos', 'Testes de adsorção antígeno-adjuvante', 'Otimização de pH, osmolalidade e tensoativos'],
        keyDecisions: ['Por que foi escolhido determinado adjuvante?', 'A formulação será líquida estável ou liofilizada?'],
        decisionsList: [
          {
            id: 'dec_form_1',
            question: 'Por que foi escolhido determinado adjuvante e qual o racional de sinergismo com o antígeno?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'JUSTIFICATIVA_ADJUVANTE',
            targetFieldLabel: 'Justificativa do Adjuvante',
            responseType: 'ambos'
          },
          {
            id: 'dec_form_2',
            question: 'Qual a composição quantitativa final (excipientes, tensoativos, pH e osmolalidade)?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'COMPOSICAO_FINAL',
            targetFieldLabel: 'Composição da Formulação Final',
            responseType: 'ambos'
          }
        ],
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
        icon: 'Clock',
        microActivities: ['Estudo de estabilidade acelerada (25°C e 40°C)', 'Estudo de estabilidade sob refrigeração (2-8°C)', 'Avaliação de estresse de congelamento e descongelamento'],
        keyDecisions: ['Qual o prazo de validade provisório para os ensaios clínicos?', 'O antígeno permanece adsorvido ao longo do tempo?'],
        decisionsList: [
          {
            id: 'dec_estab_1',
            question: 'Qual o prazo de validade provisório e temperatura de armazenamento (2-8°C ou congelado) sustentado pelos dados preliminares?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'ESTABILIDADE_PRELIMINAR',
            targetFieldLabel: 'Estabilidade Provisória e Armazenamento',
            responseType: 'ambos'
          }
        ],
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
        icon: 'Rat', // animal icon ONLY for in-vivo studies!
        microActivities: ['Curva de dose-resposta em camundongos', 'Ensaios de imunogenicidade humoral (títulos de anticorpos neutralizantes)', 'Ensaios de imunidade celular (ELISpot / Citometria de fluxo)'],
        keyDecisions: [
          'Qual a justificativa para a seleção do modelo animal?',
          'Quais estudos são necessários para esta plataforma?',
          'Qual a justificativa para seleção da dose?',
          'Por que foi escolhido determinado adjuvante?',
          'Qual a justificativa para a via de administração e o esquema de doses?',
          'Quais normas e guias fundamentam o delineamento?'
        ],
        decisionsList: [
          {
            id: 'dec_invivo_1',
            question: 'Qual a justificativa técnica para a seleção do modelo animal?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'MODELO_ANIMAL',
            targetFieldLabel: 'Seleção do Modelo Animal',
            responseType: 'ambos'
          },
          {
            id: 'dec_invivo_2',
            question: 'Qual a justificativa para seleção da dose, via de administração e esquema vacinal?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'MODELO_ANIMAL',
            targetFieldLabel: 'Racional de Dose e Via de Administração',
            responseType: 'ambos'
          },
          {
            id: 'dec_invivo_3',
            question: 'Quais normas e guias fundamentam o delineamento dos estudos não clínicos?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'MODELO_ANIMAL',
            targetFieldLabel: 'Guias Não Clínicos Aplicáveis',
            responseType: 'ambos'
          },
          {
            id: 'dec_invivo_4',
            question: 'Os títulos de anticorpos neutralizantes e a resposta celular TH1/TH2 atingiram os critérios de sucesso pré-definidos?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'RESPOSTA_IMUNE',
            targetFieldLabel: 'Resposta Imune e Eficácia Animal',
            responseType: 'ambos'
          }
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
        icon: 'Building',
        microActivities: ['Transferência de tecnologia para planta BPF', 'Produção de lote piloto clínico sob Boas Práticas', 'Envase e rotulagem estéril em sala limpa'],
        keyDecisions: ['A planta contratada possui Certificação de Boas Práticas de Fabricação (CBPF) válida pela Anvisa?', 'Os testes de esterilidade e pirógenos foram concluídos?'],
        decisionsList: [
          {
            id: 'dec_bpf_1',
            question: 'A planta fabril contratada possui CBPF vigente para produtos biológicos estéreis emitida pela Anvisa?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'PROCESSO_UPSTREAM',
            targetFieldLabel: 'Certificação BPF da Planta',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Atendimento integral à RDC Anvisa nº 658/2019 (Diretrizes Gerais de BPF).'],
        technicalJustifications: ['Validação de processo de filtração esterilizante e simulação de envase (media fill).'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 658/2019 – Boas Práticas de Fabricação', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Estudos de segurança',
        phase: VACCINE_PLATFORM_PHASES[1],
        icon: 'ShieldCheck',
        microActivities: ['Ensaio de toxicidade de dose repetida BPL', 'Tolerância local e histopatologia no sítio de injeção', 'Monitoramento laboratorial e pesquisa de reações imunopatológicas'],
        keyDecisions: ['O NOAEL foi determinado formalmente?', 'Houve relato de reactogenicidade ou fenômeno ADE?'],
        decisionsList: [
          {
            id: 'dec_tox_1',
            question: 'O NOAEL (No Observed Adverse Effect Level) foi formalmente determinado no estudo de toxicidade de dose repetida BPL?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'TOXICIDADE_SEGURANCA',
            targetFieldLabel: 'Determinação do NOAEL e Toxicologia',
            responseType: 'ambos'
          }
        ],
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
        icon: 'FileText',
        microActivities: ['Compilação dos dados pré-clínicos', 'Resumo de segurança e farmacologia', 'Instruções operacionais para os centros clínicos'],
        keyDecisions: ['Todas as reações adversas observadas em animais foram relatadas com clareza?', 'As orientações de manejo clínico estão atualizadas?'],
        decisionsList: [
          {
            id: 'dec_broch_1',
            question: 'Todas as reações observadas em estudos não clínicos e a margem de segurança clínica foram descritas com clareza na Brochura do Investigador?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'STATUS_SUBMISSAO',
            targetFieldLabel: 'Brochura do Investigador e Dados de Segurança',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Elaboração estritamente alinhada com ICH E6(R2) e RDC Anvisa 9/2015.'],
        technicalJustifications: ['Balanço risco-benefício favorável à administração em voluntários humanos.'],
        referenceGuides: [
          { title: 'ICH E6(R2) – Good Clinical Practice', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Dossiê do IFA',
        phase: VACCINE_PLATFORM_PHASES[2],
        icon: 'FileText',
        microActivities: ['Documentação de estrutura e caracterização', 'Descrição do processo de fabricação e controles', 'Estabilidade e validação de métodos analíticos'],
        keyDecisions: ['Os controles em processo (IPC) cobrem todos os parâmetros críticos (CPP)?', 'O perfil de impurezas foi justificado?'],
        decisionsList: [
          {
            id: 'dec_dos_ifa_1',
            question: 'Os controles em processo (IPC) e parâmetros críticos (CPP) estão documentados no formato CTD 3.2.S?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'PROCESSO_DOWNSTREAM',
            targetFieldLabel: 'Compilação do Dossiê do IFA',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Módulo 3 do CTD (Common Technical Document) - Seção 3.2.S.'],
        technicalJustifications: ['Rastreabilidade das matérias-primas e substâncias de partida.'],
        referenceGuides: [
          { title: 'ICH M4Q – Common Technical Document: Quality', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'Dossiê da Vacina',
        phase: VACCINE_PLATFORM_PHASES[2],
        icon: 'FileText',
        microActivities: ['Composição da formulação final e adjuvante', 'Controle de qualidade do produto terminado', 'Especificações de liberação clínica'],
        keyDecisions: ['O sistema de embalagem primária atende aos testes de integridade e estanqueidade?'],
        decisionsList: [
          {
            id: 'dec_dos_vac_1',
            question: 'O sistema de embalagem primária e os testes de estanqueidade e esterilidade atendem aos requisitos do Módulo 3.2.P?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'COMPOSICAO_FINAL',
            targetFieldLabel: 'Dossiê do Produto Terminado',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Módulo 3 do CTD - Seção 3.2.P.'],
        technicalJustifications: ['Compatibilidade com dispositivos de aplicação parenteral.'],
        referenceGuides: [
          { title: 'ICH M4Q – The CTD: Quality Module', link: 'https://www.ich.org' }
        ]
      },
      {
        name: 'DEEC',
        phase: VACCINE_PLATFORM_PHASES[2],
        icon: 'FileText',
        microActivities: ['Elaboração do Dossiê Específico de Ensaio Clínico', 'Protocolo clínico detalhado e formulários de relato de caso (CRF)', 'Termo de Consentimento Livre e Esclarecido (TCLE)'],
        keyDecisions: ['O protocolo prevê plano claro de monitoramento de segurança e comitê independente (DSMB)?'],
        decisionsList: [
          {
            id: 'dec_deec_1',
            question: 'O protocolo clínico do DEEC prevê monitoramento independente de segurança (DSMB) e critérios claros de parada de dose?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'ENDPOINTS_CLINICOS',
            targetFieldLabel: 'DEEC e Protocolo Clínico',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Atendimento aos requisitos específicos da RDC Anvisa nº 9/2015.'],
        technicalJustifications: ['Delineamento estatístico e cálculo do tamanho amostral.'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 9/2015 – Regulamento para Ensaios Clínicos', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Documentos complementares',
        phase: VACCINE_PLATFORM_PHASES[2],
        icon: 'FileText',
        microActivities: ['Parecer consubstanciado da CONEP / CEP institucional', 'Seguro para participantes da pesquisa', 'Certificados de liberação de lote clínico'],
        keyDecisions: ['Todos os documentos éticos e operacionais estão vigentes?'],
        decisionsList: [
          {
            id: 'dec_doc_comp_1',
            question: 'Os pareceres consubstanciados do CEP institucional e CONEP estão vigentes e sem pendências éticas?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'APROVACOES_ETICAS',
            targetFieldLabel: 'Aprovações Éticas CEP/CONEP',
            responseType: 'ambos'
          }
        ],
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
        icon: 'Send',
        microActivities: ['Protocolo eletrônico do DDCM junto à Anvisa', 'Organização de pastas e metadados no sistema Solicita', 'Confirmação de recebimento'],
        keyDecisions: ['Todos os módulos foram devidamente assinados digitalmente por responsáveis técnicos?'],
        decisionsList: [
          {
            id: 'dec_subm_1',
            question: 'O DDCM foi integralmente protocolado no sistema Solicita da Anvisa e o comprovante foi anexado?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'STATUS_SUBMISSAO',
            targetFieldLabel: 'Protocolo Eletrônico DDCM Anvisa',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Protocolo formal de Dossiê de Desenvolvimento Clínico de Medicamento (DDCM).'],
        technicalJustifications: ['Cumprimento dos prazos de resposta administrativa.'],
        referenceGuides: [
          { title: 'Anvisa – Manual do Usuário do Sistema Solicita', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Respostas a exigências',
        phase: VACCINE_PLATFORM_PHASES[3],
        icon: 'CheckCircle2',
        microActivities: ['Análise das exigências técnicas emitidas pela Anvisa', 'Condução de ensaios complementares solicitados', 'Submissão da petição secundária de resposta'],
        keyDecisions: ['As respostas atendem integralmente ao parecer da Gerência de Medicamentos Biológicos (GGMED)?'],
        decisionsList: [
          {
            id: 'dec_exig_1',
            question: 'Todas as exigências técnicas formuladas pela GGMED/Anvisa foram respondidas satisfatoriamente dentro do prazo legal?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'STATUS_SUBMISSAO',
            targetFieldLabel: 'Cumprimento de Exigências Sanitárias',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Prazo improrrogável de atendimento a exigências conforme legislação sanitária.'],
        technicalJustifications: ['Fundamentação técnica e científica robusta para cada questionamento da autoridade.'],
        referenceGuides: [
          { title: 'RDC Anvisa nº 9/2015 – Seção de Notificação e Exigências', link: 'https://www.gov.br/anvisa' }
        ]
      },
      {
        name: 'Aprovação/autorização regulatória',
        phase: VACCINE_PLATFORM_PHASES[3],
        icon: 'Award',
        microActivities: ['Publicação do Comunicado Especial (CE) no Diário Oficial', 'Liberação para importação de insumos clínicos', 'Reunião de início de ensaio'],
        keyDecisions: ['Todas as condicionantes técnicas foram cumpridas para início da administração humana?'],
        decisionsList: [
          {
            id: 'dec_aprov_1',
            question: 'O Comunicado Especial (CE) de autorização clínica emitido pela Anvisa foi publicado e arquivado?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'AUTORIZACAO_FINAL',
            targetFieldLabel: 'Comunicado Especial de Autorização Anvisa',
            responseType: 'ambos'
          }
        ],
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
        icon: 'Building',
        microActivities: ['Qualificação e seleção da CRO executora', 'Visitas de pré-seleção dos centros de pesquisa clínica', 'Formalização de contratos e orçamentos'],
        keyDecisions: ['O centro de pesquisa possui UTI e suporte para eventos adversos imediatos?'],
        decisionsList: [
          {
            id: 'dec_cro_1',
            question: 'O centro de pesquisa e a CRO foram devidamente qualificados e possuem suporte para emergências e eventos adversos imediatos?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'CENTROS_PESQUISA',
            targetFieldLabel: 'Qualificação de Centros e CRO',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Qualificação de prestadores de serviço e delegação de tarefas (ICH E6).'],
        technicalJustifications: ['Capacidade operacional comprovada para ensaios FIH (First-in-Human).'],
        referenceGuides: [{ title: 'ICH E6(R2) – Section 5: Sponsor Oversight', link: 'https://www.ich.org' }]
      },
      {
        name: 'Estudos Clínicos Fase I: Recrutamento e Execução',
        phase: VACCINE_PLATFORM_PHASES[4],
        icon: 'Activity',
        microActivities: ['Registro no ReBEC / ClinicalTrials.gov', 'Triagem e inclusão de voluntários sadios', 'Escalonamento de doses e monitoramento intensivo de segurança'],
        keyDecisions: ['Os critérios de parada e segurança do protocolo foram acionados?', 'Qual a dose recomendada para avanço à Fase 2 (RP2D)?'],
        decisionsList: [
          {
            id: 'dec_fase1_1',
            question: 'Qual a dose recomendada para Fase 2 (RP2D) estabelecida com base nos dados de segurança e farmacodinâmica de Fase 1?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'FASE_CLINICA_INICIAL',
            targetFieldLabel: 'Dose Recomendada para Fase 2',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Notificação imediata de eventos adversos graves inesperados (SUSAR) à Anvisa em até 7 dias.'],
        technicalJustifications: ['Relatório preliminar de segurança e determinação da dose máxima tolerada.'],
        referenceGuides: [{ title: 'RDC Anvisa nº 9/2015 – Farmacovigilância em Ensaios Clínicos', link: 'https://www.gov.br/anvisa' }]
      },
      {
        name: 'Estudos Clínicos Fase II: Execução e Imunogenicidade',
        phase: VACCINE_PLATFORM_PHASES[5],
        icon: 'Activity',
        microActivities: ['Inclusão de coortes ampliadas (voluntários e população-alvo)', 'Avaliação comparativa com placebo/controle ativo', 'Coleta seriada para resposta imune humoral e celular'],
        keyDecisions: ['A taxa de soroconversão e os títulos de anticorpos confirmam eficácia preliminar?'],
        decisionsList: [
          {
            id: 'dec_fase2_1',
            question: 'A taxa de soroconversão e os títulos de anticorpos neutralizantes em humanos confirmam eficácia preliminar e resposta TH1?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'ENDPOINTS_CLINICOS',
            targetFieldLabel: 'Imunogenicidade em Fase 2',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Monitoramento contínuo por Comitê Independente de Monitoramento de Dados (IDMC).'],
        technicalJustifications: ['Poder estatístico de discriminação de resposta imunogênica entre esquemas vacinais.'],
        referenceGuides: [{ title: 'WHO Guidelines on Clinical Evaluation of Vaccines', link: 'https://www.who.int' }]
      },
      {
        name: 'Estudos Clínicos Fase III: Ensaio Multicêntrico de Eficácia',
        phase: VACCINE_PLATFORM_PHASES[6],
        icon: 'Activity',
        microActivities: ['Ensaio randomizado duplo-cego multicêntrico de larga escala', 'Vigilância ativa de casos sintomáticos da doença', 'Análise interina e relatório final de eficácia e segurança'],
        keyDecisions: ['O desfecho primário de eficácia clínica atingiu o limiar pré-especificado (ex: > 50%)?', 'O perfil de segurança a longo prazo é sustentável?'],
        decisionsList: [
          {
            id: 'dec_fase3_1',
            question: 'O desfecho primário de eficácia clínica protetora atingiu o limiar regulatório pré-especificado (ex: > 50% de redução de casos sintomáticos)?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'ENDPOINTS_CLINICOS',
            targetFieldLabel: 'Eficácia Clínica Fase 3',
            responseType: 'ambos'
          }
        ],
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
        icon: 'Sparkles',
        microActivities: ['Seleção do vetor plasmidial de expressão', 'Otimização de códons para mamíferos', 'Clonagem molecular e checagem de sequenciamento'],
        keyDecisions: ['O promotor e sequência líder maximizam a expressão?', 'O vetor possui marcador de seleção livre de antibióticos beta-lactâmicos?'],
        decisionsList: [
          {
            id: 'dec_dna_1',
            question: 'O promotor e sequência líder maximizam a expressão sem riscos de homologia genômica indesejada?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'RACIONAL_PLATAFORMA',
            targetFieldLabel: 'Vetor Plasmidial de Expressão',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Normas da CTNBio sobre Organismos Geneticamente Modificados (OGM).'],
        technicalJustifications: ['Racional de expressão e minimização de riscos de integração genômica.'],
        referenceGuides: [{ title: 'WHO Guidelines for Assuring Quality of DNA Vaccines', link: 'https://www.who.int' }]
      },
      {
        name: 'Estudos in vivo',
        phase: VACCINE_PLATFORM_PHASES[1],
        icon: 'Rat', // animal icon ONLY for in-vivo studies!
        microActivities: ['Ensaios de imunogenicidade com eletroporação / injetores sem agulha', 'Curva dose-resposta e avaliação de adjuvantes moleculares', 'Pesquisa de anticorpos anti-DNA e tolerância sistêmica'],
        keyDecisions: [
          'Qual a justificativa para a seleção do modelo animal?',
          'Quais estudos são necessários para esta plataforma?',
          'Qual a justificativa para seleção da dose?',
          'Por que foi escolhido determinado adjuvante?',
          'Qual a justificativa para a via de administração e o esquema de doses?',
          'Quais normas e guias fundamentam o delineamento?'
        ],
        decisionsList: [
          {
            id: 'dec_dna_invivo_1',
            question: 'Qual a justificativa técnica para a seleção do modelo animal e método de entrega (eletroporação/pressão)?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'MODELO_ANIMAL',
            targetFieldLabel: 'Modelo Animal e Entrega de DNA',
            responseType: 'ambos'
          }
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
        icon: 'Layers',
        microActivities: ['Criopreservação de sementes virais', 'Sequenciamento genômico completo de alta profundidade', 'Testes de agentes adventícios e neurovirulência'],
        keyDecisions: ['A estabilidade genética de atenuação se mantém após 10 passagens sucessivas?'],
        decisionsList: [
          {
            id: 'dec_vir_1',
            question: 'A estabilidade genética do perfil de atenuação se mantém após passagens sucessivas?',
            status: 'Pendente',
            hasRegulatoryImpact: true,
            isMandatory: true,
            targetFieldKey: 'BANCO_CELULAR',
            targetFieldLabel: 'Estabilidade Genética de Atenuação Viral',
            responseType: 'ambos'
          }
        ],
        regulatoryPoints: ['Conformidade com Farmacopeia e ensaios de segurança viral OMS.'],
        technicalJustifications: ['Rastreabilidade da linhagem viral e histórico de passagens.'],
        referenceGuides: [{ title: 'WHO TRS 962 – Annex 2: Virus seed lots and cell substrates', link: 'https://www.who.int' }]
      }
    ]
  }
];

export interface RegulatoryGroupDefinition {
  groupName: string;
  description: string;
  fields: {
    key: string;
    label: string;
    phase: string;
    isMandatory: boolean;
    defaultValue?: string;
    defaultOriginMacro?: string;
  }[];
}

export const STANDARD_REGULATORY_GROUPS: RegulatoryGroupDefinition[] = [
  {
    groupName: 'Dados Gerais do Candidato Vacinal',
    description: 'Identificação, codinome, indicação terapêutica e características gerais do produto.',
    fields: [
      { key: 'NOME_DA_VACINA', label: 'Nome da Vacina e Codinome', phase: 'Descoberta / Prova de Conceito', isMandatory: true, defaultOriginMacro: 'Ideia e definição do candidato' },
      { key: 'INDICACAO_TERAPEUTICA', label: 'Indicação Terapêutica e População Alvo', phase: 'Descoberta / Prova de Conceito', isMandatory: true, defaultOriginMacro: 'Revisão da literatura' },
      { key: 'FORMA_FARMACEUTICA', label: 'Forma Farmacêutica e Via de Administração', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Desenvolvimento da formulação e controle de qualidade' }
    ]
  },
  {
    groupName: 'Racional e Plataforma Tecnológica',
    description: 'Fundamentação científica, biologia molecular e seleção da plataforma.',
    fields: [
      { key: 'RACIONAL_PLATAFORMA', label: 'Racional da Plataforma Tecnológica', phase: 'Descoberta / Prova de Conceito', isMandatory: true, defaultOriginMacro: 'Revisão da literatura' },
      { key: 'ALVO_ANTIGENICO', label: 'Alvo Antigênico e Epítopos Críticos', phase: 'Descoberta / Prova de Conceito', isMandatory: true, defaultOriginMacro: 'Ideia e definição do candidato' },
      { key: 'SISTEMA_EXPRESSAO', label: 'Sistema de Expressão Heterólogo', phase: 'Descoberta / Prova de Conceito', isMandatory: true, defaultOriginMacro: 'Ideia e definição do candidato' }
    ]
  },
  {
    groupName: 'Desenvolvimento do IFA (Substância Ativa)',
    description: 'Bancos celulares/virais, processos upstream e downstream de produção do IFA.',
    fields: [
      { key: 'BANCO_CELULAR', label: 'Banco Celular Mestre e de Trabalho (MCB/WCB)', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Banco de células, quando aplicável' },
      { key: 'PROCESSO_UPSTREAM', label: 'Condições de Cultivo e Escalonamento Upstream', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Produção de lote BPL do IFA' },
      { key: 'PROCESSO_DOWNSTREAM', label: 'Purificação e Eliminação de Contaminantes Downstream', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Produção de lote BPL do IFA' }
    ]
  },
  {
    groupName: 'Formulação e Adjuvantes',
    description: 'Adjuvantes imunológicos, excipientes, estabilidade e compatibilidade.',
    fields: [
      { key: 'JUSTIFICATIVA_ADJUVANTE', label: 'Justificativa da Escolha do Adjuvante', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Desenvolvimento da formulação e controle de qualidade' },
      { key: 'COMPOSICAO_FINAL', label: 'Composição Quantitativa e Excipientes', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Desenvolvimento da formulação e controle de qualidade' },
      { key: 'ESTABILIDADE_PRELIMINAR', label: 'Estabilidade Provisória e Condições de Armazenamento', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Estabilidade e interação entre componentes' }
    ]
  },
  {
    groupName: 'Controle de Qualidade e Métodos Analíticos',
    description: 'Ensaios de liberação, métodos analíticos validados e limites de impurezas.',
    fields: [
      { key: 'ESPECIFICACOES_LIBERACAO', label: 'Especificações e Critérios de Liberação de Lote', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Caracterização e impurezas' },
      { key: 'IMPUREZAS_RESIDUAIS', label: 'Controle de Impurezas e Agentes Adventícios', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Caracterização e impurezas' },
      { key: 'METODOS_ANALITICOS', label: 'Validação dos Métodos Analíticos Críticos', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Caracterização e impurezas' }
    ]
  },
  {
    groupName: 'Estudos Não Clínicos (Segurança, Imunogenicidade e Eficácia)',
    description: 'Modelos animais, resposta imune celular/humoral e toxicologia BPL.',
    fields: [
      { key: 'MODELO_ANIMAL', label: 'Justificativa do Modelo Animal e Esquema de Doses', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Estudos in vivo' },
      { key: 'RESPOSTA_IMUNE', label: 'Imunogenicidade Humoral e Celular em Animais', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Estudos in vivo' },
      { key: 'TOXICIDADE_SEGURANCA', label: 'Estudos de Toxicidade de Dose Repetida e NOAEL', phase: 'Desenvolvimento Não Clínico', isMandatory: true, defaultOriginMacro: 'Estudos de segurança' }
    ]
  },
  {
    groupName: 'Delineamento Clínico',
    description: 'Dose First-in-Human, centros de pesquisa, protocolo clínico e comitês.',
    fields: [
      { key: 'FASE_CLINICA_INICIAL', label: 'Racional da Dose Inicial e Escalonamento Clínico', phase: 'Ensaio Clínico Fase 1', isMandatory: true, defaultOriginMacro: 'Estudos Clínicos Fase I: Recrutamento e Execução' },
      { key: 'CENTROS_PESQUISA', label: 'Centros de Pesquisa e Qualificação de CRO', phase: 'Ensaio Clínico Fase 1', isMandatory: true, defaultOriginMacro: 'Estudos Clínicos Fase I: Definição de CRO e centros de pesquisa' },
      { key: 'ENDPOINTS_CLINICOS', label: 'Desfechos Primários e Secundários do Ensaio', phase: 'Ensaio Clínico Fase 2', isMandatory: true, defaultOriginMacro: 'Estudos Clínicos Fase II: Execução e Imunogenicidade' }
    ]
  },
  {
    groupName: 'Aspectos Regulatórios e Submissão',
    description: 'Submissão formal do DDCM, aprovações éticas, exigências e autorizações.',
    fields: [
      { key: 'STATUS_SUBMISSAO', label: 'Protocolo Eletrônico do DDCM na Anvisa', phase: 'Submissão / Aprovação', isMandatory: true, defaultOriginMacro: 'Submissão regulatória' },
      { key: 'APROVACOES_ETICAS', label: 'Parecer Consubstanciado CEP/CONEP', phase: 'Documentação Regulatória', isMandatory: true, defaultOriginMacro: 'Documentos complementares' },
      { key: 'AUTORIZACAO_FINAL', label: 'Comunicado Especial (CE) e Início de Ensaio', phase: 'Submissão / Aprovação', isMandatory: true, defaultOriginMacro: 'Aprovação/autorização regulatória' }
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
