import {
  Component,
  Directive,
  ElementRef,
  computed,
  effect,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';

export interface CircularCarouselItem {
  src: string;
  alt?: string;
  title?: string;
  subtitle?: string;
}

const PRESETS = {
  cylinder: {
    axis: 'y' as const,
    tilt: -5,
    perspective: 2500,
    curve: 1,
    spread: 1,
    inward: false,
    billboard: false,
    backfaces: true,
    window: 0,
  },
  orbit: {
    axis: 'y' as const,
    tilt: -16,
    perspective: 1500,
    curve: 0,
    spread: 1.45,
    inward: false,
    billboard: true,
    backfaces: false,
    window: 0,
  },
  wheel: {
    axis: 'x' as const,
    tilt: 0,
    perspective: 1800,
    curve: 0,
    spread: 1,
    inward: false,
    billboard: false,
    backfaces: true,
    window: 1.7,
  },
  panorama: {
    axis: 'y' as const,
    tilt: 0,
    perspective: 0,
    curve: 1,
    spread: 1,
    inward: true,
    billboard: false,
    backfaces: false,
    window: 0,
  },
};

const INTRO_LENGTH = { assemble: 1500, rise: 1400, spin: 1800, none: 0 } as const;
const TILES = 8;
const OVERLAP = 2.5;
const DRAG_THRESHOLD = 5;
const SPRING = 118;
const SETTLE_SPEED = 9;
const CAPTION_SPACE = 76;
const TO_RAD = Math.PI / 180;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const wrap = (degrees: number) => ((((degrees + 180) % 360) + 360) % 360) - 180;
const easeOut = (t: number) => 1 - Math.pow(1 - t, 4);
const easeOutQuint = (t: number) => 1 - Math.pow(1 - t, 5);

const rotateX = (p: number[], degrees: number) => {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0], p[1] * c - p[2] * s, p[1] * s + p[2] * c] as const;
};

const rotateY = (p: number[], degrees: number) => {
  const r = degrees * TO_RAD;
  const c = Math.cos(r);
  const s = Math.sin(r);
  return [p[0] * c + p[2] * s, p[1], -p[0] * s + p[2] * c] as const;
};

@Directive({ selector: 'div[appCcCard]', standalone: true })
export class CcCardDirective {
  constructor(public el: ElementRef<HTMLDivElement>) {}
}

@Component({
  selector: 'app-circular-carousel',
  standalone: true,
  imports: [CcCardDirective],
  templateUrl: './circular-carousel.component.html',
  styleUrl: './circular-carousel.component.css',
})
export class CircularCarouselComponent {
  // inputs
  items = input<CircularCarouselItem[]>([]);
  preset = input<'cylinder' | 'orbit' | 'wheel' | 'panorama'>('cylinder');
  intro = input<'assemble' | 'rise' | 'spin' | 'none'>('rise');
  cardWidth = input(220);
  aspectRatio = input(1);
  gap = input(25);
  curve = input<number | undefined>(undefined);
  tilt = input<number | undefined>(undefined);
  perspective = input<number | undefined>(undefined);
  autoplay = input<'drift' | 'step' | 'off'>('drift');
  speed = input(14);
  interval = input(3);
  direction = input<'left' | 'right'>('left');
  draggable = input(true);
  momentum = input(0.6);
  snap = input(true);
  pauseOnHover = input(true);
  focusOnClick = input(true);
  parallax = input(0.3);
  stretch = input(0.5);
  depthFade = input(0.55);
  fadeColor = input('#000000');
  innerShade = input(0.6);
  cornerRadius = input(12);
  captions = input(false);
  className = input('');
  style = input<Record<string, string | number>>({});

  // outputs
  readonly onChange = output<number>();
  readonly onItemClick = output<{ item: CircularCarouselItem; index: number }>();

  // refs
  readonly rootRef = viewChild<ElementRef<HTMLDivElement>>('rootRef');
  readonly stageRef = viewChild<ElementRef<HTMLDivElement>>('stageRef');
  private readonly cameraRef = viewChild<ElementRef<HTMLDivElement>>('cameraRef');
  private readonly ringRef = viewChild<ElementRef<HTMLDivElement>>('ringRef');
  private readonly cards = viewChildren(CcCardDirective);

