import { Routes } from '@angular/router';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'habitaciones',
    loadComponent: () =>
      import('./features/public/habitaciones/habitacion-list/habitacion-list.component').then(
        (m) => m.HabitacionListComponent
      ),
  },
  {
    path: 'habitaciones/:id',
    loadComponent: () =>
      import('./features/public/habitaciones/habitacion-detail/habitacion-detail.component').then(
        (m) => m.HabitacionDetailComponent
      ),
  },
  {
    path: 'buscar-disponibilidad',
    loadComponent: () =>
      import('./features/public/habitaciones/habitacion-buscar/habitacion-buscar.component').then(
        (m) => m.HabitacionBuscarComponent
      ),
  },
  {
    path: 'reserva',
    loadComponent: () =>
      import('./features/public/reserva/reserva-form/reserva-form.component').then(
        (m) => m.ReservaFormComponent
      ),
  },
  {
    path: 'reserva/pagar/:codigo',
    loadComponent: () =>
      import('./features/public/reserva/pagar-reserva/pagar-reserva.component').then(
        (m) => m.PagarReservaComponent
      ),
  },
  {
    path: 'reserva/exito/:codigo',
    loadComponent: () =>
      import('./features/public/reserva/reserva-exitosa/reserva-exitosa.component').then(
        (m) => m.ReservaExitosaComponent
      ),
  },
  {
    path: 'consultar-reserva',
    loadComponent: () =>
      import('./features/public/reserva/consultar-reserva/consultar-reserva.component').then(
        (m) => m.ConsultarReservaComponent
      ),
  },

  ...['privacidad', 'terminos', 'cookies', 'reembolsos'].map((slug) => ({
    path: slug,
    loadComponent: () =>
      import('./features/public/legal/legal.component').then((m) => m.LegalComponent),
    data: { slug },
  })),

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // ===== ADMIN =====
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/hoy',
    loadComponent: () =>
      import('./features/admin/hoy/hoy').then((m) => m.AdminHoyComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/walk-in',
    loadComponent: () =>
      import('./features/admin/walk-in/walk-in').then((m) => m.AdminWalkInComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/habitaciones',
    loadComponent: () =>
      import('./features/admin/habitaciones/habitacion-list/habitacion-list.component').then(
        (m) => m.AdminHabitacionListComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/habitaciones/nueva',
    loadComponent: () =>
      import('./features/admin/habitaciones/habitacion-form/habitacion-form.component').then(
        (m) => m.AdminHabitacionFormComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/habitaciones/:id',
    loadComponent: () =>
      import('./features/admin/habitaciones/habitacion-form/habitacion-form.component').then(
        (m) => m.AdminHabitacionFormComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/reservas',
    loadComponent: () =>
      import('./features/admin/reservas/reserva-list/reserva-list.component').then(
        (m) => m.AdminReservaListComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/reservas/:id',
    loadComponent: () =>
      import('./features/admin/reservas/reserva-detail/reserva-detail.component').then(
        (m) => m.AdminReservaDetailComponent
      ),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/historial',
    loadComponent: () =>
      import('./features/admin/historial/historial.component').then((m) => m.HistorialComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/calendario',
    loadComponent: () =>
      import('./features/admin/calendario/calendario.component').then((m) => m.AdminCalendarioComponent),
    canActivate: [adminGuard],
  },
  {
    path: 'admin/pagos',
    loadComponent: () =>
      import('./features/admin/pagos/pagos.component').then((m) => m.AdminPagosComponent),
    canActivate: [adminGuard],
  },

  // Fallback: si la ruta no existe, va al home
  { path: '**', redirectTo: '' },
];