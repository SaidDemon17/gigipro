async function renderLostGrid() {
  // Asegurar que los datos estén cargados
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  // Usar window.ALL_DOGS
  const allDogs = window.ALL_DOGS || [];
  const lost = allDogs.filter(d => d.type === 'lost' && d.status !== 'reunited');
  
  const lostHTML = `
    <div class="filter-bar">
      <input type="text" id="searchLost" placeholder="🔍 Buscar por nombre, raza o ubicación..." onkeyup="filterLost()"/>
      <div class="filter-tags-container">
        <button class="filter-tag active" onclick="filterLostBy('all')">Todos</button>
        <button class="filter-tag" onclick="filterLostBy('Pequeño')">Pequeño</button>
        <button class="filter-tag" onclick="filterLostBy('Mediano')">Mediano</button>
        <button class="filter-tag" onclick="filterLostBy('Grande')">Grande</button>
        <button class="filter-tag" onclick="filterLostBy('reward')">💰 Con Recompensa</button>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="showPage('report')">+ Reportar Perro</button>
    </div>
    <div class="section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Perdidos</div>
          <div class="section-sub" id="lost-count">${lost.length} perros reportados como perdidos</div>
        </div>
        <a href="#" class="view-all" onclick="showPage('lost'); return false;">Ver todos →</a>
      </div>
      <div class="dogs-grid" id="lost-grid"></div>
    </div>
    <footer>
      <div class="footer-inner">
        <div class="footer-logo">
          <div class="logo-icon" style="width:28px;height:28px;background:var(--primary);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.85rem">🐾</div>
          <span style="font-family:'DM Serif Display',serif">PawFinder</span>
        </div>
        <div class="footer-copy">🐾 Hecho con amor para nuestros amigos peludos</div>
      </div>
    </footer>
  `;
  
  document.getElementById('page-lost').innerHTML = lostHTML;
  renderLostCards(lost);
}

function renderLostCards(dogs) {
  const container = document.getElementById('lost-grid');
  if (!container) return;
  
  if (dogs.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No hay perros perdidos reportados en este momento. ¡Sé el primero en reportar uno!</p></div>';
    return;
  }
  
  container.innerHTML = dogs.map(dog => dogCard(dog)).join('');
  const countEl = document.getElementById('lost-count');
  if (countEl) countEl.textContent = `${dogs.length} perros reportados como perdidos`;
}

function filterLost() {
  const searchTerm = document.getElementById('searchLost')?.value.toLowerCase() || '';
  const allDogs = window.ALL_DOGS || [];
  const lost = allDogs.filter(d => d.type === 'lost' && d.status !== 'reunited');
  
  const filtered = lost.filter(dog => 
    (dog.name || '').toLowerCase().includes(searchTerm) ||
    (dog.breed || '').toLowerCase().includes(searchTerm) ||
    (dog.location || '').toLowerCase().includes(searchTerm) ||
    (dog.location_address || '').toLowerCase().includes(searchTerm)
  );
  renderLostCards(filtered);
}

function filterLostBy(criteria) {
  const allDogs = window.ALL_DOGS || [];
  let lost = allDogs.filter(d => d.type === 'lost' && d.status !== 'reunited');
  
  if (criteria === 'reward') {
    lost = lost.filter(dog => dog.reward && dog.reward !== '');
  } else if (criteria !== 'all') {
    lost = lost.filter(dog => dog.size === criteria);
  }
  
  renderLostCards(lost);
  
  // Actualizar clases activas
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.classList.remove('active');
    if (tag.textContent.includes(criteria) || (criteria === 'all' && tag.textContent === 'Todos')) {
      tag.classList.add('active');
    }
  });
}

// Exportar funciones
window.filterLost = filterLost;
window.filterLostBy = filterLostBy;
window.renderLostGrid = renderLostGrid;
