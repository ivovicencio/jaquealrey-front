import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer">
      <div class="container footer-grid">
        <div class="footer-brand">
          <span class="logo-icon"><i class="fas fa-chess-king"></i></span>
          <h3>Hotel Jaque al Rey</h3>
          <p>Tu refugio en el corazon de la Patagonia. Comodidad, calidez y hospitalidad en cada estancia.</p>
          <div class="footer-social">
            <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
            <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
            <a href="#" aria-label="WhatsApp"><i class="fab fa-whatsapp"></i></a>
          </div>
        </div>
        <div class="footer-links">
          <h4>Enlaces</h4>
          <ul>
            <li><a routerLink="/habitaciones">Habitaciones</a></li>
            <li><a routerLink="/buscar-disponibilidad">Buscar Disponibilidad</a></li>
            <li><a routerLink="/consultar-reserva">Consultar mi Reserva</a></li>
            <li><a routerLink="/reembolsos">Reembolsos y Cancelaciones</a></li>
          </ul>
        </div>
        <div class="footer-links">
          <h4>Informacion legal</h4>
          <ul>
            <li><a routerLink="/privacidad">Politica de Privacidad</a></li>
            <li><a routerLink="/terminos">Terminos y Condiciones</a></li>
            <li><a routerLink="/cookies">Politica de Cookies</a></li>
            <li><a routerLink="/reembolsos">Reembolsos</a></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>Contacto</h4>
          <p><i class="fas fa-map-marker-alt"></i> Julio Argentino Roca, Q8315<br>Piedra del Aguila, Neuquen</p>
          <p><i class="fas fa-phone"></i> 02942664320</p>
          <p><i class="fas fa-envelope"></i> info&#64;jaquealrey.com</p>
        </div>
      </div>
      <div class="footer-bottom container">
        <p>&copy; 2026 Hotel Jaque al Rey. Todos los derechos reservados.</p>
        <p class="footer-note">
          No usamos cookies publicitarias ni de seguimiento.
        </p>
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
      margin-bottom: 18px;
      max-width: 300px;
    }
    .footer-social {
      display: flex;
      gap: 12px;
    }
    .footer-social a {
      width: 36px;
      height: 36px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: rgba(255, 255, 255, 0.5);
      transition: var(--transition);
      font-size: 0.85rem;
    }
    .footer-social a:hover {
      border-color: var(--gold);
      color: var(--gold);
      background: rgba(184, 134, 11, 0.1);
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
    .footer-links a {
      color: rgba(255, 255, 255, 0.55);
      font-size: 0.85rem;
      transition: var(--transition);
    }
    .footer-links a:hover { color: var(--gold-light); }
    .footer-contact p {
      font-size: 0.85rem;
      margin-bottom: 10px;
      display: flex;
      gap: 8px;
      opacity: 0.65;
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
    .footer-bottom p { margin: 0; }

    @media (max-width: 768px) {
      .footer-grid { grid-template-columns: 1fr; gap: 28px; }
    }
  `
})
export class FooterComponent {}
