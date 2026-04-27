// Variables globales para el mapa y archivos
let reportMap = null;
let reportMarker = null;
let selectedFiles = [];
let currentLocation = { lat: null, lon: null, address: '' };
let cropper = null;
let currentFileToCrop = null;

function renderReportPage() {
  // Verificar si el usuario está logueado
  if (!isLoggedIn()) {
    showToast('Por favor inicia sesión para reportar un perro', '');
    openAuthModal();
    return;
  }
  
  const html = `
    <div class="report-page">
      <h1>Reportar un Perro</h1>
      <p class="sub">Ayuda a reunir a un perro perdido con su familia enviando un reporte.</p>

      <div class="form-card">
        <h2>📋 Tipo de Reporte</h2>
        <div class="type-toggle">
          <button class="type-btn active" id="type-lost" onclick="setType('lost')">🔴 Perro Perdido</button>
          <button class="type-btn" id="type-found" onclick="setType('found')">🟡 Perro Encontrado</button>
        </div>
      </div>

      <div class="form-card">
        <h2>📸 Fotos del Perro</h2>
        <div class="upload-area" id="upload-area" onclick="document.getElementById('file-input').click()">
          <div class="upload-icon">📸</div>
          <div class="upload-text">Haz clic o arrastra y suelta para subir fotos</div>
          <div class="upload-sub">PNG, JPG hasta 10MB cada una — múltiples fotos permitidas</div>
        </div>
        <input type="file" id="file-input" multiple accept="image/jpeg,image/png" style="display:none" onchange="handleFileSelect(this.files)"/>
        <div id="image-preview-container" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:15px"></div>
      </div>

      <div class="form-card">
        <h2>🐾 Información del Perro</h2>
        <div class="form-grid">
          <div class="form-group" id="dog-name-group">
            <label>Nombre del Perro <span style="color:var(--gray-400); font-weight:normal">(si se sabe)</span></label>
            <input type="text" id="dogName" placeholder="Ej: Buddy"/>
          </div>
          <div class="form-group">
            <label>Raza</label>
            <input type="text" id="breed" placeholder="Ej: Golden Retriever" value="Desconocida"/>
            <small style="color: var(--gray-500); font-size: 0.7rem;">La IA detectará la raza automáticamente desde la foto</small>
          </div>
          <div class="form-group"><label>Color</label><input type="text" id="color" placeholder="Ej: Dorado/crema"/></div>
          <div class="form-group"><label>Tamaño</label><select id="size">
            <option>Pequeño (menos de 9 kg)</option><option>Mediano (9-23 kg)</option><option>Grande (más de 23 kg)</option>
          </select></div>
          <div class="form-group"><label>Género</label><select id="gender"><option>Desconocido</option><option>Macho</option><option>Hembra</option></select></div>
          <div class="form-group"><label>Edad (aprox.)</label><input type="text" id="age" placeholder="Ej: 3 años"/></div>
          <div class="form-group full"><label>Descripción</label><textarea id="description" placeholder="Describe al perro — color de collar, marcas, características distintivas, información de microchip…"></textarea></div>
        </div>
      </div>
      <div id="extra-details-section" class="form-card">
        <h2>🐾 Detalles Adicionales (Opcional)</h2>
        <div class="form-grid">
          <div class="form-group full">
            <label>Descripción Física</label>
            <textarea id="physical" rows="2" placeholder="Ej: Orejas puntiagudas, cola larga, mancha blanca en el pecho..."></textarea>
          </div>
          <div class="form-group full">
            <label>Personalidad</label>
            <textarea id="personality" rows="2" placeholder="Ej: Juguetón, cariñoso, tímido con extraños, le gusta correr..."></textarea>
          </div>
        </div>
      </div>
      <div class="form-card">
        <h2>📍 Ubicación y Fecha</h2>
        <div class="form-grid">
          <div class="form-group full">
            <label>📍 Ubicación del reporte</label>
            <div style="display: flex; gap: 10px; margin-bottom: 10px;">
              <button type="button" class="btn btn-outline btn-sm" onclick="getUserLocation()" style="display: flex; align-items: center; gap: 6px;">
                <span>📍</span> Usar mi ubicación actual
              </button>
              <button type="button" class="btn btn-outline btn-sm" onclick="resetMapLocation()" style="display: flex; align-items: center; gap: 6px;">
                <span>🗺️</span> Restablecer mapa
              </button>
            </div>
            <div id="report-map" style="height: 300px; width: 100%; border-radius: 12px; margin-bottom: 10px;"></div>
            <input type="text" id="location-address" placeholder="La dirección aparecerá aquí" readonly style="background:#f0f0f0"/>
            <input type="hidden" id="location-lat" />
            <input type="hidden" id="location-lon" />
            <small style="color: var(--gray-500);">🔍 Haz clic en el mapa o usa "Mi ubicación" para seleccionar el lugar</small>
          </div>
          <div class="form-group"><label>Fecha</label><input type="date" id="date"/></div>
          <div class="form-group"><label>Hora (aprox.)</label><input type="time" id="time"/></div>
        </div>
      </div>

      <div class="form-card" id="reward-section">
        <h2>💰 Recompensa (Opcional)</h2>
        <div class="form-grid">
          <div class="form-group"><label>Monto de Recompensa</label><input type="text" id="reward" placeholder="Ej: S/500 o dejar en blanco"/></div>
        </div>
      </div>

      <div class="form-card">
        <h2>📞 Información de Contacto</h2>
        <div class="form-grid">
          <div class="form-group"><label>Tu Nombre</label><input type="text" id="contactName" placeholder="Tu nombre"/></div>
          <div class="form-group"><label>Teléfono</label><input type="tel" id="phone" placeholder="(555) 000-0000"/></div>
          <div class="form-group full"><label>Email</label><input type="email" id="email" placeholder="tu@email.com"/></div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn btn-outline" style="flex:1" onclick="previewReport()">Vista Previa</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitReport()">Enviar Reporte →</button>
      </div>
    </div>
  `;
  
  document.getElementById('page-report').innerHTML = html;
  initReportMap();
  setupDragAndDrop();
  updateFormFields();
}

