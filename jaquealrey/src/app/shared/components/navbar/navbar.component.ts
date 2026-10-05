import { Component, inject, signal, computed, effect, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { FlowingMenuComponent } from '../flowing-menu/flowing-menu.component';
import { FlowingMenuItem } from '../flowing-menu/flowing-menu.model';
import { AuthService } from '../../../core/services/auth.service';
import { filter } from 'rxjs/operators';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, FlowingMenuComponent],
  template: `
    <nav class="navbar" [class.scrolled]="scrolled()" [class.has-bg]="!isHome()">
      <div class="navbar-inner container">
        <a class="navbar-brand" routerLink="/"><span class="logo-icon"><i class="fas fa-chess-king"></i></span> Hotel Jaque al Rey</a>

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
          <span class="fullmenu-logo"><i class="fas fa-chess-king"></i> Hotel Jaque al Rey</span>
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
    .navbar.has-bg .logo-icon { color: var(--gold-light); }
    .navbar.has-bg .navbar-brand:hover { color: var(--gold-light); }
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
    .hamburger:focus-visible,
    .fullmenu-close:focus-visible {
      outline-color: var(--gold-light);
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
       desbordar cuando son varios (con sesion de admin se suman Panel y Salir). */
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
  private router = inject(Router);
  private auth = inject(AuthService);

  scrolled = signal(false);
  menuOpen = signal(false);
  isHome = signal(true);

  private routerSub!: Subscription;

  /**
   * El menu es a pantalla completa: sin esto el scroll de fondo se mueve
   * por detras mientras esta abierto.
   */
  constructor() {
    effect(() => {
      const abierto = this.menuOpen();
      document.body.style.overflow = abierto ? 'hidden' : '';
    });
  }

  /**
   * Items del menu visual. Las fotos salen de /assets, las que ya usa el home.
   *
   * `Panel` y `Salir` solo existen si hay un admin con sesion. Para el visitante
   * que llega a reservar, el menu tiene que hablar de habitaciones y no del
   * backoffice: ver un "Salir" en la portada hacia que el sitio publico y el
   * panel son la misma cosa.
   *
   * Para el admin si hacen falta: la barra propia del panel (app-bar) solo
   * aparece cuando la app corre instalada como PWA, asi que en el navegador
   * comun este menu es el unico lugar donde cerrar sesion.
   */
  menuItems = computed<FlowingMenuItem[]>(() => {
    const items: FlowingMenuItem[] = [
      { link: '/', text: 'Inicio', image: '/assets/nuevohero.png' },
      { link: '/habitaciones', text: 'Habitaciones', image: '/assets/nosequehabitaciones1.jpeg' },
      { link: '/buscar-disponibilidad', text: 'Buscar disponibilidad', image: '/assets/departamento.jpeg' },
      { link: '/consultar-reserva', text: 'Consultar mi reserva', image: '/assets/recepcion.jpeg' },
    ];

    if (this.esAdmin()) {
      items.push({ link: '/admin', text: 'Panel', image: '/assets/rey.jpg' });
      items.push({ link: '#', text: 'Salir', image: '/assets/recepcion.jpeg', accion: 'logout' });
    }

    return items;
  });

  /**
   * `AuthService.isAdmin()` lee el token del localStorage y no es un signal, asi
   * que sola no alcanza para redibujar el menu. Este tick es lo que dispara el
   * recalculo: se mueve al cambiar de ruta y al abrir el menu, que es
   * justo cuando el item puede aparecer o desaparecer.
   */
  private readonly sesionTick = signal(0);
  readonly esAdmin = computed(() => {
    this.sesionTick();
    return this.auth.isAdmin();
  });

  /** El click lo intercepta el navbar: el menu no sabe de rutas. */
  onMenuNavigate({ ev, link, accion }: { ev: MouseEvent; link: string; accion?: 'logout' }) {
    ev.preventDefault();
    this.closeMenu();

    if (accion === 'logout') {
      this.logout();
      return;
    }

    this.router.navigateByUrl(link);
  }

  /**
   * Cierra sesion y vuelve al login.
   *
   * `AuthService.logout()` ya borra el token y tira el socket por su cuenta: es
   * imperativo justamente para que ningun llamador pueda olvidarse de hacerlo. Aqi
   * solo queda la navegacion, que es lo unico que depende de este componente.
   */
  private logout(): void {
    this.auth.logout();
    this.sesionTick.update((v) => v + 1);
    this.router.navigateByUrl('/login');
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
        // El login borra o escribe el token sin pasar por el router con una razon
        // clara, asi que cada navegacion es una occasion de reevaluar el menu.
        this.sesionTick.update((v) => v + 1);
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
    // Antes de abrir: el menu decide si muestra Panel y Salir recien al abrirse.
    this.sesionTick.update((v) => v + 1);
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
