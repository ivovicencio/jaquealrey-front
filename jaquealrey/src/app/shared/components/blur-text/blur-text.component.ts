import { NgTemplateOutlet } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, computed, input, signal, viewChild } from '@angular/core';

type BlurTag = 'h1' | 'h2' | 'h3' | 'p' | 'span';

@Component({
  selector: 'app-blur-text',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './blur-text.component.html',
  styleUrl: './blur-text.component.css',
})
export class BlurTextComponent implements AfterViewInit, OnDestroy {
  readonly text = input('');
  readonly tag = input<BlurTag>('span');
  readonly className = input('');
  readonly delay = input(0.08);
  readonly duration = input(0.8);
  readonly from = input(10);
  readonly direction = input<'top' | 'bottom'>('bottom');
  readonly threshold = input(0.2);

  readonly shown = signal(false);
  private reduced = false;
  private io?: IntersectionObserver;

  readonly rootRef = viewChild<ElementRef<HTMLElement>>('rootRef');
  readonly words = computed(() =>
    (this.text() || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );

  ngAfterViewInit() {
    this.reduced =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (this.reduced) {
      this.shown.set(true);
      return;
    }
    const el = this.rootRef()?.nativeElement;
    if (!el || typeof IntersectionObserver === 'undefined') {
      this.shown.set(true);
      return;
    }
    this.io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.shown.set(true);
          this.io?.disconnect();
        }
      },
      { threshold: this.threshold() }
    );
    this.io.observe(el);
  }

  ngOnDestroy() {
    this.io?.disconnect();
  }

  unitStyle(index: number) {
    const inView = this.shown();
    const delay = this.delay() * index;
    const dur = this.reduced ? 0 : this.duration();
    const from = this.from();
    const y = this.direction() === 'top' ? -from * 2 : from * 2;
    const style: Record<string, string> = {
      'transition-delay': `${delay}s`,
      'transition-duration': `${dur}s`,
    };
    if (inView) {
      style['opacity'] = '1';
      style['filter'] = 'blur(0px)';
      style['transform'] = 'translateY(0)';
    } else {
      style['opacity'] = '0';
      style['filter'] = `blur(${from}px)`;
      style['transform'] = `translateY(${y}px)`;
    }
    return style;
  }
}
