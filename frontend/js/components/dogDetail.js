// ============================================
// FUNCIONES AUXILIARES
// ============================================

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);dis
  
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

// ============================================
// FUNCIONES DE DISTANCIA Y SIMILITUD (para el frontend)
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

// ============================================
// OBTENER COINCIDENCIAS GUARDADAS DESDE EL BACKEND
// ============================================

async function loadSavedMatches(dogId) {
  try {
    const response = await fetch(`${API_URL}/api/matches/${dogId}`);
    if (response.ok) {
      const matches = await response.json();
      console.log(`📊 Cargadas ${matches.length} coincidencias guardadas para perro ${dogId}`);
      return matches;
    }
  } catch (error) {
    console.error('Error cargando coincidencias:', error);
  }
  return [];
}

// ============================================
// MOSTRAR COINCIDENCIAS GUARDADAS
// ============================================

// Mostrar coincidencias guardadas (solo para el dueño)
// Mostrar coincidencias guardadas (todas, incluso las bajas)
// Mostrar coincidencias guardadas (solo para dueños)
async function displaySavedMatches(dogId, isOwner, dogType) {
  const resultsDiv = document.getElementById('ai-results');
  if (!resultsDiv) return;
  
  // Si no es dueño o no es perro perdido, salir sin hacer nada
  if (!isOwner || dogType !== 'lost') {
    return;
  }
  
  const confidenceDiv = document.getElementById('ai-confidence');
  const matchesDiv = document.getElementById('ai-matches');
  
  const matches = await loadSavedMatches(dogId);
  
  if (!matches || matches.length === 0) {
    confidenceDiv.className = 'confidence-badge low';
    confidenceDiv.innerHTML = '🎯 No hay coincidencias aún';
    matchesDiv.innerHTML = `
      <div class="empty-state">
        <p>Cuando alguien reporte un perro encontrado que coincida con el tuyo, aparecerá aquí automáticamente.</p>
      </div>
    `;
    resultsDiv.style.display = 'block';
    return;
  }
  
  const bestMatchPercentage = matches[0].similarity;
  const confidenceClass = getMatchColor(bestMatchPercentage);
  const confidenceText = getConfidenceText(bestMatchPercentage);
  
  confidenceDiv.className = `confidence-badge ${confidenceClass}`;
  confidenceDiv.innerHTML = `🎯 Confianza General: ${confidenceText} (basado en ${matches.length} coincidencia${matches.length !== 1 ? 's' : ''})`;
  
  const matchesHtml = matches.map(match => {
    const cls = getMatchColor(match.similarity);
    const explanationHtml = match.explanation ? `<div class="match-explanation">💬 ${escapeHtml(match.explanation)}</div>` : '';
    const photoUrl = match.photos?.[0] || null;
    const matchDate = new Date(match.created_at).toLocaleDateString('es-ES');
    
    let percentageColor = '';
    if (match.similarity >= 70) percentageColor = '#2E7D32';
    else if (match.similarity >= 40) percentageColor = '#FFBA08';
    else percentageColor = '#DC2F02';
    
    return `<div class="match-item" onclick="showDetail(${match.dog_id})" style="cursor:pointer">
      <div class="match-thumb">${photoUrl ? `<img src="${photoUrl}" style="width:52px; height:52px; object-fit:cover; border-radius:8px">` : '🐕'}</div>
      <div style="flex:1">
        <div class="match-name">${match.name || 'Desconocido'} · ${match.breed || 'Desconocida'}</div>
        <div class="match-loc">📍 ${(match.location_address || '').split(',')[0]}</div>
        <div class="match-bar"><div class="match-fill ${cls}" style="width:${match.similarity}%"></div></div>
        ${explanationHtml}
        <div class="match-date" style="font-size:0.7rem; color:var(--gray-400); margin-top:4px">📅 ${matchDate}</div>
      </div>
      <div>
        <div class="match-pct ${cls}" style="color:${percentageColor}">${match.similarity}%</div>
        <div style="font-size:.72rem;color:var(--gray-400);text-align:right">${getConfidenceText(match.similarity)}</div>
      </div>
    </div>`;
  }).join('');
  
  matchesDiv.innerHTML = matchesHtml;
  resultsDiv.style.display = 'block';
}

// ============================================
// FUNCIÓN ANTIGUA (ya no se usa, pero se mantiene por compatibilidad)
// ============================================

