// Sistema de Templates Operacionais Padrão, Regras de Dependência e Fluxo de Contratação

export type OperationalTemplateKey =
  | 'development_process'
  | 'batch_manufacturing'
  | 'quality_control'
  | 'characterization'
  | 'stability'
  | 'comparability'
  | 'biological_assay'
  | 'glp_safety'
  | 'regulatory_document';

export interface OperationalTemplateStep {
  name: string;
  checklist: string[];
  deliverable?: string;
}

export interface OperationalTemplateDefinition {
  key: OperationalTemplateKey;
  name: string;
  description: string;
  steps: OperationalTemplateStep[];
  deliverable: string;
}

// 9 Templates-base operacionais requisitados
export const DEFAULT_OPERATIONAL_TEMPLATES: Record<OperationalTemplateKey, OperationalTemplateDefinition> = {
  development_process: {
    key: 'development_process',
    name: 'Desenvolvimento técnico/processo',
    description: 'Definir objetivo e requisitos → planejar → executar desenvolvimento → avaliar resultados → consolidar parâmetros/processo → aprovar conclusão.',
    deliverable: 'Relatório de desenvolvimento de processo e parâmetros consolidados',
    steps: [
      {
        name: 'Definir objetivo e requisitos',
        checklist: [
          'Levantar parâmetros críticos de processo (CPPs)',
          'Definir especificações-alvo do produto (QTPP)',
          'Identificar restrições técnicas e operacionais'
        ]
      },
      {
        name: 'Planejar desenvolvimento',
        checklist: [
          'Elaborar desenho experimental (DoE)',
          'Mapear reagentes, insumos e consumíveis necessários',
          'Definir cronograma e equipamentos requeridos'
        ]
      },
      {
        name: 'Executar desenvolvimento',
        checklist: [
          'Conduzir bateladas de bancada ou testes de bancada',
          'Registrar variáveis de processo em tempo real',
          'Monitorar purificação e rendimento preliminar'
        ]
      },
      {
        name: 'Avaliar resultados',
        checklist: [
          'Realizar análise estatística dos dados obtidos',
          'Comparar com critérios de aceitação preestabelecidos',
          'Identificar desvios e oportunidades de otimização'
        ]
      },
      {
        name: 'Consolidar parâmetros/processo',
        checklist: [
          'Estabelecer faixas operacionais normais e comprovadas aceitáveis',
          'Redigir procedimento operacional preliminar (POP de produção)',
          'Definir pontos críticos de amostragem em processo'
        ]
      },
      {
        name: 'Aprovar conclusão',
        checklist: [
          'Revisão técnica multidisciplinar dos resultados',
          'Emissão e aprovação formal do relatório de desenvolvimento'
        ],
        deliverable: 'Relatório de Desenvolvimento Concluído'
      }
    ]
  },

  batch_manufacturing: {
    key: 'batch_manufacturing',
    name: 'Fabricação de lote',
    description: 'Planejar lote → confirmar materiais/processo → fabricar → registrar desvios → encaminhar amostras → revisar documentação do lote.',
    deliverable: 'Registro de lote (Batch Record) e Laudo de Produção',
    steps: [
      {
        name: 'Planejar lote',
        checklist: [
          'Emitir ordem de produção e cronograma detalhado',
          'Liberar sala limpa e verificar qualificação de utilidades',
          'Verificar prontidão da equipe técnica'
        ]
      },
      {
        name: 'Confirmar materiais/processo',
        checklist: [
          'Checar certificado de análise e liberação de matérias-primas',
          'Verificar calibração e sanitização de equipamentos',
          'Conferir registro de lote mestre atualizado'
        ]
      },
      {
        name: 'Fabricar lote',
        checklist: [
          'Executar processo produtivo conforme instrução de fabricação',
          'Realizar controles em processo (pH, densidade, osmolalidade, etc.)',
          'Proceder com envase e rotulagem provisória'
        ]
      },
      {
        name: 'Registrar desvios',
        checklist: [
          'Registrar quaisquer ocorrências fora de especificação ou desvios',
          'Classificar criticidade do desvio e impacto no produto',
          'Abrir investigação e plano de ação imediato se aplicável'
        ]
      },
      {
        name: 'Encaminhar amostras',
        checklist: [
          'Coletar amostras representativas conforme plano de amostragem',
          'Encaminhar amostras para Controle de Qualidade com termo de custódia',
          'Encaminhar alíquotas para estudos de estabilidade e retenção'
        ]
      },
      {
        name: 'Revisar documentação do lote',
        checklist: [
          'Revisar preenchimento integral do Batch Record pela Produção',
          'Auditar registros de calibração e sanitização',
          'Assinatura e envio para Garantia da Qualidade'
        ],
        deliverable: 'Batch Record Revisado'
      }
    ]
  },

  quality_control: {
    key: 'quality_control',
    name: 'Controle de qualidade',
    description: 'Definir/consolidar métodos e critérios → receber amostras → executar ensaios físico-químicos, microbiológicos, biológicos e/ou impurezas → revisar resultados → aprovar laudo/resultado.',
    deliverable: 'Certificado de Análise (CoA) / Laudo Analítico de Liberação',
    steps: [
      {
        name: 'Definir/consolidar métodos e critérios',
        checklist: [
          'Verificar especificação analítica oficial do produto',
          'Confirmar validação e status de prontidão dos métodos analíticos',
          'Preparar e qualificar padrões de referência e reagentes'
        ]
      },
      {
        name: 'Receber amostras',
        checklist: [
          'Inspecionar integridade, lacre e temperatura das amostras',
          'Registrar entrada no sistema de Controle de Qualidade',
          'Armazenar em condições controladas conforme protocolo'
        ]
      },
      {
        name: 'Executar ensaios físico-químicos, microbiológicos, biológicos e/ou impurezas',
        checklist: [
          'Executar ensaios físico-químicos (pH, osmolalidade, HPLC/UPLC, etc.)',
          'Executar ensaios microbiológicos (esterilidade, endotoxinas, bioburden)',
          'Executar ensaios de impurezas relacionadas e do hospedeiro (HCP, HCD)',
          'Executar ensaios de teor e identidade'
        ]
      },
      {
        name: 'Revisar resultados',
        checklist: [
          'Conferência dupla de dados brutos e cálculos analíticos',
          'Confrontar dados com especificações de aceitação farmacopéicas',
          'Investigar resultados fora de tendência (OOT) ou fora de especificação (OOS)'
        ]
      },
      {
        name: 'Aprovar laudo/resultado',
        checklist: [
          'Emitir Certificado de Análise (CoA) oficial',
          'Aprovação e assinatura pelo Responsável Técnico / Analítico',
          'Liberação analítica formal do lote'
        ],
        deliverable: 'Certificado de Análise (CoA) Aprovado'
      }
    ]
  },

  characterization: {
    key: 'characterization',
    name: 'Caracterização',
    description: 'Definir atributos/métodos → confirmar amostras → executar ensaios → analisar dados → revisar e aprovar relatório.',
    deliverable: 'Relatório Completo de Caracterização Estrutural e Físico-Química',
    steps: [
      {
        name: 'Definir atributos/métodos',
        checklist: [
          'Definir painel de atributos estruturais e biofísicos críticos',
          'Selecionar métodos analíticos ortogonais de alta resolução',
          'Definir parâmetros de reprodutibilidade e sensibilidade'
        ]
      },
      {
        name: 'Confirmar amostras',
        checklist: [
          'Selecionar lotes representativos e lote de referência histórico',
          'Conferir histórico e rastreabilidade das alíquotas',
          'Preparar controles positivos e negativos'
        ]
      },
      {
        name: 'Executar ensaios',
        checklist: [
          'Executar espectrometria de massas (confirmação de massa intacta e mapeamento peptídico)',
          'Executar análises de estrutura secundária e terciária (CD, FTIR, Fluorescência)',
          'Determinar perfil de carga e variantes glicosiladas',
          'Executar DLS/SEC-MALS para determinação de agregados e oligômeros'
        ]
      },
      {
        name: 'Analisar dados',
        checklist: [
          'Alinhar e interpretar espectros e cromatogramas',
          'Comparar dados experimentais com sequência teórica prevista',
          'Mapear e quantificar modificações pós-traducionais (PTMs)'
        ]
      },
      {
        name: 'Revisar e aprovar relatório',
        checklist: [
          'Compilar dados em relatório técnico estruturado',
          'Revisão técnica por especialista em biofísica/bioquímica',
          'Aprovação formal do relatório de caracterização'
        ],
        deliverable: 'Relatório de Caracterização Aprovado'
      }
    ]
  },

  stability: {
    key: 'stability',
    name: 'Estabilidade',
    description: 'Definir protocolo → definir estudos de longa duração, acelerado e/ou em uso → iniciar estudo → acompanhar pontos → consolidar resultados → revisar e aprovar relatório.',
    deliverable: 'Relatório de Estabilidade com Determinação de Validade Provisória',
    steps: [
      {
        name: 'Definir protocolo',
        checklist: [
          'Elaborar protocolo conforme guias ICH Q1A / Anvisa RDC',
          'Definir atributos de teste e critérios de aceitação específicos',
          'Definir embalagem primária de teste representativa do produto comercial'
        ]
      },
      {
        name: 'Definir estudos de longa duração, acelerado e/ou em uso',
        checklist: [
          'Definir câmara de longa duração (ex: 2°C - 8°C ou 25°C/60%UR)',
          'Definir condição acelerada (ex: 25°C/60%UR ou 40°C/75%UR)',
          'Definir estudo de estabilidade em uso ou fotoestabilidade quando aplicável',
          'Calcular quantidade total de frascos e amostras por tempo'
        ]
      },
      {
        name: 'Iniciar estudo',
        checklist: [
          'Alocar frascos nas câmaras climáticas qualificadas e calibradas',
          'Executar análise do ponto zero (T0)',
          'Ativar registro contínuo de temperatura e umidade'
        ]
      },
      {
        name: 'Acompanhar pontos',
        checklist: [
          'Controlar datas e janela de tolerância de retirada de amostras',
          'Executar ensaios analíticos nos tempos programados (ex: 1, 3, 6, 9, 12 meses)',
          'Registrar dados em planilha ou sistema de acompanhamento'
        ]
      },
      {
        name: 'Consolidar resultados',
        checklist: [
          'Avaliar tendências de degradação e cinética de perda de potência',
          'Executar regressão linear e análise estatística dos dados',
          'Avaliar necessidade de alteração de especificações ou condições de estocagem'
        ]
      },
      {
        name: 'Revisar e aprovar relatório',
        checklist: [
          'Elaborar relatório de estabilidade preliminar/final',
          'Determinar prazo de validade e recomendações de armazenamento',
          'Aprovação técnica e envio para compilação regulatória'
        ],
        deliverable: 'Relatório de Estabilidade Concluído'
      }
    ]
  },

  comparability: {
    key: 'comparability',
    name: 'Comparabilidade',
    description: 'Definir materiais e critérios → definir protocolo → executar análises → comparar processo e atributos de qualidade → avaliar impacto → aprovar relatório.',
    deliverable: 'Relatório de Estudo de Comparabilidade Pré e Pós-Mudança',
    steps: [
      {
        name: 'Definir materiais e critérios',
        checklist: [
          'Identificar lotes pré-mudança representativos (mínimo 3 lotes recomendados)',
          'Identificar lotes pós-mudança fabricados sob a nova condição/escala',
          'Definir faixas e critérios estatísticos de equivalência'
        ]
      },
      {
        name: 'Definir protocolo',
        checklist: [
          'Elaborar protocolo de comparabilidade conforme ICH Q5E',
          'Definir painel de ensaios analíticos, biológicos e de estabilidade comparativa',
          'Aprovar protocolo antes do início dos ensaios comparativos'
        ]
      },
      {
        name: 'Executar análises',
        checklist: [
          'Executar ensaios comparativos lado a lado sob as mesmas condições',
          'Avaliar pureza, perfil de impurezas e modificações pós-traducionais',
          'Executar ensaio de potência comparativa em paralelo'
        ]
      },
      {
        name: 'Comparar processo e atributos de qualidade',
        checklist: [
          'Confrontar dados físico-químicos e biológicos pré e pós-mudança',
          'Analisar sobreposição de perfis cromatográficos e espectrométricos',
          'Avaliar se diferenças observadas ultrapassam a variabilidade histórica'
        ]
      },
      {
        name: 'Avaliar impacto',
        checklist: [
          'Avaliar impacto potencial na eficácia, segurança e imunogenicidade clínica',
          'Determinar se há necessidade de estudos não clínicos ou clínicos adicionais',
          'Concluir se o produto pós-mudança é altamente similar ao pré-mudança'
        ]
      },
      {
        name: 'Aprovar relatório',
        checklist: [
          'Elaborar conclusão técnica robusta e justificada',
          'Revisão e assinatura por equipe multidisciplinar de especialistas',
          'Aprovação final do relatório de comparabilidade'
        ],
        deliverable: 'Relatório de Comparabilidade Aprovado'
      }
    ]
  },

  biological_assay: {
    key: 'biological_assay',
    name: 'Atividade biológica/laboratorial',
    description: 'Definir protocolo → preparar amostras → executar ensaios → registrar resultados → analisar → revisar e aprovar relatório.',
    deliverable: 'Relatório Técnico de Ensaio Biológico / Potência Laboratorial',
    steps: [
      {
        name: 'Definir protocolo',
        checklist: [
          'Definir princípio do método (in vitro, ELISA, neutralização, citometria, etc.)',
          'Estabelecer critérios de aceitação do sistema e controles de qualidade',
          'Verificar validade das linhagens celulares ou insumos biológicos'
        ]
      },
      {
        name: 'Preparar amostras',
        checklist: [
          'Preparar diluições seriadas padronizadas das amostras teste',
          'Preparar padrão de referência de calibração',
          'Verificar reagentes específicos e tampões de ensaio'
        ]
      },
      {
        name: 'Executar ensaios',
        checklist: [
          'Executar etapas de plaqueamento, incubação e revelação',
          'Garantir controle estrito de temperatura e tempos de incubação',
          'Realizar leitura instrumental (absorbância, fluorescência ou luminescência)'
        ]
      },
      {
        name: 'Registrar resultados',
        checklist: [
          'Registrar dados brutos eletrônicos ou cadernos de laboratório',
          'Verificar conformidade dos controles negativos e positivos',
          'Validar a curva analítica quanto ao coeficiente de determinação (R²)'
        ]
      },
      {
        name: 'Analisar',
        checklist: [
          'Calcular potência relativa e paralelismo de curvas sigmoides (modelo 4PL/5PL)',
          'Analisar reprodutibilidade entre triplicatas e réplicas',
          'Verificar se atende aos critérios de liberação'
        ]
      },
      {
        name: 'Revisar e aprovar relatório',
        checklist: [
          'Revisão técnica detalhada dos cálculos e dados brutos',
          'Elaboração e assinatura formal do relatório de ensaio biológico'
        ],
        deliverable: 'Relatório de Ensaio Biológico Concluído'
      }
    ]
  },

  glp_safety: {
    key: 'glp_safety',
    name: 'Segurança BPL',
    description: 'Definir plano → confirmar lote/amostras → executar estudo → receber relatório preliminar → revisar comentários → receber e aprovar relatório final.',
    deliverable: 'Relatório Final de Estudo de Segurança Não Clínica sob BPL (GLP)',
    steps: [
      {
        name: 'Definir plano',
        checklist: [
          'Elaborar plano de estudo de toxicidade em conformidade com as BPL (GLP)',
          'Definir espécies animais relevantes, grupos de dose e grupo controle',
          'Aprovação formal pelo Diretor do Estudo e comitê de ética no uso animal (CEUA)'
        ]
      },
      {
        name: 'Confirmar lote/amostras',
        checklist: [
          'Conferir certificado de análise e liberação do lote teste para uso pré-clínico',
          'Verificar estabilidade e homogeneidade do produto no veículo de dosagem',
          'Rastreabilidade total das amostras recebidas pelo laboratório BPL'
        ]
      },
      {
        name: 'Executar estudo',
        checklist: [
          'Administrar formulação conforme vias e cronograma aprovados',
          'Monitorar sinais clínicos diários, peso corpóreo e consumo alimentar',
          'Coletar amostras para patologia clínica (hematologia, bioquímica) e toxicocinética'
        ]
      },
      {
        name: 'Receber relatório preliminar',
        checklist: [
          'Receber dados consolidados preliminares do laboratório/CRO',
          'Analisar achados de necropsia e dados histopatológicos preliminares',
          'Identificar presença de toxicidade dose-limitante ou órgãos-alvo'
        ]
      },
      {
        name: 'Revisar comentários',
        checklist: [
          'Reunir equipe médica e toxicológica para discussão dos achados',
          'Submeter questionamentos e solicitar esclarecimentos adicionais ao Diretor do Estudo',
          'Definir nível de efeito adverso não observado (NOAEL) fundamentado'
        ]
      },
      {
        name: 'Receber e aprovar relatório final',
        checklist: [
          'Conferir declaração formal de conformidade com as Boas Práticas de Laboratório (BPL)',
          'Verificar assinaturas do Diretor do Estudo e da Garantia da Qualidade (QA)',
          'Aprovar versão final do relatório para subsidiar dossiê clínico (DDCM)'
        ],
        deliverable: 'Relatório Final BPL Auditado e Aprovado'
      }
    ]
  },

  regulatory_document: {
    key: 'regulatory_document',
    name: 'Documento regulatório',
    description: 'Mapear atividades que contribuem com dados → consolidar informações → elaborar conteúdo → revisar → aprovar versão.',
    deliverable: 'Dossiê / Petição Regulatória Formatada para Submissão à ANVISA',
    steps: [
      {
        name: 'Mapear atividades que contribuem com dados',
        checklist: [
          'Identificar todas as macro e microatividades geradoras de dados técnicos',
          'Listar relatórios de caracterização, CQ, estabilidade e segurança necessários',
          'Verificar cronograma de conclusão de cada entrega técnica de suporte'
        ]
      },
      {
        name: 'Consolidar informações',
        checklist: [
          'Coletar relatórios finais aprovados e certificados de análise',
          'Organizar anexos técnicos, POPs e referências bibliográficas',
          'Verificar rastreabilidade e integridade documental de cada evidência'
        ]
      },
      {
        name: 'Elaborar conteúdo',
        checklist: [
          'Redigir seções do dossiê conforme estrutura regulatória (ex: DDCM, DIFA, CTD)',
          'Elaborar resumos críticos de qualidade (QOS) e dados não clínicos',
          'Inserir tabelas comparativas e justificativas técnicas detalhadas'
        ]
      },
      {
        name: 'Revisar',
        checklist: [
          'Executar revisão técnica por especialistas regulatórios e líderes de projeto',
          'Revisar conformidade frente às normas e RDCs vigentes da ANVISA',
          'Fazer checagem cruzada de números de lote, referências e datas'
        ]
      },
      {
        name: 'Aprovar versão',
        checklist: [
          'Aprovação executiva final pela liderança regulatória e comitê gestor',
          'Assinatura eletrônica qualificada do documento',
          'Geração do pacote de submissão pronto para peticionamento'
        ],
        deliverable: 'Dossiê Regulatório Aprovado para Submissão'
      }
    ]
  }
};

