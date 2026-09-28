import { Component, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { Hotel } from '../../../core/models/hotel.model';
import { Habitacion } from '../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe],
  template: `
    <section class="hero">
      <div class="hero-bg" style="background: url('assets/hero.png') center / cover no-repeat;"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <span class="hero-badge">Piedra del Aguila, Neuquen</span>
        <h1 class="hero-title">Hotel Jaque al Rey</h1>
        <p class="hero-tagline">Tu refugio en el corazon de la Patagonia</p>
        <div class="hero-actions">
          <a routerLink="/habitaciones" class="btn btn-primary btn-lg">Ver Habitaciones</a>
          <a routerLink="/buscar-disponibilidad" class="btn btn-outline btn-lg">Buscar Disponibilidad</a>
        </div>
        <div class="hero-features">
          <span><i class="fas fa-map-marker-alt"></i> Ubicacion privilegiada</span>
          <span><i class="fas fa-wifi"></i> Wifi gratis</span>
          <span><i class="fas fa-bed"></i> Confort premium</span>
        </div>
      </div>
      <div class="hero-scroll">
        <span>Explorar</span>
        <i class="fas fa-chevron-down"></i>
      </div>
    </section>

    <section class="features container">
      <div class="section-header">
        <span class="section-tag">Nuestros Servicios</span>
        <h2>Todo lo que necesitas para tu estadía</h2>
      </div>
      <div class="services-grid">
        @for (f of features; track f.title) {
          <div class="service-item">
            <div class="service-icon"><i [class]="f.icon"></i></div>
            <h4>{{ f.title }}</h4>
            <p>{{ f.desc }}</p>
          </div>
        }
      </div>
    </section>

    @if (destacadas().length) {
      <section class="rooms container">
        <div class="section-header">
          <span class="section-tag">Nuestras Habitaciones</span>
          <h2>Elegí la habitación para tu estadía</h2>
          <p>Todas nuestras habitaciones incluyen las mismas comodidades y atención del hotel.</p>
        </div>
        <div class="rooms-grid">
          @for (h of destacadas(); track h.id) {
            <a [routerLink]="['/habitaciones', h.id]" class="card room-card">
              <div class="room-image" [style.background]="gradientFor(h)">
                <span class="room-number">{{ h.numero }}</span>
                <span class="badge badge-info room-type">{{ h.tipo }}</span>
              </div>
              <div class="card-body">
                <h4>{{ h.nombre }}</h4>
                <p class="room-meta">
                  <i class="fas fa-users"></i> Hasta {{ h.capacidad_max }} huéspedes
                </p>
                <div class="room-footer">
                  <span class="price">{{ h.precio_noche | currencyAr }} <small>/noche</small></span>
                  <span class="room-cta">Ver detalle <i class="fas fa-arrow-right"></i></span>
                </div>
              </div>
            </a>
          }
        </div>
        <div class="rooms-more">
          <a routerLink="/habitaciones" class="btn btn-outline">
            Ver las {{ totalHabitaciones() }} habitaciones
          </a>
        </div>
      </section>
    }

    @if (hotel()) {
      <section class="hotel-info">
        <div class="hotel-info-bg" style="background: url('assets/recepcion.png') center / cover no-repeat;"></div>
        <div class="container hotel-info-inner">
          <div class="section-header">
            <span class="section-tag">Sobre Nosotros</span>
            <h2>Conoce el Hotel Jaque al Rey</h2>
          </div>
          <div class="about-content">
            <p class="about-text">{{ hotel()!.descripcion }}</p>
            <div class="hotel-details">
              <div class="detail-item">
                <i class="fas fa-map-marker-alt"></i>
                <div>
                  <span class="detail-label">Direccion</span>
                  <span>{{ hotel()!.direccion }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="fas fa-phone"></i>
                <div>
                  <span class="detail-label">Telefono</span>
                  <span>{{ hotel()!.telefono }}</span>
                </div>
              </div>
              <div class="detail-item">
                <i class="fas fa-envelope"></i>
                <div>
                  <span class="detail-label">Email</span>
                  <span>{{ hotel()!.email }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    }

    <section class="cta-section">
      <div class="container cta-inner">
        <h2>Reserva ahora</h2>
        <p>Encontra la habitacion perfecta para tu estadía en la Patagonia</p>
        <a routerLink="/buscar-disponibilidad" class="btn btn-primary btn-lg">Buscar Disponibilidad</a>
      </div>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      height: 92vh;
      min-height: 550px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      margin-top: -72px;
      padding-top: 72px;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
    }
    .hero-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(26, 20, 16, 0.7) 0%, rgba(26, 20, 16, 0.25) 50%, rgba(26, 20, 16, 0.6) 100%);
    }
    .hero-overlay {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(26, 20, 16, 0.35) 100%);
      z-index: 1;
    }
    .hero-content {
      position: relative;
      z-index: 2;
      text-align: center;
      color: #fff;
      max-width: 720px;
      padding: 0 20px;
      animation: heroIn 1.2s ease forwards;
    }
    @keyframes heroIn {
      from { opacity: 0; transform: translateY(25px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .hero-badge {
      display: inline-block;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 2px;
      border: 1px solid rgba(255, 255, 255, 0.25);
      padding: 5px 18px;
      border-radius: 100px;
      margin-bottom: 20px;
      opacity: 0.85;
    }
    .hero-title {
      font-size: clamp(2.8rem, 7vw, 5rem);
      color: #fff;
      line-height: 1.05;
      margin-bottom: 14px;
      text-shadow: 0 2px 16px rgba(0, 0, 0, 0.3);
    }
    .hero-tagline {
      font-size: 1.05rem;
      opacity: 0.85;
      margin-bottom: 32px;
      font-weight: 300;
      color: rgba(255, 255, 255, 0.9);
    }
    .hero-actions {
      display: flex;
      gap: 14px;
      justify-content: center;
      flex-wrap: wrap;
      margin-bottom: 40px;
    }
    .hero .btn-outline {
      color: #fff;
      border-color: rgba(255, 255, 255, 0.4);
    }
    .hero-features {
      display: flex;
      gap: 24px;
      justify-content: center;
      flex-wrap: wrap;
      font-size: 0.85rem;
      opacity: 0.8;
    }
    .hero-features i {
      margin-right: 6px;
      color: var(--gold-light);
    }
    .hero-scroll {
      position: absolute;
      bottom: 28px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      color: rgba(255, 255, 255, 0.5);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 0.7rem;
      letter-spacing: 2px;
      text-transform: uppercase;
      animation: bounce 2s infinite;
    }
    @keyframes bounce {
      0%, 100% { transform: translateX(-50%) translateY(0); }
      50% { transform: translateX(-50%) translateY(6px); }
    }

    .features { padding: 80px 0 60px; background: var(--cream); }
    .section-header {
      text-align: center;
      max-width: 560px;
      margin: 0 auto 44px;
    }
    .section-tag {
      display: inline-block;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 2.5px;
      color: var(--gold);
      font-weight: 500;
      margin-bottom: 10px;
    }
    .section-header h2 {
      font-size: clamp(1.8rem, 3.5vw, 2.4rem);
      margin-bottom: 12px;
    }
    .section-header p {
      color: var(--text-light);
      font-size: 0.95rem;
    }
    .services-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 20px;
    }
    .service-item {
      text-align: center;
      padding: 28px 16px;
      background: var(--white);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      transition: var(--transition);
    }
    .service-item:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }
    .service-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 12px;
      background: var(--warm);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.3rem;
      color: var(--gold);
    }
    .service-item h4 {
      font-size: 0.95rem;
      margin-bottom: 4px;
      font-family: var(--font-family);
      font-weight: 600;
    }
    .service-item p {
      font-size: 0.78rem;
      color: var(--text-light);
      margin: 0;
    }

    .rooms { padding: 70px 0 20px; }
    .rooms-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
    }
    .room-card {
      display: block;
      overflow: hidden;
      color: inherit;
      text-decoration: none;
      transition: var(--transition);
    }
    .room-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
    }
    .room-image {
      height: 150px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }
    .room-number {
      font-size: 2.5rem;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.7);
    }
    .room-type { position: absolute; top: 12px; right: 12px; }
    .room-card h4 {
      font-size: 0.95rem;
      font-weight: 600;
      margin-bottom: 0.35rem;
    }
    .room-meta {
      font-size: 0.8125rem;
      color: var(--text-light);
      margin-bottom: 0.85rem;
    }
    .room-meta i { margin-right: 5px; }
    .room-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
    }
    .price {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--gold-dark);
    }
    .price small {
      font-weight: 400;
      font-size: 0.75rem;
      color: var(--text-light);
    }
    .room-cta {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--gold);
      white-space: nowrap;
    }
    .rooms-more {
      text-align: center;
      margin-top: 2.5rem;
    }

    .hotel-info {
      position: relative;
      padding: 80px 0;
      overflow: hidden;
      color: #fff;
    }    .hotel-info-bg {
      position: absolute;
      inset: 0;
    }
    .hotel-info-bg::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(26, 20, 16, 0.88) 0%, rgba(26, 20, 16, 0.75) 50%, rgba(26, 20, 16, 0.88) 100%);
    }
    .hotel-info-inner {
      position: relative;
      z-index: 1;
    }
    .hotel-info .section-tag {
      color: var(--gold-light);
    }
    .hotel-info .section-header h2 {
      color: #fff;
    }
    .hotel-info .about-text {
      color: rgba(255, 255, 255, 0.8);
    }
    .hotel-info .detail-item {
      color: rgba(255, 255, 255, 0.85);
    }
    .hotel-info .detail-label {
      color: rgba(255, 255, 255, 0.55);
    }
    .about-content {
      max-width: 800px;
      margin: 0 auto;
    }
    .about-text {
      color: var(--text-light);
      font-size: 1rem;
      line-height: 1.8;
      margin-bottom: 2rem;
      text-align: center;
    }
    .hotel-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }
    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
    }
    .detail-item i {
      color: var(--gold);
      font-size: 1.1rem;
      margin-top: 3px;
    }
    .detail-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 2px;
    }

    .cta-section {
      padding: 80px 0;
      background: var(--dark);
      text-align: center;
      color: #fff;
    }
    .cta-inner h2 {
      color: #fff;
      margin-bottom: 0.5rem;
    }
    .cta-inner p {
      color: rgba(255, 255, 255, 0.7);
      margin-bottom: 1.5rem;
      font-size: 0.95rem;
    }

    @media (max-width: 1024px) {
      .rooms-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 768px) {
      .hero { min-height: 50vh; }
      .hero-title { font-size: 2.25rem; }
      .hero-actions { flex-direction: column; align-items: center; }
      .services-grid { grid-template-columns: 1fr; }
      .rooms-grid { grid-template-columns: 1fr; }
      .hotel-details { grid-template-columns: 1fr; }
    }
  `
})
export class HomeComponent implements OnInit {
  private hotelService = inject(HotelService);
  private habitacionService = inject(HabitacionService);

