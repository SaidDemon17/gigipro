async function renderHomeGrids() {
  // Cargar reportes desde el backend
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  // Obtener todos los perros (estáticos + reportes de Neon)
  const allDogs = window.ALL_DOGS || [];
  
  // Filtrar perros perdidos y encontrados
  const allLost = allDogs.filter(d => d.type === 'lost');
  const allFound = allDogs.filter(d => d.type === 'found');
  
  // Ordenar por fecha (más recientes primero) y tomar los últimos 5
  const recentLost = [...allLost].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const recentFound = [...allFound].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  const homeHTML = `
    <!-- Hero -->
    <div class="hero">
      <div class="hero-icon">🐾</div>
      <h1>Help Reunite Lost Dogs<br><span>With Their Families</span></h1>
      <p>PawFinder is a community-powered platform that uses AI to match lost and found dogs, helping bring beloved pets back home faster.</p>
      <div class="hero-btns">
        <button class="btn btn-primary" onclick="showPage('report')">♥ Report a Dog</button>
        <button class="btn btn-outline" onclick="showPage('lost')">🔍 Browse Lost Dogs</button>
      </div>
      <div class="search-bar">
        <div class="search-field">
          <label>Location</label>
          <input type="text" placeholder="City or area…" id="home-location"/>
        </div>
        <div class="search-field">
          <label>Breed</label>
          <select id="home-breed">
            <option>Any breed</option>
            <option>Golden Retriever</option>
            <option>Labrador</option>
            <option>German Shepherd</option>
            <option>Poodle</option>
            <option>Beagle</option>
          </select>
        </div>
        <div class="search-field">
          <label>Color</label>
          <select id="home-color">
            <option>Any color</option>
            <option>Brown</option>
            <option>Black</option>
            <option>White</option>
            <option>Golden</option>
            <option>Mixed</option>
          </select>
        </div>
        <div class="search-field">
          <label>Size</label>
          <select id="home-size">
            <option>Any size</option>
            <option>Small</option>
            <option>Medium</option>
            <option>Large</option>
          </select>
        </div>
        <div class="search-field">
          <label>Reward</label>
          <select id="home-reward">
            <option>Any</option>
            <option>With reward</option>
            <option>No reward</option>
          </select>
        </div>
        <div class="search-field" style="display:flex;align-items:flex-end">
          <button class="btn btn-primary" style="width:100%" onclick="searchHomeDogs()">Search</button>
        </div>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-bar">
      <div class="stats-inner">
        <div><div class="stat-num">${allLost.length}</div><div class="stat-label">Lost Dogs Reported</div></div>
        <div><div class="stat-num gold">${allFound.length}</div><div class="stat-label">Found Dogs Reported</div></div>
        <div><div class="stat-num">142</div><div class="stat-label">Happy Reunions</div></div>
        <div><div class="stat-num dark">${allDogs.length}</div><div class="stat-label">Total Reports</div></div>
      </div>
    </div>

    <!-- Recently Lost -->
    <div class="section">
      <div class="section-header">
        <div><div class="section-title">Recently Lost Dogs</div><div class="section-sub">Help these dogs find their way home</div></div>
        <button class="btn btn-outline btn-sm" onclick="showPage('lost')">View All →</button>
      </div>
      <div class="dogs-grid" id="home-lost-grid"></div>
    </div>

    <!-- Recently Found -->
    <div class="section" style="padding-top:0">
      <div class="section-header">
        <div><div class="section-title">Recently Found Dogs</div><div class="section-sub">Is one of these your furry friend?</div></div>
        <button class="btn btn-outline btn-sm" onclick="showPage('found')">View All →</button>
      </div>
      <div class="dogs-grid" id="home-found-grid"></div>
    </div>

    <!-- How it works -->
    <div class="how-section">
      <div class="how-title">How It Works</div>
      <div class="how-sub">Our AI-powered platform makes finding lost dogs easier</div>
      <div class="how-cards">
        <div class="how-card red">
          <div class="how-card-icon red">🐾</div>
          <h3>Report a Dog</h3>
          <p>Upload photos and details of a lost or found dog. Our AI analyzes the images to extract identifying features.</p>
        </div>
        <div class="how-card">
          <div class="how-card-icon gold">🔍</div>
          <h3>AI Matching</h3>
          <p>Our AI compares lost and found dogs based on appearance, location, and timing to find potential matches.</p>
        </div>
        <div class="how-card red">
          <div class="how-card-icon red">✅</div>
          <h3>Reunite</h3>
          <p>Connect with the owner or finder through our secure messaging. Earn points and climb the leaderboard for helping!</p>
        </div>
      </div>
    </div>

    <!-- Community -->
    <div class="community-section">
      <div class="community-inner">
        <div class="community-text">
          <h2>Community-Powered<br><span>Pet Recovery</span></h2>
          <p>Join thousands of pet lovers working together to reunite lost dogs with their families. Every contribution matters.</p>
          <ul class="feature-list">
            <li class="feature-item">
              <div class="feature-icon">📍</div>
              <div><div class="feature-name">Interactive Map</div><div class="feature-desc">View lost and found dogs on an interactive map to find pets in your area.</div></div>
            </li>
            <li class="feature-item">
              <div class="feature-icon">🏆</div>
              <div><div class="feature-name">Earn Rewards</div><div class="feature-desc">Get points for reporting, commenting, and helping reunite dogs. Climb the leaderboard!</div></div>
            </li>
            <li class="feature-item">
              <div class="feature-icon">👥</div>
              <div><div class="feature-name">Community Support</div><div class="feature-desc">Leave helpful comments and tips to aid in the search for missing pets.</div></div>
            </li>
          </ul>
        </div>
        <div class="mini-leaderboard">
          <div style="font-weight:700;margin-bottom:14px">🏆 Top Rescuers</div>
          <div class="mini-lb-row">
            <div class="mini-rank lb-rank r1">1</div>
            <div style="flex:1"><div style="font-weight:700">Sarah M.</div><div style="font-size:.78rem;color:var(--gray-600)">Top Rescuer</div></div>
            <div style="font-weight:700;color:var(--red)">1,250 pts</div>
          </div>
          <div class="mini-lb-row">
            <div class="mini-rank lb-rank r2">2</div>
            <div style="flex:1"><div style="font-weight:700">Mike R.</div><div style="font-size:.78rem;color:var(--gray-600)">Expert Helper</div></div>
            <div style="font-weight:700;color:var(--gold)">980 pts</div>
          </div>
          <div class="mini-lb-row">
            <div class="mini-rank lb-rank r3">3</div>
            <div style="flex:1"><div style="font-weight:700">Lisa K.</div><div style="font-size:.78rem;color:var(--gray-600)">Dedicated Finder</div></div>
            <div style="font-weight:700;color:var(--gray-600)">850 pts</div>
          </div>
          <button class="btn btn-outline" style="width:100%;margin-top:14px" onclick="showPage('ranking')">View Leaderboard →</button>
        </div>
      </div>
    </div>

    <!-- CTA -->
    <div class="cta-section">
      <h2>Ready to Make a Difference?</h2>
      <p>Join our community and help reunite lost dogs with their loving families. Every report and comment counts.</p>
      <div class="cta-btns">
        <button class="btn btn-primary" onclick="showPage('report')">Report a Dog →</button>
        <button class="btn btn-outline" onclick="showPage('map')">📍 Explore Map</button>
      </div>
    </div>

    <!-- Footer -->
    <footer>
      <div class="footer-inner">
        <div class="footer-logo"><div class="logo-icon" style="width:28px;height:28px;background:var(--red);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.85rem">🐾</div>PawFinder</div>
        <div class="footer-links">
          <a href="#" onclick="showPage('lost')">Lost Dogs</a>
          <a href="#" onclick="showPage('found')">Found Dogs</a>
          <a href="#" onclick="showPage('map')">Map</a>
          <a href="#" onclick="showPage('ranking')">Leaderboard</a>
        </div>
        <div class="footer-copy">Built with love for our furry friends 🐾</div>
      </div>
    </footer>
  `;
  
  document.getElementById('page-home').innerHTML = homeHTML;
  
  // Renderizar las tarjetas con los últimos 5 perros
  const lostContainer = document.getElementById('home-lost-grid');
  const foundContainer = document.getElementById('home-found-grid');
  
  if (lostContainer) {
    lostContainer.innerHTML = recentLost.map(dog => dogCard(dog, false)).join('');
  }
  
  if (foundContainer) {
    foundContainer.innerHTML = recentFound.map(dog => dogCard(dog, false)).join('');
  }
}

