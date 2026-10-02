import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { gsap } from 'gsap';
import { PointerService } from '../../../core/services/pointer.service';

type Borde = 'top' | 'bottom';

/**
 * Item del FlowingMenu. Es el port del MenuItem de React Bits: el texto quieto
 * arriba y un marquee con el texto repetido + la foto, que se revela de la
 * banda de la que se entra (arriba o abajo) segun de que lado entre el mouse.
 */
@Component({
  selector: 'app-flowing-menu-item',
  standalone: true,
  template: `
    <div class="menu__item" #itemRef [class.menu--foto]="!animado()" [style.border-top-color]="borderColor()">
      <a
        class="menu__item-link"
        [href]="link()"
        [style.color]="textColor()"
        (mouseenter)="onEnter($event)"
        (mouseleave)="onLeave($event)"
        (focus)="onEnter()"
        (blur)="onLeave()"
        (click)="onClick($event)"
        ><span class="menu__label">{{ text() }}</span></a
      >

      @if (animado()) {
        <div class="marquee" #marqueeRef [style.background-color]="marqueeBgColor()">
          <div class="marquee__inner-wrap">
            <div class="marquee__inner" #marqueeInnerRef aria-hidden="true">
              @for (slot of copias(); track slot) {
                <div class="marquee__part" [style.color]="marqueeTextColor()">
                  <span>{{ text() }}</span>
                  <div
                    class="marquee__img"
                    [style.background-image]="'url(' + image() + ')'"
                    [style.background-color]="marqueeBgColor()"
                  ></div>
                </div>
              }
            </div>
          </div>
        </div>
      } @else {
        <!-- Sin hover no hay reveal: la foto va siempre a la vista, al lado del
             texto, y el toque navega al toque. Sin tap-doble-para-navegar. -->
        <span
          class="menu__thumb"
          aria-hidden="true"
          [style.background-image]="'url(' + image() + ')'"
        ></span>
      }
    </div>
  `,
  styleUrl: './flowing-menu-item.component.css',
})
export class FlowingMenuItemComponent implements OnDestroy {
  link = input.required<string>();
  text = input.required<string>();
  image = input.required<string>();
  /** Si viene, el click no navega: el contenedor ejecuta la accion. */
  accion = input<'logout'>();
  speed = input(15);
  textColor = input('#fff');
  marqueeBgColor = input('#fff');
  marqueeTextColor = input('#120F17');
  borderColor = input('#fff');

  /** Click delegado al contenedor: el menu no sabe de rutas ni de logout. */
  navegar = output<{ ev: MouseEvent; link: string; accion?: 'logout' }>();

  private itemRef = viewChild.required<ElementRef<HTMLElement>>('itemRef');
  // Opcionales a proposito: el marquee no se renderiza en celu ni con
  // reduced-motion, asi que required fallaria al buscarlo.
  private marqueeRef = viewChild<ElementRef<HTMLElement>>('marqueeRef');
  private marqueeInnerRef = viewChild<ElementRef<HTMLElement>>('marqueeInnerRef');

  /** Hay hover y no se pidio menos movimiento: se puede usar el reveal. */
  readonly animado = computed(() => this.pointer.canHover() && !this.pointer.reduceMotion());

  private readonly repetitions = signal(4);
  readonly copias = computed(() => Array.from({ length: this.repetitions() }, (_, i) => i));

  /** Cambia en cada resize: fuerza a recalcular cuantas copias hacen falta. */
  private readonly resizeTick = signal(0);

  private tween: gsap.core.Tween | null = null;
  private hover: gsap.core.Timeline | null = null;
  private readonly pointer = inject(PointerService);

  constructor() {
    // Cuantas copias del marquee: las justas para tapar el ancho del item y que
    // el loop sea invisible. Se mide el ancho real, no se tira un numero fijo.
    afterRenderEffect(() => {
      this.text();
      this.image();
      this.resizeTick();
      if (!this.animado()) {
        this.repetitions.set(4);
        return;
      }

      const part = this.parte();
      if (!part?.offsetWidth) return;

      const ancho = this.marqueeRef()?.nativeElement.offsetWidth || window.innerWidth;
      const necesarias = Math.ceil(ancho / part.offsetWidth) + 2;
      this.repetitions.set(Math.max(4, necesarias));
    });

    // El marquee: desplaza exactamente un ancho de contenido y repite, asi el
    // empalme es invisible. Se rehace cada vez que cambia la cantidad de copias.
    afterRenderEffect(() => {
      this.repetitions();
      const duracion = this.speed();
      if (!this.animado()) {
        this.tween?.kill();
        this.tween = null;
        return;
      }

      const part = this.parte();
      if (!part?.offsetWidth) return;

      const inner = this.marqueeInnerRef()!.nativeElement;
      this.tween?.kill();
      this.tween = gsap.to(inner, {
        x: -part.offsetWidth,
        duration: duracion,
        ease: 'none',
        repeat: -1,
      });
    });
  }

  @HostListener('window:resize')
  onResize() {
    this.resizeTick.update((v) => v + 1);
  }

  ngOnDestroy() {
    this.tween?.kill();
    this.hover?.kill();
  }

  onClick(ev: MouseEvent) {
    this.navegar.emit({ ev, link: this.link(), accion: this.accion() });
  }

  onEnter(ev?: MouseEvent) {
    if (!this.animado()) return;
    this.desplazar(ev ? this.bordeCercano(ev) : 'top', true);
  }

  onLeave(ev?: MouseEvent) {
    if (!this.animado()) return;
    this.desplazar(ev ? this.bordeCercano(ev) : 'top', false);
  }

  private parte(): HTMLElement | null {
    return this.marqueeInnerRef()?.nativeElement.querySelector<HTMLElement>('.marquee__part') ?? null;
  }

  /** Distancia al borde de arriba o de abajo del item, para reveal del lado correcto. */
  private bordeCercano(ev: MouseEvent): Borde {
    const r = this.itemRef().nativeElement.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const y = ev.clientY - r.top;
    const arriba = this.dist(x, y, r.width / 2, 0);
    const abajo = this.dist(x, y, r.width / 2, r.height);
    return arriba < abajo ? 'top' : 'bottom';
  }

  private dist(x: number, y: number, x2: number, y2: number) {
    const dx = x - x2;
    const dy = y - y2;
    return dx * dx + dy * dy;
  }

  private desplazar(borde: Borde, entrar: boolean) {
    const marquee = this.marqueeRef()?.nativeElement;
    const inner = this.marqueeInnerRef()?.nativeElement;
    if (!marquee || !inner) return;

    const arriba = borde === 'top';

    const tl = gsap.timeline({ defaults: { duration: 0.6, ease: 'expo' } });
    if (entrar) {
      tl.set(marquee, { y: arriba ? '-101%' : '101%' }, 0)
        .set(inner, { y: arriba ? '101%' : '-101%' }, 0)
        .to([marquee, inner], { y: '0%' }, 0);
    } else {
      tl.to(marquee, { y: arriba ? '-101%' : '101%' }, 0).to(inner, { y: arriba ? '101%' : '-101%' }, 0);
    }
    this.hover = tl;
  }
}
