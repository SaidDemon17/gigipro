// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Variable para almacenar los resultados de IA
let aiResultsCache = {};

// ============================================
// FUNCIONES DE DISTANCIA Y SIMILITUD
// ============================================

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 1000000;
  
  const R = 6371e3;
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

function calculateFilterScore(dog1, dog2) {
  let score = 0;
  let total = 0;
  
  if (dog1.breed && dog2.breed) {
    total += 40;
    if (dog1.breed.toLowerCase() === dog2.breed.toLowerCase()) {
      score += 40;
    } else if (dog1.breed.toLowerCase().includes(dog2.breed.toLowerCase()) || 
               dog2.breed.toLowerCase().includes(dog1.breed.toLowerCase())) {
      score += 20;
    }
  }
  
  if (dog1.color && dog2.color) {
    total += 20;
    if (dog1.color.toLowerCase() === dog2.color.toLowerCase()) {
      score += 20;
    } else if (dog1.color.toLowerCase().includes(dog2.color.toLowerCase()) || 
               dog2.color.toLowerCase().includes(dog1.color.toLowerCase())) {
      score += 10;
    }
  }
  
  if (dog1.size && dog2.size) {
    total += 20;
    const sizeMap = { 'small': 1, 'medium': 2, 'large': 3 };
    const size1 = sizeMap[dog1.size.toLowerCase().split(' ')[0]];
    const size2 = sizeMap[dog2.size.toLowerCase().split(' ')[0]];
    
    if (size1 === size2) {
      score += 20;
    } else if (Math.abs(size1 - size2) === 1) {
      score += 10;
    }
  }
  
  if (dog1.location_lat && dog2.location_lat) {
    total += 20;
    const distance = calculateDistance(
      dog1.location_lat, dog1.location_lon,
      dog2.location_lat, dog2.location_lon
    );
    const distanceKm = distance / 1000;
    const locationScore = Math.max(0, 100 - (distanceKm * 10));
    score += locationScore * 0.2;
  }
  
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function calculateSimilarity(dog1, dog2) {
  return calculateFilterScore(dog1, dog2);
}

function getMatchColor(percentage) {
  if (percentage >= 70) return 'high';
  if (percentage >= 40) return 'med';
  return 'low';
}

function getConfidenceText(percentage) {
  if (percentage >= 70) return 'Alta';
  if (percentage >= 40) return 'Media';
  return 'Baja';
}

async function calculateSimilarityWithGemini(dog1, dog2, filterScore) {
  if (!dog1.photos?.length || !dog2.photos?.length) {
    return { similarity: filterScore, explanation: null };
  }
  
  try {
    const response = await fetch(`${API_URL}/api/compare-images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageUrl1: dog1.photos[0],
        imageUrl2: dog2.photos[0]
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      const finalScore = (filterScore * 0.6) + (data.similarityPercentage * 0.4);
      return { 
        similarity: Math.round(finalScore), 
        explanation: data.explanation 
      };
    }
  } catch (error) {
    console.error('Error llamando a Gemini:', error);
  }
  
  return { similarity: filterScore, explanation: null };
}

async function getSmartMatches(dog, allDogs) {
  const oppositeType = dog.type === 'lost' ? 'found' : 'lost';
  const candidates = allDogs.filter(d => d.type === oppositeType && d.id !== dog.id);
  
  const withFilterScores = candidates.map(candidate => ({
    ...candidate,
    filterScore: calculateFilterScore(dog, candidate)
  }));
  
  const filteredCandidates = withFilterScores.filter(c => c.filterScore >= 70);
  
  if (filteredCandidates.length === 0) {
    return [];
  }
  
  const topCandidates = filteredCandidates
    .sort((a, b) => b.filterScore - a.filterScore)
    .slice(0, 3);
  
  const withFinalScores = await Promise.all(
    topCandidates.map(async (candidate, index) => {
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      const result = await calculateSimilarityWithGemini(dog, candidate, candidate.filterScore);
      return {
        ...candidate,
        similarity: result.similarity,
        explanation: result.explanation
      };
    })
  );
  
  return withFinalScores.sort((a, b) => b.similarity - a.similarity);
}

function displayAIResults(smartMatches) {
  const resultsDiv = document.getElementById('ai-results');
  const confidenceDiv = document.getElementById('ai-confidence');
  const matchesDiv = document.getElementById('ai-matches');
  
  if (!resultsDiv) return;
  
  if (!smartMatches || smartMatches.length === 0) {
    confidenceDiv.className = 'confidence-badge low';
    confidenceDiv.innerHTML = '🎯 No se encontraron coincidencias significativas';
    matchesDiv.innerHTML = '<div class="empty-state"><p>No se encontraron perros similares con alta probabilidad.</p></div>';
    resultsDiv.style.display = 'block';
    return;
  }
  
  const bestMatchPercentage = smartMatches[0].similarity;
  const confidenceClass = getMatchColor(bestMatchPercentage);
  const confidenceText = getConfidenceText(bestMatchPercentage);
  
  confidenceDiv.className = `confidence-badge ${confidenceClass}`;
  confidenceDiv.innerHTML = `🎯 Confianza General: ${confidenceText}`;
  
  const matchesHtml = smartMatches.map(match => {
    const cls = getMatchColor(match.similarity);
    const explanationHtml = match.explanation ? `<div class="match-explanation">💬 ${escapeHtml(match.explanation)}</div>` : '';
    
    return `<div class="match-item" onclick="showDetail(${match.id})" style="cursor:pointer">
      <div class="match-thumb">${match.emoji || '🐕'}</div>
      <div style="flex:1">
        <div class="match-name">${match.name || 'Desconocido'} · ${match.breed || 'Desconocida'}</div>
        <div class="match-loc">📍 ${(match.location || match.location_address || '').split(',')[0]}</div>
        <div class="match-bar"><div class="match-fill ${cls}" style="width:${match.similarity}%"></div></div>
        ${explanationHtml}
      </div>
      <div>
        <div class="match-pct ${cls}">${match.similarity}%</div>
        <div style="font-size:.72rem;color:var(--gray-400);text-align:right">${getConfidenceText(match.similarity)}</div>
      </div>
    </div>`;
  }).join('');
  
  matchesDiv.innerHTML = matchesHtml;
  resultsDiv.style.display = 'block';
  
  // Ocultar loading
  const loading = document.getElementById('ai-loading');
  if (loading) loading.style.display = 'none';
  const btn = document.getElementById('generate-ai-report-btn');
  if (btn) btn.style.display = 'block';
}

async function generateAIReport(dogId) {
  const dog = window.ALL_DOGS?.find(d => d.id == dogId);
  if (!dog) return;
  
  const btn = document.getElementById('generate-ai-report-btn');
  const loading = document.getElementById('ai-loading');
  
  if (!btn || !loading) return;
  
  // Ocultar botón, mostrar loading
  btn.style.display = 'none';
  loading.style.display = 'block';
  
  try {
    const smartMatches = await getSmartMatches(dog, window.ALL_DOGS);
    
    // Guardar en caché
    aiResultsCache[dogId] = smartMatches;
    
    // Mostrar resultados
    displayAIResults(smartMatches);
    
  } catch (error) {
    console.error('Error generando reporte IA:', error);
    showToast('Error al generar el reporte. Intenta nuevamente.', '');
    
    // Restaurar botón
    btn.style.display = 'block';
    loading.style.display = 'none';
  }
}

let currentDogId = null;

async function loadComments(dogId) {
  try {
    const response = await fetch(`${API_URL}/api/dogs/${dogId}/comments`);
    if (response.ok) {
      return await response.json();
    }
  } catch (error) {
    console.error('Error cargando comentarios:', error);
  }
  return [];
}

async function showDetail(id) {
  console.log('🔍 showDetail llamada con id:', id);
  
  currentDogId = id;
  
  if (!window.ALL_DOGS || window.ALL_DOGS.length === 0) {
    console.log('⏳ Esperando datos...');
    if (typeof window.loadReportsFromBackend === 'function') {
      await window.loadReportsFromBackend();
    }
  }
  
  const dog = window.ALL_DOGS?.find(d => d.id == id);
  
  if (!dog) {
    console.error('❌ Perro no encontrado con id:', id);
    showToast('Perro no encontrado', '');
    return;
  }
  
  console.log('✅ Mostrando detalle de:', dog.name || 'Desconocido');
  
  const currentUser = getCurrentUser();
  console.log('👤 currentUser:', currentUser);
  console.log('🐕 dog.user_id:', dog.user_id, 'tipo:', typeof dog.user_id);
  console.log('👤 currentUser.id:', currentUser?.id, 'tipo:', typeof currentUser?.id);
  console.log('✅ ¿Son iguales?', currentUser && currentUser.id == dog.user_id);
  
  const isOwner = currentUser && currentUser.id == dog.user_id;
  console.log('🎯 isOwner final:', isOwner);
  
  const detailContainer = document.getElementById('detail-content');
  if (!detailContainer) {
    console.error('❌ Contenedor detail-content no encontrado');
    return;
  }
  
  const comments = await loadComments(id);
  
  const commentsHtml = comments.map(comment => {
    const userInitial = comment.user_name ? comment.user_name.charAt(0).toUpperCase() : '?';
    const timeAgo = getTimeAgo(new Date(comment.created_at));
    return `
      <div class="comment">
        <div class="comment-avatar">${userInitial}</div>
        <div class="comment-body">
          <span class="comment-user">${escapeHtml(comment.user_name || 'Anónimo')}</span>
          <span class="comment-time">${timeAgo}</span>
          <div class="comment-text">${escapeHtml(comment.comment)}</div>
          ${comment.ai_match_similarity ? `<span class="comment-sim">🤖 IA: ${comment.ai_match_similarity}% similitud</span>` : ''}
        </div>
      </div>
    `;
  }).join('');
  
  const commentsSectionHtml = comments.length > 0 
    ? commentsHtml 
    : '<div class="empty-state"><p>No hay comentarios aún. ¡Sé el primero en comentar!</p></div>';
  
  const html = `
    <div class="detail-page">
      <button class="btn btn-outline btn-sm" onclick="showPage('${dog.type === 'lost' ? 'lost' : 'found'}')" style="margin-bottom:20px">
        ← Volver a ${dog.type === 'lost' ? 'Perros Perdidos' : 'Perros Encontrados'}
      </button>
      <div class="detail-header">
        <div class="detail-badge ${dog.status === 'reunited' ? 'reunited' : dog.type}">
          ${dog.status === 'reunited' ? '✅ REUNIDO' : (dog.type === 'lost' ? 'PERRO PERDIDO' : 'PERRO ENCONTRADO')}
        </div>
        <div class="detail-title">${dog.type === 'lost' ? `¿Has Visto a ${dog.name || 'este perro'}?` : `Perro Encontrado en ${(dog.location || dog.location_address || '').split(',')[0]}`}</div>
        <div class="detail-sub">${dog.breed || 'Desconocida'} · ${dog.color || 'Desconocido'} · ${dog.size || 'Desconocido'}</div>
      </div>
      <div class="detail-grid">
        <div class="detail-img-col">
          <div class="detail-img" style="position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; min-height:200px; background:#f0f0f0">
            ${(() => {
              const photoUrl = dog.photos && dog.photos[0];
              if (photoUrl && photoUrl.includes('cloudinary')) {
                return `<img src="${photoUrl}" style="width:100%; height:100%; object-fit:cover" alt="Foto de ${dog.name}" onerror="this.parentElement.innerHTML='<div style=\'font-size:6rem\'>🐕</div>'" />`;
              } else if (photoUrl && photoUrl.startsWith('/uploads/')) {
                return `<img src="${API_URL}${photoUrl}" style="width:100%; height:100%; object-fit:cover" alt="Foto de ${dog.name}" onerror="this.parentElement.innerHTML='<div style=\'font-size:6rem\'>🐕</div>'" />`;
              } else {
                return `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:6rem">🐕</div>`;
              }
            })()}
          </div>
          ${dog.reward ? `<div class="reward-chip">💰 ${dog.reward} RECOMPENSA</div>` : ''}
        </div>
        <div class="detail-info-col">
          <div class="info-card">
            <h3>Última Vez Visto / Encontrado</h3>
            <div class="info-row">📅 <strong>${formatDate(dog.date || new Date().toISOString())}</strong></div>
            <div class="info-row">📍 ${dog.location || dog.location_address || 'Ubicación desconocida'}</div>
          </div>
          <div class="contact-card">
            <h3>Contacta al ${dog.type === 'lost' ? 'Dueño' : 'Quien lo Encontró'} Inmediatamente</h3>
            <button class="contact-btn" onclick="window.location.href='tel:${dog.contact || dog.contact_phone || ''}'">📞 ${dog.contact || dog.contact_phone || 'N/A'}</button>
            <button class="contact-btn" onclick="window.location.href='mailto:${dog.email || dog.contact_email || ''}'">✉️ ${dog.email || dog.contact_email || 'N/A'}</button>
            
            ${isOwner && dog.status !== 'reunited' ? `
              <button class="contact-btn" style="background: #2E7D32; margin-top:8px" onclick="markAsReunited(${dog.id})">
                🎉 Marcar como Reunido
              </button>
            ` : ''}
            
            ${dog.status === 'reunited' ? `
              <div style="background: #2E7D32; padding:10px; border-radius:8px; text-align:center; margin-top:8px">
                ✅ Este perro ya fue reunido con su familia
              </div>
            ` : ''}
            
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-outline btn-sm" style="flex:1;color:#fff;border-color:rgba(255,255,255,.4)" onclick="shareDog(${dog.id})">Compartir</button>
              <button class="btn btn-outline btn-sm" style="flex:1;color:#fff;border-color:rgba(255,255,255,.4)" onclick="printPoster(${dog.id})">Imprimir Cartel</button>
            </div>
          </div>
        </div>
      </div>
      <div class="detail-desc">
        <h3>Sobre ${dog.name || 'este perro'}</h3>
        <p style="margin-bottom:16px">${dog.desc || dog.description || 'No hay descripción disponible.'}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-weight:700;font-size:.85rem;margin-bottom:10px">Descripción Física</div>
            ${(dog.physical ? dog.physical.split('\n') : ['No hay detalles disponibles']).map(p => `<div class="desc-item">${escapeHtml(p)}</div>`).join('')}
          </div>
          <div>
            <div style="font-weight:700;font-size:.85rem;margin-bottom:10px">Personalidad</div>
            ${(dog.personality ? dog.personality.split('\n') : ['Personalidad desconocida']).map(p => `<div class="desc-item">${escapeHtml(p)}</div>`).join('')}
          </div>
        </div>
      </div>
      <div class="ai-section">
        <div class="ai-header">
          <div class="ai-icon">🤖</div>
          <div>
            <div style="font-weight:700">Coincidencias con IA</div>
            <div style="font-size:.82rem;color:var(--gray-600)">Análisis visual con Gemini para encontrar posibles coincidencias</div>
          </div>
        </div>
        
        ${isOwner && dog.status !== 'reunited' ? `
          <div id="ai-generate-section">
            <button id="generate-ai-report-btn" class="btn btn-primary" style="width:100%; margin-bottom:16px" onclick="generateAIReport(${dog.id})">
              🤖 Generar Reporte de IA
            </button>
            <div id="ai-loading" style="display:none; text-align:center; padding:20px">
              <div class="loading-spinner"></div>
              <p style="margin-top:12px">Analizando imágenes con IA... Esto puede tomar unos segundos</p>
            </div>
          </div>
        ` : ''}
        
        ${!isOwner ? `
          <div class="ai-placeholder">
            <div class="ai-placeholder-icon">🔒</div>
            <h4>🤖 Análisis con IA disponible para el dueño</h4>
            <p>El dueño de esta publicación puede activar la inteligencia artificial de Gemini para comparar visualmente este perro con otros reportes y encontrar posibles coincidencias.</p>
            <div class="ai-placeholder-features">
              <span>✨ Comparación visual avanzada</span>
              <span>📊 Porcentaje de similitud</span>
              <span>💬 Explicación detallada</span>
            </div>
            <small>💡 Si reconoces este perro, puedes dejar un comentario para ayudar al dueño.</small>
          </div>
        ` : ''}
        
        <div id="ai-results" style="display:none">
          <div class="confidence-badge" id="ai-confidence"></div>
          <div id="ai-matches"></div>
        </div>
        
        <div class="ai-disclaimer">⚠️ Esto es una sugerencia basada en IA, no una confirmación. Siempre verifica en persona.</div>
      </div>
      <div class="comments-section">
        <h3>💬 Comentarios de la Comunidad</h3>
        ${commentsSectionHtml}
        <div class="comment-input">
          <input type="text" placeholder="Deja un comentario o sube una foto…" id="comment-txt"/>
          <button class="btn btn-primary btn-sm" onclick="addComment()">Publicar</button>
        </div>
      </div>
    </div>
  `;
  
  detailContainer.innerHTML = html;
  showPage('detail');
}

function shareDog(dogId) {
  const dog = window.ALL_DOGS?.find(d => d.id == dogId);
  if (dog) {
    const url = window.location.href;
    navigator.clipboard.writeText(`Mira este ${dog.type === 'lost' ? 'perro perdido' : 'perro encontrado'}: ${dog.name || 'Desconocido'} - ${url}`);
    showToast('¡Enlace copiado al portapapeles!', 'success');
  }
}

function printPoster(dogId) {
  const dog = window.ALL_DOGS?.find(d => d.id == dogId);
  if (dog) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head><title>Cartel - ${dog.name || 'Perro'}</title></head>
        <body style="font-family:Arial; text-align:center; padding:20px">
          <h1>${dog.type === 'lost' ? 'PERRO PERDIDO' : 'PERRO ENCONTRADO'}</h1>
          <div style="font-size:60px">🐕</div>
          <h2>${dog.name || 'Desconocido'}</h2>
          <p>${dog.breed || 'Desconocida'} · ${dog.color || 'Desconocido'} · ${dog.size || 'Desconocido'}</p>
          <p>Ubicación: ${dog.location || dog.location_address || 'Desconocida'}</p>
          <p>Fecha: ${formatDate(dog.date)}</p>
          <p>Contacto: ${dog.contact || dog.contact_phone || 'N/A'}</p>
          <hr>
          <p>¡Por favor ayuda! Llama si tienes información.</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  }
}

async function markAsReunited(dogId) {
  if (!confirm('¿Confirmas que este perro ha sido reunido con su familia? Esta acción no se puede deshacer.')) {
    return;
  }
  
  showToast('Procesando...', '');
  
  try {
    const currentUser = getCurrentUser();
    const response = await fetch(`${API_URL}/api/reports/${dogId}/reunite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: currentUser?.id })
    });
    
    const data = await response.json();
    
    if (data.success) {
      showToast('🎉 ¡Perro marcado como reunido! +100 puntos', 'success');
      await window.loadReportsFromBackend();
      setTimeout(() => {
        location.reload();
      }, 1500);
    } else {
      showToast('Error: ' + data.error, '');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al marcar como reunido', '');
  }
}

