import { Component, computed, inject, signal, viewChild, OnInit } from '@angular/core';
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
import { OptionWheelComponent } from '../../../shared/components/option-wheel/option-wheel.component';
import { RESENIAS, Resenia } from './resenias.data';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, CurrencyArPipe, ScrollExpandComponent, DepthCarouselComponent, SpecularButtonComponent, BorderGlowComponent, CircularCarouselComponent, BlurTextComponent, OptionWheelComponent],
  template: `
    <section class="hero">
      <!-- Imagen real, no background-image: asi puede llevar fetchpriority, que
           es lo que marca el LCP de la home. Va envuelta en un div para poder
           darle margenes de seguridad sin romper el object-fit. -->
      <div class="hero-figure">
        <img
          class="hero-img"
          src="/assets/nuevohero.png"
          alt="Rey blanco de ajedrez"
          fetchpriority="high"
          decoding="async"
        />
      </div>
      <div class="hero-scrim" aria-hidden="true"></div>
      <div class="hero-fade" aria-hidden="true"></div>

      <div class="hero-content">
        <div class="hero-inner">
          <span class="hero-kicker">Piedra del Aguila, Neuquen</span>
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
            <a routerLink="/habitaciones" [state]="{ returnUrl: '/' }" class="btn-hero btn-hero--primary">Ver Habitaciones</a>
            <a routerLink="/buscar-disponibilidad" [state]="{ returnUrl: '/' }" class="btn-hero btn-hero--ghost">Buscar Disponibilidad</a>
          </div>
        </div>
      </div>

      <div class="hero-bar">
        <ul class="hero-features">
          <li>
            <i class="fas fa-map-marker-alt"></i>
            <span>Ubicacion privilegiada</span>
          </li>
          <li>
            <i class="fas fa-wifi"></i>
            <span>Wifi gratis</span>
          </li>
          <li>
            <i class="fas fa-bed"></i>
            <span>Confort premium</span>
          </li>
        </ul>
        <span class="hero-scroll">
          <span>Explorar</span>
          <i class="fas fa-chevron-down"></i>
        </span>
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
                <a [routerLink]="['/habitaciones', h.id]" [state]="{ returnUrl: '/' }" class="btn btn-primary">
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

    @if (resenias().length) {
      <section class="reviews">
        <div class="container">
          <div class="section-header">
            <span class="section-tag">Opiniones</span>
            <h2>Lo que dicen los huéspedes</h2>
            <p class="reviews-score">
              <i class="fas fa-star"></i>
              <strong>{{ promedioResenias() }}</strong> sobre {{ totalResenias() }} opiniones
            </p>
          </div>

          <div class="reviews-layout">
            <div class="reviews-wheel">
              <app-option-wheel
                [items]="reseniasNombres()"
                [defaultSelected]="0"
                [textColor]="'#a99a86'"
                [activeColor]="'#1a1410'"
                side="left"
                [fontSize]="1.05"
                [spacing]="1.5"
                [curve]="1"
                [tilt]="6"
                [blur]="2"
                [fade]="0.28"
                [minOpacity]="0.06"
                [smoothing]="200"
                [inset]="0"
                [loop]="true"
                [draggable]="true"
                ariaLabel="Elegí una reseña de huéspedes"
                (onChange)="onReseniaChange($event)"
              />
            </div>

            @if (reseniaActiva(); as r) {
              <figure class="review-card">
                <div class="review-stars" [attr.aria-label]="r.estrellas + ' de 5 estrellas'">
                  @for (i of [1, 2, 3, 4, 5]; track i) {
                    <i
                      class="fa-star"
                      [class.fas]="i <= r.estrellas"
                      [class.far]="i > r.estrellas"
                    ></i>
                  }
                </div>
                <blockquote>{{ r.texto }}</blockquote>
                <figcaption>
                  <span class="review-author">{{ r.autor }}</span>
                  <span class="review-via">Reseña de Google</span>
                </figcaption>
              </figure>
            }
          </div>

          <div class="reviews-controls">
            <button
              type="button"
              class="review-nav"
              aria-label="Reseña anterior"
              (click)="moverResenia(-1)"
            >
              <i class="fas fa-chevron-up"></i>
            </button>
            <button
              type="button"
              class="review-nav"
              aria-label="Reseña siguiente"
              (click)="moverResenia(1)"
            >
              <i class="fas fa-chevron-down"></i>
            </button>
            <span class="reviews-hint">Arrastrá o desplazá la rueda para ver más</span>
          </div>
        </div>
      </section>
    }

    <section class="location-section">
      <div class="container location-layout">
        <div class="location-copy">
          <span class="section-tag">Cómo llegar</span>
          <h2>Encontranos en<br />Piedra del Águila</h2>
          <p>Hotel Jaque al Rey</p>
          <span class="location-address">Julio Argentino Roca · Piedra del Águila, Neuquén</span>
          <a
            class="location-link"
            href="https://www.google.com/maps/place/Hotel+%22Jaque+al+Rey%22/@-40.0492909,-70.0805509,17z/data=!4m20!1m10!3m9!1s0x960e37dc70d41135:0x1443102aadb8b488!2sHotel+%22Jaque+al+Rey%22!5m2!4m1!1i2!8m2!3d-40.049295!4d-70.077976!16s%2Fg%2F11r88r5_pg!3m8!1s0x960e37dc70d41135:0x1443102aadb8b488!5m2!4m1!1i2!8m2!3d-40.049295!4d-70.077976!16s%2Fg%2F11r88r5_pg?entry=ttu&g_ep=EgoyMDI2MDkzMC4wIKXMDSoASAFQAw%3D%3D"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir en Google Maps <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
          </a>
        </div>
        <div class="location-map">
          <iframe
            title="Ubicación exacta del Hotel Jaque al Rey en Google Maps"
            src="https://maps.google.com/maps?q=-40.049295,-70.077976&z=17&output=embed"
            loading="lazy"
            referrerpolicy="no-referrer-when-downgrade"
            allowfullscreen
          ></iframe>
        </div>
      </div>
    </section>
  `,
  styles: `
    /* ------------------------------------------------------------------ hero
       min-height, no height: asi el bloque crece si el contenido no entra en
       pantalla en vez de desbordarlo. 100svh y no 100vh porque en mobile la
       barra del navegador encoge el viewport y 100vh corta los ultimos px. */
    .hero {
      position: relative;
      min-height: 100svh;
      display: flex;
      align-items: center;
      overflow: hidden;
      margin-top: -72px;
      padding-top: 72px;
      /* Negro puro: es el fondo real de la foto, asi que con object-contain los
         laterales vacios se funden con el fondo y no se ve ningun marco. */
      background: #000;
    }
    /* Recinto de la foto. Los insets son el margen de seguridad: 88px arriba
       para que la corona no choque con el navbar fijo de 72px, 84px abajo para
       que la base no toque la barra de insignias. */
    .hero-figure {
      position: absolute;
      inset: 88px 0 104px 0;
      z-index: 0;
    }
    .hero-img {
      width: 100%;
      height: 100%;
      /* contain, no cover: la pieza entra completa, corona y base. Con cover
         el 1.78:1 del escritorio contra el 1.5 de la foto recortaba arriba y
         abajo, y el scale(1.04) que venia puesto empeoraba el corte. */
      object-fit: contain;
      object-position: right center;
    }
    /* Dos capas: el radial garantiza legibilidad del texto, el linear funde la
       pieza con el fondo oscuro. Se separan para poderlas ajustar por separado. */
    .hero-scrim {
      position: absolute;
      inset: 0;
      z-index: 1;
      background:
        radial-gradient(
          115% 90% at 18% 50%,
          rgba(10, 7, 5, 0.88) 0%,
          rgba(10, 7, 5, 0.55) 45%,
          rgba(10, 7, 5, 0) 78%
        ),
        linear-gradient(
          100deg,
          rgba(10, 7, 5, 0.92) 0%,
          rgba(10, 7, 5, 0.68) 32%,
          rgba(10, 7, 5, 0.3) 62%,
          rgba(10, 7, 5, 0) 100%
        );
    }
    /* El bloque de abajo es claro, asi que el fundido va a crema. Con negro
       queda un corte duro entre las dos secciones. */
    .hero-fade {
      position: absolute;
      inset: auto 0 0 0;
      height: 22%;
      z-index: 1;
      background: linear-gradient(to bottom, rgba(250, 246, 240, 0) 0%, var(--cream) 100%);
    }
    .hero-content {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 1100px;
      margin-inline: auto;
      padding: 4rem 20px 7rem;
    }
    .hero-inner {
      max-width: 620px;
      text-align: left;
    }
    /* Sin recuadro: solo una linea fina antes del texto. */
    .hero-kicker {
      display: inline-flex;
      align-items: center;
      gap: 14px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.25em;
      color: #c9b089;
      margin-bottom: 1.5rem;
      font-weight: 500;
    }
    .hero-kicker::before {
      content: '';
      width: 32px;
      height: 1px;
      background: rgba(212, 160, 23, 0.55);
      flex: none;
    }
    .hero-title {
      font-family: var(--font-heading);
      font-size: clamp(3rem, 7.5vw, 5.5rem);
      font-weight: 400;
      line-height: 1.02;
      letter-spacing: -0.015em;
      color: #fff;
      margin-bottom: 1.25rem;
    }
    /* El BlurText parte el h1 en spans: el serif tiene que llegar hasta ahi. */
    .hero-title ::ng-deep span {
      font-family: var(--font-heading);
      font-weight: 400;
    }
    .hero-tagline {
      font-size: 1.05rem;
      font-weight: 300;
      line-height: 1.75;
      color: #d6cec3;
      max-width: 46ch;
      margin-bottom: 2.5rem;
    }
    .hero-actions {
      display: flex;
      gap: 14px;
      flex-wrap: wrap;
    }
    /* Sin border-radius: el corte recto es lo que separa esto de una landing
       generica. */
    .btn-hero {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 15px 34px;
      font-size: 0.8rem;
      font-weight: 500;
      font-family: inherit;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      text-decoration: none;
      border: 1px solid transparent;
      cursor: pointer;
      transition: background-color 0.35s ease, border-color 0.35s ease,
        color 0.35s ease, transform 0.35s ease, box-shadow 0.35s ease;
    }
    .btn-hero--primary {
      background: #c5a880;
      color: #1a1410;
      border-color: #c5a880;
    }
    .btn-hero--primary:hover {
      background: #d8bd97;
      border-color: #d8bd97;
      transform: translateY(-2px);
      box-shadow: 0 10px 28px rgba(197, 168, 128, 0.26);
    }
    .btn-hero--ghost {
      background: rgba(255, 255, 255, 0.06);
      color: #fff;
      border-color: rgba(255, 255, 255, 0.22);
      -webkit-backdrop-filter: blur(10px);
      backdrop-filter: blur(10px);
    }
    .btn-hero--ghost:hover {
      background: rgba(255, 255, 255, 0.12);
      border-color: rgba(255, 255, 255, 0.4);
      transform: translateY(-2px);
    }
    /* Barra inferior: separa con una linea, no con cajas. */
    .hero-bar {
      position: absolute;
      inset: auto 0 0 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 2rem;
      width: 100%;
      max-width: 1100px;
      margin-inline: auto;
      padding: 1.5rem 20px 2rem;
    }
    .hero-features {
      display: flex;
      align-items: center;
      gap: 0;
      list-style: none;
      margin: 0;
      padding: 0;
      flex-wrap: wrap;
    }
    .hero-features li {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 1.75rem;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: #a99c8c;
    }
    /* Separadores finos entre insignias: el primero y el ultimo no llevan. */
    .hero-features li + li {
      border-left: 1px solid rgba(255, 255, 255, 0.1);
    }
    .hero-features i {
      font-size: 0.8rem;
      color: #c9b089;
    }
    .hero-scroll {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: none;
      font-size: 0.65rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
      color: rgba(255, 255, 255, 0.45);
    }
    .hero-scroll i {
      animation: heroScrollBounce 2.4s ease-in-out infinite;
    }
    @keyframes heroScrollBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(5px); }
    }

    .features { padding: clamp(4rem, 7vw, 6rem) 0 clamp(3rem, 5vw, 4.5rem); background: var(--cream); }
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
      grid-template-columns: repeat(2, minmax(0, 1fr));
      column-gap: clamp(1.5rem, 4vw, 3.5rem);
      margin-top: 1.75rem;
      border-top: 1px solid var(--border);
    }
    .fact-chip {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.25rem 0;
      border-bottom: 1px solid var(--border);
    }
    .fact-chip i {
      flex: 0 0 1.25rem;
      margin-top: 0.2rem;
      font-size: 1rem;
      color: var(--gold-dark);
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
      color: var(--dark);
    }
    .fact-text {
      font-size: 0.78rem;
      line-height: 1.45;
      color: var(--text-light);
    }

    /* La seccion va a sangre arriba porque el ScrollExpand necesita el alto
       completo, y el resto del contenido se mete en un .container propio. */
    .rooms { padding: 0 0 clamp(3rem, 6vw, 5rem); }
    .rooms > .container { padding-top: clamp(2rem, 5vw, 4rem); }
    .rooms .section-header { text-align: left; margin: 0 0 1.25rem; }
    .rooms .section-header h3 {
      margin: 0;
      font-family: var(--font-heading);
      font-size: clamp(1.8rem, 3.2vw, 2.5rem);
      font-weight: 500;
    }
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
      padding: 1.25rem 0;
      border-top: 1px solid var(--border-strong);
      border-bottom: 1px solid var(--border);
      background: transparent;
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
      padding: clamp(4rem, 7vw, 6rem) 0;
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

    /* ---------------------------------------------------------------- reviews */
    .reviews {
      padding: clamp(4rem, 7vw, 6rem) 0;
      background: var(--cream);
    }
    .reviews .section-header { margin-bottom: 8px; }
    .reviews-score {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 0.9rem;
      color: var(--text-light);
    }
    .reviews-score i { color: var(--gold); }
    .reviews-score strong { color: var(--dark); }
    .reviews-layout {
      display: grid;
      grid-template-columns: 0.9fr 1.1fr;
      align-items: center;
      gap: 3rem;
      margin-top: 2.5rem;
    }
    /* Alto fijo: la rueda posiciona cada nombre sobre una curva y necesita
       saber cuanto alto tiene disponible. */
    .reviews-wheel {
      height: 400px;
      position: relative;
    }
    .review-card {
      margin: 0;
      padding: 2.25rem 2rem;
      background: transparent;
      border-radius: 0;
      border-left: 1px solid var(--gold);
      border-top: 1px solid var(--border);
      border-bottom: 1px solid var(--border);
      box-shadow: none;
      min-height: 220px;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
    .review-stars {
      display: flex;
      gap: 3px;
      color: var(--gold);
      font-size: 0.95rem;
      margin-bottom: 1rem;
    }
    .review-stars .far { color: rgba(26, 20, 16, 0.18); }
    .review-card blockquote {
      margin: 0 0 1.25rem;
      font-size: 1.05rem;
      line-height: 1.7;
      font-weight: 300;
      color: var(--dark);
    }
    .review-card figcaption {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
      flex-wrap: wrap;
    }
    .review-author {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--dark);
    }
    .review-via {
      font-size: 0.75rem;
      color: var(--text-light);
    }
    .reviews-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      margin-top: 1.75rem;
    }
    .review-nav {
      width: 38px;
      height: 38px;
      border-radius: 50%;
      border: 1px solid var(--border-strong);
      background: transparent;
      color: var(--dark);
      cursor: pointer;
      transition: var(--transition);
    }
    .review-nav:hover {
      border-color: var(--gold);
      color: var(--gold-dark);
      transform: translateY(-2px);
    }
    .reviews-hint {
      font-size: 0.78rem;
      color: var(--text-light);
      margin-left: 0.5rem;
    }

    .location-section {
      position: relative;
      overflow: hidden;
      padding: clamp(4rem, 8vw, 7rem) 0;
      background:
        radial-gradient(ellipse at 78% 50%, rgba(197, 168, 128, 0.09), transparent 48%),
        var(--dark);
      color: #fff;
    }
    .location-layout {
      display: grid;
      grid-template-columns: minmax(260px, 0.78fr) minmax(0, 1.22fr);
      align-items: center;
      gap: clamp(2rem, 6vw, 5rem);
    }
    .location-copy .section-tag {
      display: inline-block;
      margin-bottom: 1.25rem;
      color: #c5a880;
      font-size: 0.7rem;
      font-weight: 500;
      letter-spacing: 0.22em;
      text-transform: uppercase;
    }
    .location-copy h2 {
      margin-bottom: 1rem;
      color: #fff;
      font-family: var(--font-heading);
      font-size: clamp(2.3rem, 4.2vw, 3.6rem);
      font-weight: 400;
      line-height: 1.08;
    }
    .location-copy > p {
      margin-bottom: 0.45rem;
      color: #e6ddd1;
      font-size: 1rem;
      letter-spacing: 0.03em;
    }
    .location-address {
      display: block;
      color: rgba(255, 255, 255, 0.58);
      font-size: 0.88rem;
      line-height: 1.7;
    }
    .location-link {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      margin-top: 1.75rem;
      padding-bottom: 0.55rem;
      border-bottom: 1px solid rgba(197, 168, 128, 0.6);
      color: #d7bd98;
      font-size: 0.76rem;
      font-weight: 500;
      letter-spacing: 0.12em;
      text-decoration: none;
      text-transform: uppercase;
      transition: color 0.25s ease, border-color 0.25s ease;
    }
    .location-link:hover {
      border-color: #fff;
      color: #fff;
    }
    .location-link i {
      font-size: 0.7rem;
    }
    .location-map {
      position: relative;
      overflow: hidden;
      min-height: 360px;
      aspect-ratio: 1.55;
      border: 1px solid rgba(215, 189, 152, 0.42);
      background: #211b16;
      box-shadow: 0 24px 70px rgba(0, 0, 0, 0.32);
    }
    .location-map::before {
      position: absolute;
      z-index: 1;
      pointer-events: none;
      content: '';
      inset: 0;
      box-shadow: inset 0 0 0 6px rgba(26, 20, 16, 0.08);
    }
    .location-map iframe {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 360px;
      border: 0;
    }

    @media (max-width: 1024px) {
      .rooms-carousel { height: 430px; }
    }
    @media (max-width: 768px) {
      .features { padding-top: 3.5rem; }
      .services-facts { grid-template-columns: 1fr; }
      .fact-chip { padding: 1rem 0; }
      .location-layout { grid-template-columns: 1fr; gap: 2rem; }
      .location-map { min-height: 300px; aspect-ratio: 1.2; }
      .location-map iframe { min-height: 300px; }
      /* En vertical la foto 3:2 contenida deja una banda angosta. Va anclada
         arriba, sobre negro, y el texto queda debajo: mejor que estirarla y
         cortar la pieza. */
      .hero-figure {
        inset: 76px 0 auto 0;
        height: 34vh;
      }
      .hero-img {
        object-position: 50% 0%;
      }
      .hero-scrim {
        background:
          radial-gradient(120% 55% at 50% 22%, rgba(10, 7, 5, 0.55) 0%, rgba(10, 7, 5, 0.15) 70%, rgba(10, 7, 5, 0) 100%),
          linear-gradient(180deg, rgba(10, 7, 5, 0.35) 0%, rgba(10, 7, 5, 0.75) 45%, rgba(10, 7, 5, 0.9) 100%);
      }
      .hero-content {
        padding: 3rem 20px 9rem;
      }
      .hero-inner {
        text-align: center;
      }
      .hero-kicker {
        font-size: 0.62rem;
        letter-spacing: 0.2em;
      }
      .hero-title { font-size: 2.6rem; }
      .hero-tagline {
        margin-inline: auto;
        margin-bottom: 2rem;
        font-size: 0.95rem;
      }
      .hero-actions {
        flex-direction: column;
        align-items: stretch;
      }
      .btn-hero { padding: 14px 24px; }
      /* La barra pasa a columna y se apila arriba del scroll, que en mobile
         compite por el mismo espacio. */
      .hero-bar {
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem 20px 1.5rem;
      }
      .hero-features {
        justify-content: center;
        gap: 0.5rem 0;
      }
      .hero-features li {
        padding: 0 0.85rem;
        font-size: 0.6rem;
        letter-spacing: 0.08em;
      }
      .hero-features li + li {
        border-left: none;
      }
      .hero-features li:not(:last-child)::after {
        content: '';
        display: inline-block;
        width: 1px;
        height: 9px;
        margin-left: 0.85rem;
        background: rgba(255, 255, 255, 0.12);
        vertical-align: middle;
      }
      .hero-scroll { display: none; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero-scroll i { animation: none; }
      .btn-hero { transition: none; }
    }
    @media (max-width: 768px) {
      .services-carousel { height: 400px; margin-inline: -0.5rem; }
      .rooms-carousel { height: 340px; }
      .rooms-foco { flex-direction: column; align-items: flex-start; }
      .rooms-foco-accion { width: 100%; justify-content: space-between; }
      .hotel-details { grid-template-columns: 1fr; }
      .border-glow-card__content { padding: 1.75rem 1.25rem; }
      .reviews-layout { grid-template-columns: 1fr; gap: 1.5rem; }
      .reviews-wheel { height: 260px; }
      .review-card { padding: 1.75rem 1.25rem; }
      .reviews-hint { display: none; }
    }
  `
})
export class HomeComponent implements OnInit {
  private hotelService = inject(HotelService);
  private habitacionService = inject(HabitacionService);
  private imagenes = inject(HabitacionImagenService);

