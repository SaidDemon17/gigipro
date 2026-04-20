function dogCard(dog, showBtn = true) {
  const rewardBadge = dog.reward && dog.reward !== '' ? `<span class="badge badge-reward">💰 ${dog.reward}</span>` : '';
  const typeBadge = dog.type === 'lost' ? `<span class="badge badge-lost">LOST</span>` : `<span class="badge badge-found">FOUND</span>`;
  
  const dogName = dog.name || 'Unknown';
  const dogBreed = dog.breed || 'Unknown';
  const dogSize = dog.size || 'Medium';
  const dogLocation = dog.location || dog.location_address || 'Unknown location';
  const dogDate = dog.date || new Date().toISOString().split('T')[0];
  const dogDesc = dog.desc || dog.description || 'No description available';
  
  // ✅ CORREGIDO: No concatenar la URL, usar directamente la de Cloudinary
  const hasPhotos = dog.photos && dog.photos.length > 0;
  const firstPhoto = hasPhotos ? dog.photos[0] : null;
  
  // Mostrar foto real o emoji
  const imageHtml = firstPhoto 
    ? `<img src="${firstPhoto}" alt="${dogName}" style="width:100%; height:100%; object-fit:cover" onerror="this.style.display='none'; this.parentElement.innerHTML='🐕'" />`
    : `<div style="display:flex; align-items:center; justify-content:center; width:100%; height:100%; font-size:3rem">${dog.emoji || '🐕'}</div>`;
  
  const btn = dog.type === 'lost'
    ? `<button class="btn btn-primary btn-sm" style="width:100%" onclick="showDetail(${dog.id})">ℹ️ I have information</button>`
    : `<button class="btn btn-outline btn-sm" style="width:100%" onclick="showDetail(${dog.id})">🐾 This might be my dog</button>`;
  
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
