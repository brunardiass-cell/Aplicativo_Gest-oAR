
import { ActivityPlanTemplate, TeamMember, AppUser, RegulatoryStandard, Meeting } from './types';

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
    id: 'user_user_ester',
    username: 'Ester (Acesso)',
    email: 'ester@ctvacinas.org',
    role: 'user_team_2',
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

export const DEFAULT_TEAM_MEMBERS: TeamMember[] = [
  { id: 'tm_1', name: 'Graziella', role: 'Líder', isLeader: true, password: 'admin' },
  { id: 'tm_2', name: 'Bruna Dias', role: 'Equipe', isLeader: false },
  { id: 'tm_3', name: 'Ester', role: 'Equipe', isLeader: false },
  { id: 'tm_4', name: 'Marjorie', role: 'Equipe', isLeader: false },
  { id: 'tm_5', name: 'Ana Luiza', role: 'Equipe', isLeader: false },
  { id: 'tm_6', name: 'Ana Terzian', role: 'Equipe', isLeader: false },
  { id: 'tm_comite', name: 'Comitê Gestor', role: 'Gestão', isLeader: false, isComiteGestor: true }
];

export const ADMIN_WHITELIST = [
  'priscilapassos@ctvacinas.org'
];

const defaultPhases = [
  'Fase 1: Prova de Conceito',
  'Fase 2: Fase Não Clínica',
  'Fase 3: Fase Clínica I',
  'Fase 4: Fase Clínica II',
  'Fase 5: Fase Clínica III',
];

export const DEFAULT_ACTIVITY_PLANS: ActivityPlanTemplate[] = [
  {
    id: 'plan_protein',
    name: 'Proteína Recombinante',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Desenvolvimento de Dossiê de Insumo (DIFA)', phase: defaultPhases[0] },
      { name: 'Coordenação de Estudo de Estabilidade', phase: defaultPhases[0] },
      { name: 'Validação de Processo Produtivo', phase: defaultPhases[0] },
      { name: 'Elaboração de Relatório Clínico Fase III', phase: defaultPhases[0] },
      { name: 'Submissão Regulatória Final', phase: defaultPhases[0] }
    ]
  },
  {
    id: 'plan_virus',
    name: 'Vírus Recombinante',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Caracterização do Banco Viral Mestre/Trabalho', phase: defaultPhases[0] },
      { name: 'Gerenciamento de Testes de Adventícios', phase: defaultPhases[0] },
      { name: 'Desenvolvimento do Processo de Inativação Viral', phase: defaultPhases[0] },
      { name: 'Compilação e Submissão de Dossiê', phase: defaultPhases[0] }
    ]
  },
  {
    id: 'plan_rna',
    name: 'RNA (Terapia Gênica)',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Qualificação do Plasmídeo Molde', phase: defaultPhases[0] },
      { name: 'Validação da Transcrição in vitro (TIV)', phase: defaultPhases[0] },
      { name: 'Análise de Pureza e Integridade do RNA', phase: defaultPhases[0] },
      { name: 'Elaboração de Relatório de Segurança Pré-clínica', phase: defaultPhases[0] },
    ]
  },
  {
    id: 'plan_dna',
    name: 'DNA (Vacina de DNA)',
    phases: defaultPhases,
    macroActivities: [
      { name: 'Construção e Qualificação do Vetor Plasmidial', phase: defaultPhases[0] },
      { name: 'Desenvolvimento da Produção em Larga Escala', phase: defaultPhases[0] },
      { name: 'Desenvolvimento de Teste de Potência', phase: defaultPhases[0] },
      { name: 'Preparação para Submissão de Estudos Clínicos', phase: defaultPhases[0] },
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
