function dogCard(dog, showBtn = true) {
  const rewardBadge = dog.reward && dog.reward !== '' ? `<span class="badge badge-reward">💰 ${dog.reward}</span>` : '';
  
  // Badge con colores mejorados
  let typeBadge = '';
  let cardClass = '';
  
  if (dog.status === 'reunited') {
    typeBadge = `<span class="badge badge-reunited">✅ PERRO LOCALIZADO</span>`;
    cardClass = 'reunited-card';
  } else if (dog.type === 'lost') {
    typeBadge = `<span class="badge badge-lost">⚠️ PERDIDO</span>`;
  } else {
    typeBadge = `<span class="badge badge-found">🚶 DEAMBULANTE</span>`;
  }
  
  const dogName = dog.name || 'Desconocido';
  const dogBreed = dog.breed || 'Desconocida';
  const dogSize = dog.size || 'Mediano';
  
  // Ubicación truncada
  let dogLocation = dog.location || dog.location_address || 'Ubicación desconocida';
  const locationParts = dogLocation.split(',');
  if (locationParts.length >= 2) {
    dogLocation = locationParts[0].trim() + ', ' + locationParts[1].trim();
  }
  if (dogLocation.length > 45) {
    dogLocation = dogLocation.substring(0, 42) + '...';
  }
  
  const dogDate = dog.date || new Date().toISOString();
  const relativeDate = getRelativeTime(dogDate);
  const dogDesc = dog.desc || dog.description || 'Sin descripción disponible';
  
  const hasPhotos = dog.photos && dog.photos.length > 0;
  const firstPhoto = hasPhotos ? dog.photos[0] : null;
  
  // Mostrar foto real o emoji
  let imageHtml = '';
  if (firstPhoto) {
    imageHtml = `<img src="${firstPhoto}" alt="${dogName}" style="width:100%; height:100%; object-fit:cover">`;
  } else {
    imageHtml = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:3rem">🐕</div>`;
  }
  
  const sizeIcon = dogSize === 'Pequeño' ? '🐕' : dogSize === 'Mediano' ? '🐕‍🦺' : '🐕';
  
  const btn = dog.type === 'lost'
    ? `<button class="btn btn-primary btn-sm" style="width:auto; display:inline-block; margin-top:12px" onclick="showDetail(${dog.id})">ℹ️ Tengo información</button>`
    : `<button class="btn btn-outline btn-sm" style="width:auto; display:inline-block; margin-top:12px" onclick="showDetail(${dog.id})">🐾 Ver detalles</button>`;
  
  // Mensaje especial para perros reunidos
  const reunitedMessage = dog.status === 'reunited' 
    ? `<div style="background:#4CAF50; color:white; padding:8px 12px; border-radius:8px; margin-top:12px; font-size:0.75rem; text-align:center; font-weight:600">
        ✅ Este perro ya fue localizado y está con su familia
       </div>`
    : '';
  
  return `
  <div class="dog-card ${cardClass}" onclick="showDetail(${dog.id})" style="cursor:pointer">
    <div class="dog-card-img" style="cursor:pointer; overflow:hidden; background:#f0f0f0">
      ${imageHtml}
    </div>
    <div class="dog-card-body">
      <div class="dog-card-top">
        <span class="dog-name">${dogName}</span>
        ${typeBadge}
      </div>
      <div class="dog-card-location">
        <span class="location-icon">📍</span>
        <span class="location-text">${dogLocation}</span>
      </div>
      ${rewardBadge ? `<div style="margin-bottom:8px">${rewardBadge}</div>` : ''}
      <div class="dog-meta-improved">
        <div class="meta-item">
          <span class="meta-icon">📅</span>
          <span class="meta-text">${relativeDate}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">🐾</span>
          <span class="meta-text">${dogBreed}</span>
        </div>
        <div class="meta-item">
          <span class="meta-icon">${sizeIcon}</span>
          <span class="meta-text">${dogSize}</span>
        </div>
      </div>
      <p class="dog-description">${dogDesc.substring(0, 80)}…</p>
      ${showBtn ? btn : ''}
      ${reunitedMessage}
    </div>
  </div>`;
}

// Tarjeta simplificada para el home (solo imagen + nombre)
function dogCardSimple(dog) {
  const hasPhotos = dog.photos && dog.photos.length > 0 && dog.photos[0];
  const firstPhoto = hasPhotos ? dog.photos[0] : null;
  const dogName = dog.name || 'Desconocido';
  
  let typeBadge = '';
  if (dog.status === 'reunited') {
    typeBadge = `<span class="badge badge-reunited">✅ REUNIDO</span>`;
  } else if (dog.type === 'lost') {
    typeBadge = `<span class="badge badge-lost">⚠️ PERDIDO</span>`;
  } else {
    typeBadge = `<span class="badge badge-found">📍 ENCONTRADO</span>`;
  }
  
  // ✅ CORREGIDO - Sin onerror problemático
  let imageHtml = '';
  if (firstPhoto) {
    imageHtml = `<img src="${firstPhoto}" alt="${dogName}" style="width:100%; height:100%; object-fit:cover">`;
  } else {
    imageHtml = `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:3rem">🐕</div>`;
  }
  
  return `
    <div class="dog-card-simple" onclick="showDetail(${dog.id})">
      <div class="dog-card-img-simple">
        ${imageHtml}
      </div>
      <div class="dog-card-body-simple">
        <div class="dog-card-name-simple">
          <span class="dog-name">${dogName}</span>
          ${typeBadge}
        </div>
      </div>
    </div>
  `;
}

// Exportar las funciones
window.dogCard = dogCard;
window.dogCardSimple = dogCardSimple;
