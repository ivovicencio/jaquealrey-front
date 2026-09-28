import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-reserva-exitosa',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page">
      <div class="success-card card">
        <div class="card-body success-body">
          <div class="checkmark">&#10003;</div>
          <h1>Reserva Confirmada</h1>

          <div class="code-box">
            <span class="code-label">Tu codigo de reserva</span>
            <span class="code-value">{{ codigo() }}</span>
          </div>

          <p class="info-text">
            No necesitas crear ninguna cuenta. Con este codigo y el email que usaste podés
            consultar el estado de tu reserva o cancelarla hasta 24 horas antes de la entrada.
          </p>

          <div class="actions">
            <a [routerLink]="['/consultar-reserva']" [queryParams]="{ codigo: codigo() }" class="btn btn-primary btn-lg">
              Consultar mi Reserva
            </a>
            <a routerLink="/" class="btn btn-outline btn-lg">Volver al Inicio</a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .page {
      padding: 3rem 0 4rem;
      display: flex;
      justify-content: center;
    }
    .success-card { max-width: 520px; width: 100%; }
    .success-body {
      text-align: center;
      padding: 3rem 2rem;
    }
    .checkmark {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: var(--gold);
      color: #fff;
      font-size: 2.5rem;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
      line-height: 1;
    }
    .success-body h1 {
      margin-bottom: 1.5rem;
    }

    .code-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 1.5rem;
      background: var(--bg);
      border-radius: var(--radius-lg);
      border: 2px dashed var(--border);
      margin-bottom: 1.25rem;
    }
    .code-label {
      font-size: 0.8125rem;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      font-weight: 600;
    }
    .code-value {
      font-size: 2rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      color: var(--gold-dark);
    }

    .info-text {
      color: var(--text-light);
      margin-bottom: 2rem;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
      flex-wrap: wrap;
    }
  `
})
export class ReservaExitosaComponent implements OnInit {
  private route = inject(ActivatedRoute);

  codigo = signal('');

  ngOnInit() {
    this.codigo.set(this.route.snapshot.paramMap.get('codigo') ?? '');
  }
}
