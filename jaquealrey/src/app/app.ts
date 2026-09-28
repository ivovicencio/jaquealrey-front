import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { AppModeService } from './core/services/app-mode.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, FooterComponent, ToastComponent],
  template: `
    @if (!appMode.esAppEscritorio()) {
      <a class="skip-link" href="#contenido">Ir al contenido principal</a>
      <app-navbar />
    }
    <main
      class="main-content"
      [class.panel-only]="appMode.esAppEscritorio()"
      id="contenido"
      tabindex="-1"
    >
      <router-outlet />
    </main>
    @if (!appMode.esAppEscritorio()) {
      <app-footer />
    }
    <app-toast />
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      min-height: 100dvh;
    }
    .main-content {
      flex: 1;
      padding-top: 72px;
    }
    /* Instalada como PWA no hay navbar fijo arriba: nada de padding. */
    .main-content.panel-only {
      padding-top: 0;
    }
    /* Solo aparece al navegar con el teclado (Tab). */
    .skip-link {
      position: absolute;
      left: -9999px;
      top: 0;
      z-index: 2000;
      padding: 0.75rem 1.25rem;
      background: var(--dark);
      color: #fff;
      font-size: 0.9rem;
      border-radius: 0 0 var(--radius) 0;
    }
    .skip-link:focus {
      left: 0;
    }
  `,
})
export class App {
  readonly appMode = inject(AppModeService);
}
