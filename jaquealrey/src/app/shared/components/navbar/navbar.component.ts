import { Component, inject, signal, computed, effect, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { obtenerNotificaciones } from '../../../core/services/notification.service';
import { FlowingMenuComponent } from '../flowing-menu/flowing-menu.component';
import { FlowingMenuItem } from '../flowing-menu/flowing-menu.model';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FlowingMenuComponent],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()" [class.has-bg]="!isHome()">
      <div class="navbar-inner container">
        <a class="navbar-brand" routerLink="/"><span class="logo-icon">&#9819;</span> Hotel Jaque al Rey</a>

        <button
          class="hamburger"
          (click)="toggleMenu()"
          [class.active]="menuOpen()"
          [attr.aria-expanded]="menuOpen()"
          aria-label="Menu"
        >
          <span></span><span></span><span></span>
        </button>
      </div>

      <div class="fullmenu" [class.open]="menuOpen()">
        <div class="fullmenu-top">
          <span class="fullmenu-logo">&#9819; Hotel Jaque al Rey</span>
          <button class="fullmenu-close" (click)="closeMenu()" aria-label="Cerrar menu">&times;</button>
        </div>
        <app-flowing-menu
          class="fullmenu-body"
          [items]="menuItems()"
          [speed]="11"
          [textColor]="'#f3ece1'"
          [bgColor]="'#0f0b08'"
          [marqueeBgColor]="'var(--gold-light)'"
          [marqueeTextColor]="'#140f0a'"
          [borderColor]="'rgba(255,255,255,0.14)'"
          (navegar)="onMenuNavigate($event)"
        />
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

    .hamburger {
      display: flex;
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

    /* Menu FlowingMenu a pantalla completa, por encima del nav. */
    .fullmenu {
      position: fixed;
      inset: 0;
      /* dvh y no vh: en el celu vh excede la pantalla cuando la barra del
         navegador aparece, y el ultimo item quedaba cortado. */
      height: 100dvh;
      z-index: 1002;
      display: flex;
      flex-direction: column;
      background: #0f0b08;
      padding-bottom: env(safe-area-inset-bottom);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-12px);
      transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), visibility 0.4s;
    }
    .fullmenu.open {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }
    .fullmenu-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex: 0 0 auto;
      padding: 18px 24px;
      padding-top: calc(18px + env(safe-area-inset-top));
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    .fullmenu-logo {
      font-family: var(--font-heading);
      font-size: 1rem;
      letter-spacing: 0.3px;
      color: var(--gold-light);
    }
    .fullmenu-close {
      background: none;
      border: 1px solid rgba(255, 255, 255, 0.25);
      color: #fff;
      width: 38px;
      height: 38px;
      border-radius: 50%;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      transition: var(--transition);
    }
    .fullmenu-close:hover { background: rgba(255, 255, 255, 0.12); }
    /* min-height:0 es lo que deja que los items repartan la pantalla en vez de
       desbordar cuando son varios (admin suma Panel y Salir). */
    .fullmenu-body {
      display: block;
      flex: 1 1 auto;
      min-height: 0;
    }

    @media (max-width: 768px) {
      .fullmenu-top { padding: 14px 18px; }
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

  /** Items del menu visual. Las fotos salen de /assets, las que ya usa el home. */
  menuItems = computed<FlowingMenuItem[]>(() => {
    const items: FlowingMenuItem[] = [
      { link: '/', text: 'Inicio', image: '/assets/hero.jpeg' },
      { link: '/habitaciones', text: 'Habitaciones', image: '/assets/nosequehabitaciones1.jpeg' },
      { link: '/buscar-disponibilidad', text: 'Buscar disponibilidad', image: '/assets/departamento.jpeg' },
      { link: '/consultar-reserva', text: 'Consultar mi reserva', image: '/assets/recepcion.jpeg' },
    ];
    if (this.authService.isAdmin()) {
      items.push({ link: '/admin', text: 'Panel', image: '/assets/mismodepartamento.jpeg' });
      items.push({ link: '/salir', text: 'Salir', image: '/assets/nosequehabitaciones3.jpeg' });
    }
    return items;
  });

  constructor() {
    // El menu es a pantalla completa: sin esto el scroll de fondo se mueve
    // por detras mientras esta abierto.
    effect(() => {
      const abierto = this.menuOpen();
      document.body.style.overflow = abierto ? 'hidden' : '';
    });
  }

  /** El click lo intercepta el navbar: el menu no sabe de rutas ni de logout. */
  onMenuNavigate({ ev, link }: { ev: MouseEvent; link: string }) {
    ev.preventDefault();
    if (link === '/salir') {
      this.logout();
      return;
    }
    this.router.navigateByUrl(link);
    this.closeMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.closeMenu();
  }

  ngOnInit() {
    this.checkHome(this.router.url);
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.checkHome(e.urlAfterRedirects || e.url);
        this.closeMenu();
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
    document.body.style.overflow = '';
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
    this.closeMenu();
    obtenerNotificaciones()?.disconnect();
    // El servicio ya limpio el token local antes de emitir, asi que acá el
    // panel ya no queda logueado aunque el POST al back haya fallado.
    this.authService.logout().subscribe(() => this.router.navigate(['/']));
  }
}
