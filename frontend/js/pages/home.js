// frontend/js/pages/home.js

// ============================================
// FUNCIÓN DE TARJETA SIMPLE (DEFINIDA LOCALMENTE POR SEGURIDAD)
// ============================================
function dogCardSimple(dog) {
  const hasPhotos = dog.photos && dog.photos.length > 0 && dog.photos[0];
  const firstPhoto = hasPhotos ? dog.photos[0] : null;
  const dogName = dog.name || 'Desconocido';
  
  let typeBadge = '';
  if (dog.status === 'reunited') {
    typeBadge = `<span class="badge badge-reunited">✅ REUNIDO</span>`;
  } else if (dog.type === 'lost') {
    typeBadge = `<span class="badge badge-lost">⚠️ PERDIDO</span>`;
  } else {
    typeBadge = `<span class="badge badge-found">📍 ENCONTRADO</span>`;
  }
  
  const imageHtml = firstPhoto 
    ? `<img src="${firstPhoto}" alt="${dogName}" style="width:100%; height:100%; object-fit:cover" onerror="this.onerror=null; this.parentElement.innerHTML='🐕'">`
    : `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:3rem">🐕</div>`;
  
  return `
    <div class="dog-card-simple" onclick="showDetail(${dog.id})">
      <div class="dog-card-img-simple">
        ${imageHtml}
      </div>
      <div class="dog-card-body-simple">
        <div class="dog-card-name-simple">
          <span class="dog-name">${dogName}</span>
          ${typeBadge}
        </div>
      </div>
    </div>
  `;
}

// ============================================
// CARRUSEL INFINITO
// ============================================

let carouselIntervals = {};
let carouselPositions = {};

function initCarousel(trackId, cards) {
  const track = document.getElementById(trackId);
  if (!track) return;
  
  // Duplicar tarjetas para efecto infinito (3 copias)
  const originalCards = track.innerHTML;
  track.innerHTML = originalCards + originalCards + originalCards;
  
  // Posición inicial: comenzar en el medio (segundo set)
  const cardWidth = 300; // 280 + 20 gap
  const initialPosition = -cardWidth * cards.length;
  track.style.transform = `translateX(${initialPosition}px)`;
  carouselPositions[trackId] = initialPosition;
  carouselPositions[`${trackId}_index`] = 0;
  
  return true;
}

function scrollCarousel(trackId, direction, cardsLength) {
  const track = document.getElementById(trackId);
  if (!track) return;
  
  const cardWidth = 300;
  let currentPosition = carouselPositions[trackId];
  let currentIndex = carouselPositions[`${trackId}_index`];
  
  let newIndex = currentIndex + direction;
  
  // Efecto infinito: si pasa los límites, saltar al otro extremo
  if (newIndex >= cardsLength) {
    newIndex = 0;
    // Saltar al principio del track sin animación
    track.style.transition = 'none';
    const newPosition = -cardWidth * cardsLength;
    track.style.transform = `translateX(${newPosition}px)`;
    carouselPositions[trackId] = newPosition;
    // Forzar reflow
    track.offsetHeight;
    track.style.transition = 'transform 0.5s ease-in-out';
    currentPosition = newPosition;
    currentIndex = 0;
    newIndex = 1;
  } else if (newIndex < 0) {
    newIndex = cardsLength - 1;
    track.style.transition = 'none';
    const newPosition = -cardWidth * cardsLength;
    track.style.transform = `translateX(${newPosition}px)`;
    carouselPositions[trackId] = newPosition;
    track.offsetHeight;
    track.style.transition = 'transform 0.5s ease-in-out';
    currentPosition = newPosition;
    currentIndex = cardsLength - 1;
    newIndex = cardsLength - 2;
  }
  
  const newPosition = currentPosition - (cardWidth * direction);
  track.style.transform = `translateX(${newPosition}px)`;
  carouselPositions[trackId] = newPosition;
  carouselPositions[`${trackId}_index`] = newIndex;
}

function startAutoScroll(trackId, cardsLength) {
  if (carouselIntervals[trackId]) {
    clearInterval(carouselIntervals[trackId]);
  }
  
  carouselIntervals[trackId] = setInterval(() => {
    const wrapper = document.querySelector(`#${trackId}`)?.closest('.carousel-section');
    if (wrapper && wrapper.matches(':hover')) {
      return;
    }
    scrollCarousel(trackId, 1, cardsLength);
  }, 4000);
}

