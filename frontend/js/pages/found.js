async function renderFoundGrid() {
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  const allDogs = window.ALL_DOGS || [];
  const found = allDogs.filter(d => d.type === 'found' && d.status !== 'reunited');  
  
  const foundHTML = `
    <div class="filter-bar">
      <input type="text" id="searchFound" placeholder="🔍 Buscar por ubicación, descripción..." onkeyup="filterFound()"/>
      <div class="filter-tags-container">
        <button class="filter-tag active" onclick="filterFoundBy('all')">Todos</button>
        <button class="filter-tag" onclick="filterFoundBy('week')">Esta Semana</button>
        <button class="filter-tag" onclick="filterFoundBy('month')">Este Mes</button>
      </div>
      <button class="btn btn-primary btn-sm" style="margin-left:auto" onclick="showPage('report')">+ Reportar Perro Deambulante</button>
    </div>
    <div class="section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Deambulantes</div>
          <div class="section-sub" id="found-count">${found.length} perros esperando ser ayudados</div>
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
  
  document.getElementById('page-found').innerHTML = foundHTML;
  renderFoundCards(found);
}

function renderFoundCards(dogs) {
  const container = document.getElementById('found-grid');
  if (!container) return;
  
  if (dogs.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No hay perros deambulantes reportados en este momento. ¡Sé el primero en reportar uno!</p></div>';
    return;
  }
  
  container.innerHTML = dogs.map(dog => dogCard(dog)).join('');
  const countEl = document.getElementById('found-count');
  const countText = dogs.length === 1 ? 'perro deambulante' : 'perros deambulantes';
  if (countEl) countEl.textContent = `${dogs.length} ${countText} esperando ser ayudados`;
}

function filterFound() {
  const searchTerm = document.getElementById('searchFound')?.value.toLowerCase() || '';
  const allDogs = window.ALL_DOGS || [];
  const found = allDogs.filter(d => d.type === 'found' && d.status !== 'reunited');
  
  const filtered = found.filter(dog => 
    (dog.name || '').toLowerCase().includes(searchTerm) ||
    (dog.breed || '').toLowerCase().includes(searchTerm) ||
    (dog.location || '').toLowerCase().includes(searchTerm) ||
    (dog.location_address || '').toLowerCase().includes(searchTerm) ||
    (dog.desc || '').toLowerCase().includes(searchTerm)
  );
  renderFoundCards(filtered);
}

function filterFoundBy(criteria) {
  const allDogs = window.ALL_DOGS || [];
  let found = allDogs.filter(d => d.type === 'found' && d.status !== 'reunited');
  
  if (criteria === 'week') {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    found = found.filter(dog => dog.date && new Date(dog.date) > oneWeekAgo);
  } else if (criteria === 'month') {
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    found = found.filter(dog => dog.date && new Date(dog.date) > oneMonthAgo);
  }
  
  renderFoundCards(found);
  
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.classList.remove('active');
    if (tag.textContent.includes(criteria) || (criteria === 'all' && tag.textContent === 'Todos')) {
      tag.classList.add('active');
    }
  });
}

// Exportar funciones
window.filterFound = filterFound;
window.filterFoundBy = filterFoundBy;
window.renderFoundGrid = renderFoundGrid;
