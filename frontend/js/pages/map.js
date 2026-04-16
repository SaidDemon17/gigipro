// js/pages/map.js
let mainMap = null;
let mapMarkers = [];

async function renderMapPage() {
  // Cargar reportes desde el backend
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  const allDogs = window.ALL_DOGS || [];
  
  const mapHTML = `
    <div class="map-page">
      <div class="map-sidebar">
        <h2>🗺️ Map View</h2>
        <div class="map-filter">
          <label>FILTER</label>
          <select id="map-filter-select" onchange="filterMapPins()">
            <option value="all">All Dogs</option>
            <option value="lost">Lost Dogs</option>
            <option value="found">Found Dogs</option>
          </select>
        </div>
        <div class="legend">
          <div style="font-size:.8rem;font-weight:600;text-transform:uppercase;letter-spacing:.04em;color:var(--gray-600);margin-bottom:10px">LEGEND</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--red)"></div>🔴 Lost Dog</div>
          <div class="legend-item"><div class="legend-dot" style="background:var(--gold)"></div>🟡 Found Dog</div>
        </div>
        <div id="map-dog-list" style="margin-top:20px; font-size:.85rem; color:var(--gray-600)">
          Loading dogs...
        </div>
      </div>
      <div class="map-area" id="map-area">
        <div id="map-container" style="height: 100%; width: 100%;"></div>
      </div>
    </div>
  `;
  
  document.getElementById('page-map').innerHTML = mapHTML;
  
  // Inicializar el mapa después de que el DOM esté listo
  setTimeout(() => {
    initMainMap();
    updateMapWithDogs(allDogs);
  }, 100);
}

function initMainMap() {
  // Coordenadas de Lima, Perú
  const limaLat = -12.0464;
  const limaLon = -77.0428;
  
  if (mainMap) {
    mainMap.remove();
  }
  
  mainMap = L.map('map-container').setView([limaLat, limaLon], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(mainMap);
}

function updateMapWithDogs(dogs) {
  const filter = document.getElementById('map-filter-select')?.value || 'all';
  
  let filteredDogs = dogs;
  if (filter === 'lost') {
    filteredDogs = dogs.filter(d => d.type === 'lost');
  } else if (filter === 'found') {
    filteredDogs = dogs.filter(d => d.type === 'found');
  }
  
  // Filtrar solo perros que tienen coordenadas
  const dogsWithLocation = filteredDogs.filter(d => d.location_lat && d.location_lon);
  
  // Actualizar contador
  const dogListDiv = document.getElementById('map-dog-list');
  if (dogListDiv) {
    dogListDiv.innerHTML = `<strong>${dogsWithLocation.length}</strong> dog(s) in this area.`;
  }
  
  // Limpiar marcadores existentes
  if (mapMarkers.length) {
    mapMarkers.forEach(marker => mainMap.removeLayer(marker));
    mapMarkers = [];
  }
  
  // Agregar nuevos marcadores
  dogsWithLocation.forEach(dog => {
    const markerColor = dog.type === 'lost' ? 'red' : 'gold';
    const popupContent = `
      <div style="min-width: 150px;">
        <strong>${dog.name || 'Unknown'}</strong><br/>
        <span style="color: ${dog.type === 'lost' ? '#C0392B' : '#B7860B'}">
          ${dog.type === 'lost' ? '🔴 LOST' : '🟡 FOUND'}
        </span><br/>
        📍 ${dog.location || dog.location_address || 'Unknown'}<br/>
        📅 ${formatDate(dog.date)}<br/>
        <button onclick="showDetail(${dog.id})" style="margin-top:8px; padding:4px 12px; background:#C0392B; color:white; border:none; border-radius:6px; cursor:pointer;">
          View Details
        </button>
      </div>
    `;
    
    const marker = L.marker([dog.location_lat, dog.location_lon], {
      icon: L.divIcon({
        className: 'custom-marker',
        html: `<div class="pin-dot ${dog.type}" style="background:${dog.type === 'lost' ? '#C0392B' : '#B7860B'}"></div>`,
        iconSize: [28, 28],
        popupAnchor: [0, -14]
      })
    }).addTo(mainMap);
    
    marker.bindPopup(popupContent);
    mapMarkers.push(marker);
  });
  
  // Si hay perros, ajustar el mapa para mostrar todos
  if (dogsWithLocation.length > 0) {
    const bounds = [];
    dogsWithLocation.forEach(dog => {
      bounds.push([dog.location_lat, dog.location_lon]);
    });
    mainMap.fitBounds(bounds);
  }
}

function filterMapPins() {
  const allDogs = window.ALL_DOGS || [];
  updateMapWithDogs(allDogs);
}

// Exportar funciones
window.renderMapPage = renderMapPage;
window.filterMapPins = filterMapPins;
window.updateMapWithDogs = updateMapWithDogs;