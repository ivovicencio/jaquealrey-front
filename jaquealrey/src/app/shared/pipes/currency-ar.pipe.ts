import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyAr', standalone: true })
export class CurrencyArPipe implements PipeTransform {
  transform(value: number): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }
}
