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

  // Documentos legales exigidos por la Ley 25.326 y la Ley 24.241.
  ...['privacidad', 'terminos', 'cookies', 'reembolsos'].map((slug) => ({
    path: slug,
    loadComponent: () =>
      import('./features/public/legal/legal.component').then((m) => m.LegalComponent),
    data: { slug },
  })),

  // El huesped no tiene cuenta. El login es solo del personal del hotel.
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },

  // Admin
  {
    path: 'admin',
    loadComponent: () =>
      import('./features/admin/dashboard/dashboard.component').then((m) => m.DashboardComponent),
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

  // Fallback
  { path: '**', redirectTo: '' },
];
