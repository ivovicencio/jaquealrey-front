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
    .page { padding: clamp(3rem, 6vw, 5rem) 0; max-width: 780px; }
    .breadcrumbs {
      display: flex; gap: 0.5rem; align-items: center;
      font-size: 0.82rem; color: var(--text-light); margin-bottom: 2rem;
    }
    .breadcrumbs a { color: var(--text-light); text-decoration: none; }
    .breadcrumbs a:hover { color: var(--gold-dark); text-decoration: underline; }
    .legal-doc h1 {
      font-family: var(--font-heading);
      font-size: clamp(2.4rem, 5vw, 3.4rem); font-weight: 500; line-height: 1;
      margin-bottom: 0.5rem;
    }
    .actualizado { color: var(--text-light); font-size: 0.85rem; margin-bottom: 1.5rem; }
    .intro {
      font-size: 1.1rem; line-height: 1.8; color: var(--dark-2);
      padding-bottom: 1.75rem; border-bottom: 1px solid var(--border-strong); margin-bottom: 2rem;
    }
    section { margin-bottom: 2.25rem; }
    h2 {
      font-family: var(--font-heading);
      font-size: 1.55rem; font-weight: 600; color: var(--dark);
      margin-bottom: 0.75rem;
    }
    section p { line-height: 1.8; margin-bottom: 0.85rem; color: var(--text); }
    .legal-contact {
      margin-top: 2rem;
      padding: 1.25rem 0;
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      background: transparent;
    }
    .legal-contact p { margin: 0 0 0.4rem; line-height: 1.5; font-size: 0.92rem; }
    .legal-contact a { color: var(--gold-dark); }
    .legal-contact-note { color: var(--text-light); font-size: 0.85rem; margin-bottom: 0 !important; }
    .legal-nav {
      display: flex; flex-wrap: wrap; gap: 0.5rem 1rem;
      padding-top: 1.5rem; border-top: 1px solid var(--border);
    }
    .legal-nav a {
      padding: 0.5rem 0; border-bottom: 1px solid var(--border);
      text-decoration: none;
      color: var(--text); font-size: 0.875rem;
    }
    .legal-nav a:hover { border-color: var(--gold); color: var(--gold-dark); }
    @media (max-width: 640px) {
      .page { padding: 2.75rem 0 3.5rem; }
      .legal-nav { gap: 0.4rem 1rem; }
    }
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