// 16 Etapas do Fluxo de Contratação
export const CONTRACTING_STEPS: OperationalTemplateStep[] = [
  {
    name: 'Definir escopo do serviço',
    checklist: [
      'Elaborar termo de referência (TR) ou especificação técnica do serviço',
      'Definir entregáveis mandatórios, marcos intermediários e prazos exigidos',
      'Definir critérios de conformidade técnica e regulatória (ex: BPL, ISO)'
    ]
  },
  {
    name: 'Identificar prestadores/CRO/laboratórios',
    checklist: [
      'Pesquisar fornecedores qualificados no mercado nacional ou internacional',
      'Verificar histórico, certificações e acreditação dos prestadores',
      'Contatar contatos comerciais preliminares para verificar capacidade técnica'
    ]
  },
  {
    name: 'Solicitar orçamento/proposta',
    checklist: [
      'Enviar termo de referência e especificação técnica aos prestadores',
      'Assinar termo de confidencialidade (NDA) mútuo',
      'Solicitar cotações formais detalhadas com prazos e custos discriminados'
    ]
  },
  {
    name: 'Receber e comparar propostas',
    checklist: [
      'Receber propostas comerciais e técnico-operacionais dentro do prazo',
      'Criar matriz de comparação técnica, prazos e valores',
      'Avaliar compatibilidade orçamentária frente ao projeto'
    ]
  },
  {
    name: 'Selecionar prestador',
    checklist: [
      'Reunir comitê técnico/liderança para análise conjunta',
      'Emitir parecer de seleção técnica justificando a escolha do prestador',
      'Notificar o prestador selecionado'
    ]
  },
  {
    name: 'Aprovar orçamento',
    checklist: [
      'Submeter valor ao comitê gestor ou fundação gestora',
      'Confirmar rubrica financeira disponível no convênio/projeto',
      'Aprovação formal do orçamento'
    ]
  },
  {
    name: 'Revisar contrato',
    checklist: [
      'Elaborar ou receber minuta contratual e aditivo de serviço',
      'Submeter à assessoria jurídica institucional para análise de cláusulas',
      'Validar termos de propriedade intelectual, confidencialidade e penalidades'
    ]
  },
  {
    name: 'Aprovar contrato',
    checklist: [
      'Aprovar versão final da minuta sem pendências jurídicas',
      'Coletar anuência das partes envolvidas'
    ]
  },
  {
    name: 'Formalizar contratação',
    checklist: [
      'Coletar assinaturas das testemunhas e representantes legais',
      'Emitir pedido de compra / ordem de serviço formal',
      'Cadastrar contrato no sistema financeiro e de compras'
    ]
  },
  {
    name: 'Realizar kickoff/alinhamento',
    checklist: [
      'Realizar reunião inicial (kickoff meeting) com equipe técnica do prestador',
      'Alinhar cronograma detalhado, canais de comunicação e relatórios de progresso',
      'Definir responsáveis técnicos em ambas as organizações'
    ]
  },
  {
    name: 'Acompanhar execução do serviço',
    checklist: [
      'Realizar reuniões de acompanhamento periódicas',
      'Monitorar cumprimento de marcos temporais e parciais',
      'Registrar eventuais necessidades de ajustes operacionais'
    ]
  },
  {
    name: 'Receber entrega ou relatório preliminar',
    checklist: [
      'Receber dados brutos ou minuta de relatório técnico preliminar',
      'Registrar data formal de recebimento para contagem de prazo de análise'
    ]
  },
  {
    name: 'Revisar tecnicamente',
    checklist: [
      'Revisar criticamente dados, metodologia e conclusões apresentadas',
      'Conferir aderência total ao escopo contratado',
      'Consolidar dúvidas ou apontamentos técnicos da equipe'
    ]
  },
  {
    name: 'Solicitar ajustes, se necessário',
    checklist: [
      'Encaminhar parecer técnico com solicitações de esclarecimento ou correções',
      'Acompanhar elaboração das correções pelo prestador'
    ]
  },
  {
    name: 'Receber relatório/entrega final',
    checklist: [
      'Receber versão final revisada, com assinaturas devidas e anexos completos',
      'Conferir incorporação de todos os ajustes solicitados'
    ]
  },
  {
    name: 'Aprovar relatório/entrega final',
    checklist: [
      'Emitir termo de recebimento definitivo / ateste técnico de conformidade',
      'Liberar pagamento final ao prestador',
      'Arquivar entrega no repositório oficial do projeto'
    ],
    deliverable: 'Entrega Técnica Final Aprovada do Prestador'
  }
];

