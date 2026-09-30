import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HotelService } from '../../../core/services/hotel.service';
import { HabitacionService } from '../../../core/services/habitacion.service';
import { HabitacionImagenService } from '../../../core/services/habitacion-imagen.service';
import { Hotel } from '../../../core/models/hotel.model';
import { Habitacion } from '../../../core/models/habitacion.model';
import { CurrencyArPipe } from '../../../shared/pipes/currency-ar.pipe';
import { ScrollExpandComponent } from '../../../shared/components/scroll-expand/scroll-expand.component';
import { DepthCarouselComponent, DepthCarouselItem } from '../../../shared/components/depth-carousel/depth-carousel.component';
import { SpecularButtonComponent } from '../../../shared/components/specular-button/specular-button.component';
import { BorderGlowComponent } from '../../../shared/components/border-glow/border-glow.component';
import { CircularCarouselComponent, CircularCarouselItem } from '../../../shared/components/circular-carousel/circular-carousel.component';
import { BlurTextComponent } from '../../../shared/components/blur-text/blur-text.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe, ScrollExpandComponent, DepthCarouselComponent, SpecularButtonComponent, BorderGlowComponent, CircularCarouselComponent, BlurTextComponent],
  template: `
    <section class="hero">
      <div class="hero-bg"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content container">
        <span class="hero-badge">Piedra del Aguila, Neuquen</span>
        <h1 class="hero-title">
          <app-blur-text
            text="Hotel Jaque al Rey"
            tag="span"
            [delay]="0.09"
            [duration]="0.7"
            [from]="10"
            direction="bottom"
          />
        </h1>
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
      <div class="services-carousel">
        <app-circular-carousel
          [items]="serviciosItems"
          preset="cylinder"
          intro="rise"
          [cardWidth]="240"
          [aspectRatio]="1"
          [gap]="30"
          [speed]="14"
          [captions]="true"
          fadeColor="#1a1410"
          [depthFade]="0.5"
          [innerShade]="0.5"
        />
      </div>
      <div class="services-facts">
        <div class="fact-chip">
          <i class="fas fa-clock icon-checkin"></i>
          <div>
            <span class="fact-title">Horarios</span>
            <span class="fact-text">Check-in desde 15:00 · Check-out 10:30</span>
          </div>
        </div>
        <div class="fact-chip">
          <i class="fas fa-mug-hot"></i>
          <div>
            <span class="fact-title">Desayuno en la habitacion</span>
            <span class="fact-text">Pava electrica, jarra con agua, te, cafe y galletitas</span>
          </div>
        </div>
        <div class="fact-chip">
          <i class="fas fa-car"></i>
          <div>
            <span class="fact-title">Estacionamiento</span>
            <span class="fact-text">Incluido en el precio de tu estadia</span>
          </div>
        </div>
        <div class="fact-chip">
          <i class="fas fa-fan"></i>
          <div>
            <span class="fact-title">Ventilador en las habitaciones</span>
            <span class="fact-text">El hotel no cuenta con aire acondicionado</span>
          </div>
        </div>
      </div>
    </section>

    @if (destacadas().length) {
      <section class="rooms">
        <app-scroll-expand
          src="/assets/rey.jpg"
          alt="Piezas de ajedrez en primer plano"
          title="Pensá la partida antes de jugarla"
          titleTag="h2"
          scrollHint="Desliza"
          [useWindowScroll]="true"
          [startWidth]="44"
          [startHeight]="64"
          [startRadius]="20"
          [mediaZoom]="1.28"
          [scrollDistance]="0.95"
          [holdDistance]="0.25"
          [overlayScrim]="0.5"
        >
          <p class="rooms-lead">
            Un tablero enseña a leer la partida antes de jugarla. Cada habitacion esta pensada con la misma
            logica: una decision, un movimiento, un resultado.
          </p>
        </app-scroll-expand>

        <div class="container">
          <div class="section-header">
            <span class="section-tag">Nuestras Habitaciones</span>
            <h3>Habitaciones destacadas</h3>
          </div>

          <app-depth-carousel
            class="rooms-carousel"
            [items]="carouselItems()"
            ariaLabel="Habitaciones destacadas del hotel"
            slide="habitación"
            [cardWidth]="330"
            [cardHeight]="430"
            [radius]="16"
            [tint]="'#1a120c'"
            [depth]="200"
            [spread]="84"
            [tilt]="24"
            [perspective]="1500"
            [visibleCards]="4"
            [falloff]="0.22"
            [blur]="5"
            [duration]="750"
            [autoplay]="true"
            [autoplayDelay]="3600"
            (cambio)="onCarouselChange($event)"
          />

          @if (habFoco(); as h) {
            <div class="rooms-foco">
              <div class="rooms-foco-datos">
                <h4>{{ h.nombre }}</h4>
                <p class="room-meta">
                  <i class="fas fa-users"></i> Hasta {{ h.capacidad_max }} huéspedes
                </p>
              </div>
              <div class="rooms-foco-accion">
                <span class="price">{{ h.precio_noche | currencyAr }} <small>/noche</small></span>
                <a [routerLink]="['/habitaciones', h.id]" class="btn btn-primary">
                  Ver detalle <i class="fas fa-arrow-right"></i>
                </a>
              </div>
            </div>
          }

          <div class="rooms-more">
            <app-specular-button
              routerLink="/habitaciones"
              size="lg"
              [radius]="14"
              tint="#ffffff"
              [tintOpacity]="0.02"
              [blur]="12"
              textColor="#3d2c1e"
              lineColor="#8b6914"
              baseColor="#d4a017"
              [intensity]="1.1"
              [shineSize]="12"
              [shineFade]="42"
              [thickness]="1.4"
              [speed]="0.4"
              [followMouse]="true"
              [proximity]="320"
            >
              Ver las {{ totalHabitaciones() }} habitaciones
            </app-specular-button>
          </div>
        </div>
      </section>
    }

    @if (hotel()) {
      <section class="hotel-info">
        <div class="hotel-info-bg"></div>
        <div class="container hotel-info-inner">
          <div class="section-header">
            <span class="section-tag">Sobre Nosotros</span>
            <h2>Conoce el Hotel Jaque al Rey</h2>
          </div>
          <div class="hotel-glow-wrap">
            <app-border-glow
              class="about-glow-card"
            glowColor="40 85 62"
            backgroundColor="#1a1410"
            [borderRadius]="22"
            [glowRadius]="28"
            [glowIntensity]="1.15"
            [coneSpread]="30"
            [edgeSensitivity]="24"
            [animated]="true"
            [colors]="colorsTablero"
            [fillOpacity]="0.28"
          >
            <div class="border-glow-card__content">
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
              </div>
            </div>
          </app-border-glow>
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
      /* Foto arriba, gradiente de respaldo abajo: si la imagen no carga, se ve
         el gradiente y no un rectangulo vacio. */
      /* Rutas con slash inicial a proposito: las imagenes viven en public/ y se
         sirven desde la raiz. Sin el slash, Angular las busca relativas al
         componente y el build falla. */
      background: url('/assets/hero.jpeg') center / cover no-repeat,
                  linear-gradient(150deg, #3d2f26 0%, #5a4436 45%, #8a6a4f 100%);
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
    .services-carousel {
      height: 560px;
      position: relative;
      margin: 8px -1rem 0;
    }
    .services-carousel ::ng-deep .circular-carousel__caption {
      color: var(--text-dark);
    }
    .services-carousel ::ng-deep .circular-carousel__subtitle {
      color: var(--text-light);
    }
    .services-facts {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
      gap: 16px;
      margin-top: 2.5rem;
    }
    .fact-chip {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 18px 18px;
      background: var(--white);
      border-radius: var(--radius);
      box-shadow: var(--shadow);
      border-left: 3px solid var(--gold);
      transition: var(--transition);
    }
    .fact-chip:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
    }
    .fact-chip i {
      font-size: 1.15rem;
      color: var(--gold);
      margin-top: 2px;
    }
    .fact-chip > div {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .fact-title {
      font-size: 0.875rem;
      font-weight: 700;
      font-family: var(--font-family);
      color: var(--text-dark);
    }
    .fact-text {
      font-size: 0.78rem;
      line-height: 1.45;
      color: var(--text-light);
    }

    /* La seccion va a sangre arriba porque el ScrollExpand necesita el alto
       completo, y el resto del contenido se mete en un .container propio. */
    .rooms { padding: 0 0 20px; }
    /* El texto que aparece cuando el marco ya esta abierto. */
    .rooms-lead {
      max-width: 44ch;
      margin: 0;
      font-size: 1.05rem;
      font-weight: 300;
      line-height: 1.6;
      color: rgba(255, 255, 255, 0.92);
    }
    /* Carrusel con profundidad. El alto es fijo porque el componente apila las
       tarjetas en 3D y necesita saber cuanto espacio vertical hay. */
    .rooms-carousel {
      display: block;
      height: 480px;
      margin: 0.5rem 0 1.5rem;
    }
    /* Ficha de la habitacion que esta al frente: nombre, capacidad, precio y el
       link al detalle. El carrusel por si solo no lleva a ningun lado. */
    .rooms-foco {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1.5rem;
      flex-wrap: wrap;
      padding: 1.25rem 1.5rem;
      border: 1px solid rgba(0, 0, 0, 0.07);
      border-radius: 14px;
      background: #fff;
    }
    .rooms-foco-datos h4 {
      font-size: 1.05rem;
      font-weight: 600;
      margin-bottom: 0.3rem;
    }
    .rooms-foco-accion {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }
    .rooms-foco-accion .btn i { margin-left: 6px; }
    .room-meta {
      font-size: 0.8125rem;
      color: var(--text-light);
      margin-bottom: 0;
    }
    .room-meta i { margin-right: 5px; }
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
      /* Igual que .hero-bg: la foto con el gradiente de respaldo. */
      background: url('/assets/recepcion.jpeg') center / cover no-repeat,
                  linear-gradient(150deg, #2e2620 0%, #4a3b30 50%, #6b5442 100%);
      animation: hotel-bg-zoom 28s ease-in-out infinite alternate;
      will-change: transform;
    }
    @keyframes hotel-bg-zoom {
      from { transform: scale(1); }
      to { transform: scale(1.08); }
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
    .hotel-glow-wrap {
      max-width: 780px;
      margin: 0 auto;
    }
    .about-glow-card {
      display: block;
    }
    .about-glow-card ::ng-deep .border-glow-card {
      background: rgba(26, 20, 16, 0.62);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
    }
    .border-glow-card__content {
      display: flex;
      flex-direction: column;
      padding: 2.5rem 2rem;
    }
    .about-text {
      color: rgba(255, 255, 255, 0.85);
      font-size: 1rem;
      line-height: 1.8;
      margin-bottom: 2rem;
      text-align: center;
    }
    .hotel-details {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1.5rem;
    }
    .detail-item {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      color: rgba(255, 255, 255, 0.85);
    }
    .detail-item i {
      color: var(--gold-light);
      font-size: 1.1rem;
      margin-top: 3px;
    }
    .detail-label {
      display: block;
      font-size: 0.8125rem;
      font-weight: 600;
      color: rgba(255, 255, 255, 0.55);
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
      .rooms-carousel { height: 430px; }
    }
    @media (max-width: 768px) {
      .hero { min-height: 50vh; }
      .hero-title { font-size: 2.25rem; }
      .hero-actions { flex-direction: column; align-items: center; }
      .services-carousel { height: 400px; margin-inline: -0.5rem; }
      .rooms-carousel { height: 340px; }
      .rooms-foco { flex-direction: column; align-items: flex-start; }
      .rooms-foco-accion { width: 100%; justify-content: space-between; }
      .hotel-details { grid-template-columns: 1fr; }
      .border-glow-card__content { padding: 1.75rem 1.25rem; }
    }
  `
})
export class HomeComponent implements OnInit {
  private hotelService = inject(HotelService);
  private habitacionService = inject(HabitacionService);
  private imagenes = inject(HabitacionImagenService);

