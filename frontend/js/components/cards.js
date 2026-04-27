function dogCard(dog, showBtn = true) {
  const rewardBadge = dog.reward && dog.reward !== '' ? `<span class="badge badge-reward">💰 ${dog.reward}</span>` : '';
  
  // ✅ CORREGIDO: declarar typeBadge solo una vez
  let typeBadge = '';
  if (dog.status === 'reunited') {
    typeBadge = `<span class="badge badge-reunited">✅ REUNIDO</span>`;
  } else if (dog.type === 'lost') {
    typeBadge = `<span class="badge badge-lost">PERDIDO</span>`;
  } else {
    typeBadge = `<span class="badge badge-found">ENCONTRADO</span>`;
  }
  
  const dogName = dog.name || 'Desconocido';
  const dogBreed = dog.breed || 'Desconocida';
  const dogSize = dog.size || 'Mediano';
  const dogLocation = dog.location || dog.location_address || 'Ubicación desconocida';
  const dogDate = dog.date || new Date().toISOString().split('T')[0];
  const dogDesc = dog.desc || dog.description || 'Sin descripción disponible';
  
  // Verificar si tiene fotos
  const hasPhotos = dog.photos && dog.photos.length > 0;
  // ✅ CORREGIDO: NO concatenar la URL, usar directamente la de Cloudinary
  const firstPhoto = hasPhotos ? dog.photos[0] : null;
  
  // Mostrar foto real o emoji
  const imageHtml = firstPhoto 
    ? `<img src="${firstPhoto}" alt="${dogName}" style="width:100%; height:100%; object-fit:cover" onerror="this.style.display='none'; this.parentElement.innerHTML='🐕'" />`
    : `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:3rem">${dog.emoji || '🐕'}</div>`;
  
  const btn = dog.type === 'lost'
    ? `<button class="btn btn-primary btn-sm" style="width:100%" onclick="showDetail(${dog.id})">ℹ️ Tengo información</button>`
    : `<button class="btn btn-outline btn-sm" style="width:100%" onclick="showDetail(${dog.id})">🐾 Este podría ser mi perro</button>`;
  
  return `
  <div class="dog-card" onclick="showDetail(${dog.id})">
    <div class="dog-card-img" style="cursor:pointer; overflow:hidden; background:#f0f0f0">
      ${imageHtml}
    </div>
    <div class="dog-card-body">
      <div class="dog-card-top">
        <span class="dog-name">${dogName}</span>
        <span>${typeBadge}</span>
      </div>
      ${rewardBadge ? `<div style="margin-bottom:8px">${rewardBadge}</div>` : ''}
      <div class="dog-meta">
        <span>📍 ${dogLocation}</span>
        <span>📅 ${formatDate(dogDate)}</span>
        <span>🐾 ${dogBreed} · ${dogSize}</span>
      </div>
      <p style="font-size:.83rem;color:var(--gray-600);margin-bottom:12px;line-height:1.5">${dogDesc.substring(0, 80)}…</p>
      ${showBtn ? btn : ''}
    </div>
  </div>`;
}