  // state
  readonly active = signal(0);
  readonly ready = signal(false);
  readonly dragging = signal(false);
  private readonly reduced = signal(false);

  private state: {
    angle: number;
    velocity: number;
    target: number | null;
    dir: number;
    press: { id: number; x: number; y: number; angle: number; moved: boolean; origin: number; samples: { time: number; angle: number }[] } | null;
    drag: boolean;
    hover: boolean;
    pointer: { inside: boolean; x: number; y: number };
    yaw: number;
    pitch: number;
    intro: { type: string; start: number } | null;
    introDone: boolean;
    holdUntil: number;
    stepAt: number;
    suppressClick: boolean;
    wheelTimer: ReturnType<typeof setTimeout> | 0;
    fit: number;
    shift: number;
    drop: number;
    last: number;
  } = {
    angle: 0,
    velocity: 0,
    target: null,
    dir: 0,
    press: null,
    drag: false,
    hover: false,
    pointer: { inside: false, x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    intro: null,
    introDone: false,
    holdUntil: 0,
    stepAt: 0,
    suppressClick: false,
    wheelTimer: 0,
    fit: 1,
    shift: 0,
    drop: 0,
    last: 0,
  };

  private raf = 0;
  private visible = true;
  private viewReady = false;
  private timers: ReturnType<typeof setTimeout>[] = [];
  private cleanupFns: (() => void)[] = [];

  // derived
  private readonly list = computed(() => {
    const items = this.items();
    return items && items.length ? items : [];
  });
  readonly count = computed(() => this.list().length);
  readonly shape = computed<'cylinder' | 'orbit' | 'wheel' | 'panorama'>(() => {
    const p = this.preset();
    return p && p in PRESETS ? p : 'cylinder';
  });
  readonly layout = computed(() => PRESETS[this.shape()]);
  readonly axis = computed(() => this.layout().axis);
  private readonly tiltValue = computed(() => this.tilt() ?? this.layout().tilt);
  private readonly curveValue = computed(() => {
    const layout = this.layout();
    if (layout.billboard) return 0;
    return clamp(this.curve() ?? layout.curve, 0, 1);
  });
  private readonly cardW = computed(() => Math.max(40, this.cardWidth()));
  private readonly cardH = computed(() => this.cardW() / clamp(this.aspectRatio(), 0.2, 5));
  readonly along = computed(() => (this.axis() === 'x' ? this.cardH() : this.cardW()));
  readonly step = computed(() => 360 / Math.max(this.count(), 1));

  readonly radius = computed(() => {
    const n = Math.max(this.count(), 3);
    const along = this.along();
    const gap = this.gap();
    const pitch = (along + gap) * this.layout().spread;
    const chord = pitch / (2 * Math.sin(Math.PI / n));
    const arc = (n * pitch) / (2 * Math.PI);
    const curve = this.curveValue();
    return Math.max(chord + (arc - chord) * curve, along * 0.6);
  });

  readonly tiles = computed(() => {
    const along = this.along();
    const axis = this.axis();
    const curve = this.curveValue();
    const total = curve > 0.001 ? TILES : 1;
    const length = along / total;
    const bend = curve > 0.001 ? this.radius() / curve : 0;
    const inward = this.layout().inward;
    return Array.from({ length: total }, (_, index) => {
      const start = index * length - (index > 0 ? OVERLAP / 2 : 0);
      const end = (index + 1) * length + (index < total - 1 ? OVERLAP / 2 : 0);
      const center = (start + end) / 2 - along / 2;
      const alpha = bend ? center / bend : 0;
      const shift = bend ? bend * Math.sin(alpha) : center;
      const sink = bend ? bend * (1 - Math.cos(alpha)) : 0;
      const depth = inward ? sink : -sink;
      const turn = ((inward ? -alpha : alpha) * 180) / Math.PI;
      const move =
        axis === 'x'
          ? `translate3d(0px, ${shift}px, ${depth}px) rotateX(${-turn}deg)`
          : `translate3d(${shift}px, 0px, ${depth}px) rotateY(${turn}deg)`;
      return { index, total, start, end, size: end - start, move };
    });
  });

  readonly current = computed(() => {
    const list = this.list();
    return list[this.active()] || list[0];
  });

  readonly label = computed(() => {
    const current = this.current();
    if (!current) return '';
    return current.title || current.alt || `Imagen ${this.active() + 1}`;
  });

  readonly ccRadius = computed(() => `${Math.max(0, this.cornerRadius())}px`);
  readonly ccInner = computed(() => (1 - clamp(this.innerShade(), 0, 1)).toFixed(3));

  constructor() {
    effect(() => {
      // re-measure cuando cambian las dimensiones calculadas
      void this.radius();
      void this.tiles();
      void this.count();
      this.scheduleMeasure();
    });
    effect(() => {
      void this.items();
      void this.reduced();
      this.loadImages();
    });
  }

  private scheduleMeasure() {
    if (!this.viewReady) return;
    this.measure();
    this.wake();
  }

  // ----------------------------------------------------------------- lifecycle

  ngOnInit() {
    const query = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (query) {
      const update = () => this.reduced.set(query.matches);
      update();
      query.addEventListener('change', update);
    }
  }

  ngAfterViewInit() {
    this.viewReady = true;
    this.loadImages();

    const root = this.rootRef();
    const stage = this.stageRef();
    const camera = this.cameraRef();
    const ring = this.ringRef();
    if (!root || !stage || !camera || !ring) return;

    const onWheel = (event: WheelEvent) => {
      const s = this.settings();
      if (!s.draggable) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : 0;
      if (!delta) return;
      event.preventDefault();
      const perPixel = 180 / (Math.PI * s.radius * this.state.fit);
      this.state.target = null;
      this.state.angle -= delta * perPixel * (s.layout.inward ? -1 : 1);
      this.state.velocity = -delta * perPixel * (s.layout.inward ? -1 : 1) * 30;
      this.state.holdUntil = performance.now() + 1600;
      clearTimeout(this.state.wheelTimer);
      this.state.wheelTimer = setTimeout(() => {
        const st = this.settings();
        if (st.snap) this.state.target = this.nearest(this.state.angle + this.state.velocity * 0.12);
        this.wake();
      }, 140);
      this.wake();
    };
    root.nativeElement.addEventListener('wheel', onWheel, { passive: false });

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.state.last = 0;
      } else this.wake();
    };
    document.addEventListener('visibilitychange', onVisibility);