function updateFormFields() {
  const isLost = document.getElementById('type-lost')?.classList.contains('active');
  const dogNameGroup = document.getElementById('dog-name-group');
  const rewardSection = document.getElementById('reward-section');
  const extraDetailsSection = document.getElementById('extra-details-section');
  
  if (!isLost) {
    // Modo FOUND - ocultar campos innecesarios
    if (dogNameGroup) dogNameGroup.style.display = 'none';
    if (rewardSection) rewardSection.style.display = 'none';
    if (extraDetailsSection) extraDetailsSection.style.display = 'none';
  } else {
    // Modo LOST - mostrar todos los campos
    if (dogNameGroup) dogNameGroup.style.display = 'block';
    if (rewardSection) rewardSection.style.display = 'block';
    if (extraDetailsSection) extraDetailsSection.style.display = 'block';
  }
}

// ============================================
// INICIALIZACIÓN DEL MAPA
// ============================================

function initReportMap() {
  if (reportMap) return;
  
  if (typeof L === 'undefined') {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
    
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => createMap();
    document.head.appendChild(script);
  } else {
    createMap();
  }
}

function createMap() {
  const limaLat = -12.0464;
  const limaLon = -77.0428;
  
  reportMap = L.map('report-map').setView([limaLat, limaLon], 12);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 19
  }).addTo(reportMap);
  
  // Crear marcador arrastrable
  reportMarker = L.marker([limaLat, limaLon], { draggable: true }).addTo(reportMap);
  
  reportMarker.on('dragend', async (e) => {
    const pos = e.target.getLatLng();
    document.getElementById('location-lat').value = pos.lat;
    document.getElementById('location-lon').value = pos.lng;
    await reverseGeocode(pos.lat, pos.lng);
    showToast('📍 Ubicación actualizada', 'success');
  });
  
  reportMap.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    document.getElementById('location-lat').value = lat;
    document.getElementById('location-lon').value = lng;
    reportMarker.setLatLng([lat, lng]);
    await reverseGeocode(lat, lng);
    reportMap.setView([lat, lng], 16);
    showToast('📍 Ubicación seleccionada', 'success');
  });
  
  document.getElementById('location-lat').value = limaLat;
  document.getElementById('location-lon').value = limaLon;
  reverseGeocode(limaLat, limaLon);
}