function stopAutoScroll(trackId) {
  if (carouselIntervals[trackId]) {
    clearInterval(carouselIntervals[trackId]);
  }
}

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

async function getStats() {
  try {
    const response = await fetch(`${API_URL}/api/stats`);
    const stats = await response.json();
    return stats;
  } catch (error) {
    console.error('Error obteniendo stats:', error);
    return { lost: 0, found: 0, reunited: 0 };
  }
}

async function renderHomeGrids() {
  console.log('🚀 renderHomeGrids iniciado');
  
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const allDogs = window.ALL_DOGS || [];
  console.log('📊 allDogs:', allDogs.length);
  
  const stats = await getStats();
  
  const totalReports = allDogs.length;
  const totalReunited = allDogs.filter(d => d.status === 'reunited').length;
  const activeUsers = JSON.parse(localStorage.getItem('pawfinder_users') || '[]').length;
  const uniqueLocations = [...new Set(allDogs.map(d => d.location_address?.split(',')[1]?.trim()).filter(Boolean))].length;
  
  // Filtrar perros con fechas válidas
  const currentYear = new Date().getFullYear();

  const allLost = allDogs.filter(d => 
    d.type === 'lost' && 
    d.status !== 'reunited' && 
    d.date && 
    !isNaN(new Date(d.date)) &&
    new Date(d.date).getFullYear() >= 2000 &&
    new Date(d.date).getFullYear() <= currentYear + 1
  );

  const allFound = allDogs.filter(d => 
    d.type === 'found' && 
    d.status !== 'reunited' && 
    d.date && 
    !isNaN(new Date(d.date)) &&
    new Date(d.date).getFullYear() >= 2000 &&
    new Date(d.date).getFullYear() <= currentYear + 1
  );

  const recentLost = [...allLost].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const recentFound = [...allFound].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  console.log('📢 recentLost (después de slice):', recentLost.length);
  console.log('📢 recentLost nombres:', recentLost.map(d => d.name));
  
  const recentReunited = [...allDogs]
    .filter(d => d.status === 'reunited')
    .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    .slice(0, 5);
  
  let top3 = [];
  if (typeof getRanking === 'function') {
    const ranking = await getRanking();
    top3 = ranking.slice(0, 3);
  }
  
  // Guardar copia local y generar HTML
  const lostPerros = [...recentLost];
  const foundPerros = [...recentFound];
  
  // Generar HTML de las tarjetas
  let lostCardsHtml = '';
  let foundCardsHtml = '';
  
  for (let i = 0; i < lostPerros.length; i++) {
    lostCardsHtml += `<div class="carousel-card">${dogCardSimple(lostPerros[i])}</div>`;
  }
  
  for (let i = 0; i < foundPerros.length; i++) {
    foundCardsHtml += `<div class="carousel-card">${dogCardSimple(foundPerros[i])}</div>`;
  }
  
  console.log('📢 lostCardsHtml generado:', lostCardsHtml.length, 'caracteres');
  console.log('📢 Número de tarjetas perdidas:', lostPerros.length);
  
  const homeHTML = `
    <!-- Hero Section -->
    <div class="hero-new hero-reduced">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-logo">
          <img src="assets/images/logo.png" alt="PawFinder" class="hero-logo-img">
        </div>
        <h1>Ayuda a reunir <span>perros perdidos</span><br>con sus familias</h1>
        <p>Únete a nuestra comunidad y utiliza nuestra inteligencia artificial para encontrar mascotas perdidas.</p>
        <div class="hero-buttons">
          <button class="btn btn-primary btn-large" onclick="showPage('report')">📝 Reportar Perro</button>
          <button class="btn btn-outline-light btn-large" onclick="showPage('lost')">🔍 Buscar Perros</button>
        </div>
        <div class="hero-search">
          <div class="hero-search-icon">🔍</div>
          <input type="text" placeholder="Busca por nombre, raza o distrito..." id="hero-search-input" onkeypress="handleHeroSearch(event)"/>
          <button class="hero-search-btn" onclick="searchHomeDogs()">Buscar</button>
        </div>
      </div>
    </div>

    <!-- Stats Reales -->
    <div class="hero-stats">
      <div class="hero-stats-container">
        <div class="hero-stat">
          <div class="hero-stat-number">${totalReports}</div>
          <div class="hero-stat-label">perros reportados</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-number">${totalReunited}</div>
          <div class="hero-stat-label">perros reunidos</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-number">${activeUsers || 150}</div>
          <div class="hero-stat-label">usuarios activos</div>
        </div>
        <div class="hero-stat">
          <div class="hero-stat-number">${uniqueLocations || 25}</div>
          <div class="hero-stat-label">distritos cubiertos</div>
        </div>
      </div>
    </div>

    <!-- Recently Lost - Carrusel Horizontal -->
    <div class="section carousel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Perdidos Recientemente</div>
          <div class="section-sub">Ayuda a estos perros a encontrar su hogar</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showPage('lost')">Ver Todos →</button>
      </div>
      <div class="carousel-container">
        <button class="carousel-arrow prev-lost" onclick="scrollCarousel('home-lost-track', -1)">‹</button>
        <div class="carousel-wrapper">
          <div class="carousel-track" id="home-lost-track">
            ${lostCardsHtml}
          </div>
        </div>
        <button class="carousel-arrow next-lost" onclick="scrollCarousel('home-lost-track', 1)">›</button>
      </div>
    </div>

    <!-- Recently Found - Carrusel Horizontal -->
    <div class="section carousel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Encontrados Recientemente</div>
          <div class="section-sub">¿Es alguno de estos tu amigo peludo?</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showPage('found')">Ver Todos →</button>
      </div>
      <div class="carousel-container">
        <button class="carousel-arrow prev-found" onclick="scrollCarousel('home-found-track', -1)">‹</button>
        <div class="carousel-wrapper">
          <div class="carousel-track" id="home-found-track">
            ${foundCardsHtml}
          </div>
        </div>
        <button class="carousel-arrow next-found" onclick="scrollCarousel('home-found-track', 1)">›</button>
      </div>
    </div>

    <!-- Recently Reunited -->
    ${recentReunited.length > 0 ? `
    <div class="section reunited-section">
      <div class="section-header">
        <div>
          <div class="section-title">🎉 Reunidos Recientemente</div>
          <div class="section-sub">¡Estos perros ya están en casa! Gracias por ayudar.</div>
        </div>
      </div>
      <div class="dogs-grid" id="home-reunited-grid"></div>
    </div>
    ` : ''}

    <!-- Nuestra Misión -->
    <div class="mission-full-section">
      <div class="mission-full-container">
        <div class="mission-full-text">
          <span class="mission-tag">🌟 Nuestra Razón de Ser</span>
          <h2>Una comunidad unida <span>para nunca rendirse</span></h2>
          <p>En PawFinder, sabemos que perder una mascota es como perder un familiar. Por eso creamos una plataforma que combina <strong>tecnología de inteligencia artificial</strong> con el <strong>poder de una comunidad solidaria</strong>. Juntos, podemos acortar distancias y acelerar los reencuentros.</p>
          <div class="mission-features">
            <div class="mission-feature">
              <div class="mission-feature-icon">🤖</div>
              <div>
                <h4>IA Avanzada</h4>
                <p>Comparación inteligente de fotos y datos para encontrar coincidencias.</p>
              </div>
            </div>
            <div class="mission-feature">
              <div class="mission-feature-icon">📍</div>
              <div>
                <h4>Geolocalización</h4>
                <p>Mapas interactivos para ver perros perdidos cerca de ti.</p>
              </div>
            </div>
            <div class="mission-feature">
              <div class="mission-feature-icon">🏆</div>
              <div>
                <h4>Recompensas</h4>
                <p>Gana puntos y reconocimiento por ayudar a reunir familias.</p>
              </div>
            </div>
          </div>
        </div>
        <div class="mission-full-image">
          <div class="mission-stats-card">
            <div class="stat-circle">
              <div class="stat-circle-number">+92%</div>
              <div class="stat-circle-label">Tasa de éxito</div>
            </div>
            <div class="stat-circle">
              <div class="stat-circle-number">24h</div>
              <div class="stat-circle-label">Respuesta promedio</div>
            </div>
            <div class="stat-circle">
              <div class="stat-circle-number">+2.5k</div>
              <div class="stat-circle-label">Miembros activos</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- How It Works -->
    <div class="how-section">
      <div class="how-title">Cómo Funciona</div>
      <div class="how-sub">Tres simples pasos para reunir a una familia</div>
      <div class="how-cards">
        <div class="how-card">
          <div class="how-card-step">PASO 1</div>
          <div class="how-card-icon">📝</div>
          <h3>Reportar</h3>
          <p>Sube una foto y los detalles de tu mascota perdida o encontrada.</p>
        </div>
        <div class="how-card">
          <div class="how-card-step">PASO 2</div>
          <div class="how-card-icon">🤖</div>
          <h3>Analizar</h3>
          <p>Nuestra IA compara la información con otros reportes en tu zona.</p>
        </div>
        <div class="how-card">
          <div class="how-card-step">PASO 3</div>
          <div class="how-card-icon">💚</div>
          <h3>Reencontrar</h3>
          <p>Recibe notificaciones de posibles coincidencias y actúa rápido.</p>
        </div>
      </div>
    </div>

    <!-- Community Section -->
    <div class="community-section">
      <div class="community-inner">
        <div class="community-text">
          <h2>Recuperación de Mascotas<br><span>Impulsada por la Comunidad</span></h2>
          <p>Únete a miles de amantes de mascotas trabajando juntos para reunir perros perdidos con sus familias. Cada contribución cuenta.</p>
          <ul class="feature-list">
            <li class="feature-item">
              <div class="feature-icon">📍</div>
              <div>
                <div class="feature-name">Mapa Interactivo</div>
                <div class="feature-desc">Visualiza perros perdidos y encontrados en tiempo real.</div>
              </div>
            </li>
            <li class="feature-item">
              <div class="feature-icon">🏆</div>
              <div>
                <div class="feature-name">Gana Recompensas</div>
                <div class="feature-desc">Obtén puntos y sube en el ranking por ayudar.</div>
              </div>
            </li>
            <li class="feature-item">
              <div class="feature-icon">💬</div>
              <div>
                <div class="feature-name">Soporte Comunitario</div>
                <div class="feature-desc">Comentarios y consejos de otros usuarios.</div>
              </div>
            </li>
          </ul>
        </div>
        <div class="mini-leaderboard">
          <div class="leaderboard-header">🏆 Top Rescatadores</div>
          ${top3.map((user, index) => {
            const rankClass = index === 0 ? 'r1' : index === 1 ? 'r2' : 'r3';
            const rankIcon = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
            return `
              <div class="mini-lb-row">
                <div class="mini-rank lb-rank ${rankClass}">${rankIcon}</div>
                <div style="flex:1">
                  <div style="font-weight:700">${user.name}</div>
                  <div style="font-size:.78rem;color:var(--gray-600)">${user.level || 'Rescatador'}</div>
                </div>
                <div style="font-weight:700;color:var(--primary)">${user.points} pts</div>
              </div>
            `;
          }).join('')}
          <button class="btn btn-outline" style="width:100%;margin-top:14px" onclick="showPage('ranking')">Ver Ranking →</button>
        </div>
      </div>
    </div>

    <!-- CTA Section -->
    <div class="cta-section">
      <h2>¿Listo para Hacer la Diferencia?</h2>
      <p>Tu ayuda puede reunir a una familia con su mejor amigo.</p>
      <div class="cta-btns">
        <button class="btn btn-primary" onclick="showPage('report')">Reportar un Perro →</button>
        <button class="btn btn-outline" onclick="showPage('map')">📍 Explorar Mapa</button>
      </div>
    </div>

    <!-- Footer -->
    <footer>
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="footer-logo">
              <img src="assets/images/logo.png" alt="PawFinder" class="footer-logo-img">
              PawFinder
            </div>
            <p class="footer-description">Conectando familias con sus mascotas perdidas mediante tecnología de inteligencia artificial y una comunidad solidaria.</p>
            <div class="footer-social">
              <a href="#" class="social-icon">📘</a>
              <a href="#" class="social-icon">📷</a>
              <a href="#" class="social-icon">🐦</a>
              <a href="#" class="social-icon">💬</a>
            </div>
          </div>
          <div class="footer-col">
            <h4>Plataforma</h4>
            <ul>
              <li><a href="#" onclick="showPage('lost')">Perros Perdidos</a></li>
              <li><a href="#" onclick="showPage('found')">Perros Encontrados</a></li>
              <li><a href="#" onclick="showPage('map')">Mapa Interactivo</a></li>
              <li><a href="#" onclick="showPage('ranking')">Ranking</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Recursos</h4>
            <ul>
              <li><a href="#" onclick="showPage('report')">Reportar un Perro</a></li>
              <li><a href="#" onclick="showPage('account')">Mi Cuenta</a></li>
              <li><a href="#">Preguntas Frecuentes</a></li>
              <li><a href="#">Términos y Condiciones</a></li>
            </ul>
          </div>
          <div class="footer-col">
            <h4>Contacto</h4>
            <ul>
              <li>📧 ayuda@pawfinder.com</li>
              <li>📞 +51 1 234 5678</li>
              <li>📍 Lima, Perú</li>
            </ul>
            <div class="footer-newsletter">
              <p>Recibe notificaciones de perros perdidos en tu zona</p>
              <div class="newsletter-input">
                <input type="email" placeholder="Tu email">
                <button class="btn btn-primary btn-sm">Suscribirse</button>
              </div>
            </div>
          </div>
        </div>
        <div class="footer-bottom">
          <p>🐾 Hecho con amor para nuestros amigos peludos - PawFinder 2026</p>
        </div>
      </div>
    </footer>
  `;
  
  document.getElementById('page-home').innerHTML = homeHTML;
  
  // Después de document.getElementById('page-home').innerHTML = homeHTML

// Inicializar carruseles
setTimeout(() => {
  const lostTrack = document.getElementById('home-lost-track');
  const foundTrack = document.getElementById('home-found-track');
  const lostCardsCount = recentLost.length;
  const foundCardsCount = recentFound.length;
  
  if (lostTrack && lostCardsCount > 0) {
    initCarousel('home-lost-track', lostCardsCount);
    startAutoScroll('home-lost-track', lostCardsCount);
    
    // Eventos para pausar al hacer hover
    const lostSection = lostTrack.closest('.carousel-section');
    if (lostSection) {
      lostSection.addEventListener('mouseenter', () => stopAutoScroll('home-lost-track'));
      lostSection.addEventListener('mouseleave', () => startAutoScroll('home-lost-track', lostCardsCount));
    }
  }
  
  if (foundTrack && foundCardsCount > 0) {
    initCarousel('home-found-track', foundCardsCount);
    startAutoScroll('home-found-track', foundCardsCount);
    
    const foundSection = foundTrack.closest('.carousel-section');
    if (foundSection) {
      foundSection.addEventListener('mouseenter', () => stopAutoScroll('home-found-track'));
      foundSection.addEventListener('mouseleave', () => startAutoScroll('home-found-track', foundCardsCount));
    }
  }
}, 100);

// ============================================
// FUNCIONES DE BÚSQUEDA
// ============================================

function handleHeroSearch(event) {
  if (event.key === 'Enter') {
    searchHomeDogs();
  }
}

function searchHomeDogs() {
  const searchTerm = document.getElementById('hero-search-input')?.value.toLowerCase() || '';
  
  if (!searchTerm.trim()) {
    showToast('Escribe algo para buscar', '');
    return;
  }
  
  const allDogs = window.ALL_DOGS || [];
  
  const filtered = allDogs.filter(dog => {
    return (dog.name || '').toLowerCase().includes(searchTerm) ||
           (dog.breed || '').toLowerCase().includes(searchTerm) ||
           (dog.location || '').toLowerCase().includes(searchTerm) ||
           (dog.location_address || '').toLowerCase().includes(searchTerm);
  });
  
  if (filtered.length === 0) {
    showToast('No se encontraron perros con ese criterio', '');
    return;
  }
  
  const lostFiltered = filtered.filter(d => d.type === 'lost');
  const foundFiltered = filtered.filter(d => d.type === 'found');
  
  if (lostFiltered.length > 0) {
    window.tempFilteredLost = lostFiltered;
    showPage('lost');
    setTimeout(() => {
      if (typeof renderLostCards === 'function') renderLostCards(lostFiltered);
    }, 100);
  } else if (foundFiltered.length > 0) {
    window.tempFilteredFound = foundFiltered;
    showPage('found');
    setTimeout(() => {
      if (typeof renderFoundCards === 'function') renderFoundCards(foundFiltered);
    }, 100);
  }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.renderHomeGrids = renderHomeGrids;
window.handleHeroSearch = handleHeroSearch;
window.searchHomeDogs = searchHomeDogs;
window.scrollCarousel = scrollCarousel;
window.initCarousels = initCarousels;
