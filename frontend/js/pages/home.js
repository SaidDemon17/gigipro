// frontend/js/pages/home.js

// ============================================
// FUNCIÓN DE TARJETA SIMPLE
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
  
    // ✅ Corregido
  // ❌ Línea problemática (aprox. línea 25)
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
// VARIABLES GLOBALES DEL CARRUSEL
// ============================================
let carouselIntervals = {};
let carouselPositions = {};

// Inicializar carrusel con efecto infinito (duplicando tarjetas)
function initInfiniteCarousel(trackId, cardsCount) {
  const track = document.getElementById(trackId);
  if (!track || cardsCount === 0) return false;
  
  // Guardar el HTML original
  const originalHTML = track.innerHTML;
  
  // Duplicar las tarjetas 3 veces para efecto infinito
  track.innerHTML = originalHTML + originalHTML + originalHTML;
  
  // Calcular ancho de una tarjeta (280px + gap 20px = 300px)
  const cardWidth = 300;
  
  // Posición inicial: comenzar en el segundo set (índice cardsCount)
  const initialPosition = -cardWidth * cardsCount;
  track.style.transform = `translateX(${initialPosition}px)`;
  track.style.transition = 'transform 0.5s ease-in-out';
  
  // Guardar estado
  carouselPositions[trackId] = {
    position: initialPosition,
    index: 0,
    cardWidth: cardWidth,
    cardsCount: cardsCount
  };
  
  return true;
}

// Scroll del carrusel con efecto infinito
function scrollInfiniteCarousel(trackId, direction) {
  const track = document.getElementById(trackId);
  if (!track) return;
  
  const state = carouselPositions[trackId];
  if (!state) return;
  
  const { cardWidth, cardsCount } = state;
  let currentPosition = state.position;
  let newPosition = currentPosition - (cardWidth * direction);
  
  // Umbral para resetear (cuando pasa los límites)
  const threshold = cardWidth * cardsCount;
  
  // Efecto infinito: si pasa el límite inferior (muy a la derecha)
  if (newPosition <= -threshold * 2) {
    // Saltar al segundo set sin animación
    track.style.transition = 'none';
    newPosition = -threshold;
    track.style.transform = `translateX(${newPosition}px)`;
    // Forzar reflow
    track.offsetHeight;
    track.style.transition = 'transform 0.5s ease-in-out';
  }
  // Si pasa el límite superior (muy a la izquierda)
  else if (newPosition > -threshold) {
    track.style.transition = 'none';
    newPosition = -threshold * 2 + (cardWidth * direction);
    track.style.transform = `translateX(${newPosition}px)`;
    track.offsetHeight;
    track.style.transition = 'transform 0.5s ease-in-out';
  }
  
  // Aplicar movimiento
  track.style.transform = `translateX(${newPosition}px)`;
  carouselPositions[trackId].position = newPosition;
}

// Iniciar auto-scroll con pausa al hover
function startInfiniteAutoScroll(trackId, direction = 1) {
  if (carouselIntervals[trackId]) {
    clearInterval(carouselIntervals[trackId]);
  }
  
  carouselIntervals[trackId] = setInterval(() => {
    const track = document.getElementById(trackId);
    if (!track) return;
    
    // Pausar si el mouse está sobre el carrusel
    const carouselWrapper = track.closest('.carousel-section');
    if (carouselWrapper && carouselWrapper.matches(':hover')) {
      return;
    }
    
    scrollInfiniteCarousel(trackId, direction);
  }, 2000);
}

// Detener auto-scroll
function stopInfiniteAutoScroll(trackId) {
  if (carouselIntervals[trackId]) {
    clearInterval(carouselIntervals[trackId]);
    delete carouselIntervals[trackId];
  }
}

// Inicializar todos los carruseles
function initCarousels() {
  console.log('🚀 Inicializando carruseles infinitos');
  
  const lostTrack = document.getElementById('home-lost-track');
  const foundTrack = document.getElementById('home-found-track');
  
  if (lostTrack && carouselPositions['home-lost-track']?.cardsCount > 0) {
    const count = carouselPositions['home-lost-track'].cardsCount;
    initInfiniteCarousel('home-lost-track', count);
    startInfiniteAutoScroll('home-lost-track', 1);
    
    // Eventos de pausa al hover
    const lostSection = lostTrack.closest('.carousel-section');
    if (lostSection) {
      lostSection.addEventListener('mouseenter', () => {
        stopInfiniteAutoScroll('home-lost-track');
      });
      lostSection.addEventListener('mouseleave', () => {
        startInfiniteAutoScroll('home-lost-track', 1);
      });
    }
  }
  
  if (foundTrack && carouselPositions['home-found-track']?.cardsCount > 0) {
    const count = carouselPositions['home-found-track'].cardsCount;
    initInfiniteCarousel('home-found-track', count);
    startInfiniteAutoScroll('home-found-track', 1);
    
    const foundSection = foundTrack.closest('.carousel-section');
    if (foundSection) {
      foundSection.addEventListener('mouseenter', () => {
        stopInfiniteAutoScroll('home-found-track');
      });
      foundSection.addEventListener('mouseleave', () => {
        startInfiniteAutoScroll('home-found-track', 1);
      });
    }
  }
}