// Função de Detecção Automática do Tipo de Macroatividade
export function detectMacroActivityType(name: string): OperationalTemplateKey {
  if (!name) return 'development_process';
  
  const clean = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    clean.includes('qualidade') ||
    clean.includes(' cq') ||
    clean.includes('cq ') ||
    clean.includes('controle') ||
    clean.includes('ensaio analitico') ||
    clean.includes('liberacao analitica') ||
    clean.includes('especificacao')
  ) {
    return 'quality_control';
  }

  if (
    clean.includes('estabilidade') ||
    clean.includes('vida de prateleira') ||
    clean.includes('shelf life') ||
    clean.includes('acelerad') ||
    clean.includes('longa duracao') ||
    clean.includes('fotoestabilidade')
  ) {
    return 'stability';
  }

  if (
    clean.includes('fabricacao') ||
    clean.includes('lote') ||
    clean.includes('producao') ||
    clean.includes('envase') ||
    clean.includes('formulacao') ||
    clean.includes('gmp') ||
    clean.includes('bpf')
  ) {
    return 'batch_manufacturing';
  }

  if (
    clean.includes('caracterizacao') ||
    clean.includes('estrutural') ||
    clean.includes('biofisica') ||
    clean.includes('massa intacta') ||
    clean.includes('dls') ||
    clean.includes('cd')
  ) {
    return 'characterization';
  }

  if (
    clean.includes('comparabilidade') ||
    clean.includes('comparacao de lote') ||
    clean.includes('mudanca de processo')
  ) {
    return 'comparability';
  }

  if (
    clean.includes('seguranca') ||
    clean.includes('bpl') ||
    clean.includes('glp') ||
    clean.includes('toxicidade') ||
    clean.includes('toxicol') ||
    clean.includes('nao clinico') ||
    clean.includes('pre-clinico') ||
    clean.includes('primatas') ||
    clean.includes('roedores') ||
    clean.includes('biodistribuicao')
  ) {
    return 'glp_safety';
  }

  if (
    clean.includes('biologico') ||
    clean.includes('potencia') ||
    clean.includes('neutralizacao') ||
    clean.includes('imunogenicidade') ||
    clean.includes('elisa') ||
    clean.includes('ensaio celular') ||
    clean.includes('laboratorial') ||
    clean.includes('in vitro') ||
    clean.includes('in vivo')
  ) {
    return 'biological_assay';
  }

  if (
    clean.includes('dossie') ||
    clean.includes('regulatorio') ||
    clean.includes('ddcm') ||
    clean.includes('difa') ||
    clean.includes('anvisa') ||
    clean.includes('submissao') ||
    clean.includes('peticionamento') ||
    clean.includes('registro') ||
    clean.includes('ctd')
  ) {
    return 'regulatory_document';
  }

  return 'development_process';
}

