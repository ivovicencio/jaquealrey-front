import {
  Component,
  ElementRef,
  OnDestroy,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { gsap } from 'gsap';

export interface DepthCarouselItem {
  image: string;
  alt?: string;
  /** Se puede colgar data extra (id de habitacion, precio) y vuelve en el change. */
  [clave: string]: unknown;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

/**
 * DepthCarousel de React Bits, portado a Angular.
 *
 * Las tarjetas se apilan en profundidad con perspectiva: la del frente entra
 * sola y las de atras se van desvaneciendo, con blur y mas oscuras. Navega con
 * flechas, arrastrando, con la rueda o con autoplay.
 */
@Component({
  selector: 'app-depth-carousel',
  standalone: true,
  template: `
    <div
      class="depth-carousel"
      [style.--dc-perspective]="perspective() + 'px'"
      role="group"
      aria-roledescription="carrusel"
      [attr.aria-label]="ariaLabel()"
      tabindex="0"
      #rootRef
      (pointerdown)="onPointerDown($event)"
      (pointermove)="onPointerMove($event)"
      (pointerup)="onPointerEnd()"
      (pointercancel)="onPointerEnd()"
      (keydown)="onKeyDown($event)"
    >
      <div class="depth-carousel__stage">
        @for (item of data(); track $index) {
          <div
            class="depth-carousel__card"
            #cardRef
            role="slide"
            [attr.aria-roledescription]="slide()"
            [attr.aria-label]="$index + 1 + ' de ' + data().length"
            [attr.aria-hidden]="active() !== $index"
            [style.width.px]="cardWidth()"
            [style.height.px]="cardHeight()"
            [style.border-radius.px]="radius()"
            (click)="onCardClick($index)"
          >
            <img class="depth-carousel__img" [src]="item.image" [alt]="item.alt || ''" draggable="false" />
            <span class="depth-carousel__tint" #tintRef [style.background]="tint()"></span>
          </div>
        }
      </div>

      @if (showControls() && data().length > 1) {
        <button
          type="button"
          class="depth-carousel__arrow depth-carousel__arrow--prev"
          aria-label="Anterior"
          (click)="navigateBy(-1)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M15 5l-7 7 7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <button
          type="button"
          class="depth-carousel__arrow depth-carousel__arrow--next"
          aria-label="Siguiente"
          (click)="navigateBy(1)"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path
              d="M9 5l7 7-7 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      }

      @if (showIndicators() && data().length > 1) {
        <div class="depth-carousel__dots" role="tablist" aria-label="Tarjetas">
          @for (item of data(); track $index) {
            <button
              type="button"
              role="tab"
              [attr.aria-selected]="active() === $index"
              [attr.aria-label]="'Ir a la tarjeta ' + ($index + 1)"
              class="depth-carousel__dot"
              [class.is-active]="active() === $index"
              (click)="setFocus($index, true)"
            ></button>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './depth-carousel.component.css',
})
export class DepthCarouselComponent implements OnDestroy {
  items = input<DepthCarouselItem[]>([]);
  ariaLabel = input('Carrusel de habitaciones');
  slide = input('diapositiva');
  cardWidth = input(300);
  cardHeight = input(380);
  radius = input(18);
  tint = input('#05060a');
  depth = input(220);
  spread = input(90);
  tilt = input(22);
  tiltDirection = input<'left' | 'right'>('right');
  perspective = input(1400);
  visibleCards = input(4);
  falloff = input(0.2);
  blur = input(6);
  duration = input(700);
  ease = input('power3.out');
  autoplay = input(false);
  autoplayDelay = input(3200);
  loop = input(true);
  showControls = input(true);
  showIndicators = input(true);

  /** Se dispara cuando la tarjeta del frente cambia: sirve para el detalle. */
  cambio = output<{ index: number; item: DepthCarouselItem }>();

  readonly data = computed<DepthCarouselItem[]>(() =>
    (Array.isArray(this.items()) ? this.items() : []).map((it) =>
      typeof it === 'string' ? { image: it, alt: '' } : it,
    ),
  );

  private readonly rootRef = viewChild.required<ElementRef<HTMLElement>>('rootRef');
  private readonly cardRefs = viewChildren<ElementRef<HTMLElement>>('cardRef');
  private readonly tintRefs = viewChildren<ElementRef<HTMLElement>>('tintRef');

  private pos = 0;
  private focus = 0;
  private scale = 1;
  private tween: gsap.core.Tween | null = null;
  private drag: { x: number; startPos: number; lastX: number; lastT: number; v: number; moved: boolean; id: number } | null =
    null;
  private wheelTimer: ReturnType<typeof setTimeout> | null = null;
  private autoTimer: ReturnType<typeof setInterval> | null = null;
  private reduced = false;
  private ro: ResizeObserver | null = null;
  private teardown: (() => void) | null = null;

  readonly active = signal(0);

  constructor() {
    // El layout se recalcula sola cuando cambia cualquier prop: es el equivalente
    // del useEffect de dependencias del original.
    afterRenderEffect(() => {
      this.depth();
      this.spread();
      this.tilt();
      this.tiltDirection();
      this.visibleCards();
      this.falloff();
      this.blur();
      this.cardWidth();
      this.data();
      this.layout(this.pos);
    });

    afterNextRender(() => this.init());
  }

  ngOnDestroy() {
    this.teardown?.();
    this.tween?.kill();
  }

  private init() {
    const root = this.rootRef().nativeElement;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      const needed = this.cardWidth() + Math.abs(this.spread()) * 2 + 120;
      this.scale = clamp(w / needed, 0.4, 1);
      this.layout(this.pos);
    });
    this.ro.observe(root);

    // La rueda navega el carrusel, no la pagina. Por eso preventDefault y por eso
    // hay que registrarlo sin passive: es lo que hace el original.
    const onWheel = (e: WheelEvent) => {
      if (this.data().length < 2) return;
      e.preventDefault();
      this.tween?.kill();
      const raw = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      const delta = e.deltaMode === 1 ? raw * 24 : raw;
      const step = clamp(delta / (this.cardWidth() * 0.9), -0.6, 0.6);
      this.pos += step;
      this.layout(this.pos);
      if (this.wheelTimer) clearTimeout(this.wheelTimer);
      this.wheelTimer = setTimeout(() => this.setFocus(Math.round(this.pos), true), 130);
    };
    root.addEventListener('wheel', onWheel, { passive: false });

    this.setupAutoplay();

    this.teardown = () => {
      this.ro?.disconnect();
      this.ro = null;
      root.removeEventListener('wheel', onWheel);
      if (this.wheelTimer) clearTimeout(this.wheelTimer);
      this.stopAutoplay();
    };
  }

  /** Reparte las tarjetas en el riel de profundidad. */
  private layout(pos: number) {
    const n = this.data().length;
    if (!n) return;
    const dir = this.tiltDirection() === 'left' ? -1 : 1;
    const sc = this.scale;
    const cards = this.cardRefs();
    const tints = this.tintRefs();

    for (let i = 0; i < n; i++) {
      const el = cards[i]?.nativeElement;
      if (!el) continue;

      let d = i - pos;
      if (this.loop() && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }

      const back = Math.max(0, d);
      const az = Math.abs(d);
      const shown = az <= this.visibleCards() + 0.5;

      const tz = -this.depth() * d;
      const tx = dir * this.spread() * d;
      const ry = dir * this.tilt() * clamp(d, 0, 1);

      let opacity = d < 0 ? Math.max(0, 1 + d) : 1;
      if (!shown) opacity = 0;

      const brightness = Math.max(0.15, 1 - back * this.falloff());
      const blurPx =
        this.blur() > 0 ? Math.min(this.blur(), (back / Math.max(1, this.visibleCards())) * this.blur()) : 0;
      const zi = Math.round(2000 - d * 20);

      el.style.transform = `translate(-50%, -50%) scale(${sc}) translateX(${tx.toFixed(2)}px) translateZ(${tz.toFixed(2)}px) rotateY(${ry.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = `brightness(${brightness.toFixed(3)}) blur(${blurPx.toFixed(2)}px)`;
      el.style.zIndex = String(zi);
      el.style.pointerEvents = shown && opacity > 0.05 ? 'auto' : 'none';

      const ov = tints[i]?.nativeElement;
      if (ov) ov.style.opacity = clamp(back * this.falloff() * 1.25, 0, 0.86).toFixed(3);
    }
  }

  private tweenTo(target: number, animate: boolean) {
    this.tween?.kill();
    const proxy = { p: this.pos };
    const dur = animate && !this.reduced ? this.duration() / 1000 : 0;
    const n = this.data().length;

    this.tween = gsap.to(proxy, {
      p: target,
      duration: dur,
      ease: this.ease(),
      onUpdate: () => {
        this.pos = proxy.p;
        this.layout(proxy.p);
      },
      onComplete: () => {
        if (n > 0) this.pos = ((this.pos % n) + n) % n;
        this.layout(this.pos);
      },
    });
  }

  setFocus(rawIndex: number, animate = true) {
    const n = this.data().length;
    if (!n) return;
    const idx = this.loop() ? ((rawIndex % n) + n) % n : clamp(rawIndex, 0, n - 1);

    let delta = idx - this.pos;
    if (this.loop() && n > 1) {
      delta = ((delta % n) + n) % n;
      if (delta > n / 2) delta -= n;
    }
    this.tweenTo(this.pos + delta, animate);

    if (idx !== this.focus) {
      this.focus = idx;
      this.active.set(idx);
      this.cambio.emit({ index: idx, item: this.data()[idx] });
    }
  }

  navigateBy(step: number) {
    this.setFocus(this.focus + step, true);
  }

  onCardClick(index: number) {
    if (this.drag?.moved) return;
    this.setFocus(index, true);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      this.navigateBy(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      this.navigateBy(1);
    }
  }

  onPointerDown(e: PointerEvent) {
    if (this.data().length < 2) return;
    this.tween?.kill();
    this.drag = {
      x: e.clientX,
      startPos: this.pos,
      lastX: e.clientX,
      lastT: performance.now(),
      v: 0,
      moved: false,
      id: e.pointerId,
    };
  }

  onPointerMove(e: PointerEvent) {
    const drag = this.drag;
    if (!drag) return;
    const stepPx = Math.max(this.cardWidth() * 0.55 * this.scale, 40);
    const dx = e.clientX - drag.x;

    if (!drag.moved && Math.abs(dx) > 4) {
      drag.moved = true;
      this.rootRef().nativeElement.setPointerCapture(drag.id);
    }
    if (!drag.moved) return;

    const now = performance.now();
    const dt = Math.max(now - drag.lastT, 1);
    drag.v = (e.clientX - drag.lastX) / dt;
    drag.lastX = e.clientX;
    drag.lastT = now;

    this.pos = drag.startPos - dx / stepPx;
    this.layout(this.pos);
  }

  onPointerEnd() {
    const drag = this.drag;
    if (!drag) return;
    this.drag = null;
    if (!drag.moved) return;
    const stepPx = Math.max(this.cardWidth() * 0.55 * this.scale, 40);
    const projected = this.pos - (drag.v * 180) / stepPx;
    this.setFocus(Math.round(projected), true);
  }

  private setupAutoplay() {
    this.stopAutoplay();
    if (!this.autoplay() || this.reduced || this.data().length < 2) return;

    let hovered = false;
    let focused = false;
    const root = this.rootRef().nativeElement;

    this.autoTimer = setInterval(() => {
      if (!hovered && !focused) this.navigateBy(1);
    }, Math.max(this.autoplayDelay(), 600));

    const onEnter = () => (hovered = true);
    const onLeave = () => (hovered = false);
    const onFocusIn = () => (focused = true);
    const onFocusOut = () => (focused = false);

    root.addEventListener('mouseenter', onEnter);
    root.addEventListener('mouseleave', onLeave);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);

    const prevStop = this.teardown;
    this.teardown = () => {
      prevStop?.();
      root.removeEventListener('mouseenter', onEnter);
      root.removeEventListener('mouseleave', onLeave);
      root.removeEventListener('focusin', onFocusIn);
      root.removeEventListener('focusout', onFocusOut);
    };
  }

  private stopAutoplay() {
    if (this.autoTimer) clearInterval(this.autoTimer);
    this.autoTimer = null;
  }
}