// Detener todos los carruseles (útil al cambiar de página)
function stopAllCarousels() {
  Object.keys(carouselIntervals).forEach(key => {
    clearInterval(carouselIntervals[key]);
  });
  carouselIntervals = {};
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
  
  // Detener carruseles anteriores antes de rerenderizar
  stopAllCarousels();
  
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const allDogs = window.ALL_DOGS || [];
  console.log('📊 allDogs:', allDogs.length);
  
  const stats = await getStats();
  
  // ============================================
  // CALCULAR TODAS LAS VARIABLES PRIMERO
  // ============================================
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
  
  // Ordenar reunidos (más recientes primero)
const recentReunited = [...allDogs]
  .filter(d => d.status === 'reunited')
  .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
  .slice(0, 5);
  
  let top3 = [];
  if (typeof getRanking === 'function') {
    const ranking = await getRanking();
    top3 = ranking.slice(0, 3);
  }
  
  // Guardar cantidad de tarjetas para los carruseles
  const lostCardsCount = recentLost.length;
  const foundCardsCount = recentFound.length;
  
  // Guardar en carouselPositions para usarlos después
  carouselPositions['home-lost-track'] = { cardsCount: lostCardsCount, position: 0, cardWidth: 300, index: 0 };
  carouselPositions['home-found-track'] = { cardsCount: foundCardsCount, position: 0, cardWidth: 300, index: 0 };
  
  // Generar HTML de las tarjetas
  let lostCardsHtml = '';
  let foundCardsHtml = '';
  
  for (let i = 0; i < recentLost.length; i++) {
    lostCardsHtml += `<div class="carousel-card">${dogCardSimple(recentLost[i])}</div>`;
  }
  
  for (let i = 0; i < recentFound.length; i++) {
    foundCardsHtml += `<div class="carousel-card">${dogCardSimple(recentFound[i])}</div>`;
  }
  
  // ============================================
  // HTML COMPLETO - AHORA CON TODAS LAS VARIABLES DEFINIDAS
  // ============================================
  const homeHTML = `
    <div class="hero-new hero-reduced">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-logo">
          <img src="assets/images/logo.png" alt="PawFinder" class="hero-logo-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23E85D04%27/%3E%3Ctext x=%2750%27 y=%2770%27 font-size=%2750%27 text-anchor=%27middle%27 fill=%27white%27%3E🐾%3C/text%3E%3C/svg%3E'">
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

    <div class="section carousel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Perdidos Recientemente</div>
          <div class="section-sub">Ayuda a estos perros a encontrar su hogar</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showPage('lost')">Ver Todos →</button>
      </div>
      <div class="carousel-container">
        <button class="carousel-arrow prev-lost" onclick="scrollInfiniteCarousel('home-lost-track', -1)">‹</button>
        <div class="carousel-wrapper">
          <div class="carousel-track" id="home-lost-track">
            ${lostCardsHtml}
          </div>
        </div>
        <button class="carousel-arrow next-lost" onclick="scrollInfiniteCarousel('home-lost-track', 1)">›</button>
      </div>
    </div>

    <div class="section carousel-section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Deambulantes Recientemente</div>
          <div class="section-sub">¿Es alguno de estos tu amigo peludo?</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showPage('found')">Ver Todos →</button>
      </div>
      <div class="carousel-container">
        <button class="carousel-arrow prev-found" onclick="scrollInfiniteCarousel('home-found-track', -1)">‹</button>
        <div class="carousel-wrapper">
          <div class="carousel-track" id="home-found-track">
            ${foundCardsHtml}
          </div>
        </div>
        <button class="carousel-arrow next-found" onclick="scrollInfiniteCarousel('home-found-track', 1)">›</button>
      </div>
    </div>

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

    <div class="mission-full-section">
      <div class="mission-full-container">
        <div class="mission-full-text">
          <span class="mission-tag">🌟 Nuestra Razón de Ser</span>
          <h2>Una comunidad unida <span>para nunca rendirse</span></h2>
          <p>En PawFinder, sabemos que perder una mascota es como perder un familiar. Por eso creamos una plataforma que combina <strong>tecnología de inteligencia artificial</strong> con el <strong>poder de una comunidad solidaria</strong>.</p>
          <div class="mission-features">
            <div class="mission-feature"><div class="mission-feature-icon">🤖</div><div><h4>IA Avanzada</h4><p>Comparación inteligente de fotos y datos.</p></div></div>
            <div class="mission-feature"><div class="mission-feature-icon">📍</div><div><h4>Geolocalización</h4><p>Mapas interactivos cerca de ti.</p></div></div>
            <div class="mission-feature"><div class="mission-feature-icon">🏆</div><div><h4>Recompensas</h4><p>Gana puntos por ayudar.</p></div></div>
          </div>
        </div>
        <div class="mission-full-image">
          <div class="mission-stats-card">
            <div class="stat-circle"><div class="stat-circle-number">+92%</div><div class="stat-circle-label">Tasa de éxito</div></div>
            <div class="stat-circle"><div class="stat-circle-number">24h</div><div class="stat-circle-label">Respuesta promedio</div></div>
            <div class="stat-circle"><div class="stat-circle-number">+2.5k</div><div class="stat-circle-label">Miembros activos</div></div>
          </div>
        </div>
      </div>
    </div>

    <div class="how-section">
      <div class="how-title">Cómo Funciona</div>
      <div class="how-sub">Tres simples pasos para reunir a una familia</div>
      <div class="how-cards">
        <div class="how-card"><div class="how-card-step">PASO 1</div><div class="how-card-icon">📝</div><h3>Reportar</h3><p>Sube una foto y los detalles.</p></div>
        <div class="how-card"><div class="how-card-step">PASO 2</div><div class="how-card-icon">🤖</div><h3>Analizar</h3><p>IA compara con otros reportes.</p></div>
        <div class="how-card"><div class="how-card-step">PASO 3</div><div class="how-card-icon">💚</div><h3>Reencontrar</h3><p>Recibe notificaciones de coincidencias.</p></div>
      </div>
    </div>

    <div class="cta-section">
      <h2>¿Listo para Hacer la Diferencia?</h2>
      <p>Tu ayuda puede reunir a una familia con su mejor amigo.</p>
      <div class="cta-btns">
        <button class="btn btn-primary" onclick="showPage('report')">Reportar un Perro →</button>
        <button class="btn btn-outline" onclick="showPage('map')">📍 Explorar Mapa</button>
      </div>
    </div>

    <footer>
      <div class="footer-container">
        <div class="footer-grid">
          <div class="footer-col">
            <div class="footer-logo"><img src="assets/images/logo.png" alt="PawFinder" class="footer-logo-img" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27%3E%3Crect width=%27100%27 height=%27100%27 fill=%27%23E85D04%27/%3E%3Ctext x=%2750%27 y=%2770%27 font-size=%2750%27 text-anchor=%27middle%27 fill=%27white%27%3E🐾%3C/text%3E%3C/svg%3E'">PawFinder</div>
            <p class="footer-description">Conectando familias con sus mascotas perdidas.</p>
            <div class="footer-social"><a href="#" class="social-icon">📘</a><a href="#" class="social-icon">📷</a><a href="#" class="social-icon">🐦</a><a href="#" class="social-icon">💬</a></div>
          </div>
          <div class="footer-col"><h4>Plataforma</h4><ul><li><a href="#" onclick="showPage('lost')">Perros Perdidos</a></li><li><a href="#" onclick="showPage('found')">Perros Encontrados</a></li><li><a href="#" onclick="showPage('map')">Mapa</a></li><li><a href="#" onclick="showPage('ranking')">Ranking</a></li></ul></div>
          <div class="footer-col"><h4>Recursos</h4><ul><li><a href="#" onclick="showPage('report')">Reportar</a></li><li><a href="#" onclick="showPage('account')">Mi Cuenta</a></li></ul></div>
          <div class="footer-col"><h4>Contacto</h4><ul><li>📧 ayuda@pawfinder.com</li><li>📍 Lima, Perú</li></ul></div>
        </div>
        <div class="footer-bottom"><p>🐾 Hecho con amor - PawFinder 2026</p></div>
      </div>
    </footer>
  `;

  // Insertar HTML completo
  document.getElementById('page-home').innerHTML = homeHTML;
  console.log('✅ HTML completo insertado, longitud:', homeHTML.length);
  
  const reunitedContainer = document.getElementById('home-reunited-grid');
  if (reunitedContainer && recentReunited.length > 0) {
    reunitedContainer.innerHTML = recentReunited.map(dog => window.dogCard ? window.dogCard(dog, false) : '').join('');
  }
  
  // Inicializar carruseles después de renderizar
  setTimeout(() => {
    if (lostCardsCount > 0 || foundCardsCount > 0) {
      initCarousels();
    }
  }, 100);
}
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
window.scrollInfiniteCarousel = scrollInfiniteCarousel;
window.initCarousels = initCarousels;
window.stopAllCarousels = stopAllCarousels;