// Recupera um template considerando customizações salvas em localStorage
export function getOperationalTemplate(key: OperationalTemplateKey): OperationalTemplateDefinition {
  const base = DEFAULT_OPERATIONAL_TEMPLATES[key] || DEFAULT_OPERATIONAL_TEMPLATES.development_process;
  try {
    const custom = localStorage.getItem('ctvacinas_operational_templates_custom');
    if (custom) {
      const parsed = JSON.parse(custom);
      if (parsed && parsed[key]) {
        return { ...base, ...parsed[key] };
      }
    }
  } catch (e) {
    // fallback para o padrão
  }
  return base;
}

// Salva alteração de template para novos planos
export function saveOperationalTemplateCustomization(
  key: OperationalTemplateKey,
  updates: Partial<OperationalTemplateDefinition>
) {
  try {
    const existing = localStorage.getItem('ctvacinas_operational_templates_custom');
    const parsed = existing ? JSON.parse(existing) : {};
    parsed[key] = {
      ...(parsed[key] || DEFAULT_OPERATIONAL_TEMPLATES[key]),
      ...updates
    };
    localStorage.setItem('ctvacinas_operational_templates_custom', JSON.stringify(parsed));
  } catch (e) {
    console.error('Erro ao salvar template customizado:', e);
  }
}