// Función para buscar en home
function searchHomeDogs() {
  const location = document.getElementById('home-location')?.value.toLowerCase() || '';
  const breed = document.getElementById('home-breed')?.value.toLowerCase() || '';
  const color = document.getElementById('home-color')?.value.toLowerCase() || '';
  const size = document.getElementById('home-size')?.value.toLowerCase() || '';
  const reward = document.getElementById('home-reward')?.value.toLowerCase() || '';
  
  const allDogs = window.ALL_DOGS || [];
  
  const filtered = allDogs.filter(dog => {
    let match = true;
    if (location && !(dog.location || '').toLowerCase().includes(location)) match = false;
    if (breed !== 'any breed' && !(dog.breed || '').toLowerCase().includes(breed)) match = false;
    if (color !== 'any color' && !(dog.color || '').toLowerCase().includes(color)) match = false;
    if (size !== 'any size' && !(dog.size || '').toLowerCase().includes(size)) match = false;
    if (reward === 'with reward' && !dog.reward) match = false;
    if (reward === 'no reward' && dog.reward) match = false;
    return match;
  });
  
  // Mostrar resultados en la página de lost/found según el tipo
  if (filtered.length > 0) {
    const lostFiltered = filtered.filter(d => d.type === 'lost');
    const foundFiltered = filtered.filter(d => d.type === 'found');
    
    if (lostFiltered.length > 0) {
      window.tempFilteredLost = lostFiltered;
      showPage('lost');
      setTimeout(() => {
        renderLostCards(lostFiltered);
      }, 100);
    } else if (foundFiltered.length > 0) {
      window.tempFilteredFound = foundFiltered;
      showPage('found');
      setTimeout(() => {
        renderFoundCards(foundFiltered);
      }, 100);
    } else {
      showToast('No dogs found matching your search', '');
    }
  } else {
    showToast('No dogs found matching your search', '');
  }
}

// Exportar funciones
window.searchHomeDogs = searchHomeDogs;