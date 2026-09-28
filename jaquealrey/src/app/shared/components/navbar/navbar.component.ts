import { Component, inject, signal, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { obtenerNotificaciones } from '../../../core/services/notification.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()" [class.has-bg]="!isHome()">
      <div class="navbar-inner container">
        <a class="navbar-brand" routerLink="/"><span class="logo-icon">&#9819;</span> Hotel Jaque al Rey</a>

        <button class="hamburger" (click)="toggleMenu()" [class.active]="menuOpen()">
          <span></span><span></span><span></span>
        </button>

        <ul class="navbar-links" [class.open]="menuOpen()">
          <li><a routerLink="/habitaciones" routerLinkActive="active" (click)="closeMenu()">Habitaciones</a></li>
          <li><a routerLink="/buscar-disponibilidad" routerLinkActive="active" (click)="closeMenu()">Buscar Disponibilidad</a></li>
          <li><a routerLink="/consultar-reserva" routerLinkActive="active" (click)="closeMenu()">Consultar mi Reserva</a></li>
        </ul>

        @if (authService.isAdmin()) {
          <ul class="navbar-auth" [class.open]="menuOpen()">
            <li><a routerLink="/admin" routerLinkActive="active" (click)="closeMenu()">Panel</a></li>
            <li><a (click)="logout()" class="btn btn-outline btn-sm">Salir</a></li>
          </ul>
        }
      </div>
    </nav>
  `,
  styles: `
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      padding: 16px 0;
      transition: background 0.4s ease, padding 0.3s ease, box-shadow 0.3s ease;
    }
    .navbar.scrolled {
      background: rgba(26, 20, 16, 0.95);
      backdrop-filter: blur(14px);
      padding: 10px 0;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
    }
    .navbar.has-bg {
      background: rgba(26, 20, 16, 0.95);
      backdrop-filter: blur(14px);
    }
    .navbar.has-bg.scrolled {
      padding: 10px 0;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.15);
    }
    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2.5rem;
    }
    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
      white-space: nowrap;
      text-decoration: none;
      letter-spacing: 0.3px;
    }
    .logo-icon {
      font-size: 1.4rem;
      line-height: 1;
    }
    .navbar-links, .navbar-auth {
      display: flex;
      align-items: center;
      gap: 28px;
    }
    .navbar-links a {
      font-size: 0.85rem;
      font-weight: 400;
      color: rgba(255, 255, 255, 0.85);
      letter-spacing: 0.3px;
      position: relative;
      transition: var(--transition);
      padding: 0.25rem 0;
    }
    .navbar-links a::after {
      content: '';
      position: absolute;
      bottom: -3px;
      left: 0;
      width: 0;
      height: 2px;
      background: var(--gold-light);
      transition: var(--transition);
    }
    .navbar-links a:hover { color: #fff; }
    .navbar-links a:hover::after { width: 100%; }
    .navbar-links a.active { color: #fff; }
    .navbar-links a.active::after { width: 100%; }
    .navbar-auth { gap: 0.5rem; }
    .navbar-auth a { cursor: pointer; }
    .navbar-auth .btn-outline {
      background: rgba(255, 255, 255, 0.1);
      padding: 6px 14px !important;
      border-radius: 100px;
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 0.8rem !important;
    }
    .navbar-auth .btn-outline:hover {
      background: rgba(255, 255, 255, 0.2) !important;
    }

    .hamburger {
      display: none;
      flex-direction: column;
      gap: 5px;
      background: none;
      border: none;
      padding: 0.25rem;
      z-index: 1001;
    }
    .hamburger span {
      display: block;
      width: 22px;
      height: 2px;
      background: #fff;
      border-radius: 2px;
      transition: transform 0.2s, opacity 0.2s;
    }
    .hamburger.active span:nth-child(1) { transform: translateY(7px) rotate(45deg); }
    .hamburger.active span:nth-child(2) { opacity: 0; }
    .hamburger.active span:nth-child(3) { transform: translateY(-7px) rotate(-45deg); }

    @media (max-width: 768px) {
      .hamburger { display: flex; }
      .navbar-links, .navbar-auth {
        display: none;
        position: fixed;
        top: 0;
        right: -100%;
        width: 280px;
        height: 100vh;
        background: rgba(26, 20, 16, 0.98);
        backdrop-filter: blur(20px);
        flex-direction: column;
        padding: 80px 32px 32px;
        gap: 18px;
        transition: right 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: -4px 0 24px rgba(0, 0, 0, 0.3);
      }
      .navbar-links.open, .navbar-auth.open { display: flex; right: 0; }
      .navbar-links a, .navbar-auth a { width: 100%; justify-content: center; color: rgba(255, 255, 255, 0.85); }
      .navbar-auth { border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 1rem; }
    }
  `
})
export class NavbarComponent implements OnInit, OnDestroy {
  authService = inject(AuthService);
  private router = inject(Router);
  scrolled = signal(false);
  menuOpen = signal(false);
  isHome = signal(true);

  private routerSub!: Subscription;

  ngOnInit() {
    this.checkHome(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => this.checkHome(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  private checkHome(url: string) {
    this.isHome.set(url === '/' || url === '');
  }

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 10);
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }

  logout() {
    this.authService.logout();
    this.closeMenu();
    obtenerNotificaciones()?.disconnect();
    this.router.navigate(['/']);
  }
}