async function generateAIReport(dogId) {
  // Esta función ya no es necesaria porque las coincidencias se guardan automáticamente
  // Pero la mantenemos para no romper código existente
  console.log('⚠️ generateAIReport está obsoleto. Las coincidencias se generan automáticamente al reportar perros encontrados.');
  showToast('Las coincidencias se generan automáticamente cuando se reportan perros encontrados.', '');
  await displaySavedMatches(dogId, true);
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
          ${dog.status === 'reunited' ? '✅ REUNIDO' : (dog.type === 'lost' ? '⚠️ PERRO PERDIDO' : '📍 PERRO ENCONTRADO')}
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
            <h3>📅 Última Vez Visto / Encontrado</h3>
            <div class="info-row">📅 <strong>${formatDate(dog.date || new Date().toISOString())}</strong></div>
            <div class="info-row">📍 ${dog.location || dog.location_address || 'Ubicación desconocida'}</div>
          </div>
          <div class="contact-card">
            <h3>📞 Contacta al ${dog.type === 'lost' ? 'Dueño' : 'Quien lo Encontró'} Inmediatamente</h3>
            <button class="contact-btn" onclick="window.location.href='tel:${dog.contact || dog.contact_phone || ''}'">📞 ${dog.contact || dog.contact_phone || 'N/A'}</button>
            <button class="contact-btn" onclick="window.location.href='mailto:${dog.email || dog.contact_email || ''}'">✉️ ${dog.email || dog.contact_email || 'N/A'}</button>
            
            // SECCIÓN DE IA - SOLO VISIBLE PARA EL DUEÑO
            ${isOwner && dog.type === 'lost' && dog.status !== 'reunited' ? `
              <div class="ai-section">
                <div class="ai-header">
                  <div class="ai-icon">🤖</div>
                  <div>
                    <div style="font-weight:700">Coincidencias con IA</div>
                    <div style="font-size:.82rem;color:var(--gray-600)">Coincidencias guardadas con perros encontrados</div>
                  </div>
                </div>
    
    <div id="ai-results" style="display:none">
      <div class="confidence-badge" id="ai-confidence"></div>
      <div id="ai-matches"></div>
    </div>
    
    <div class="ai-disclaimer">⚠️ Las coincidencias se generan automáticamente al reportar un perro encontrado y se guardan de forma permanente.</div>
  </div>
` : ''}
            
            ${dog.status === 'reunited' ? `
              <div style="background: #2E7D32; padding:10px; border-radius:8px; text-align:center; margin-top:8px">
                ✅ Este perro ya fue reunido con su familia
              </div>
            ` : ''}
            
            <div style="display:flex;gap:8px;margin-top:8px">
              <button class="btn btn-outline btn-sm" style="flex:1;color:#fff;border-color:rgba(255,255,255,.4)" onclick="shareDog(${dog.id})">📤 Compartir</button>
              <button class="btn btn-outline btn-sm" style="flex:1;color:#fff;border-color:rgba(255,255,255,.4)" onclick="printPoster(${dog.id})">🖨️ Imprimir Cartel</button>
            </div>
          </div>
        </div>
      </div>
      <div class="detail-desc">
        <h3>📝 Sobre ${dog.name || 'este perro'}</h3>
        <p style="margin-bottom:16px">${dog.desc || dog.description || 'No hay descripción disponible.'}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
          <div>
            <div style="font-weight:700;font-size:.85rem;margin-bottom:10px">🐾 Descripción Física</div>
            ${(dog.physical ? dog.physical.split('\n') : ['No hay detalles disponibles']).map(p => `<div class="desc-item">${escapeHtml(p)}</div>`).join('')}
          </div>
          <div>
            <div style="font-weight:700;font-size:.85rem;margin-bottom:10px">❤️ Personalidad</div>
            ${(dog.personality ? dog.personality.split('\n') : ['Personalidad desconocida']).map(p => `<div class="desc-item">${escapeHtml(p)}</div>`).join('')}
          </div>
        </div>
      </div>
      
      <!-- SECCIÓN DE IA - COINCIDENCIAS GUARDADAS -->
      <div class="ai-section">
        <div class="ai-header">
          <div class="ai-icon">🤖</div>
          <div>
            <div style="font-weight:700">Coincidencias con IA</div>
            <div style="font-size:.82rem;color:var(--gray-600)">Coincidencias guardadas con perros encontrados</div>
          </div>
        </div>
        
        <div id="ai-results" style="display:none">
          <div class="confidence-badge" id="ai-confidence"></div>
          <div id="ai-matches"></div>
        </div>
        
        <div class="ai-disclaimer">⚠️ Las coincidencias se generan automáticamente al reportar un perro encontrado y se guardan de forma permanente.</div>
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
  
  // Cargar y mostrar coincidencias guardadas después de renderizar
  setTimeout(() => {
    displaySavedMatches(dog.id, isOwner,dog.type);
  }, 100);
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
          <h1>${dog.type === 'lost' ? '🐕 PERRO PERDIDO' : '🐕 PERRO ENCONTRADO'}</h1>
          <div style="font-size:60px">🐕</div>
          <h2>${dog.name || 'Desconocido'}</h2>
          <p><strong>Raza:</strong> ${dog.breed || 'Desconocida'}</p>
          <p><strong>Color:</strong> ${dog.color || 'Desconocido'}</p>
          <p><strong>Tamaño:</strong> ${dog.size || 'Desconocido'}</p>
          <p><strong>Ubicación:</strong> ${dog.location || dog.location_address || 'Desconocida'}</p>
          <p><strong>Fecha:</strong> ${formatDate(dog.date)}</p>
          <p><strong>Contacto:</strong> ${dog.contact || dog.contact_phone || 'N/A'}</p>
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
window.getMatchColor = getMatchColor;
window.getConfidenceText = getConfidenceText;
window.generateAIReport = generateAIReport;
window.displaySavedMatches = displaySavedMatches;
window.loadSavedMatches = loadSavedMatches;