    const resize = new ResizeObserver(() => {
      this.measure();
      this.wake();
    });
    resize.observe(root.nativeElement);

    const io = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting;
      if (this.visible) this.wake();
      else {
        cancelAnimationFrame(this.raf);
        this.raf = 0;
        this.state.last = 0;
      }
    });
    io.observe(root.nativeElement);

    this.cleanupFns.push(() => {
      cancelAnimationFrame(this.raf);
      resize.disconnect();
      io.disconnect();
      clearTimeout(this.state.wheelTimer);
      root.nativeElement.removeEventListener('wheel', onWheel);
      document.removeEventListener('visibilitychange', onVisibility);
      this.timers.forEach((t) => clearTimeout(t));
    });

    this.state.dir = this.directionSign();
    this.measure();
    this.render(this.settings(), performance.now());
    this.wake();
  }

  ngOnDestroy() {
    this.cleanupFns.forEach((fn) => fn());
    this.cleanupFns = [];
  }

  // ----------------------------------------------------------------- settings

  private dragSign() {
    return this.layout().inward ? -1 : 1;
  }
  private directionSign() {
    return (this.direction() === 'right' ? 1 : -1) * this.dragSign();
  }

  private settings() {
    const layout = this.layout();
    const reduced = this.reduced();
    const radius = this.radius();
    return {
      count: this.count(),
      step: this.step(),
      radius,
      layout,
      axis: this.axis(),
      tilt: this.tiltValue(),
      perspective: layout.inward ? radius : (this.perspective() ?? layout.perspective),
      cardW: this.cardW(),
      cardH: this.cardH(),
      intro: reduced ? 'none' : this.intro() in INTRO_LENGTH ? (this.intro() as keyof typeof INTRO_LENGTH) : 'rise',
      autoplay: reduced ? ('off' as const) : this.autoplay(),
      speed: this.speed(),
      interval: Math.max(0.5, this.interval()),
      draggable: this.draggable(),
      momentum: clamp(this.momentum(), 0, 1),
      snap: this.snap(),
      pauseOnHover: this.pauseOnHover(),
      parallax: reduced ? 0 : clamp(this.parallax(), 0, 1),
      stretch: reduced ? 0 : clamp(this.stretch(), 0, 1),
      depthFade: clamp(this.depthFade(), 0, 1),
      captions: this.captions(),
      reduced,
    };
  }

  // ----------------------------------------------------------------- measure / loop

  private nearest(angle: number) {
    const s = this.settings();
    return Math.round(angle / s.step) * s.step;
  }

  private measure() {
    const root = this.rootRef();
    if (!root || !root.nativeElement.offsetWidth) return;
    const stage = this.stageRef();
    if (!stage) return;
    const s = this.settings();
    const rect = root.nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const room = s.captions ? CAPTION_SPACE : 0;
    const width = rect.width * 0.94;
    const height = (rect.height - room) * 0.92;
    const P = s.perspective;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    if (s.layout.inward) {
      minX = -width / 2;
      maxX = width / 2;
      minY = -s.cardH / 2;
      maxY = s.cardH / 2;
    } else {
      const corners = [
        [-s.cardW / 2, -s.cardH / 2],
        [s.cardW / 2, -s.cardH / 2],
        [-s.cardW / 2, s.cardH / 2],
        [s.cardW / 2, s.cardH / 2],
      ];
      const limit = s.layout.window ? s.layout.window * s.step : 180;
      for (let a = -limit; a <= limit; a += Math.max(limit / 24, 1e-3)) {
        for (const [cx, cy] of corners) {
          let p: readonly number[];
          if (s.axis === 'x') {
            p = rotateX([cx, cy, s.radius], -a);
            p = [p[0], p[1], p[2] - s.radius];
            p = rotateY([...p], s.tilt);
          } else if (s.layout.billboard) {
            const c = rotateY([0, 0, s.radius], a);
            p = [c[0] + cx, cy, c[2] - s.radius];
            p = rotateX([...p], s.tilt);
          } else {
            p = rotateY([cx, cy, s.radius], a);
            p = [p[0], p[1], p[2] - s.radius];
            p = rotateX([...p], s.tilt);
          }
          if (p[2] >= P * 0.95) continue;
          const k = P / (P - p[2]);
          minX = Math.min(minX, p[0] * k);
          maxX = Math.max(maxX, p[0] * k);
          minY = Math.min(minY, p[1] * k);
          maxY = Math.max(maxY, p[1] * k);
        }
      }
    }
    const spanX = Math.max(maxX - minX, 1);
    const spanY = Math.max(maxY - minY, 1);
    const fit = Math.min(1, width / spanX, height / spanY);
    this.state.fit = fit;
    this.state.shift = -((minY + maxY) / 2) * fit - room / 2;
    this.state.drop =
      s.axis === 'x' ? (rect.width / Math.max(fit, 1e-3)) * 0.55 + s.cardW : (rect.height / Math.max(fit, 1e-3)) * 0.55 + s.cardH;
    stage.nativeElement.style.perspective = `${P}px`;
    stage.nativeElement.style.transform = `translate3d(0, ${this.state.shift}px, 0) scale(${fit})`;
  }

  private introCard(elapsed: number, landing: number) {
    const state = this.state;
    if (!state.intro) return { radius: 1, lift: 0 };
    const type = state.intro.type;
    const reach = Math.abs(wrap(landing + state.angle));
    if (type === 'assemble') {
      const delay = (reach / 180) * 420;
      const p = easeOut(clamp((elapsed - delay) / 1080, 0, 1));
      return { radius: 1 + 0.6 * (1 - p), lift: 0 };
    }
    if (type === 'rise') {
      const delay = (reach / 180) * 480;
      const p = easeOutQuint(clamp((elapsed - delay) / 900, 0, 1));
      return { radius: 1, lift: (1 - p) * state.drop };
    }
    if (type === 'spin') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      return { radius: 1 + 0.28 * (1 - p), lift: 0 };
    }
    return { radius: 1, lift: 0 };
  }

  private advance(s: ReturnType<CircularCarouselComponent['settings']>, dt: number, now: number) {
    const state = this.state;
    if (!state.introDone && this.ready()) {
      if (!state.intro) {
        if (s.intro === 'none') state.introDone = true;
        else state.intro = { type: s.intro as string, start: now };
      }
      if (state.intro && now - state.intro.start >= INTRO_LENGTH[state.intro.type as keyof typeof INTRO_LENGTH]) {
        state.intro = null;
        state.introDone = true;
      }
    }

    const paused = (s.pauseOnHover && state.hover) || state.drag || now < state.holdUntil;
    const cruise = s.autoplay === 'drift' && !paused && !state.intro ? s.speed * state.dir : 0;
    let busy = Boolean(state.intro) || state.drag;

    if (state.drag || state.intro) {
      state.velocity = state.drag ? state.velocity : 0;
    } else if (state.target !== null) {
      let remaining = dt;
      const damping = 2 * Math.sqrt(SPRING);
      while (remaining > 0) {
        const h = Math.min(remaining, 1 / 240);
        const accel = SPRING * (state.target - state.angle) - damping * state.velocity;
        state.velocity += accel * h;
        state.angle += state.velocity * h;
        remaining -= h;
      }
      if (Math.abs(state.target - state.angle) < 0.004 && Math.abs(state.velocity) < 0.03) {
        state.angle = state.target;
        state.velocity = 0;
        state.target = null;
      }
      busy = true;
    } else {
      const tau = 0.18 + s.momentum * 1.5;
      const c = cruise;
      state.velocity += (c - state.velocity) * (1 - Math.exp(-dt / tau));
      state.angle += state.velocity * dt;
      if (c === 0 && s.snap && Math.abs(state.velocity) < SETTLE_SPEED) {
        state.target = this.nearest(state.angle);
      }
      busy = busy || c !== 0 || Math.abs(state.velocity) > 0.01 || state.target !== null;
    }

    if (s.autoplay === 'step' && !paused && !state.intro && state.introDone) {
      if (!state.stepAt) state.stepAt = now + s.interval * 1000;
      if (now >= state.stepAt) {
        state.target = (state.target ?? this.nearest(state.angle)) + s.step * state.dir;
        state.stepAt = now + s.interval * 1000;
      }
      busy = true;
    } else {
      state.stepAt = 0;
    }

    if (now < state.holdUntil) busy = true;

    const ease = 1 - Math.exp(-dt / 0.35);
    const aimYaw = state.pointer.inside ? state.pointer.x * s.parallax * 9 : 0;
    const aimPitch = state.pointer.inside ? -state.pointer.y * s.parallax * 6 : 0;
    state.yaw += (aimYaw - state.yaw) * ease;
    state.pitch += (aimPitch - state.pitch) * ease;
    if (Math.abs(aimYaw - state.yaw) > 0.01 || Math.abs(aimPitch - state.pitch) > 0.01) busy = true;

    return busy;
  }

  private render(s: ReturnType<CircularCarouselComponent['settings']>, now: number) {
    const state = this.state;
    const camera = this.cameraRef();
    const ring = this.ringRef();
    if (!camera || !ring) return;
    const elapsed = state.intro ? now - state.intro.start : 0;
    const swell = 1 + s.stretch * 0.12 * Math.min(1, Math.abs(state.velocity) / 420);
    let spinOffset = 0;
    if (state.intro?.type === 'spin') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.spin, 0, 1));
      spinOffset = -300 * state.dir * (1 - p);
    } else if (state.intro?.type === 'assemble') {
      const p = easeOut(clamp(elapsed / INTRO_LENGTH.assemble, 0, 1));
      spinOffset = -32 * state.dir * (1 - p);
    }
    const angle = state.angle + spinOffset;
    const R = s.radius * swell;

    if (s.axis === 'x') {
      camera.nativeElement.style.transform = `translate3d(0, 0, ${-R}px) rotateY(${s.tilt + state.yaw}deg) rotateX(${state.pitch}deg)`;
      ring.nativeElement.style.transform = `rotateX(${-angle}deg)`;
    } else if (s.layout.inward) {
      camera.nativeElement.style.transform = `translate3d(0, 0, ${s.perspective - 1}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.nativeElement.style.transform = `rotateY(${angle}deg)`;
    } else {
      camera.nativeElement.style.transform = `translate3d(0, 0, ${-R}px) rotateX(${s.tilt + state.pitch}deg) rotateY(${state.yaw}deg)`;
      ring.nativeElement.style.transform = `rotateY(${angle}deg)`;
    }

    const cardEls = this.cards().map((card) => card.el.nativeElement);

    for (let index = 0; index < s.count; index++) {
      const card = cardEls[index];
      if (!card) continue;
      const base = index * s.step;
      const mod = this.introCard(elapsed, base);
      const r = R * mod.radius;
      let transform: string;
      if (s.axis === 'x') {
        transform = `rotateX(${-base}deg) translateZ(${r}px)`;
      } else if (s.layout.inward) {
        transform = `rotateY(${base}deg) translateZ(${-r}px)`;
      } else {
        transform = `rotateY(${base}deg) translateZ(${r}px)`;
        if (s.layout.billboard) transform += ` rotateY(${-(base + angle)}deg)`;
      }
      if (mod.lift) transform += s.axis === 'x' ? ` translateX(${mod.lift}px)` : ` translateY(${mod.lift}px)`;
      card.style.transform = transform;

      const world = wrap(base + angle);
      const facing = Math.cos(world * TO_RAD);
      if (s.layout.inward) card.style.visibility = Math.abs(world) > 86 ? 'hidden' : '';
      const fade = s.depthFade * Math.pow((1 - facing) / 2, 1.25);
      card.style.setProperty('--cc-depth', fade.toFixed(3));
    }

    const count = Math.max(s.count, 1);
    const index = (((Math.round(-state.angle / s.step) % count) + count) % count) || 0;
    if (index !== this.active()) {
      this.active.set(index);
      this.onChange.emit(index);
    }
  }

  private frame = (now: number) => {
    this.raf = 0;
    const s = this.settings();
    const dt = this.state.last ? Math.min((now - this.state.last) / 1000, 0.05) : 1 / 60;
    this.state.last = now;
    const busy = this.advance(s, dt, now);
    this.render(s, now);
    if (busy && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.frame);
    else this.state.last = 0;
  };

  private wake() {
    if (!this.viewReady) return;
    if (!this.raf && this.visible && !document.hidden) this.raf = requestAnimationFrame(this.frame);
  }

  // ----------------------------------------------------------------- image loading

  private lastKey = '';

  private loadImages() {
    const srcs = this.list().map((item) => item.src);
    const key = srcs.join('|');
    if (this.viewReady && this.ready() && this.lastKey === key) return;
    if (this.lastKey === key && this.lastKey !== '') return;
    this.lastKey = key;
    this.ready.set(false);
    let cancelled = false;
    const load = (src: string) =>
      new Promise<void>((resolve) => {
        const image = new Image();
        image.decoding = 'async';
        image.onload = () => {
          if (image.decode) image.decode().then(() => resolve(), () => resolve());
          else resolve();
        };
        image.onerror = () => resolve();
        image.src = src;
      });
    const timeout = new Promise<void>((resolve) => setTimeout(resolve, 2400));
    Promise.race([Promise.all(srcs.slice(0, 12).map(load)), timeout]).then(() => {
      if (cancelled) return;
      this.state.introDone = false;
      this.state.intro = null;
      this.ready.set(true);
      this.wake();
    });
    const timer = setTimeout(() => (cancelled = true), 30000);
    this.timers.push(timer);
  }

  // ----------------------------------------------------------------- helpers used by template

  cardLabel(item: CircularCarouselItem, index: number) {
    return `${item.title || item.alt || `Imagen ${index + 1}`}, ${index + 1} de ${this.count()}`;
  }

  digitList(value: number): string[] {
    return String(value)
      .padStart(2, '0')
      .split('');
  }

  reelTransform(digit: string) {
    return `translateY(${-Number(digit) * 10}%)`;
  }

  tileBox(tile: { index: number; total: number; start: number; end: number; size: number; move: string }, back: boolean) {
    const axis = this.axis();
    const cardW = this.cardW();
    const cardH = this.cardH();
    const size = tile.size;
    if (axis === 'x') {
      return { display: 'block', left: `${-cardW / 2}px`, top: `${-size / 2}px`, width: `${cardW}px`, height: `${size}px` } as Record<string, string>;
    }
    return { display: 'block', left: `${-size / 2}px`, top: `${-cardH / 2}px`, width: `${size}px`, height: `${cardH}px` } as Record<string, string>;
  }

  tileMove(tile: { move: string }, back: boolean) {
    const axis = this.axis();
    return tile.move + (back ? (axis === 'x' ? ' rotateX(180deg)' : ' rotateY(180deg)') : '');
  }

  tileFrameStyle(tile: { index: number; total: number; size: number }, back: boolean) {
    const axis = this.axis();
    const strip = back ? tile.total - 1 - tile.index : tile.index;
    const first = strip === 0;
    const last = strip === tile.total - 1;
    const r = this.ccRadius();
    const borderRadius =
      axis === 'x'
        ? `${first ? r : 0} ${first ? r : 0} ${last ? r : 0} ${last ? r : 0}`
        : `${first ? r : 0} ${last ? r : 0} ${last ? r : 0} ${first ? r : 0}`;
    return { height: `${axis === 'x' ? tile.size : this.cardH()}px`, borderRadius, overflow: 'hidden' } as Record<string, string>;
  }

  tilePhotoStyle(tile: { start: number; end: number; size: number }, back: boolean) {
    const axis = this.axis();
    const cardW = this.cardW();
    const cardH = this.cardH();
    const along = this.along();
    const offset = back ? along - tile.end : tile.start;
    if (axis === 'x') {
      return { left: '0px', top: `${-offset}px`, width: `${cardW}px`, height: `${cardH}px` } as Record<string, string>;
    }
    return { left: `${-offset}px`, top: '0px', width: `${cardW}px`, height: `${cardH}px` } as Record<string, string>;
  }

  // ----------------------------------------------------------------- pointer / keyboard

  private focusIndex(index: number) {
    const s = this.settings();
    let target = -index * s.step;
    target += 360 * Math.round((this.state.angle - target) / 360);
    this.state.target = target;
    this.state.holdUntil = performance.now() + 2800;
    this.wake();
  }

  private stepBy(delta: number) {
    const s = this.settings();
    const base = this.state.target ?? Math.round(this.state.angle / s.step) * s.step;
    this.state.target = base - delta * s.step * (s.layout.inward ? -1 : 1);
    this.state.holdUntil = performance.now() + 2800;
    this.wake();
  }

  private updatePointer(event: PointerEvent) {
    const root = this.rootRef();
    if (!root) return;
    const rect = root.nativeElement.getBoundingClientRect();
    const pointer = this.state.pointer;
    pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointer.y = clamp(((event.clientY - rect.top) / rect.height) * 2 - 1, -1, 1);
  }

  onPointerDown(event: PointerEvent) {
    const state = this.state;
    state.suppressClick = false;
    if (!this.draggable() || event.button !== 0) return;
    state.press = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      angle: state.angle,
      moved: false,
      origin: 0,
      samples: [{ time: performance.now(), angle: state.angle }],
    };
  }

  onPointerMove(event: PointerEvent) {
    const state = this.state;
    if (event.pointerType === 'mouse') {
      state.pointer.inside = true;
      this.updatePointer(event);
    }
    const press = state.press;
    if (!press || press.id !== event.pointerId) {
      this.wake();
      return;
    }
    const s = this.settings();
    const delta = s.axis === 'x' ? event.clientY - press.y : event.clientX - press.x;
    const cross = s.axis === 'x' ? event.clientX - press.x : event.clientY - press.y;
    if (!press.moved) {
      if (Math.abs(delta) < DRAG_THRESHOLD) return;
      if (Math.abs(cross) > Math.abs(delta) * 1.2 && event.pointerType !== 'mouse') {
        state.press = null;
        return;
      }
      press.moved = true;
      press.origin = delta;
      state.drag = true;
      state.target = null;
      state.velocity = 0;
      this.dragging.set(true);
      try {
        this.rootRef()?.nativeElement.setPointerCapture(event.pointerId);
      } catch {
        // noop
      }
    }
    const perPixel = 180 / (Math.PI * s.radius * state.fit);
    state.angle = press.angle + (delta - press.origin) * perPixel * (s.layout.inward ? -1 : 1);
    const now = performance.now();
    press.samples.push({ time: now, angle: state.angle });
    while (press.samples.length > 2 && now - press.samples[0].time > 110) press.samples.shift();
    this.wake();
  }

  onPointerUp(event: PointerEvent) {
    const state = this.state;
    const press = state.press;
    if (!press || press.id !== event.pointerId) return;
    state.press = null;
    if (!press.moved) return;
    state.drag = false;
    this.dragging.set(false);
    state.suppressClick = true;
    const s = this.settings();
    const first = press.samples[0];
    const last = press.samples[press.samples.length - 1];
    const span = (last.time - first.time) / 1000;
    const velocity = span > 0.008 ? clamp((last.angle - first.angle) / span, -1400, 1400) : 0;
    state.velocity = velocity;
    if (Math.abs(velocity) > 60) state.dir = Math.sign(velocity);
    const coasting = s.autoplay === 'drift' && !(s.pauseOnHover && state.hover && event.pointerType === 'mouse');
    if (s.snap && !coasting) {
      const tau = 0.18 + s.momentum * 1.5;
      state.target = Math.round((state.angle + velocity * tau * 0.55) / s.step) * s.step;
    }
    this.wake();
  }

  onPointerEnter(event: PointerEvent) {
    if (event.pointerType !== 'mouse') return;
    this.state.hover = true;
    this.wake();
  }

  onPointerLeave(event: PointerEvent) {
    const state = this.state;
    if (event.pointerType === 'mouse') {
      state.hover = false;
      state.pointer.inside = false;
    }
    this.wake();
  }

  onClick(event: MouseEvent) {
    const state = this.state;
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const target = event.target as HTMLElement | null;
    const card = target?.closest?.('[data-cc-index]') as HTMLElement | null;
    if (!card) return;
    const index = Number(card.getAttribute('data-cc-index'));
    if (this.focusOnClick()) this.focusIndex(index);
    const list = this.list();
    this.onItemClick.emit({ item: list[index], index });
  }

  onKeyDown(event: KeyboardEvent) {
    const axis = this.axis();
    const forward = axis === 'x' ? 'ArrowDown' : 'ArrowRight';
    const backward = axis === 'x' ? 'ArrowUp' : 'ArrowLeft';
    if (event.key === forward) this.stepBy(1);
    else if (event.key === backward) this.stepBy(-1);
    else if (event.key === 'Home') this.focusIndex(0);
    else if (event.key === 'End') this.focusIndex(this.count() - 1);
    else if (event.key === 'Enter' || event.key === ' ') {
      const list = this.list();
      const current = list[this.active()];
      this.onItemClick.emit({ item: current, index: this.active() });
    } else return;
    event.preventDefault();
  }
}