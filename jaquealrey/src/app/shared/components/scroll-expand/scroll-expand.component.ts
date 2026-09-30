import { Component, ElementRef, OnDestroy, afterNextRender, input, viewChild } from '@angular/core';

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = clamp((x - edge0) / (edge1 - edge0 || 1e-6), 0, 1);
  return t * t * (3 - 2 * t);
};

/**
 * ScrollExpand de React Bits, portado a Angular.
 *
 * Un marco chico y redondeado que se abre a sangre mientras scrolleas: la foto
 * arranca con zoom, el titulo se va para arriba y el contenido de adentro
 * aparece cuando el marco ya esta a pantalla completa.
 *
 * El alto del track se calcula en px al medir (1 + scrollDistance +
 * holdDistance)x el alto del stage, y el stage es sticky: eso es lo que produce
 * el efecto de "se abre y despues se suelta".
 */
@Component({
  selector: 'app-scroll-expand',
  standalone: true,
  template: `
    <div
      class="scroll-expand"
      [class.scroll-expand--scroller]="!useWindowScroll()"
      #rootRef
    >
      <div class="scroll-expand__track" #trackRef>
        <div class="scroll-expand__stage" #stageRef>
          <div class="scroll-expand__frame" #frameRef>
            @if (mediaType() === 'video') {
              <video
                class="scroll-expand__media"
                #mediaRef
                [src]="src()"
                [poster]="poster()"
                autoplay
                muted
                loop
                playsinline
              ></video>
            } @else {
              <img class="scroll-expand__media" #mediaRef [src]="src()" [alt]="alt()" draggable="false" />
            }

            <div class="scroll-expand__scrim" #scrimRef></div>

            <div class="scroll-expand__overlay" #overlayRef>
              <ng-content></ng-content>
            </div>
          </div>

          @if (title()) {
            <div class="scroll-expand__title" #titleRef>
              @switch (titleTag()) {
                @case ('h1') {
                  <h1 class="scroll-expand__title-text">{{ title() }}</h1>
                }
                @case ('h2') {
                  <h2 class="scroll-expand__title-text">{{ title() }}</h2>
                }
                @default {
                  <span class="scroll-expand__title-text">{{ title() }}</span>
                }
              }
            </div>
          }

          @if (scrollHint()) {
            <div class="scroll-expand__hint" #hintRef>{{ scrollHint() }}</div>
          }
        </div>
      </div>
    </div>
  `,
  styleUrl: './scroll-expand.component.css',
})
export class ScrollExpandComponent implements OnDestroy {
  src = input('');
  mediaType = input<'image' | 'video'>('image');
  poster = input('');
  alt = input('');
  title = input('');
  /** El original pinta el titulo en un div. Para no perder el h1 del SEO. */
  titleTag = input<'h1' | 'h2' | 'span'>('span');
  scrollHint = input('');
  startWidth = input(42);
  startHeight = input(58);
  startRadius = input(24);
  endRadius = input(0);
  mediaZoom = input(1.35);
  scrollDistance = input(1.2);
  holdDistance = input(0.35);
  smoothing = input(0.1);
  overlayScrim = input(0.45);
  useWindowScroll = input(false);
  enabled = input(true);

  private rootRef = viewChild.required<ElementRef<HTMLElement>>('rootRef');
  private trackRef = viewChild.required<ElementRef<HTMLElement>>('trackRef');
  private stageRef = viewChild.required<ElementRef<HTMLElement>>('stageRef');
  private frameRef = viewChild.required<ElementRef<HTMLElement>>('frameRef');
  private mediaRef = viewChild.required<ElementRef<HTMLElement>>('mediaRef');
  // Opcionales: el titulo, el hint y el overlay dependen de si hay contenido.
  private titleRef = viewChild<ElementRef<HTMLElement>>('titleRef');
  private overlayRef = viewChild<ElementRef<HTMLElement>>('overlayRef');
  private scrimRef = viewChild<ElementRef<HTMLElement>>('scrimRef');
  private hintRef = viewChild<ElementRef<HTMLElement>>('hintRef');

  private raf = 0;
  private current = 0;
  private target = 0;
  private stageH = 0;
  private running = false;
  private reduceMotion = false;
  private teardown: (() => void) | null = null;