// Retorna todos os templates disponíveis
export function getAllOperationalTemplates(): OperationalTemplateDefinition[] {
  return (Object.keys(DEFAULT_OPERATIONAL_TEMPLATES) as OperationalTemplateKey[]).map(key =>
    getOperationalTemplate(key)
  );
}

// Gera dependências automáticas apenas quando realmente bloqueantes:
// - Desenvolvimento do processo → Fabricação de lote
// - Fabricação de lote → Controle de qualidade
// - Fabricação + CQ → Caracterização, quando aplicável
// - Fabricação + CQ → Estabilidade
// - Fabricação + CQ → Comparabilidade
// - Fabricação + CQ → Estudos biológicos / não clínicos / segurança, quando dependerem desse lote
// - Caracterização / CQ / Estabilidade / Estudos concluídos → Documento regulatório correspondente
export function applyAutomaticDependencies(macroActivities: any[]): any[] {
  if (!macroActivities || macroActivities.length === 0) return [];

  // Mapeia macros por tipo
  const devMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'development_process');
  const batchMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'batch_manufacturing');
  const qcMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'quality_control');
  const charMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'characterization');
  const stabMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'stability');
  const compMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'comparability');
  const bioMacros = macroActivities.filter(
    m => detectMacroActivityType(m.name) === 'biological_assay' || detectMacroActivityType(m.name) === 'glp_safety'
  );
  const regMacros = macroActivities.filter(m => detectMacroActivityType(m.name) === 'regulatory_document');

  return macroActivities.map(macro => {
    const type = detectMacroActivityType(macro.name);
    const deps = new Set<string>(macro.dependsOnMacroIds || []);

    // Desenvolvimento do processo → Fabricação de lote
    if (type === 'batch_manufacturing') {
      devMacros.forEach(d => deps.add(d.id));
    }

    // Fabricação de lote → Controle de qualidade
    if (type === 'quality_control') {
      batchMacros.forEach(b => deps.add(b.id));
    }

    // Fabricação + CQ → Caracterização
    if (type === 'characterization') {
      batchMacros.forEach(b => deps.add(b.id));
      qcMacros.forEach(q => deps.add(q.id));
    }

    // Fabricação + CQ → Estabilidade
    if (type === 'stability') {
      batchMacros.forEach(b => deps.add(b.id));
      qcMacros.forEach(q => deps.add(q.id));
    }

    // Fabricação + CQ → Comparabilidade
    if (type === 'comparability') {
      batchMacros.forEach(b => deps.add(b.id));
      qcMacros.forEach(q => deps.add(q.id));
    }

    // Fabricação + CQ → Estudos biológicos / não clínicos / segurança
    if (type === 'biological_assay' || type === 'glp_safety') {
      batchMacros.forEach(b => deps.add(b.id));
      qcMacros.forEach(q => deps.add(q.id));
    }

    // Caracterização / CQ / Estabilidade / Estudos concluídos → Documento regulatório
    if (type === 'regulatory_document') {
      charMacros.forEach(c => deps.add(c.id));
      qcMacros.forEach(q => deps.add(q.id));
      stabMacros.forEach(s => deps.add(s.id));
      bioMacros.forEach(b => deps.add(b.id));
    }

    const dependsOnList = Array.from(deps).filter(id => id !== macro.id);
    return {
      ...macro,
      dependsOnMacroIds: dependsOnList,
      relationshipType: dependsOnList.length > 0 ? 'dependent' : macro.relationshipType || 'sequential'
    };
  });
}