  hotel = signal<Hotel | null>(null);
  totalHabitaciones = signal(0);

  /** Dorados del hotel para el borde mesh del BorderGlow de "Sobre Nosotros". */
  colorsTablero = ['#d4a017', '#8b6914', '#b8860b'];

  // La home muestra solo un resumen: el catalogo completo esta en /habitaciones.
  // 6 y no 4 porque el carrusel apila en profundidad y con 4 la pila se ve corta.
  private readonly CUANTAS_DESTACADAS = 6;
  destacadas = signal<Habitacion[]>([]);
  /** La habitacion que esta al frente en el carrusel. */
  habFoco = signal<Habitacion | null>(null);

  /** El carrusel necesita url de imagen; la foto sale del servicio central. */
  carouselItems = computed<DepthCarouselItem[]>(() =>
    this.destacadas().map((h) => ({
      image: this.imagenes.imagenPara(h),
      alt: h.nombre,
      hab: h,
    })),
  );

  /** Servicios del hotel mostrados en el carrusel circular. */
  serviciosItems: CircularCarouselItem[] = [
    { src: '/assets/svc-patagonia.jpg', alt: 'Paisaje de la Patagonia', title: 'Ubicación', subtitle: 'En el corazón de la Patagonia, con acceso a los principales atractivos.' },
    { src: '/assets/svc-desayuno.jpg', alt: 'Desayuno dentro de la habitación', title: 'Desayuno en la habitación', subtitle: 'Pava eléctrica, jarra con agua potable, té, café y galletitas.' },
    { src: '/assets/svc-habitacion.jpg', alt: 'Habitación del hotel', title: 'Confort', subtitle: 'Habitaciones modernas y equipadas para una estadía inolvidable.' },
    { src: '/assets/svc-parking.jpg', alt: 'Estacionamiento del hotel', title: 'Estacionamiento', subtitle: 'Incluido en el precio de tu estadía.' },
    { src: '/assets/svc-wifi.jpg', alt: 'Conexión wifi', title: 'Wifi gratis', subtitle: 'Conexión inalámbrica de alta velocidad en todo el hotel.' },
    { src: '/assets/svc-atencion.jpg', alt: 'Recepción del hotel', title: 'Atención', subtitle: 'Un equipo dedicado a hacer que te sientas como en casa.' },
  ];

  onCarouselChange({ item }: { index: number; item: DepthCarouselItem }) {
    this.habFoco.set((item['hab'] as Habitacion | undefined) ?? null);
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
