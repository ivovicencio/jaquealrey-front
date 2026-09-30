import { Component, ElementRef, afterNextRender, computed, input, signal, viewChild } from '@angular/core';

function parseHSL(hslStr: string) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor: string, intensity: number): Record<string, string> {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars: Record<string, string> = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = [
  '--gradient-one',
  '--gradient-two',
  '--gradient-three',
  '--gradient-four',
  '--gradient-five',
  '--gradient-six',
  '--gradient-seven',
];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors: string[]): Record<string, string> {
  const vars: Record<string, string> = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function isLightColor(color: string): boolean {
  const value = color.trim().replace('#', '');
  if (!/^[\da-f]{3}([\da-f]{3})?$/i.test(value)) return false;
  const hex = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const red = parseInt(hex.slice(0, 2), 16);
  const green = parseInt(hex.slice(2, 4), 16);
  const blue = parseInt(hex.slice(4, 6), 16);
  return red * 0.2126 + green * 0.7152 + blue * 0.0722 > 180;
}

function easeOutCubic(x: number) {
  return 1 - Math.pow(1 - x, 3);
}
function easeInCubic(x: number) {
  return x * x * x;
}

/**
 * BorderGlow de React Bits, portado a Angular.
 *
 * Una tarjeta cuyo borde y luz se iluminan al acercar el cursor: el brillo
 * sigue la posicion del puntero con un cono direccional y un halo exterior.
 * Los colores se definen con el array `colors`; el borde usa un gradiente mesh.
 */
@Component({
  selector: 'app-border-glow',
  standalone: true,
  template: `
    <div
      class="border-glow-card"
      [class.border-glow-card--light]="lightSurface()"
      [class.sweep-active]="sweeping()"
      [class]="className()"
      #cardRef
      (pointermove)="handlePointerMove($event)"
      [style]="cardStyles()"
    >
      <span class="edge-light"></span>
      <div class="border-glow-inner">
        <ng-content></ng-content>
      </div>
    </div>
  `,
  styleUrls: ['./border-glow.component.css'],
})
export class BorderGlowComponent {
  className = input('');
  edgeSensitivity = input(30);
  glowColor = input('40 80 80');
  backgroundColor = input('#120F17');
  borderRadius = input(28);
  glowRadius = input(40);
  glowIntensity = input(1.0);
  coneSpread = input(25);
  animated = input(false);
  colors = input(['#c084fc', '#f472b6', '#38bdf8']);
  fillOpacity = input(0.5);

  private readonly cardRef = viewChild.required<ElementRef<HTMLDivElement>>('cardRef');

  readonly lightSurface = computed(() => isLightColor(this.backgroundColor()));
  readonly sweeping = signal(false);

  readonly cardStyles = computed<Record<string, string | number>>(() => ({
    '--card-bg': this.backgroundColor(),
    '--edge-sensitivity': this.edgeSensitivity(),
    '--border-radius': `${this.borderRadius()}px`,
    '--glow-padding': `${this.glowRadius()}px`,
    '--cone-spread': this.coneSpread(),
    '--fill-opacity': this.fillOpacity(),
    ...buildGlowVars(this.glowColor(), this.glowIntensity()),
    ...buildGradientVars(this.colors()),
  }));

  constructor() {
    afterNextRender(() => this.runIntroSweep());
  }

  handlePointerMove(e: PointerEvent) {
    const card = this.cardRef().nativeElement;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = this.getEdgeProximity(card, x, y);
    const angle = this.getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }

  private getCenterOfElement(el: HTMLElement): [number, number] {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }

  private getEdgeProximity(el: HTMLElement, x: number, y: number): number {
    const [cx, cy] = this.getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    if (dx !== 0) kx = cx / Math.abs(dx);
    if (dy !== 0) ky = cy / Math.abs(dy);
    return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  }

  private getCursorAngle(el: HTMLElement, x: number, y: number): number {
    const [cx, cy] = this.getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }

  private runIntroSweep() {
    const card = this.cardRef().nativeElement;
    if (!this.animated() || !card) return;

    const angleStart = 110;
    const angleEnd = 465;
    let disposed = false;

    const animateValue = (opts: {
      start?: number;
      end: number;
      duration: number;
      delay?: number;
      ease?: (x: number) => number;
      onUpdate: (v: number) => void;
      onEnd?: () => void;
    }) => {
      const t0 = performance.now() + (opts.delay ?? 0);
      const ease = opts.ease || easeOutCubic;
      const tick = () => {
        if (disposed) return;
        const elapsed = performance.now() - t0;
        const t = Math.min(elapsed / opts.duration, 1);
        opts.onUpdate((opts.start ?? 0) + (opts.end - (opts.start ?? 0)) * ease(t));
        if (t < 1) requestAnimationFrame(tick);
        else opts.onEnd?.();
      };
      const id = setTimeout(() => requestAnimationFrame(tick), opts.delay ?? 0);
      this.sweepTimers.push(id);
    };

    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);
    this.sweeping.set(true);

    animateValue({
      end: 100,
      duration: 500,
      onUpdate: (v) => card.style.setProperty('--edge-proximity', String(v)),
    });
    animateValue({
      ease: easeInCubic,
      duration: 1500,
      end: 50,
      onUpdate: (v) => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      },
    });
    animateValue({
      ease: easeOutCubic,
      delay: 1500,
      duration: 2250,
      start: 50,
      end: 100,
      onUpdate: (v) => {
        card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
      },
    });
    animateValue({
      ease: easeInCubic,
      delay: 2500,
      duration: 1500,
      start: 100,
      end: 0,
      onUpdate: (v) => card.style.setProperty('--edge-proximity', String(v)),
      onEnd: () => {
        card.classList.remove('sweep-active');
        this.sweeping.set(false);
      },
    });
  }

  private readonly sweepTimers: ReturnType<typeof setTimeout>[] = [];
}