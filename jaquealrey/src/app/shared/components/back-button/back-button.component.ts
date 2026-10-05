import { Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button type="button" class="back-button" (click)="goBack()">
      <i class="fas fa-arrow-left" aria-hidden="true"></i>
      {{ label }}
    </button>
  `,
  styles: `
    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0;
      border: 0;
      background: transparent;
      color: var(--text-light);
      font: inherit;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
    }
    .back-button:hover { color: var(--gold-dark); }
    .back-button:focus-visible {
      outline: 2px solid var(--gold);
      outline-offset: 4px;
      border-radius: 2px;
    }
  `,
})
export class BackButtonComponent {
  private router = inject(Router);

  @Input() fallbackUrl = '/';
  @Input() fallbackLabel = 'Volver';

  get label(): string {
    const returnUrl = this.returnUrl();
    if (!returnUrl) return this.fallbackLabel;

    const labels: Record<string, string> = {
      '/': 'Volver al Inicio',
      '/admin': 'Volver al Panel',
      '/admin/hoy': 'Volver a Hoy',
      '/admin/calendario': 'Volver al Calendario',
      '/admin/reservas': 'Volver a Reservas',
      '/admin/habitaciones': 'Volver a Habitaciones',
      '/admin/pagos': 'Volver a Pagos',
      '/habitaciones': 'Volver a Habitaciones',
      '/buscar-disponibilidad': 'Volver a Disponibilidad',
    };
    const path = returnUrl.split('?')[0];
    if (path.startsWith('/habitaciones/')) return 'Volver a Habitaciones';
    return labels[path] || this.fallbackLabel;
  }

  goBack(): void {
    void this.router.navigateByUrl(this.returnUrl() || this.fallbackUrl);
  }

  private returnUrl(): string | null {
    const candidate = (history.state as { returnUrl?: unknown } | null)?.returnUrl;
    if (
      typeof candidate === 'string' &&
      candidate.startsWith('/') &&
      !candidate.startsWith('//') &&
      !candidate.includes('://')
    ) {
      return candidate;
    }
    return null;
  }
}