async function addComment() {
  const txt = document.getElementById('comment-txt')?.value.trim();
  if (!txt) return;
  
  const currentUser = getCurrentUser();
  const dogId = currentDogId;
  
  if (!dogId) {
    showToast('Error: No se pudo identificar el perro', '');
    return;
  }
  
  showToast('Publicando comentario...', '');
  
  try {
    const response = await fetch(`${API_URL}/api/dogs/${dogId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser?.id || null,
        userName: currentUser?.name || 'Anónimo',
        comment: txt,
        aiMatchSimilarity: null
      })
    });
    
    if (response.ok) {
      showToast('¡Comentario publicado! +5 pts 🎉', 'success');
      document.getElementById('comment-txt').value = '';
      location.reload();
    } else {
      throw new Error('Error al publicar');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al publicar comentario', '');
  }
}

// ============================================
// EXPORTAR FUNCIONES
// ============================================

window.showDetail = showDetail;
window.shareDog = shareDog;
window.printPoster = printPoster;
window.addComment = addComment;
window.markAsReunited = markAsReunited;
window.calculateDistance = calculateDistance;
window.calculateFilterScore = calculateFilterScore;
window.calculateSimilarity = calculateFilterScore;
window.calculateSimilarityWithGemini = calculateSimilarityWithGemini;
window.getSmartMatches = getSmartMatches;
window.getMatchColor = getMatchColor;
window.getConfidenceText = getConfidenceText;
window.generateAIReport = generateAIReport;
