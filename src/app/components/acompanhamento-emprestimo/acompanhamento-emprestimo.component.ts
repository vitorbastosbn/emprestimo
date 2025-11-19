import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EmprestimoService } from '../../services/emprestimo.service';
import { AuthService } from '../../services/auth.service';
import { ApiService } from '../../services/api.service';
import { MascaraMoedaDirective } from '../../directives/mascara-moeda.directive';
import { Emprestimo, Parcela } from '../../models/parcela.model';

@Component({
  selector: 'app-acompanhamento-emprestimo',
  standalone: true,
  imports: [CommonModule, FormsModule, MascaraMoedaDirective],
  templateUrl: './acompanhamento-emprestimo.component.html',
  styleUrl: './acompanhamento-emprestimo.component.scss'
})
export class AcompanhamentoEmprestimoComponent implements OnInit {
  emprestimo!: Emprestimo;
  totalJuros: number = 0;
  totalAmortizacao: number = 0;
  totalPago: number = 0;
  totalDiferenca: number = 0;
  isAdmin: boolean = false;
  isCarregando: boolean = true;
  isSalvando: boolean = false;
  mensagemSucesso: string = '';

  constructor(
    private emprestimoService: EmprestimoService,
    private authService: AuthService,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    // Verificar se é admin
    this.isAdmin = this.authService.isAdmin();
    
    // Dados do empréstimo
    const valorInicial = 31400;
    const taxaJurosMensal = 1.385; // 120% do CDI (1,385% ao mês)
    const numeroParcelas = 24;
    const dataPrimeiraParcela = new Date('2025-10-10');

    // Calcular empréstimo
    this.emprestimo = this.emprestimoService.calcularEmprestimo(
      valorInicial,
      taxaJurosMensal,
      numeroParcelas,
      dataPrimeiraParcela
    );

    // Inicializar valores reais pagos com 0
    this.emprestimo.parcelas.forEach(p => {
      p.valorRealPago = 0;
    });

    // Carregar pagamentos salvos do backend
    this.carregarPagamentos();
  }

  carregarPagamentos(): void {
    this.isCarregando = true;
    
    // Por enquanto usando ID fixo de empréstimo (1)
    const emprestimoId = 1;
    
    this.apiService.obterPagamentos(emprestimoId).subscribe({
      next: (pagamentos) => {
        // Atualizar os valores reais pagos com base nos dados do backend
        pagamentos.forEach(pagamento => {
          const parcela = this.emprestimo.parcelas.find(p => p.numero === pagamento.numeroParcel);
          if (parcela) {
            // Converter null para 0 e marcar como editado apenas se não for null
            if (pagamento.valorRealPago !== null) {
              parcela.valorRealPago = pagamento.valorRealPago;
              parcela.foiEditado = true;
            } else {
              parcela.valorRealPago = 0;
              parcela.foiEditado = false;
            }
            parcela.diferenca = parcela.valorRealPago - parcela.valorParcela;
          }
        });
        
        this.recalcularQuitacao();
        this.calcularTotais();
        this.isCarregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar pagamentos:', erro);
        this.calcularTotais();
        this.isCarregando = false;
      }
    });
  }

  atualizarValorRealPago(parcela: Parcela, valor: string): void {
    // Remove formatação de moeda e converte para número
    const valorLimpo = valor
      .replace(/[R$\s]/g, '')
      .replace(/\./g, '')
      .replace(',', '.');
    const valorNumerico = parseFloat(valorLimpo) || 0;
    
    // Atualiza o valor da parcela
    parcela.valorRealPago = valorNumerico;
    parcela.foiEditado = true; // Marcar como editado
    parcela.diferenca = parcela.valorRealPago - parcela.valorParcela;
    
    // Recalcular quitação para todas as parcelas
    this.recalcularQuitacao();
    this.calcularTotais();
  }

  salvarAlteracoes(): void {
    if (!this.isAdmin) {
      return;
    }

    this.isSalvando = true;
    this.mensagemSucesso = '';
    const emprestimoId = 1; // ID fixo por enquanto
    let parcelasSalvas = 0;
    let erros = 0;

    // Salvar cada parcela
    this.emprestimo.parcelas.forEach(parcela => {
      // Se não foi editado, enviar null; caso contrário, enviar o valor
      const valorParaSalvar = parcela.foiEditado ? parcela.valorRealPago : null;
      
      this.apiService.salvarPagamento(emprestimoId, parcela.numero, valorParaSalvar).subscribe({
        next: (response) => {
          parcelasSalvas++;
          if (parcelasSalvas + erros === this.emprestimo.parcelas.length) {
            this.isSalvando = false;
            if (erros === 0) {
              this.mensagemSucesso = '✓ Todas as alterações foram salvas com sucesso!';
              setTimeout(() => {
                this.mensagemSucesso = '';
              }, 5000);
            } else {
              this.mensagemSucesso = `⚠ Salvo com ${erros} erro(s)`;
            }
          }
        },
        error: (erro) => {
          erros++;
          console.error('Erro ao salvar pagamento:', erro);
          if (parcelasSalvas + erros === this.emprestimo.parcelas.length) {
            this.isSalvando = false;
            this.mensagemSucesso = `✗ Erro ao salvar. ${erros} parcela(s) falharam`;
          }
        }
      });
    });
  }

  private recalcularQuitacao(): void {
    let totalPagoAnterior = 0;
    
    for (let i = 0; i < this.emprestimo.parcelas.length; i++) {
      const p = this.emprestimo.parcelas[i];
      
      // Quitação = Montante investimento - total pago nas parcelas anteriores
      p.quitacaoEmprestimo = p.montanteInvestimento - totalPagoAnterior;
      
      totalPagoAnterior += p.valorRealPago;
    }
  }

  calcularTotais(): void {
    this.totalJuros = this.emprestimo.parcelas.reduce((sum, p) => sum + p.juros, 0);
    this.totalAmortizacao = this.emprestimo.parcelas.reduce((sum, p) => sum + p.amortizacao, 0);
    
    // Total Pago: somar apenas os valores editados
    this.totalPago = this.emprestimo.parcelas
      .filter(p => p.foiEditado)
      .reduce((sum, p) => sum + p.valorRealPago, 0);
    
    // Total Diferença: somar apenas as diferenças dos valores editados
    this.totalDiferenca = this.emprestimo.parcelas
      .filter(p => p.foiEditado)
      .reduce((sum, p) => sum + p.diferenca, 0);
  }

  formatarMoeda(valor: number): string {
    return this.emprestimoService.formatarMoeda(valor ?? 0);
  }

  formatarData(data: Date): string {
    return this.emprestimoService.formatarData(data);
  }

  logout(): void {
    this.authService.logout();
  }
}