// ============================================
// GEOLOCALIZACIÓN
// ============================================

function getUserLocation() {
  if (!navigator.geolocation) {
    showToast('Tu navegador no soporta geolocalización', '');
    return;
  }
  
  showToast('📍 Obteniendo tu ubicación...', '');
  
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      
      document.getElementById('location-lat').value = lat;
      document.getElementById('location-lon').value = lng;
      
      if (reportMap) {
        reportMap.setView([lat, lng], 16);
        reportMarker.setLatLng([lat, lng]);
        await reverseGeocode(lat, lng);
        showToast('✅ Ubicación actualizada', 'success');
      }
    },
    (error) => {
      switch(error.code) {
        case error.PERMISSION_DENIED:
          showToast('Permiso denegado. Activa la ubicación en tu navegador.', '');
          break;
        case error.POSITION_UNAVAILABLE:
          showToast('No se pudo obtener tu ubicación', '');
          break;
        default:
          showToast('Error al obtener ubicación', '');
      }
    },
    { enableHighAccuracy: true, timeout: 10000 }
  );
}

function resetMapLocation() {
  const defaultLat = -12.0464;
  const defaultLon = -77.0428;
  
  if (reportMap) {
    reportMap.setView([defaultLat, defaultLon], 12);
    reportMarker.setLatLng([defaultLat, defaultLon]);
    document.getElementById('location-lat').value = defaultLat;
    document.getElementById('location-lon').value = defaultLon;
    reverseGeocode(defaultLat, defaultLon);
    showToast('🗺️ Mapa restablecido', 'success');
  }
}

async function reverseGeocode(lat, lon) {
  const addressInput = document.getElementById('location-address');
  if (!addressInput) return;
  
  addressInput.value = 'Cargando dirección...';
  
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1&accept-language=es`);
    const data = await response.json();
    addressInput.value = data.display_name || `${lat}, ${lon}`;
  } catch (error) {
    addressInput.value = `${lat}, ${lon}`;
  }
}

// ============================================
// MANEJO DE FOTOS Y DRAG & DROP
// ============================================

function setupDragAndDrop() {
  const dropZone = document.getElementById('upload-area');
  if (!dropZone) return;
  
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
    });
  });
  
  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-over'));
  });
  
  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-over'));
  });
  
  dropZone.addEventListener('drop', (e) => {
    const files = e.dataTransfer.files;
    if (files.length > 0) handleFileSelect(files);
  });
}

function handleFileSelect(files) {
  const validTypes = ['image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024;
  
  for (let file of files) {
    if (!validTypes.includes(file.type)) {
      showToast(`${file.name}: Solo JPEG y PNG`, '');
      continue;
    }
    if (file.size > maxSize) {
      showToast(`${file.name}: Máximo 10MB`, '');
      continue;
    }
    openCropEditor(file);
  }
}

function openCropEditor(file) {
  currentFileToCrop = file;
  
  const modalHTML = `
    <div class="crop-modal-overlay" id="crop-modal">
      <div class="crop-modal">
        <div class="crop-modal-header">
          <h3>✂️ Recortar imagen</h3>
          <button class="crop-modal-close" onclick="closeCropModal()">✕</button>
        </div>
        <div class="crop-modal-body">
          <div class="crop-preview">
            <img id="crop-image" src="" alt="Imagen a recortar">
          </div>
          <div class="crop-preview-small">
            <p>Vista previa (200x200):</p>
            <div id="crop-preview-box" style="width:200px; height:200px; overflow:hidden; border-radius:12px; background:#f0f0f0"></div>
          </div>
        </div>
        <div class="crop-modal-footer">
          <button class="btn btn-outline" onclick="closeCropModal()">Cancelar</button>
          <button class="btn btn-primary" onclick="applyCrop()">Aplicar recorte</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  document.getElementById('crop-modal').classList.add('open');
  
  const img = document.getElementById('crop-image');
  const reader = new FileReader();
  
  reader.onload = (e) => {
    img.src = e.target.result;
    img.onload = () => {
      if (cropper) cropper.destroy();
      cropper = new Cropper(img, {
        aspectRatio: 1,
        viewMode: 2,
        dragMode: 'move',
        autoCropArea: 0.9,
        preview: '#crop-preview-box'
      });
    };
  };
  reader.readAsDataURL(file);
}

