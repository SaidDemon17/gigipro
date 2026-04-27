async function renderFoundGrid() {
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  const allDogs = window.ALL_DOGS || [];
  const found = allDogs.filter(d => d.type === 'found' && d.status !== 'reunited');  
  const foundHTML = `
    <div class="filter-bar">
      <input type="text" id="searchFound" placeholder="Search by location, description…" onkeyup="filterFound()"/>
      <button class="filter-tag active" onclick="filterFoundBy('all')">All</button>
      <button class="filter-tag" onclick="filterFoundBy('week')">This Week</button>
      <button class="filter-tag" onclick="filterFoundBy('month')">This Month</button>
      <button class="filter-tag" style="margin-left:auto;background:var(--gold);color:#fff;border-color:var(--gold)" onclick="showPage('report')">+ Report Found Dog</button>
    </div>
    <div class="section">
      <div class="section-header">
        <div><div class="section-title">Found Dogs</div><div class="section-sub" id="found-count">${found.length} dogs waiting to be claimed</div></div>
      </div>
      <div class="dogs-grid" id="found-grid"></div>
    </div>
    <footer><div class="footer-inner"><div class="footer-logo"><div style="width:28px;height:28px;background:var(--red);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.85rem">🐾</div><span style="font-family:'DM Serif Display',serif">PawFinder</span></div><div class="footer-copy">Built with love for our furry friends 🐾</div></div></footer>
  `;
  
  document.getElementById('page-found').innerHTML = foundHTML;
  renderFoundCards(found);
}

function renderFoundCards(dogs) {
  const container = document.getElementById('found-grid');
  if (!container) return;
  
  if (dogs.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>No found dogs reported yet. Check back later!</p></div>';
    return;
  }
  
  container.innerHTML = dogs.map(dog => dogCard(dog)).join('');
  const countEl = document.getElementById('found-count');
  if (countEl) countEl.textContent = `${dogs.length} dogs waiting to be claimed`;
}

function filterFound() {
  const searchTerm = document.getElementById('searchFound')?.value.toLowerCase() || '';
  const allDogs = window.ALL_DOGS || [];
  const found = allDogs.filter(d => d.type === 'found');
  
  const filtered = found.filter(dog => 
    (dog.name || '').toLowerCase().includes(searchTerm) ||
    (dog.breed || '').toLowerCase().includes(searchTerm) ||
    (dog.location || '').toLowerCase().includes(searchTerm) ||
    (dog.desc || '').toLowerCase().includes(searchTerm)
  );
  renderFoundCards(filtered);
}

function filterFoundBy(criteria) {
  const allDogs = window.ALL_DOGS || [];
  let found = allDogs.filter(d => d.type === 'found');
  
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
    if (tag.textContent.includes(criteria) || (criteria === 'all' && tag.textContent === 'All')) {
      tag.classList.add('active');
    }
  });
}

window.filterFound = filterFound;
window.filterFoundBy = filterFoundBy;
window.renderFoundGrid = renderFoundGrid;