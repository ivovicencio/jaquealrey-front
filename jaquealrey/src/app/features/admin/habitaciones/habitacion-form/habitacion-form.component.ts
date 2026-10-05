import { Component, inject, signal, OnInit } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../../core/services/admin.service';
import { HabitacionService } from '../../../../core/services/habitacion.service';
import { Habitacion } from '../../../../core/models/habitacion.model';
import { ToastService } from '../../../../shared/services/toast.service';
import { BackButtonComponent } from '../../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-habitacion-form',
  standalone: true,
  imports: [FormsModule, RouterLink, BackButtonComponent],
  template: `
    <div class="container admin-page">
      <div class="admin-header">
        <app-back-button fallbackUrl="/admin/habitaciones" fallbackLabel="Volver a Habitaciones" />
        <h1 class="page-title">{{ isEdit() ? 'Editar Habitacion' : 'Nueva Habitacion' }}</h1>
      </div>

      @if (loadingData()) {
        <div class="loading-state">
          <div class="spinner"></div>
          <p>Cargando datos...</p>
        </div>
      } @else {
        <div class="card form-card">
          <div class="card-body">
            <form (ngSubmit)="onSubmit()" #habitacionForm="ngForm">
              <div class="form-grid">
                <div class="form-group">
                  <label class="form-label" for="numero">Número</label>
                  <input class="form-input" id="numero" type="number" name="numero"
                    [(ngModel)]="form.numero" required min="1" #numeroField="ngModel" />
                  @if (numeroField.invalid && numeroField.touched) {
                    <span class="form-error">El número es requerido</span>
                  }
                </div>

                <div class="form-group">
                  <label class="form-label" for="nombre">Nombre</label>
                  <input class="form-input" id="nombre" type="text" name="nombre"
                    [(ngModel)]="form.nombre" required #nombreField="ngModel" />
                  @if (nombreField.invalid && nombreField.touched) {
                    <span class="form-error">El nombre es requerido</span>
                  }
                </div>

                <div class="form-group full-width">
                  <label class="form-label" for="descripcion">Descripción</label>
                  <textarea class="form-textarea" id="descripcion" name="descripcion"
                    [(ngModel)]="form.descripcion" rows="3"></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label" for="camas_individuales">Camas Individuales</label>
                  <input class="form-input" id="camas_individuales" type="number" name="camas_individuales"
                    [(ngModel)]="form.camas_individuales" required min="0" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="camas_matrimoniales">Camas Matrimoniales</label>
                  <input class="form-input" id="camas_matrimoniales" type="number" name="camas_matrimoniales"
                    [(ngModel)]="form.camas_matrimoniales" required min="0" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="capacidad_max">Capacidad Máxima</label>
                  <input class="form-input" id="capacidad_max" type="number" name="capacidad_max"
                    [(ngModel)]="form.capacidad_max" required min="1" />
                </div>

                <div class="form-group">
                  <label class="form-label" for="tipo">Tipo</label>
                  <select class="form-select" id="tipo" name="tipo" [(ngModel)]="form.tipo" required>
                    @for (tipo of tipos; track tipo) {
                      <option [value]="tipo">{{ tipo }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label" for="precio_noche">Precio por Noche</label>
                  <input class="form-input" id="precio_noche" type="number" name="precio_noche"
                    [(ngModel)]="form.precio_noche" required min="0" />
                </div>

                <div class="form-group checkbox-group">
                  <label class="form-label checkbox-label">
                    <input type="checkbox" name="activa" [(ngModel)]="form.activa" />
                    <span>Habitación Activa</span>
                  </label>
                </div>
              </div>

              <div class="form-actions">
                <a routerLink="/admin/habitaciones" class="btn btn-outline">Cancelar</a>
                <button class="btn btn-primary" type="submit" [disabled]="saving() || habitacionForm.invalid">
                  @if (saving()) {
                    <span class="spinner-sm"></span> Guardando...
                  } @else {
                    Guardar
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    .admin-page { padding-top: 2rem; padding-bottom: 3rem; }
    .admin-header { margin-bottom: 1.5rem; }
    .admin-header h1 { font-size: 1.75rem; font-weight: 600; font-family: var(--font-heading); margin-top: 0.5rem; }
    .back-link {
      font-size: 0.875rem;
      color: var(--text-light);
      text-decoration: none;
      font-weight: 500;
    }
    .back-link:hover { color: var(--gold); }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 30vh;
      gap: 1rem;
      color: var(--text-light);
    }
    .spinner {
      width: 36px; height: 36px;
      border-radius: 50%;
      border: 3px solid var(--border);
      border-top-color: var(--gold);
      border-right-color: var(--gold-light);
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .form-card { max-width: 720px; }
    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }
    .full-width { grid-column: 1 / -1; }
    .checkbox-group { display: flex; align-items: flex-end; padding-bottom: 0.5rem; }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      font-size: 0.9375rem;
    }
    .checkbox-label input[type="checkbox"] {
      width: 1.125rem;
      height: 1.125rem;
      accent-color: var(--gold);
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--border);
    }
    .spinner-sm {
      display: inline-block;
      width: 1rem; height: 1rem;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @media (max-width: 640px) {
      .form-grid { grid-template-columns: 1fr; }
    }
  `
})
export class AdminHabitacionFormComponent implements OnInit {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private adminService = inject(AdminService);
  private habitacionService = inject(HabitacionService);
  private toast = inject(ToastService);

  isEdit = signal(false);
  editId = signal<number | null>(null);
  loadingData = signal(false);
  saving = signal(false);
  readonly tipos = ['Doble', 'Triple', 'Cuádruple', 'Quíntuple', 'Departamento', 'Cabaña'] as const;
  form = {
    numero: null as number | null,
    nombre: '',
    descripcion: '',
    camas_individuales: 0,
    camas_matrimoniales: 0,
    capacidad_max: 2,
    tipo: 'Doble' as Habitacion['tipo'],
    precio_noche: 0,
    activa: true,
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEdit.set(true);
      this.editId.set(Number(id));
      this.loadHabitacion(Number(id));
    }
  }

  loadHabitacion(id: number) {
    this.loadingData.set(true);
    this.habitacionService.getHabitacion(id).subscribe({
      next: (res) => {
        if (res.status === '1') {
          const h = res.data;
          this.form = {
            numero: h.numero,
            nombre: h.nombre,
            descripcion: h.descripcion || '',
            camas_individuales: h.camas_individuales,
            camas_matrimoniales: h.camas_matrimoniales,
            capacidad_max: h.capacidad_max,
            tipo: h.tipo,
            precio_noche: h.precio_noche,
            activa: h.activa,
          };
        }
        this.loadingData.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar la habitación');
        this.loadingData.set(false);
      },
    });
  }

  onSubmit() {
    const numero = this.form.numero;
    if (numero === null || numero < 1 || !this.form.nombre || !this.form.tipo) return;

    this.saving.set(true);
    const payload: Partial<Habitacion> = { ...this.form, numero };

    const req$ = this.isEdit() && this.editId()
      ? this.adminService.updateHabitacion(this.editId()!, payload)
      : this.adminService.createHabitacion(payload);

    req$.subscribe({
      next: (res) => {
        if (res.status === '1') {
          this.toast.success(this.isEdit() ? 'Habitación actualizada' : 'Habitación creada');
          this.router.navigate(['/admin/habitaciones']);
        } else {
          this.toast.error(res.msg || 'Error al guardar');
        }
        this.saving.set(false);
      },
      error: (error) => {
        this.toast.error(error?.error?.msg || 'Error al guardar la habitación');
        this.saving.set(false);
      },
    });
  }

}
