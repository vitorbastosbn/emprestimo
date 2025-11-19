import { Directive, ElementRef, HostListener } from '@angular/core';

/**
 * Diretiva que aplica máscara de moeda (R$ 0,00) em campos de input
 * 
 * Exemplos de uso:
 * - Digitar "150050" → Exibe "R$ 1.500,50"
 * - Digitar "0" → Exibe "R$ 0,00"
 * - Digitar "999" → Exibe "R$ 9,99"
 * 
 * @example
 * <input appMascaraMoeda />
 */
@Directive({
  selector: '[appMascaraMoeda]',
  standalone: true
})
export class MascaraMoedaDirective {
  constructor(private el: ElementRef) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove caracteres não numéricos (mantém apenas dígitos)
    value = value.replace(/\D/g, '');

    // Se vazio, define como 0
    if (!value) {
      value = '0';
    }

    // Converte para número e divide por 100 (para ter 2 casas decimais)
    const numerico = parseInt(value, 10) / 100;

    // Formata como moeda brasileira
    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numerico);

    input.value = formatado;
  }

  @HostListener('blur', ['$event'])
  onBlur(event: any): void {
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove caracteres não numéricos
    value = value.replace(/\D/g, '');

    // Se vazio, define como 0
    if (!value) {
      value = '0';
    }

    // Converte para número
    const numerico = parseInt(value, 10) / 100;

    // Formata como moeda
    const formatado = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numerico);

    input.value = formatado;
  }

  @HostListener('focus', ['$event'])
  onFocus(event: any): void {
    // Ao focar, limpa a formatação para facilitar edição
    const input = event.target as HTMLInputElement;
    let value = input.value;

    // Remove a formatação de moeda
    value = value.replace(/\D/g, '');

    // Mostra apenas os números para facilitar edição
    if (value) {
      const numerico = parseInt(value, 10) / 100;
      input.value = numerico.toFixed(2);
    }
  }
}
