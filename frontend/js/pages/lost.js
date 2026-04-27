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
      <input type="text" id="searchLost" placeholder="Search by name, breed, location…" onkeyup="filterLost()"/>
      <button class="filter-tag active" onclick="filterLostBy('all')">All</button>
      <button class="filter-tag" onclick="filterLostBy('Small')">Small</button>
      <button class="filter-tag" onclick="filterLostBy('Medium')">Medium</button>
      <button class="filter-tag" onclick="filterLostBy('Large')">Large</button>
      <button class="filter-tag" onclick="filterLostBy('reward')">With Reward</button>
      <button class="filter-tag" style="margin-left:auto;background:var(--red);color:#fff;border-color:var(--red)" onclick="showPage('report')">+ Report Lost Dog</button>
    </div>
    <div class="section">
      <div class="section-header">
        <div><div class="section-title">Lost Dogs</div><div class="section-sub" id="lost-count">${lost.length} dogs currently reported missing</div></div>
      </div>
      <div class="dogs-grid" id="lost-grid"></div>
    </div>
    <footer><div class="footer-inner"><div class="footer-logo"><div style="width:28px;height:28px;background:var(--red);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.85rem">🐾</div><span style="font-family:'DM Serif Display',serif">PawFinder</span></div><div class="footer-copy">Built with love for our furry friends 🐾</div></div></footer>
  `;
  
  document.getElementById('page-lost').innerHTML = lostHTML;
  renderLostCards(lost);
}

function renderLostCards(dogs) {
  const container = document.getElementById('lost-grid');
  if (!container) return;
  
  if (dogs.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No lost dogs reported yet. Be the first to report one!</p></div>';
    return;
  }
  
  container.innerHTML = dogs.map(dog => dogCard(dog)).join('');
  const countEl = document.getElementById('lost-count');
  if (countEl) countEl.textContent = `${dogs.length} dogs currently reported missing`;
}

function filterLost() {
  const searchTerm = document.getElementById('searchLost')?.value.toLowerCase() || '';
  const allDogs = window.ALL_DOGS || [];
  const lost = allDogs.filter(d => d.type === 'lost');
  
  const filtered = lost.filter(dog => 
    (dog.name || '').toLowerCase().includes(searchTerm) ||
    (dog.breed || '').toLowerCase().includes(searchTerm) ||
    (dog.location || '').toLowerCase().includes(searchTerm)
  );
  renderLostCards(filtered);
}

function filterLostBy(criteria) {
  const allDogs = window.ALL_DOGS || [];
  let lost = allDogs.filter(d => d.type === 'lost');
  
  if (criteria === 'reward') {
    lost = lost.filter(dog => dog.reward && dog.reward !== '');
  } else if (criteria !== 'all') {
    lost = lost.filter(dog => dog.size === criteria);
  }
  
  renderLostCards(lost);
  
  // Actualizar clases activas
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.classList.remove('active');
    if (tag.textContent.includes(criteria) || (criteria === 'all' && tag.textContent === 'All')) {
      tag.classList.add('active');
    }
  });
}

// Exportar funciones
window.filterLost = filterLost;
window.filterLostBy = filterLostBy;
window.renderLostGrid = renderLostGrid;