// URL do webhook n8n (GET) que retorna o JSON atualizado dos contratos vigentes.
// Enquanto este endpoint não estiver disponível, o painel usa o instantâneo local abaixo.
const CONVENIOS_N8N_URL = 'https://n8n.tjpa.jus.br/webhook/painel-contratos';

// Instantâneo local de contratos vigentes (amostra real, usada apenas como fallback).
const CONVENIOS_DATA = [
  {
    tipo_instrumento: "CONTRATO", numero: "080", ano: 2025,
    credor: "BIOCROMA CLÍNICA DE EXAMES DE DNA LTDA", cnpj: "09.001.104/0001-95",
    objeto: "Contratação de empresa especializada para prestação, sob demanda, de serviços laboratoriais de análises genéticas, com a finalidade de realização de exames de DNA do tipo trio, duo, espólio e exames a partir de amostras obtidas por exumação cadavérica, para instrução de processos judiciais cíveis e criminais.",
    natureza: "Serviços de Terceiros", forma_contratacao: "Pregão Eletrônico", licitacao: "016/2025",
    inicio: "2025-07-14", termino: "2027-07-14", restante_dias: 363, vigencia_trimestral: "2027 - 3º Trimestre",
    tipo_contrato: "Despesa", qtd_aditivos: 0, setor_demandante: "FCI-BM",
    protocolo: "0012364-82.2025.8.14.0900",
    valor_global_inicial: 559595, valor_global_atualizado: 559595, valor_executado: 0, valor_referencia: 559595, pct_executado: 0,
    base_legal: "Lei n° 14.133/21", estrategico: "Sim",
    gestor: "Charley Cardoso da Silva", fiscal_demandante: "Sem indicação", fiscal_tecnico: "Leila Maria Lisboa da Silva"
  },
];
