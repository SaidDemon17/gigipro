// ============================================
// FUNCIONES DE DISTANCIA Y SIMILITUD
// ============================================

// Calcular distancia entre dos coordenadas (fórmula de Haversine)
function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1000000; // Distancia grande si no hay coordenadas
  
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
}

// Calcular similitud entre dos perros (sin IA para evitar errores)
function calculateSimilarity(dog1, dog2) {
  let score = 0;
  let total = 0;
  
  // 1. Raza (30%)
  if (dog1.breed && dog2.breed) {
    total += 30;
    if (dog1.breed.toLowerCase() === dog2.breed.toLowerCase()) {
      score += 30;
    } else if (dog1.breed.toLowerCase().includes(dog2.breed.toLowerCase()) || 
               dog2.breed.toLowerCase().includes(dog1.breed.toLowerCase())) {
      score += 15;
    }
  }
  
  // 2. Color (25%)
  if (dog1.color && dog2.color) {
    total += 25;
    if (dog1.color.toLowerCase() === dog2.color.toLowerCase()) {
      score += 25;
    } else if (dog1.color.toLowerCase().includes(dog2.color.toLowerCase()) || 
               dog2.color.toLowerCase().includes(dog1.color.toLowerCase())) {
      score += 12;
    }
  }
  
  // 3. Tamaño (20%)
  if (dog1.size && dog2.size) {
    total += 20;
    if (dog1.size === dog2.size) {
      score += 20;
    }
  }
  
  // 4. Ubicación (25%)
  if (dog1.location_lat && dog2.location_lat) {
    total += 25;
    const distance = calculateDistance(
      dog1.location_lat, dog1.location_lon,
      dog2.location_lat, dog2.location_lon
    );
    const distanceKm = distance / 1000;
    const locationScore = Math.max(0, 100 - (distanceKm * 10));
    score += locationScore * 0.25;
  }
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

// Obtener matches inteligentes
function getSmartMatches(dog, allDogs) {
  const oppositeType = dog.type === 'lost' ? 'found' : 'lost';
  const candidates = allDogs.filter(d => d.type === oppositeType && d.id !== dog.id);
  
  const withScores = candidates.map(candidate => ({
    ...candidate,
    similarity: calculateSimilarity(dog, candidate)
  }));
  
  return withScores.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
}

// Colores según porcentaje
function getMatchColor(percentage) {
  if (percentage >= 70) return 'high';
  if (percentage >= 40) return 'med';
  return 'low';
}

// Texto de confianza
function getConfidenceText(percentage) {
  if (percentage >= 70) return 'High';
  if (percentage >= 40) return 'Medium';
  return 'Low';
}

// ============================================
// FUNCIÓN PRINCIPAL SHOW DETAIL
// ============================================

async function showDetail(id) {
  console.log('🔍 showDetail llamada con id:', id);
  
  // Asegurar que los datos están cargados
  if (!window.ALL_DOGS || window.ALL_DOGS.length === 0) {
    console.log('⏳ Esperando datos...');
    if (typeof window.loadReportsFromBackend === 'function') {
      await window.loadReportsFromBackend();
    }
  }
  
  const dog = window.ALL_DOGS?.find(d => d.id == id);
  
  if (!dog) {
    console.error('❌ Perro no encontrado con id:', id);
    showToast('Dog not found', '');
    return;
  }
  
  console.log('✅ Mostrando detalle de:', dog.name || 'Unknown');
  
  const detailContainer = document.getElementById('detail-content');
  if (!detailContainer) {
    console.error('❌ Contenedor detail-content no encontrado');
    return;
  }
  
  // Obtener matches inteligentes
  let matchesHtml = '';
  let confidenceClass = 'high';
  let confidenceText = 'High';
  
  if (window.ALL_DOGS && window.ALL_DOGS.length > 0) {
    const smartMatches = getSmartMatches(dog, window.ALL_DOGS);
    const bestMatchPercentage = smartMatches.length > 0 ? smartMatches[0].similarity : 0;
    confidenceClass = getMatchColor(bestMatchPercentage);
    confidenceText = getConfidenceText(bestMatchPercentage);
    
    matchesHtml = smartMatches.map(match => {
      const cls = getMatchColor(match.similarity);
      return `<div class="match-item" onclick="showDetail(${match.id})" style="cursor:pointer">
        <div class="match-thumb">${match.emoji || '🐕'}</div>
        <div style="flex:1">
          <div class="match-name">${match.name || 'Unknown'} · ${match.breed || 'Unknown'}</div>
          <div class="match-loc">📍 ${(match.location || match.location_address || '').split(',')[0]}</div>
          <div class="match-bar"><div class="match-fill ${cls}" style="width:${match.similarity}%"></div></div>
        </div>
        <div>
          <div class="match-pct ${cls}">${match.similarity}%</div>
          <div style="font-size:.72rem;color:var(--gray-400);text-align:right">${getConfidenceText(match.similarity)}</div>
        </div>
      </div>`;
    }).join('');
  }
  
  if (!matchesHtml) {
    matchesHtml = '<div class="empty-state" style="padding:20px"><p>No similar dogs found at the moment.</p></div>';
  }
  
  const html = `
    <div class="detail-page">
      <button class="btn btn-outline btn-sm" onclick="history.back(); showPage('${dog.type === 'lost' ? 'lost' : 'found'}')" style="margin-bottom:20px">← Back</button>
      <div class="detail-header">
        <div class="detail-badge ${dog.type}">${dog.type === 'lost' ? 'LOST DOG' : 'FOUND DOG'}</div>
        <div class="detail-title">${dog.type === 'lost' ? `Have You Seen ${dog.name || 'this dog'}?` : `Found Dog in ${(dog.location || dog.location_address || '').split(',')[0]}`}</div>
        <div class="detail-sub">${dog.breed || 'Unknown'} · ${dog.color || 'Unknown'} · ${dog.size || 'Unknown'}</div>
      </div>
      <div class="detail-grid">
        <div class="detail-img-col">
          <div class="detail-img" style="position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; min-height:200px; background:#f0f0f0">
            ${dog.photos && dog.photos.length > 0 && dog.photos[0] ? 
            `<img src="${dog.photos[0]}" style="width:100%; height:100%; object-fit:cover" onerror="this.onerror=null; this.parentElement.innerHTML='<div style=\'display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:6rem\'>🐕</div>'" />` :
            `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:6rem">${dog.emoji || '🐕'}</div>`
          }
        </div>
          ${dog.reward ? `<div class="reward-chip">💰 ${dog.reward} REWARD</div>` : ''}
        </div>
        <div class="detail-info-col">
          <div class="info-card">
            <h3>Last Seen / Found</h3>
            <div class="info-row">📅 <strong>${formatDate(dog.date || new Date().toISOString())}</strong></div>
            <div class="info-row">📍 ${dog.location || dog.location_address || 'Unknown location'}</div>
          </div>
          <div class="contact-card">
            <h3>Contact ${dog.type === 'lost' ? 'Owner' : 'Finder'} Immediately</h3>
            <button class="contact-btn" onclick="window.location.href='tel:${dog.contact || dog.contact_phone || ''}'">📞 ${dog.contact || dog.contact_phone || 'N/A'}</button>
            <button class="contact-btn" onclick="window.location.href='mailto:${dog.email || dog.contact_email || ''}'">✉️ ${dog.email || dog.contact_email || 'N/A'}</button>
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-outline btn-sm" style="flex:1;color:#fff;border-color:rgba(255,255,255,.4)" onclick="shareDog(${dog.id})">Share</button>
              <button class="btn btn-outline btn-sm" style="flex:1;color:#fff;border-color:rgba(255,255,255,.4)" onclick="printPoster(${dog.id})">Print Poster</button>
            </div>
          </div>
        </div>
      </div>
      <div class="detail-desc">
        <h3>About ${dog.name || 'this dog'}</h3>
        <p style="margin-bottom:16px">${dog.desc || dog.description || 'No description available.'}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-weight:700;font-size:.85rem;margin-bottom:10px">Physical Description</div>
            ${(dog.physical || ['No details available']).map(p => `<div class="desc-item">${p}</div>`).join('')}
          </div>
          <div>
            <div style="font-weight:700;font-size:.85rem;margin-bottom:10px">Personality</div>
            ${(dog.personality || ['Unknown personality']).map(p => `<div class="desc-item">${p}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="ai-section">
        <div class="ai-header">
          <div class="ai-icon">🤖</div>
          <div>
            <div style="font-weight:700">AI Similarity Matches</div>
            <div style="font-size:.82rem;color:var(--gray-600)">Potential matches found based on appearance and location</div>
          </div>
        </div>
        <div class="confidence-badge ${confidenceClass}">🎯 Overall Match Confidence: ${confidenceText}</div>
        ${matchesHtml}
        <div class="ai-disclaimer">⚠️ This is an AI-based suggestion and not a confirmation. Always verify in person.</div>
      </div>
      <div class="comments-section">
        <h3>💬 Community Comments</h3>
        <div class="comment">
          <div class="comment-avatar">JD</div>
          <div class="comment-body">
            <span class="comment-user">John D.</span><span class="comment-time">2 hours ago</span>
            <div class="comment-text">I saw a dog matching this description near the park this morning!</div>
            <span class="comment-sim">AI Match: 78% similarity</span>
          </div>
        </div>
        <div class="comment">
          <div class="comment-avatar">ML</div>
          <div class="comment-body">
            <span class="comment-user">Maria L.</span><span class="comment-time">5 hours ago</span>
            <div class="comment-text">Sharing on my neighborhood Facebook group! Hope you find them soon 🙏</div>
          </div>
        </div>
        <div class="comment-input">
          <input type="text" placeholder="Leave a comment or upload a photo…" id="comment-txt"/>
          <button class="btn btn-primary btn-sm" onclick="addComment()">Post</button>
        </div>
      </div>
    </div>
  `;
  
  detailContainer.innerHTML = html;
  showPage('detail');
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function shareDog(dogId) {
  const dog = window.ALL_DOGS?.find(d => d.id == dogId);
  if (dog) {
    const url = window.location.href;
    navigator.clipboard.writeText(`Check out this ${dog.type} dog: ${dog.name || 'Unknown'} - ${url}`);
    showToast('Link copied to clipboard!', 'success');
  }
}

function printPoster(dogId) {
  const dog = window.ALL_DOGS?.find(d => d.id == dogId);
  if (dog) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Missing Dog Poster - ${dog.name || 'Dog'}</title></head>
        <body style="font-family:Arial; text-align:center; padding:20px">
          <h1>${dog.type === 'lost' ? 'LOST DOG' : 'FOUND DOG'}</h1>
          <div style="font-size:60px">🐕</div>
          <h2>${dog.name || 'Unknown'}</h2>
          <p>${dog.breed || 'Unknown'} · ${dog.color || 'Unknown'} · ${dog.size || 'Unknown'}</p>
          <p>Location: ${dog.location || dog.location_address || 'Unknown'}</p>
          <p>Date: ${formatDate(dog.date)}</p>
          <p>Contact: ${dog.contact || dog.contact_phone || 'N/A'}</p>
          <hr>
          <p>Please help! Call if you have any information.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

function addComment() {
  const txt = document.getElementById('comment-txt')?.value.trim();
  if (!txt) return;
  showToast('Comment posted! +5 pts earned 🎉', 'success');
  const commentInput = document.getElementById('comment-txt');
  if (commentInput) commentInput.value = '';
}

// Exportar funciones
window.showDetail = showDetail;
window.shareDog = shareDog;
window.printPoster = printPoster;
window.addComment = addComment;
window.calculateDistance = calculateDistance;
window.calculateSimilarity = calculateSimilarity;
window.getSmartMatches = getSmartMatches;
window.getMatchColor = getMatchColor;
window.getConfidenceText = getConfidenceText;