  constructor() {
    afterNextRender(() => this.init());
  }

  ngOnDestroy() {
    this.teardown?.();
  }

  private init() {
    const root = this.rootRef().nativeElement;
    const track = this.trackRef().nativeElement;
    const stage = this.stageRef().nativeElement;

    this.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const measure = () => {
      const alto = this.useWindowScroll() ? window.innerHeight : root.clientHeight;
      if (alto <= 0) return;
      this.stageH = alto;
      stage.style.height = `${alto}px`;
      track.style.height = `${alto * (1 + Math.max(0, this.scrollDistance()) + Math.max(0, this.holdDistance()))}px`;

      const ancho = root.clientWidth || alto;
      stage.style.setProperty('--se-title-size', `${clamp(ancho * 0.075, 20, 84)}px`);
    };

    const readProgress = (): number => {
      if (!this.enabled()) return 1;
      const span = this.stageH * Math.max(0.01, this.scrollDistance());
      if (this.useWindowScroll()) {
        const top = track.getBoundingClientRect().top;
        return clamp(-top / span, 0, 1);
      }
      return clamp(root.scrollTop / span, 0, 1);
    };

    const tick = () => {
      const s = this.smoothing();
      const k = s <= 0 ? 1 : 1 - Math.exp(-1 / (60 * s));
      this.current += (this.target - this.current) * k;
      if (Math.abs(this.target - this.current) < 0.0004) {
        this.current = this.target;
        this.running = false;
      }
      this.applyProgress(this.current);
      this.raf = this.running ? requestAnimationFrame(tick) : 0;
    };

    const kick = () => {
      if (this.running) return;
      this.running = true;
      if (!this.raf) this.raf = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      this.target = readProgress();
      if (this.smoothing() <= 0 || this.reduceMotion) {
        this.current = this.target;
        this.applyProgress(this.current);
        return;
      }
      kick();
    };

    const onResize = () => {
      measure();
      this.target = readProgress();
      this.current = this.target;
      this.applyProgress(this.current);
    };

    measure();
    this.target = readProgress();
    this.current = this.target;
    this.applyProgress(this.current);

    // useWindowScroll se lee una sola vez, como en el efecto del original: si
    // cambiara en caliente habria que rebindear los listeners.
    const scroller: HTMLElement | Window = this.useWindowScroll() ? window : root;
    scroller.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const ro = new ResizeObserver(onResize);
    ro.observe(root);

    this.teardown = () => {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = 0;
      scroller.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      ro.disconnect();
    };
  }

  private applyProgress(p: number) {
    const frame = this.frameRef().nativeElement;
    const media = this.mediaRef().nativeElement;
    const e = smoothstep(0, 1, p);

    const w = this.startWidth() + (100 - this.startWidth()) * e;
    const h = this.startHeight() + (100 - this.startHeight()) * e;
    const ix = Math.max(0, (100 - w) / 2);
    const iy = Math.max(0, (100 - h) / 2);
    const r = this.startRadius() + (this.endRadius() - this.startRadius()) * e;
    frame.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${r}px)`;

    media.style.transform = `scale(${this.mediaZoom() + (1 - this.mediaZoom()) * e})`;

    this.scrimRef()?.nativeElement.style.setProperty('opacity', `${this.overlayScrim() * e}`);

    const title = this.titleRef()?.nativeElement;
    if (title) {
      const out = smoothstep(0.4, 0.88, p);
      title.style.opacity = `${1 - out}`;
      title.style.transform = `translate3d(0, ${-28 * out}px, 0) scale(${1 + 0.06 * out})`;
    }

    const hint = this.hintRef()?.nativeElement;
    if (hint) {
      const gone = smoothstep(0, 0.12, p);
      hint.style.opacity = `${1 - gone}`;
      hint.style.transform = `translate3d(0, ${8 * gone}px, 0)`;
    }

    const overlay = this.overlayRef()?.nativeElement;
    if (overlay) {
      const inn = smoothstep(0.68, 1, p);
      overlay.style.opacity = `${inn}`;
      overlay.style.transform = `translate3d(0, ${18 * (1 - inn)}px, 0)`;
    }
  }
}