// Verifica se um item está bloqueado (Quando B depende de A, A libera B se A estiver concluída)
export function checkIsBlockedByDependencies(
  itemDependsOnIds: string[] | undefined,
  allMacros: any[]
): { isBlocked: boolean; blockingNames: string[] } {
  if (!itemDependsOnIds || itemDependsOnIds.length === 0) {
    return { isBlocked: false, blockingNames: [] };
  }

  const blockingNames: string[] = [];
  itemDependsOnIds.forEach(depId => {
    const depMacro = allMacros.find(m => m.id === depId);
    if (depMacro) {
      // Verifica se todas as microatividades estão concluídas ou se a macro está 100%
      const isCompleted =
        depMacro.status === 'Concluído e aprovado' ||
        (depMacro.microActivities &&
          depMacro.microActivities.length > 0 &&
          depMacro.microActivities.every(
            (mic: any) => mic.status === 'Concluído e aprovado' || mic.status === 'Concluído com restrições'
          ));
      if (!isCompleted) {
        blockingNames.push(depMacro.name);
      }
    }
  });

  return {
    isBlocked: blockingNames.length > 0,
    blockingNames
  };
}

// Adapta e complementa uma macroatividade e suas microatividades sem apagar nada
export function complementMacroActivityWithTemplate(macro: any, overrideTemplateKey?: OperationalTemplateKey): any {
  const detectedKey = overrideTemplateKey || (macro.templateType as OperationalTemplateKey) || detectMacroActivityType(macro.name);
  const templateDef = getOperationalTemplate(detectedKey);

  const existingMicros = macro.microActivities || [];
  const isContractedMacro = macro.isContracted ?? false;

  let finalMicros: any[] = [];

  if (existingMicros.length === 0) {
    // Se não há microatividades cadastradas, gera as do template base
    const baseSteps = templateDef.steps;
    finalMicros = baseSteps.map((step, idx) => ({
      id: `micro_${Math.random().toString(36).substr(2, 9)}`,
      name: step.name,
      code: `${macro.code || '1'}.${idx + 1}`,
      assignee: '',
      startDate: '',
      dueDate: '',
      status: 'Planejado',
      progress: 0,
      observations: step.deliverable ? `Entrega prevista: ${step.deliverable}` : '',
      isContracted: isContractedMacro,
      contractedCustomized: false, // herdado da macro
      checklist: (step.checklist || []).map((chk, cIdx) => ({
        id: `chk_${cIdx + 1}`,
        item: chk,
        completed: false
      }))
    }));
  } else {
    // PRESERVA todas as microatividades técnicas já existentes
    finalMicros = existingMicros.map((mic: any, idx: number) => {
      // Se a microatividade ainda herda o padrão, atualiza seu isContracted com base na macro
      const isCustomized = mic.contractedCustomized === true;
      const effectiveContracted = isCustomized ? mic.isContracted : isContractedMacro;

      // Se não tem checklist, tenta preencher com um checklist padrão coerente com o nome
      let checklist = mic.checklist;
      if (!checklist || checklist.length === 0) {
        const matchingStep = templateDef.steps.find(s =>
          mic.name.toLowerCase().includes(s.name.toLowerCase().split(' ')[0])
        );
        if (matchingStep) {
          checklist = matchingStep.checklist.map((chk, cIdx) => ({
            id: `chk_${cIdx + 1}`,
            item: chk,
            completed: false
          }));
        } else {
          checklist = [
            { id: 'chk_1', item: 'Verificar escopo e requisitos técnicos', completed: false },
            { id: 'chk_2', item: 'Executar atividade conforme procedimento padrão', completed: false },
            { id: 'chk_3', item: 'Revisar dados e validar resultados', completed: false }
          ];
        }
      }

      return {
        ...mic,
        code: mic.code || `${macro.code || '1'}.${idx + 1}`,
        isContracted: effectiveContracted,
        contractedCustomized: isCustomized,
        checklist
      };
    });
  }

  return {
    ...macro,
    templateType: detectedKey,
    isContracted: isContractedMacro,
    microActivities: finalMicros
  };
}

