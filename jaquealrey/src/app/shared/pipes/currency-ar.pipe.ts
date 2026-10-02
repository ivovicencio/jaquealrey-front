import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'currencyAr', standalone: true })
export class CurrencyArPipe implements PipeTransform {
  // Acepta null/undefined a proposito: varios endpoints del panel omiten
  // pagado/saldo, y en el listado publico no existen. Formatear "undefined"
  // como $NaN se ve peor que mostrar $0.
  transform(value: number | null | undefined): string {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Number(value ?? 0));
  }
}
