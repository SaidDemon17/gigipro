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

// Variable para almacenar el dogId actual (para los comentarios)
let currentDogId = null;

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

function calculateSimilarity(dog1, dog2) {
  let score = 0;
  let total = 0;
  
  if (dog1.breed && dog2.breed) {
    total += 30;
    if (dog1.breed.toLowerCase() === dog2.breed.toLowerCase()) {
      score += 30;
    } else if (dog1.breed.toLowerCase().includes(dog2.breed.toLowerCase()) || 
               dog2.breed.toLowerCase().includes(dog1.breed.toLowerCase())) {
      score += 15;
    }
  }
  
  if (dog1.color && dog2.color) {
    total += 25;
    if (dog1.color.toLowerCase() === dog2.color.toLowerCase()) {
      score += 25;
    } else if (dog1.color.toLowerCase().includes(dog2.color.toLowerCase()) || 
               dog2.color.toLowerCase().includes(dog1.color.toLowerCase())) {
      score += 12;
    }
  }
  
  if (dog1.size && dog2.size) {
    total += 20;
    if (dog1.size === dog2.size) {
      score += 20;
    }
  }
  
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

function getSmartMatches(dog, allDogs) {
  const oppositeType = dog.type === 'lost' ? 'found' : 'lost';
  const candidates = allDogs.filter(d => d.type === oppositeType && d.id !== dog.id);
  
  const withScores = candidates.map(candidate => ({
    ...candidate,
    similarity: calculateSimilarity(dog, candidate)
  }));
  
  return withScores.sort((a, b) => b.similarity - a.similarity).slice(0, 3);
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
// FUNCIÓN PARA CARGAR COMENTARIOS
// ============================================

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

// ============================================
// FUNCIÓN PRINCIPAL SHOW DETAIL
// ============================================

async function showDetail(id) {
  console.log('🔍 showDetail llamada con id:', id);
  
  // Guardar el dogId actual para los comentarios
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
  
  const detailContainer = document.getElementById('detail-content');
  if (!detailContainer) {
    console.error('❌ Contenedor detail-content no encontrado');
    return;
  }
  
  // Cargar comentarios
  const comments = await loadComments(id);
  
  // Generar HTML de comentarios dinámicos
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
  
  // Verificar si el usuario actual es el dueño del reporte
  const currentUser = getCurrentUser();
  console.log('Usuario actual:', currentUser);
  console.log('user_id del perro:', dog.user_id);
  console.log('¿Es dueño?', currentUser && currentUser.id === dog.user_id);
  
  const isOwner = currentUser && currentUser.id === dog.user_id;
  
  // Obtener matches inteligentes
  let matchesHtml = '';
  let confidenceClass = 'high';
  let confidenceText = 'Alta';
  
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
          <div class="match-name">${match.name || 'Desconocido'} · ${match.breed || 'Desconocida'}</div>
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
    matchesHtml = '<div class="empty-state" style="padding:20px"><p>No se encontraron perros similares en este momento.</p></div>';
  }
  
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
                🎉 Marcar como Reunido (Solo Dueño)
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
            <div style="font-size:.82rem;color:var(--gray-600)">Posibles coincidencias encontradas basadas en apariencia y ubicación</div>
          </div>
        </div>
        <div class="confidence-badge ${confidenceClass}">🎯 Confianza General: ${confidenceText}</div>
        ${matchesHtml}
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

// ============================================
// FUNCIONES AUXILIARES
// ============================================

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
      // Recargar la página para mostrar el nuevo comentario
      location.reload();
    } else {
      throw new Error('Error al publicar');
    }
  } catch (error) {
    console.error('Error:', error);
    showToast('Error al publicar comentario', '');
  }
}

// Exportar funciones
window.showDetail = showDetail;
window.shareDog = shareDog;
window.printPoster = printPoster;
window.addComment = addComment;
window.markAsReunited = markAsReunited;
window.calculateDistance = calculateDistance;
window.calculateSimilarity = calculateSimilarity;
window.getSmartMatches = getSmartMatches;
window.getMatchColor = getMatchColor;
window.getConfidenceText = getConfidenceText;