  /** Necesario para mover la rueda desde los botones prev/next. */
  readonly optionWheel = viewChild(OptionWheelComponent);

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
    this.destacadas()
      .filter((h) => this.imagenes.tieneImagen(h))
      .map((h) => ({
        image: this.imagenes.imagenPara(h),
        alt: h.nombre,
        hab: h,
      })),
  );

  /** Servicios del hotel mostrados en el carrusel circular. */
  serviciosItems: CircularCarouselItem[] = [
    { src: '/assets/ubicacion.jpg', alt: 'Ubicación del hotel sobre la ruta', title: 'Ubicación', subtitle: 'En el corazón de la Patagonia, con acceso a los principales atractivos.' },
    { src: '/assets/desayuno.jpg', alt: 'Desayuno dentro de la habitación', title: 'Desayuno en la habitación', subtitle: 'Pava eléctrica, jarra con agua potable, té, café y galletitas.' },
    { src: '/assets/confort.jpg', alt: 'Habitación del hotel', title: 'Confort', subtitle: 'Habitaciones modernas y equipadas para una estadía inolvidable.' },
    { src: '/assets/estacionamiento.jpeg', alt: 'Estacionamiento del hotel', title: 'Estacionamiento', subtitle: 'Incluido en el precio de tu estadía.' },
    { src: '/assets/svc-wifi.jpg', alt: 'Conexión wifi', title: 'Wifi gratis', subtitle: 'Conexión inalámbrica de alta velocidad en todo el hotel.' },
    { src: '/assets/svc-atencion.jpg', alt: 'Recepción del hotel', title: 'Atención', subtitle: 'Un equipo dedicado a hacer que te sientas como en casa.' },
  ];

  onCarouselChange({ item }: { index: number; item: DepthCarouselItem }) {
    this.habFoco.set((item['hab'] as Habitacion | undefined) ?? null);
  }

  /* ------------------------------------------------------------- reviews */
  resenias = signal<Resenia[]>(RESENIAS);
  reseniaIdx = signal(0);

  /** Nombres para el OptionWheel: son los items de la rueda. */
  reseniasNombres = computed(() => this.resenias().map((r) => r.autor));

  /** La reseña que se muestra en la tarjeta, sincronizada con la rueda. */
  reseniaActiva = computed(() => this.resenias()[this.reseniaIdx()] ?? null);

  /** 3.8 sobre 199, segun el resumen de Google Maps. Sin datos, no promedia. */
  readonly PUNTUACION_GOOGLE = 3.8;
  readonly TOTAL_OPINIONES = 199;

  totalResenias() {
    return this.TOTAL_OPINIONES;
  }

  promedioResenias() {
    return this.PUNTUACION_GOOGLE.toFixed(1);
  }

  onReseniaChange({ index }: { index: number; item: string }) {
    this.reseniaIdx.set(index);
  }

  /** Botones prev/next: con loop:true siempre hay una reseña a la que moverse. */
  moverResenia(delta: number) {
    const n = this.resenias().length;
    if (!n) return;
    this.reseniaIdx.set((this.reseniaIdx() + delta + n) % n);
    this.optionWheel()?.select(this.reseniaIdx());
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
        this.destacadas.set(
          data.filter((h) => this.imagenes.tieneImagen(h)).slice(0, this.CUANTAS_DESTACADAS)
        );
      },
    });
  }
}