  hotel = signal<Hotel | null>(null);
  totalHabitaciones = signal(0);

  // La home muestra solo un resumen: el catalogo completo esta en /habitaciones.
  private readonly CUANTAS_DESTACADAS = 4;
  destacadas = signal<Habitacion[]>([]);

  private gradients = [
    'linear-gradient(135deg, var(--dark) 0%, var(--dark-2) 100%)',
    'linear-gradient(135deg, var(--gold-dark) 0%, var(--gold) 100%)',
    'linear-gradient(135deg, var(--dark-2) 0%, var(--gold-dark) 100%)',
    'linear-gradient(135deg, var(--gold) 0%, var(--gold-light) 100%)',
    'linear-gradient(135deg, #3d322b 0%, var(--dark) 100%)',
  ];

  features = [
    { icon: 'fas fa-map-marker-alt', title: 'Ubicacion', desc: 'En el corazon de la Patagonia, con acceso facil a los principales atractivos turisticos de la region.' },
    { icon: 'fas fa-bed', title: 'Confort', desc: 'Habitaciones modernas y equipadas para que tu estadía sea una experiencia inolvidable.' },
    { icon: 'fas fa-hand-holding-heart', title: 'Atencion', desc: 'Un equipo dedicado a brindarte el mejor servicio y hacer que te sientas como en casa.' },
    { icon: 'fas fa-wifi', title: 'Wifi Gratis', desc: 'Conexion inalámbrica de alta velocidad en todas las instalaciones del hotel.' },
  ];

  gradientFor(h: Habitacion): string {
    return this.gradients[h.numero % this.gradients.length];
  }

  ngOnInit() {
    this.hotelService.getHotel().subscribe({
      next: (res) => { if (res.status === '1') this.hotel.set(res.data); },
    });

    this.habitacionService.getHabitaciones().subscribe({
      next: (res) => {
        if (res.status !== '1') return;
        const data = res.data;
        this.totalHabitaciones.set(data.length);
        this.destacadas.set(data.slice(0, this.CUANTAS_DESTACADAS));
      },
    });
  }
}
