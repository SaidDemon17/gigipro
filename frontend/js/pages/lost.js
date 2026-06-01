async function renderLostGrid() {
  // Asegurar que los datos estén cargados
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  // Usar window.ALL_DOGS
  const allDogs = window.ALL_DOGS || [];
  const lost = allDogs.filter(d => d.type === 'lost' && d.status !== 'reunited');
  
  const foundHTML = `
  <div class="filter-bar">
    <input type="text" id="searchFound" placeholder="Buscar por ubicación, descripción…" onkeyup="filterFound()"/>
    <button class="filter-tag active" onclick="filterFoundBy('all')">Todos</button>
    <button class="filter-tag" onclick="filterFoundBy('week')">Esta Semana</button>
    <button class="filter-tag" onclick="filterFoundBy('month')">Este Mes</button>
    <button class="filter-tag" style="margin-left:auto;background:var(--gold);color:#fff;border-color:var(--gold)" onclick="showPage('report')">+ Reportar Perro Encontrado</button>
  </div>
  <div class="section">
    <div class="section-header">
      <div>
        <div class="section-title">Perros Encontrados</div>
        <div class="section-sub" id="found-count">${found.length} perros esperando ser reclamados</div>
      </div>
      <a href="#" class="view-all" onclick="showPage('found'); return false;">Ver todos →</a>
    </div>
    <div class="dogs-grid" id="found-grid"></div>
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
  // ✅ Excluir perros reunidos también en la búsqueda
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
  // ✅ Excluir perros reunidos
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
