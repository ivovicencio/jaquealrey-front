import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

export interface OptionWheelChange {
  index: number;
  item: string;
}

@Component({
  selector: 'app-option-wheel',
  standalone: true,
  templateUrl: './option-wheel.component.html',
  styleUrl: './option-wheel.component.css',
})
export class OptionWheelComponent implements AfterViewInit, OnDestroy {
  // inputs
  items = input<string[]>([]);
  defaultSelected = input(0);
  textColor = input('#a6a6a6');
  activeColor = input('#ffffff');
  side = input<'left' | 'right'>('left');
  fontSize = input(3);
  spacing = input(1.4);
  curve = input(1);
  tilt = input(6);
  blur = input(2);
  fade = input(0.25);
  minOpacity = input(0.05);
  smoothing = input(200);
  inset = input(80);
  loop = input(false);
  draggable = input(true);
  soundUrl = input('');
  soundVolume = input(0.5);
  className = input('');
  ariaLabel = input('Rueda de opciones');

  // outputs
  readonly onChange = output<OptionWheelChange>();

  // state
  readonly selectedIndex = signal(0);
  readonly dragging = signal(false);

  readonly rootRef = viewChild<ElementRef<HTMLDivElement>>('rootRef');
  readonly count = () => this.items().length;

  private els: HTMLElement[] = [];
  private remPx = 16;
  private reduced = false;
  private rowH = 1;
  private st = {
    pos: 0,
    target: 0,
    raf: 0,
    last: 0,
    wheelTimer: 0 as ReturnType<typeof setTimeout> | 0,
    drag: null as null | { y: number; start: number; id: number; moved: boolean },
    moved: false,
    lastTick: 0,
    audio: null as HTMLAudioElement | null,
    audioUrl: '',
  };
  private cleanup: (() => void)[] = [];

  constructor() {
    // Re-layout when any visual config input changes.
    effect(() => {
      this.items();
      this.fontSize();
      this.spacing();
      this.curve();
      this.tilt();
      this.blur();
      this.fade();
      this.minOpacity();
      this.side();
      this.loop();
      this.smoothing();
      this.defaultSelected();
      this.remeasure();
    });
  }

  // ------------------------------------------------------------------ lifecycle

  ngAfterViewInit() {
    this.remPx =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    this.reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const root = this.rootRef()?.nativeElement;
    if (!root) return;
    this.els = Array.from(root.querySelectorAll<HTMLElement>('.option-wheel__item'));

    this.st.pos = this.defaultSelected();
    this.st.target = this.defaultSelected();
    this.selectedIndex.set(this.defaultSelected());
    this.remeasure();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      // Cap each event at one step so a notchy wheel moves exactly one option.
      const step = Math.max(-1, Math.min(1, delta / this.rowH));
      this.applyTarget(this.st.target + step, false);
      clearTimeout(this.st.wheelTimer);
      this.st.wheelTimer = setTimeout(() => this.applyTarget(this.st.target, true), 140);
    };
    root.addEventListener('wheel', onWheel, { passive: false });
    this.cleanup.push(() => {
      root.removeEventListener('wheel', onWheel);
      clearTimeout(this.st.wheelTimer);
    });

