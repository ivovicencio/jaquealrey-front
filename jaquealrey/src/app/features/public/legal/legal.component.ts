import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DATOS_RESPONSABLE, DOCUMENTOS, LegalDoc } from './legal-content';

@Component({
  selector: 'app-legal',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="container page">
      <nav class="breadcrumbs" aria-label="Ruta de navegacion">
        <a routerLink="/">Inicio</a>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{{ doc().titulo }}</span>
      </nav>

      <article class="legal-doc">
        <h1>{{ doc().titulo }}</h1>
        <p class="actualizado">{{ doc().actualizado }}</p>
        <p class="intro">{{ doc().intro }}</p>

        @for (seccion of doc().secciones; track seccion.titulo) {
          <section>
            <h2>{{ seccion.titulo }}</h2>
            @for (parrafo of seccion.cuerpo; track $index) {
              <p>{{ parrafo }}</p>
            }
          </section>
        }
      </article>

      <aside class="legal-contact">
        <p><strong>{{ datos.nombre }}</strong></p>
        <p>{{ datos.domicilio }}</p>
        <p>
          Telefono:
          <a [href]="datos.telefonoHref">{{ datos.telefono }}</a>
          ·
          <a [href]="datos.whatsappHref" target="_blank" rel="noopener noreferrer">WhatsApp</a>
        </p>
      </aside>

      <nav class="legal-nav" aria-label="Otros documentos legales">
        @for (slug of otros; track slug) {
          <a [routerLink]="['/' + slug]">{{ DOCUMENTOS[slug].titulo }}</a>
        }
      </nav>
    </div>
  `,
  styles: `
    .page { padding: 2.5rem 0 4rem; max-width: 780px; }
    .breadcrumbs {
      display: flex; gap: 0.5rem; align-items: center;
      font-size: 0.85rem; color: var(--text-light); margin-bottom: 1.5rem;
    }
    .breadcrumbs a { color: var(--text-light); text-decoration: none; }
    .breadcrumbs a:hover { color: var(--gold-dark); text-decoration: underline; }
    .legal-doc h1 {
      font-family: var(--font-heading);
      font-size: 2rem; font-weight: 600; margin-bottom: 0.25rem;
    }
    .actualizado { color: var(--text-light); font-size: 0.85rem; margin-bottom: 1.5rem; }
    .intro {
      font-size: 1.05rem; line-height: 1.7; color: var(--text);
      padding-bottom: 1.5rem; border-bottom: 1px solid var(--border); margin-bottom: 1.5rem;
    }
    section { margin-bottom: 1.75rem; }
    h2 {
      font-size: 1.1rem; font-weight: 600; color: var(--gold-dark);
      margin-bottom: 0.625rem;
    }
    section p { line-height: 1.75; margin-bottom: 0.75rem; color: var(--text); }
    .legal-contact {
      margin-top: 2rem;
      padding: 1.25rem 1.35rem;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: color-mix(in srgb, var(--gold) 6%, transparent);
    }
    .legal-contact p { margin: 0 0 0.4rem; line-height: 1.5; font-size: 0.92rem; }
    .legal-contact a { color: var(--gold-dark); }
    .legal-contact-note { color: var(--text-light); font-size: 0.85rem; margin-bottom: 0 !important; }
    .legal-nav {
      display: flex; flex-wrap: wrap; gap: 0.75rem;
      padding-top: 1.5rem; border-top: 1px solid var(--border);
    }
    .legal-nav a {
      padding: 0.5rem 0.875rem; border: 1px solid var(--border);
      border-radius: var(--radius); text-decoration: none;
      color: var(--text); font-size: 0.875rem;
    }
    .legal-nav a:hover { border-color: var(--gold); color: var(--gold-dark); }
  `,
})
export class LegalComponent implements OnInit {
  private route = inject(ActivatedRoute);

  readonly DOCUMENTOS = DOCUMENTOS;
  readonly datos = DATOS_RESPONSABLE;
  readonly otros = ['privacidad', 'terminos', 'cookies', 'reembolsos'];

  slug = signal('privacidad');
  doc = computed<LegalDoc>(() => DOCUMENTOS[this.slug()] ?? DOCUMENTOS['privacidad']);

  ngOnInit() {
    this.route.data.subscribe((data) => this.slug.set(data['slug'] || 'privacidad'));
  }
}
