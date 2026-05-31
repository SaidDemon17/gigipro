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
  }, 4000);
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
  
  const homeHTML = `...`; // Tu HTML existente aquí (no cambio nada)
  
  document.getElementById('page-home').innerHTML = homeHTML;
  
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
window.scrollInfiniteCarousel = scrollInfiniteCarousel;
window.initCarousels = initCarousels;
window.stopAllCarousels = stopAllCarousels;