    this.startLoop();
  }

  ngOnDestroy() {
    if (this.st.raf) cancelAnimationFrame(this.st.raf);
    this.st.raf = 0;
    this.cleanup.forEach((fn) => fn());
    this.cleanup = [];
    this.st.audio?.pause();
  }

  // ------------------------------------------------------------------ config

  private remeasure() {
    this.rowH = Math.max(this.fontSize() * this.spacing() * this.remPx, 1);
    if (!this.els.length) return;
    this.applyTarget(this.st.target, false);
  }

  // ------------------------------------------------------------------ loop

  private startLoop() {
    if (this.st.raf) cancelAnimationFrame(this.st.raf);
    this.st.last = performance.now();
    this.st.raf = requestAnimationFrame(this.frame);
  }

  private frame = (now: number) => {
    this.st.raf = 0;
    const n = this.count();
    if (!n) return;

    const dt = Math.min((now - this.st.last) / 1000, 0.05);
    this.st.last = now;

    // Exponential smoothing, frame-rate independent. Reduced motion snaps.
    const tau = Math.max(this.reduced ? 0.0001 : this.smoothing(), 1) / 1000;
    const k = this.reduced ? 1 : 1 - Math.exp(-dt / tau);
    const target = this.st.target;
    const cur = this.st.pos;
    let next = cur + (target - cur) * k;
    const settled = this.reduced ? true : Math.abs(target - next) < 0.001;
    if (settled) next = target;
    this.st.pos = next;

    const mirror = this.side() === 'right' ? -1 : 1;
    const tiltRad = (this.tilt() * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? this.rowH / tiltRad : 0;

    for (let i = 0; i < n; i++) {
      const el = this.els[i];
      if (!el) continue;
      let d = i - next;
      if (this.loop() && n > 1) {
        d = ((d % n) + n) % n;
        if (d > n / 2) d -= n;
      }
      const dist = Math.abs(d);
      let x = 0;
      let y = d * this.rowH;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * this.curve();
        rot = (mirror * ang * 180) / Math.PI;
      }
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = String(Math.max(this.minOpacity(), 1 - dist * this.fade()));
      el.style.filter = this.blur() > 0 ? `blur(${(dist * this.blur()).toFixed(2)}px)` : 'none';
      el.style.setProperty('--ow-p', Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    if (!settled) this.st.raf = requestAnimationFrame(this.frame);
  };

  private applyTarget(value: number, snap: boolean) {
    const n = this.count();
    if (!n) return;
    let v = value;
    if (!this.loop()) v = Math.min(Math.max(v, 0), n - 1);
    if (snap) v = Math.round(v);
    this.st.target = v;

    const idx = ((Math.round(v) % n) + n) % n;
    if (idx !== this.selectedIndex()) {
      this.selectedIndex.set(idx);
      this.onChange.emit({ index: idx, item: this.items()[idx] ?? '' });
      this.playTick();
    }
    this.startLoop();
  }

  // ------------------------------------------------------------------ sound

  private playTick() {
    const url = this.soundUrl();
    if (!url) return;
    const now = performance.now();
    if (now - this.st.lastTick < 70) return;
    this.st.lastTick = now;
    if (!this.st.audio || this.st.audioUrl !== url) {
      this.st.audio = new Audio(url);
      this.st.audio.preload = 'auto';
      this.st.audioUrl = url;
    }
    const audio = this.st.audio;
    audio.volume = Math.min(Math.max(this.soundVolume(), 0), 1);
    audio.currentTime = 0;
    audio.play()?.catch(() => {});
  }

  // ------------------------------------------------------------------ pointer / keyboard

  onPointerDown(event: PointerEvent) {
    if (!this.draggable()) return;
    this.st.drag = { y: event.clientY, start: this.st.target, id: event.pointerId, moved: false };
    this.st.moved = false;
    this.dragging.set(true);
  }

  onPointerMove(event: PointerEvent) {
    const drag = this.st.drag;
    if (!drag) return;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) > 4) {
      drag.moved = true;
      this.st.moved = true;
      // Capture only once a real drag starts so plain clicks still reach items.
      this.rootRef()?.nativeElement.setPointerCapture(drag.id);
    }
    if (drag.moved) this.applyTarget(drag.start - dy / this.rowH, false);
  }

  onPointerEnd() {
    if (!this.st.drag) return;
    if (this.st.drag.moved) this.applyTarget(this.st.target, true);
    this.st.drag = null;
    this.dragging.set(false);
  }

  onItemClick(index: number) {
    if (this.st.moved) return;
    const n = this.count();
    if (!n) return;
    const cur = this.st.target;
    let d = index - (((cur % n) + n) % n);
    if (this.loop() && n > 1) {
      if (d > n / 2) d -= n;
      else if (d < -n / 2) d += n;
    }
    this.applyTarget(cur + d, true);
  }

  /** Mueve la rueda a una posicion concreta. Lo usan los botones prev/next del
   *  contenedor, que en movil son mas comodos que arrastrar sobre el canvas. */
  select(index: number) {
    this.applyTarget(index, true);
  }

  onKeyDown(event: KeyboardEvent) {
    let delta: number | null = null;
    if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') delta = -1;
    else if (event.key === 'ArrowDown' || event.key === 'ArrowRight') delta = 1;
    if (delta === null) return;
    event.preventDefault();
    this.applyTarget(Math.round(this.st.target) + delta, true);
  }
}
