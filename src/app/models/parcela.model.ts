export interface Parcela {
  numero: number;
  dataVencimento: Date;
  // Rendimento do investimento
  rendimentoMes: number; // Rendimento do mês atual
  rendimentoAcumulado: number; // Rendimento acumulado até o mês
  montanteInvestimento: number; // Valor total do investimento no mês (capital + rendimento acumulado)
  // Pagamento do empréstimo
  valorParcela: number;
  juros: number;
  amortizacao: number;
  valorRealPago: number; // Valor real pago da parcela (editável)
  diferenca: number; // Diferença entre valor da parcela e valor real pago
  quitacaoEmprestimo: number; // Montante acumulado do investimento menos o valor real pago
  saldoDevedor: number;
  foiEditado?: boolean; // Flag para rastrear se o valor foi editado
}

export interface Emprestimo {
  valorInicial: number;
  taxaJurosAnual: number;
  taxaJurosMensal: number;
  numeroParcelas: number;
  dataPrimeiraParcela: Date;
  valorParcela: number;
  montanteTotalRendimento: number; // Montante total que o investimento renderia
  totalRendimento: number; // Total de rendimento (montante - capital inicial)
  parcelas: Parcela[];
}

