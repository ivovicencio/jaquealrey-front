import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DATOS_RESPONSABLE } from '../../../features/public/legal/legal-content';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <span class="logo-icon"><i class="fas fa-chess-king"></i></span>
          <h3>{{ datos.nombre }}</h3>
          <p>Hotel en Piedra del Águila, Neuquén.</p>
        </div>
        <div class="footer-links">
          <h4>Reservas</h4>
          <ul>
            <li><a routerLink="/habitaciones">Habitaciones</a></li>
            <li><a routerLink="/buscar-disponibilidad">Disponibilidad</a></li>
            <li><a routerLink="/consultar-reserva">Consultar mi reserva</a></li>
            <li><a routerLink="/reembolsos">Cancelaciones</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Informacion</h4>
          <ul>
            <li><a routerLink="/privacidad">Privacidad</a></li>
            <li><a routerLink="/terminos">Terminos</a></li>
            <li><a routerLink="/cookies">Cookies</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contacto</h4>
          <p>
            <i class="fas fa-map-marker-alt"></i>
            {{ datos.domicilio }}
          </p>
          <p>
            <i class="fas fa-phone"></i>
            <a [href]="datos.telefonoHref">{{ datos.telefono }}</a>
          </p>
          <p>
            <i class="fab fa-whatsapp"></i>
            <a [href]="datos.whatsappHref" target="_blank" rel="noopener noreferrer">WhatsApp</a>
          </p>
        </div>
      </div>
      <div class="footer-bottom container">
        <p>&copy; 2026 {{ datos.nombre }}.</p>
      </div>
    </footer>
  `,
  styles: `
    .footer {
      background: var(--dark);
      color: rgba(255, 255, 255, 0.8);
      padding: 60px 0 0;
      margin-top: auto;
    }
    .footer-grid {
      display: grid;
      grid-template-columns: 2fr 1fr 1fr 1.2fr;
      gap: 40px;
      padding-bottom: 40px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .footer-brand .logo-icon {
      font-size: 2rem;
      color: var(--gold-light);
    }
    .footer-brand h3 {
      font-size: 1.4rem;
      color: #fff;
      margin: 6px 0 10px;
    }
    .footer-brand p {
      font-size: 0.85rem;
      opacity: 0.7;
      margin-bottom: 0;
      max-width: 300px;
    }
    .footer-links h4, .footer-contact h4 {
      color: #fff;
      font-family: var(--font-family);
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .footer-links ul {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .footer-links a,
    .footer-contact a {
      color: rgba(255, 255, 255, 0.55);
      font-size: 0.85rem;
      transition: var(--transition);
    }
    .footer-links a:hover,
    .footer-contact a:hover { color: var(--gold-light); }
    .footer-contact p {
      font-size: 0.85rem;
      margin-bottom: 10px;
      display: flex;
      gap: 8px;
      opacity: 0.8;
      line-height: 1.6;
    }
    .footer-contact i {
      color: var(--gold-light);
      width: 14px;
      margin-top: 3px;
    }
    .footer-bottom {
      padding: 20px 0;
      text-align: center;
      font-size: 0.78rem;
      opacity: 0.45;
    }
    .footer-bottom p { margin: 0 0 4px; }

    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr; gap: 28px; }
    }
  `
})
export class FooterComponent {
  readonly datos = DATOS_RESPONSABLE;
}