function applyCrop() {
  if (!cropper) return;
  
  const canvas = cropper.getCroppedCanvas({ width: 800, height: 800 });
  
  canvas.toBlob((blob) => {
    const croppedFile = new File([blob], currentFileToCrop.name, {
      type: currentFileToCrop.type,
      lastModified: Date.now()
    });
    
    selectedFiles.push(croppedFile);
    addImagePreview(croppedFile, canvas.toDataURL());
    closeCropModal();
    showToast('✅ Imagen recortada y agregada', 'success');
    
    if (selectedFiles.length === 1) setTimeout(() => autoSuggestBreedOnUpload(), 500);
  }, currentFileToCrop.type, 0.9);
}

function closeCropModal() {
  if (cropper) cropper.destroy();
  cropper = null;
  document.getElementById('crop-modal')?.remove();
  currentFileToCrop = null;
}

function addImagePreview(file, imageUrl = null) {
  const container = document.getElementById('image-preview-container');
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '100px';
  
  const img = document.createElement('img');
  
  if (imageUrl) {
    img.src = imageUrl;
  } else {
    const reader = new FileReader();
    reader.onload = (e) => { img.src = e.target.result; };
    reader.readAsDataURL(file);
    return;
  }
  
  img.style.cssText = 'width:100px; height:100px; object-fit:cover; border-radius:12px; border:2px solid var(--primary)';
  wrapper.appendChild(img);
  
  const removeBtn = document.createElement('button');
  removeBtn.textContent = '✕';
  removeBtn.style.cssText = 'position:absolute; top:-8px; right:-8px; width:24px; height:24px; border-radius:50%; background:var(--primary); color:white; border:none; cursor:pointer; font-size:12px';
  removeBtn.onclick = () => {
    const index = selectedFiles.indexOf(file);
    if (index > -1) selectedFiles.splice(index, 1);
    wrapper.remove();
  };
  wrapper.appendChild(removeBtn);
  container.appendChild(wrapper);
}

async function autoSuggestBreedOnUpload() {
  if (selectedFiles.length === 0) return;
  
  const firstPhoto = selectedFiles[0];
  const photoUrl = URL.createObjectURL(firstPhoto);
  
  try {
    if (typeof window.getDogBreedPredictions === 'function') {
      const predictions = await window.getDogBreedPredictions(photoUrl);
      URL.revokeObjectURL(photoUrl);
      
      if (predictions?.length) {
        const breedInput = document.getElementById('breed');
        breedInput.value = predictions[0].className;
        breedInput.style.cssText = 'border-color:#2E7D32; background-color:#E8F5E9';
        showToast(`🤖 IA detectó: ${predictions[0].className}`, 'success');
      }
    }
  } catch (error) {
    console.error('Error en IA:', error);
  }
}

function setType(t) {
  const lostBtn = document.getElementById('type-lost');
  const foundBtn = document.getElementById('type-found');
  
  if (t === 'lost') {
    lostBtn.classList.add('active');
    foundBtn.classList.remove('active');
  } else {
    lostBtn.classList.remove('active');
    foundBtn.classList.add('active');
  }
  updateFormFields();
}

function previewReport() {
  const name = document.getElementById('dogName')?.value || 'Desconocido';
  const breed = document.getElementById('breed')?.value || 'Desconocida';
  const address = document.getElementById('location-address')?.value || 'Sin ubicación';
  showToast(`Vista previa: ${name} - ${breed} en ${address}`, '');
}

