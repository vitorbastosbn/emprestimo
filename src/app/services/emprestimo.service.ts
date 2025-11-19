import { Injectable } from '@angular/core';
import { Emprestimo, Parcela } from '../models/parcela.model';

@Injectable({
  providedIn: 'root'
})
export class EmprestimoService {
  
  calcularEmprestimo(
    valorInicial: number,
    taxaJurosMensal: number, // Taxa mensal já calculada (1,385%)
    numeroParcelas: number,
    dataPrimeiraParcela: Date
  ): Emprestimo {
    // Calcular o montante total que o investimento renderia em 24 meses (juros compostos)
    const montanteTotalRendimento = valorInicial * Math.pow(1 + taxaJurosMensal / 100, numeroParcelas);
    const totalRendimento = montanteTotalRendimento - valorInicial;
    
    // Calcular valor da parcela: dividir o montante total em parcelas iguais (sem juros adicionais)
    // Isso garante que a soma das parcelas seja exatamente igual ao montante total
    const taxaMensalDecimal = taxaJurosMensal / 100;
    const valorParcela = montanteTotalRendimento / numeroParcelas;
    
    // Calcular todas as parcelas com rendimento e pagamento
    const parcelas = this.calcularParcelasComRendimento(
      valorInicial,
      taxaMensalDecimal,
      numeroParcelas,
      valorParcela,
      montanteTotalRendimento,
      dataPrimeiraParcela
    );
    
    return {
      valorInicial,
      taxaJurosAnual: 0, // Não usado mais
      taxaJurosMensal,
      numeroParcelas,
      dataPrimeiraParcela,
      valorParcela,
      montanteTotalRendimento,
      totalRendimento,
      parcelas
    };
  }
  
  private calcularValorParcela(
    valorInicial: number,
    taxaMensal: number,
    numeroParcelas: number
  ): number {
    if (taxaMensal === 0) {
      return valorInicial / numeroParcelas;
    }
    
    const fator = Math.pow(1 + taxaMensal, numeroParcelas);
    return valorInicial * (taxaMensal * fator) / (fator - 1);
  }
  
  private calcularParcelasComRendimento(
    valorInicial: number,
    taxaMensal: number,
    numeroParcelas: number,
    valorParcela: number,
    montanteTotal: number,
    dataPrimeiraParcela: Date
  ): Parcela[] {
    const parcelas: Parcela[] = [];
    let saldoDevedor = montanteTotal; // O saldo devedor é o montante total que deve ser pago
    let totalPago = 0; // Controle do total pago para ajustar a última parcela
    let totalPagoAcumulado = 0; // Total pago nas parcelas anteriores
    
    // Primeiro, calcular todas as parcelas com valor fixo
    for (let i = 1; i <= numeroParcelas; i++) {
      // Calcular data de vencimento (adicionar i-1 meses à data inicial)
      const dataVencimento = new Date(dataPrimeiraParcela);
      dataVencimento.setMonth(dataVencimento.getMonth() + (i - 1));
      // Garantir que a data fica no dia 10
      dataVencimento.setDate(10);
      
      // Calcular rendimento usando juros compostos
      // Montante no mês i = Capital * (1 + taxa)^i
      const montanteInvestimento = valorInicial * Math.pow(1 + taxaMensal, i);
      const montanteAnterior = i === 1 ? valorInicial : valorInicial * Math.pow(1 + taxaMensal, i - 1);
      const rendimentoMes = montanteInvestimento - montanteAnterior;
      const rendimentoAcumulado = montanteInvestimento - valorInicial;
      
      // Os juros da parcela são iguais ao rendimento do mês
      const juros = rendimentoMes;
      
      // Calcular amortização: valor da parcela - juros
      let amortizacao = valorParcela - juros;
      
      // Valor da parcela é fixo (exceto na última se necessário)
      let valorParcelaAtual = valorParcela;
      
      // Inicializar valor real pago com o valor da parcela
      const valorRealPago = valorParcelaAtual;
      const diferenca = valorRealPago - valorParcelaAtual; // Inicialmente zero
      
      // Quitação = Montante investimento (daquele mês) - total pago nas parcelas anteriores
      let quitacaoEmprestimo = montanteInvestimento - totalPagoAcumulado;
      
      // Atualizar saldo devedor
      saldoDevedor = saldoDevedor - valorParcelaAtual;
      totalPago += valorParcelaAtual;
      
      parcelas.push({
        numero: i,
        dataVencimento,
        rendimentoMes,
        rendimentoAcumulado,
        montanteInvestimento,
        valorParcela: valorParcelaAtual,
        juros,
        amortizacao,
        valorRealPago,
        diferenca,
        quitacaoEmprestimo,
        saldoDevedor: saldoDevedor < 0 ? 0 : saldoDevedor
      });
      
      // Atualizar total pago acumulado para próxima parcela
      totalPagoAcumulado += valorRealPago;
    }
    
    // Ajustar a última parcela se necessário para garantir que a soma seja exatamente o montante total
    const diferencaAjuste = montanteTotal - totalPago;
    if (Math.abs(diferencaAjuste) > 0.01) {
      const ultimaParcela = parcelas[parcelas.length - 1];
      ultimaParcela.valorParcela = ultimaParcela.valorParcela + diferencaAjuste;
      ultimaParcela.amortizacao = ultimaParcela.amortizacao + diferencaAjuste;
      ultimaParcela.valorRealPago = ultimaParcela.valorRealPago + diferencaAjuste;
      ultimaParcela.diferenca = ultimaParcela.valorRealPago - ultimaParcela.valorParcela;
      ultimaParcela.quitacaoEmprestimo = ultimaParcela.montanteInvestimento - ultimaParcela.valorRealPago;
      ultimaParcela.saldoDevedor = 0;
    }
    
    // Recalcular o saldo devedor corretamente
    saldoDevedor = montanteTotal;
    for (let i = 0; i < parcelas.length; i++) {
      saldoDevedor = saldoDevedor - parcelas[i].valorParcela;
      parcelas[i].saldoDevedor = saldoDevedor < 0.01 ? 0 : saldoDevedor;
    }
    
    return parcelas;
  }
  
  formatarMoeda(valor: number): string {
    // Garantir que o valor seja um número válido
    const numeroValido = typeof valor === 'number' && !isNaN(valor) ? valor : 0;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numeroValido);
  }
  
  formatarData(data: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(data);
  }
}