// Atualiza contratação na Macroatividade propagando apenas para quem não tem customização individual
export function updateMacroContracting(macro: any, isContracted: boolean): any {
  const updatedMicros = (macro.microActivities || []).map((mic: any) => {
    // Se foi personalizado individualmente, preserva o valor da microatividade
    if (mic.contractedCustomized === true) {
      return mic;
    }
    // Caso contrário, herda o novo valor da macroatividade
    return {
      ...mic,
      isContracted,
      contractedCustomized: false
    };
  });

  return {
    ...macro,
    isContracted,
    microActivities: updatedMicros
  };
}

// Atualiza contratação individualmente em uma microatividade específica
export function updateMicroContracting(macro: any, microId: string, isContracted: boolean): any {
  const updatedMicros = (macro.microActivities || []).map((mic: any) => {
    if (mic.id === microId) {
      return {
        ...mic,
        isContracted,
        contractedCustomized: true // Marca explicitamente como personalizado
      };
    }
    return mic;
  });

  return {
    ...macro,
    microActivities: updatedMicros
  };
}

// Adapta projetos existentes no sistema sem apagar nada
export function adaptProjectsWithOperationalTemplates(projects: any[]): any[] {
  if (!projects || !Array.isArray(projects)) return [];

  return projects.map(proj => {
    if (!proj.macroActivities || !Array.isArray(proj.macroActivities)) return proj;

    const adaptedMacros = proj.macroActivities.map((macro: any) => {
      const complemented = complementMacroActivityWithTemplate(macro);
      return complemented;
    });

    const withDependencies = applyAutomaticDependencies(adaptedMacros);

    return {
      ...proj,
      macroActivities: withDependencies
    };
  });
}

// Adapta planos existentes no sistema preservando sua estrutura
export function adaptPlansWithOperationalTemplates(plans: any[]): any[] {
  if (!plans || !Array.isArray(plans)) return [];

  return plans.map(plan => {
    if (!plan.macroActivities || !Array.isArray(plan.macroActivities)) return plan;

    const adaptedMacros = plan.macroActivities.map((macroTemplate: any) => {
      const detectedType = macroTemplate.templateType || detectMacroActivityType(macroTemplate.name);
      return {
        ...macroTemplate,
        templateType: detectedType
      };
    });

    return {
      ...plan,
      macroActivities: adaptedMacros
    };
  });
}