// ============================================
// ENVÍO DEL REPORTE
// ============================================

async function submitReport() {
  if (!isLoggedIn()) {
    showToast('Por favor inicia sesión para reportar un perro', '');
    openAuthModal();
    return;
  }
  
  const dogName = document.getElementById('dogName')?.value;
  const contactName = document.getElementById('contactName')?.value;
  const email = document.getElementById('email')?.value;
  const lat = document.getElementById('location-lat')?.value;
  const lon = document.getElementById('location-lon')?.value;
  const isLost = document.getElementById('type-lost').classList.contains('active');
  const reportType = isLost ? 'lost' : 'found';
  
  if (!contactName || !email) {
    showToast('Por favor completa tu nombre y email', '');
    return;
  }
  
  if (!lat || !lon) {
    showToast('Por favor selecciona una ubicación en el mapa', '');
    return;
  }
  
  showToast('Enviando reporte...', '');
  
  let uploadedPhotos = [];
  if (selectedFiles.length > 0) {
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('photos', file));
    
    try {
      const uploadRes = await fetch(`${API_URL}/api/upload`, { method: 'POST', body: formData });
      if (!uploadRes.ok) throw new Error(`Upload failed: ${uploadRes.status}`);
      const uploadData = await uploadRes.json();
      uploadedPhotos = uploadData.files || [];
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error subiendo fotos, continuando...', '');
    }
  }
  
  const reportData = {
    user_id: getCurrentUser()?.id || null,
    type: reportType,
    name: dogName || 'Desconocido',
    breed: document.getElementById('breed')?.value || 'Desconocida',
    color: document.getElementById('color')?.value || 'Desconocido',
    size: document.getElementById('size')?.value || 'Mediano',
    gender: document.getElementById('gender')?.value || 'Desconocido',
    age: document.getElementById('age')?.value || 'Desconocida',
    description: document.getElementById('description')?.value || '',
    location_address: document.getElementById('location-address')?.value || '',
    location_lat: parseFloat(lat),
    location_lon: parseFloat(lon),
    date: document.getElementById('date')?.value || new Date().toISOString().split('T')[0],
    time: document.getElementById('time')?.value || '',
    physical: document.getElementById('physical')?.value || '',
    personality: document.getElementById('personality')?.value || '',
    reward: document.getElementById('reward')?.value || '',
    contact_name: contactName,
    contact_phone: document.getElementById('phone')?.value || '',
    contact_email: email,
    photos: uploadedPhotos,
    emoji: '🐕',
    status: isLost ? 'Perdido' : 'Encontrado'
  };
  
  try {
    const response = await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
    const result = await response.json();
    const pointsToAdd = reportType === 'lost' ? 10 : 20;
    const currentUser = getCurrentUser();
    
    if (currentUser) {
      await updateUserPoints(currentUser.id, pointsToAdd, `Reportó un ${reportType === 'lost' ? 'perro perdido' : 'perro encontrado'}: ${dogName || 'Desconocido'}`);
      await incrementUserReports(currentUser.id, reportType);
      showToast(`¡Reporte guardado! +${pointsToAdd} pts 🎉`, 'success');
    } else {
      showToast('¡Reporte guardado! 🎉', 'success');
    }
    
    setTimeout(() => location.reload(), 1500);
  } catch (error) {
    console.error('Submit error:', error);
    showToast('Error conectando al servidor. Reporte guardado localmente.', '');
    const reports = JSON.parse(localStorage.getItem('dogReports') || '[]');
    reports.push({ ...reportData, id: Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem('dogReports', JSON.stringify(reports));
    setTimeout(() => location.reload(), 1500);
  }
}

// Exportar funciones globales
window.getUserLocation = getUserLocation;
window.resetMapLocation = resetMapLocation;
window.closeCropModal = closeCropModal;
window.applyCrop = applyCrop;
window.setType = setType;
window.previewReport = previewReport;
window.submitReport = submitReport;