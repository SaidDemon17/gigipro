// frontend/js/pages/home.js
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
  // Cargar reportes desde el backend
  if (typeof window.loadReportsFromBackend === 'function') {
    await window.loadReportsFromBackend();
  }
  
  // Obtener todos los perros
  const allDogs = window.ALL_DOGS || [];
  // Obtener perros reunidos recientemente
  const recentReunited = [...allDogs]
  .filter(d => d.status === 'reunited')
  .sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
  .slice(0, 5);
  // Obtener estadísticas reales
  const stats = await getStats();

  // Filtrar perros perdidos y encontrados
  const allLost = allDogs.filter(d => d.type === 'lost');
  const allFound = allDogs.filter(d => d.type === 'found');
  
  // Ordenar por fecha (más recientes primero) y tomar los últimos 5
  const recentLost = [...allLost].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  const recentFound = [...allFound].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  
  // Obtener top 3 del ranking
  let top3 = [];
  if (typeof getRanking === 'function') {
    const ranking = await getRanking();
    top3 = ranking.slice(0, 3);
  }
  
  const homeHTML = `
    <!-- Hero Section - Nuevo diseño -->
    <div class="hero-new">
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <div class="hero-badge">🐾 PawFinder</div>
        <h1>Ayuda a reunir <span>perros perdidos</span><br>con sus familias</h1>
        <p>Únete a nuestra comunidad y utiliza nuestra inteligencia artificial para encontrar mascotas perdidas. Cada reporte cuenta, cada reencuentro es una historia de éxito.</p>
        <div class="hero-buttons">
          <button class="btn btn-primary btn-large" onclick="showPage('report')">📝 Reportar Perro</button>
          <button class="btn btn-outline-light btn-large" onclick="showPage('lost')">🔍 Buscar Perros</button>
        </div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="stats-bar">
      <div class="stats-inner">
        <div class="stat-item">
          <div class="stat-number">${allLost.length}</div>
          <div class="stat-label">Perros Perdidos</div>
        </div>
        <div class="stat-item">
          <div class="stat-number gold">${allFound.length}</div>
          <div class="stat-label">Perros Encontrados</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">142</div>
          <div class="stat-label">Reencuentros Felices</div>
        </div>
        <div class="stat-item">
          <div class="stat-number dark">${allDogs.length}</div>
          <div class="stat-label">Total Reportes</div>
        </div>
      </div>
    </div>

    <!-- Recently Lost -->
    <div class="section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Perdidos Recientemente</div>
          <div class="section-sub">Ayuda a estos perros a encontrar su hogar</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showPage('lost')">Ver Todos →</button>
      </div>
      <div class="dogs-grid" id="home-lost-grid"></div>
    </div>

    <!-- Recently Found -->
    <div class="section">
      <div class="section-header">
        <div>
          <div class="section-title">Perros Encontrados Recientemente</div>
          <div class="section-sub">¿Es alguno de estos tu amigo peludo?</div>
        </div>
        <button class="btn btn-outline btn-sm" onclick="showPage('found')">Ver Todos →</button>
      </div>
      <div class="dogs-grid" id="home-found-grid"></div>
    </div>

    <!-- Nueva Sección: Nuestra Misión -->
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
      <div class="footer-inner">
        <div class="footer-logo">
          <div class="logo-icon">🐾</div>
          PawFinder
        </div>
        <div class="footer-links">
          <a href="#" onclick="showPage('lost')">Perros Perdidos</a>
          <a href="#" onclick="showPage('found')">Perros Encontrados</a>
          <a href="#" onclick="showPage('map')">Mapa</a>
          <a href="#" onclick="showPage('ranking')">Ranking</a>
        </div>
        <div class="footer-copy">Hecho con amor para nuestros amigos peludos 🐾</div>
      </div>
    </footer>
  `;
  
  document.getElementById('page-home').innerHTML = homeHTML;
  
  // Renderizar tarjetas
  const lostContainer = document.getElementById('home-lost-grid');
  const foundContainer = document.getElementById('home-found-grid');
  
  if (lostContainer) {
    lostContainer.innerHTML = recentLost.map(dog => dogCard(dog, false)).join('');
  }
  
  if (foundContainer) {
    foundContainer.innerHTML = recentFound.map(dog => dogCard(dog, false)).join('');
  }
}

// Exportar funciones
window.renderHomeGrids = renderHomeGrids;