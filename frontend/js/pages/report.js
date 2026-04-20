// Variables globales para el mapa y archivos
let reportMap = null;
let reportMarker = null;
let selectedFiles = [];
let currentLocation = { lat: null, lon: null, address: '' };

function renderReportPage() {
  // Verificar si el usuario está logueado
  if (!isLoggedIn()) {
    showToast('Please sign in to report a dog', '');
    openAuthModal();
    return;
  }
  
  const html = `
    <div class="report-page">
      <h1>Report a Dog</h1>
      <p class="sub">Help reunite a lost dog with their family by submitting a report.</p>

      <div class="form-card">
        <h2>📋 Report Type</h2>
        <div class="type-toggle">
          <button class="type-btn active" id="type-lost" onclick="setType('lost')">🔴 Lost Dog</button>
          <button class="type-btn" id="type-found" onclick="setType('found')">🟡 Found Dog</button>
        </div>
      </div>

      <div class="form-card">
        <h2>📸 Dog Photos</h2>
        <div class="upload-area" id="upload-area" onclick="document.getElementById('file-input').click()">
          <div class="upload-icon">📸</div>
          <div class="upload-text">Click or drag and drop to upload photos</div>
          <div class="upload-sub">PNG, JPG up to 10MB each — multiple photos allowed</div>
        </div>
        <input type="file" id="file-input" multiple accept="image/jpeg,image/png" style="display:none" onchange="handleFileSelect(this.files)"/>
        <div id="image-preview-container" style="display:flex; flex-wrap:wrap; gap:10px; margin-top:15px"></div>
      </div>

      <div class="form-card">
        <h2>🐾 Dog Information</h2>
        <div class="form-grid">
          <div class="form-group" id="dog-name-group">
            <label>Dog's Name <span style="color:var(--gray-400); font-weight:normal">(if known)</span></label>
            <input type="text" id="dogName" placeholder="e.g. Buddy"/>
          </div>
          <div class="form-group">
            <label>Breed</label>
            <input type="text" id="breed" placeholder="e.g. Golden Retriever" value="Unknown"/>
            <small style="color: var(--gray-500); font-size: 0.7rem;">The AI will auto-detect the breed from the photo</small>
          </div>
          <div class="form-group"><label>Color</label><input type="text" id="color" placeholder="e.g. Golden/cream"/></div>
          <div class="form-group"><label>Size</label><select id="size">
            <option>Small (under 20 lbs)</option><option>Medium (20–50 lbs)</option><option>Large (50+ lbs)</option>
          </select></div>
          <div class="form-group"><label>Gender</label><select id="gender"><option>Unknown</option><option>Male</option><option>Female</option></select></div>
          <div class="form-group"><label>Age (approx.)</label><input type="text" id="age" placeholder="e.g. 3 years"/></div>
          <div class="form-group full"><label>Description</label><textarea id="description" placeholder="Describe the dog — collar color, markings, distinctive features, microchip info…"></textarea></div>
        </div>
      </div>

      <div class="form-card">
        <h2>📍 Location & Date</h2>
        <div class="form-grid">
          <div class="form-group full">
            <label>Click on the map to select location</label>
            <div id="report-map" style="height: 300px; width: 100%; border-radius: 12px; margin-bottom: 10px;"></div>
            <input type="text" id="location-address" placeholder="Address will appear here" readonly style="background:#f0f0f0"/>
            <input type="hidden" id="location-lat" />
            <input type="hidden" id="location-lon" />
          </div>
          <div class="form-group"><label>Date</label><input type="date" id="date"/></div>
          <div class="form-group"><label>Time (approx.)</label><input type="time" id="time"/></div>
        </div>
      </div>

      <div class="form-card" id="reward-section">
        <h2>💰 Reward (Optional)</h2>
        <div class="form-grid">
          <div class="form-group"><label>Reward Amount</label><input type="text" id="reward" placeholder="e.g. $500 or leave blank"/></div>
        </div>
      </div>

      <div class="form-card">
        <h2>📞 Contact Information</h2>
        <div class="form-grid">
          <div class="form-group"><label>Your Name</label><input type="text" id="contactName" placeholder="Your name"/></div>
          <div class="form-group"><label>Phone</label><input type="tel" id="phone" placeholder="(555) 000-0000"/></div>
          <div class="form-group full"><label>Email</label><input type="email" id="email" placeholder="you@email.com"/></div>
        </div>
      </div>

      <div style="display:flex;gap:12px;margin-top:8px">
        <button class="btn btn-outline" style="flex:1" onclick="previewReport()">Preview Report</button>
        <button class="btn btn-primary" style="flex:2" onclick="submitReport()">Submit Report →</button>
      </div>
    </div>
  `;
  
  document.getElementById('page-report').innerHTML = html;
  initReportMap();
  setupDragAndDrop();
  updateFormFields();
}

// Función para mostrar/ocultar campos según el tipo de reporte
function updateFormFields() {
  const isLost = document.getElementById('type-lost')?.classList.contains('active');
  const dogNameGroup = document.getElementById('dog-name-group');
  const rewardSection = document.getElementById('reward-section');
  
  if (!isLost) {
    if (dogNameGroup) dogNameGroup.style.display = 'none';
    if (rewardSection) rewardSection.style.display = 'none';
  } else {
    if (dogNameGroup) dogNameGroup.style.display = 'block';
    if (rewardSection) rewardSection.style.display = 'block';
  }
}

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
  reportMap = L.map('report-map').setView([-12.0464, -77.0428], 12);
  
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(reportMap);
  
  reportMap.on('click', async (e) => {
    const { lat, lng } = e.latlng;
    currentLocation = { lat, lon: lng, address: '' };
    
    document.getElementById('location-lat').value = lat;
    document.getElementById('location-lon').value = lng;
    
    if (reportMarker) {
      reportMarker.setLatLng([lat, lng]);
    } else {
      reportMarker = L.marker([lat, lng], { draggable: true }).addTo(reportMap);
      reportMarker.on('dragend', async (e) => {
        const pos = e.target.getLatLng();
        currentLocation = { lat: pos.lat, lon: pos.lng, address: '' };
        document.getElementById('location-lat').value = pos.lat;
        document.getElementById('location-lon').value = pos.lng;
        await reverseGeocode(pos.lat, pos.lng);
      });
    }
    
    await reverseGeocode(lat, lng);
    reportMap.setView([lat, lng], 16);
  });
}

async function reverseGeocode(lat, lon) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`);
    const data = await response.json();
    const address = data.display_name || `${lat}, ${lon}`;
    currentLocation.address = address;
    document.getElementById('location-address').value = address;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    document.getElementById('location-address').value = `${lat}, ${lon}`;
  }
}

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

async function autoSuggestBreedOnUpload() {
  if (selectedFiles.length === 0) return;
  
  const firstPhoto = selectedFiles[0];
  const photoUrl = URL.createObjectURL(firstPhoto);
  
  try {
    if (typeof window.getDogBreedPredictions === 'function') {
      const predictions = await window.getDogBreedPredictions(photoUrl);
      URL.revokeObjectURL(photoUrl);
      
      if (predictions && predictions.length > 0) {
        const breedInput = document.getElementById('breed');
        const suggestedBreed = predictions[0].className;
        
        breedInput.value = suggestedBreed;
        breedInput.style.borderColor = '#2E7D32';
        breedInput.style.backgroundColor = '#E8F5E9';
        
        showToast(`🤖 AI detected: ${suggestedBreed}`, 'success');
      }
    }
  } catch (error) {
    console.error('Error auto-detecting breed:', error);
  }
}

function handleFileSelect(files) {
  const validTypes = ['image/jpeg', 'image/png'];
  const maxSize = 10 * 1024 * 1024;
  
  for (let file of files) {
    if (!validTypes.includes(file.type)) {
      showToast(`${file.name}: Only JPEG and PNG allowed`, '');
      continue;
    }
    if (file.size > maxSize) {
      showToast(`${file.name}: Max size 10MB`, '');
      continue;
    }
    selectedFiles.push(file);
    addImagePreview(file);
  }
  
  if (selectedFiles.length === 1) {
    setTimeout(() => autoSuggestBreedOnUpload(), 500);
  }
}

function addImagePreview(file) {
  const container = document.getElementById('image-preview-container');
  const reader = new FileReader();
  const wrapper = document.createElement('div');
  wrapper.style.position = 'relative';
  wrapper.style.width = '100px';
  
  reader.onload = (e) => {
    const img = document.createElement('img');
    img.src = e.target.result;
    img.style.width = '100px';
    img.style.height = '100px';
    img.style.objectFit = 'cover';
    img.style.borderRadius = '8px';
    wrapper.appendChild(img);
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.style.position = 'absolute';
    removeBtn.style.top = '-8px';
    removeBtn.style.right = '-8px';
    removeBtn.style.width = '24px';
    removeBtn.style.height = '24px';
    removeBtn.style.borderRadius = '50%';
    removeBtn.style.background = 'red';
    removeBtn.style.color = 'white';
    removeBtn.style.border = 'none';
    removeBtn.style.cursor = 'pointer';
    removeBtn.onclick = () => {
      const index = selectedFiles.indexOf(file);
      if (index > -1) selectedFiles.splice(index, 1);
      wrapper.remove();
    };
    wrapper.appendChild(removeBtn);
    container.appendChild(wrapper);
  };
  reader.readAsDataURL(file);
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
  const name = document.getElementById('dogName')?.value || 'Unknown';
  const breed = document.getElementById('breed')?.value || 'Unknown';
  const address = document.getElementById('location-address')?.value || 'No location';
  showToast(`Preview: ${name} - ${breed} at ${address}`, '');
}

async function submitReport() {
  if (!isLoggedIn()) {
    showToast('Please sign in to report a dog', '');
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
    showToast('Please fill in your name and email!', '');
    return;
  }
  
  if (!lat || !lon) {
    showToast('Please click on the map to select a location!', '');
    return;
  }
  
  showToast('Submitting report...', '');
  
  let uploadedPhotos = [];
  if (selectedFiles.length > 0) {
    const formData = new FormData();
    selectedFiles.forEach(file => formData.append('photos', file));
    
    try {
      const uploadRes = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) {
        throw new Error(`Upload failed: ${uploadRes.status}`);
      }
      
      const uploadData = await uploadRes.json();
      uploadedPhotos = uploadData.files || [];
      console.log('📸 Fotos subidas a Cloudinary:', uploadedPhotos);
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Error uploading photos, but continuing...', '');
    }
  }
  
  const reportData = {
    user_id: getCurrentUser()?.id || null,
    type: reportType,
    name: dogName || 'Unknown',
    breed: document.getElementById('breed')?.value || 'Unknown',
    color: document.getElementById('color')?.value || 'Unknown',
    size: document.getElementById('size')?.value || 'Medium',
    gender: document.getElementById('gender')?.value || 'Unknown',
    age: document.getElementById('age')?.value || 'Unknown',
    description: document.getElementById('description')?.value || '',
    location_address: document.getElementById('location-address')?.value || '',
    location_lat: parseFloat(lat),
    location_lon: parseFloat(lon),
    date: document.getElementById('date')?.value || new Date().toISOString().split('T')[0],
    time: document.getElementById('time')?.value || '',
    reward: document.getElementById('reward')?.value || '',
    contact_name: contactName,
    contact_phone: document.getElementById('phone')?.value || '',
    contact_email: email,
    photos: uploadedPhotos,
    emoji: '🐕',
    status: isLost ? 'Lost' : 'Found'
  };
  
  try {
    const response = await fetch(`${API_URL}/api/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reportData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Reporte guardado:', result);
    
    const pointsToAdd = reportType === 'lost' ? 10 : 20;
    const actionText = reportType === 'lost' ? 'lost dog' : 'found dog';
    
    const currentUser = getCurrentUser();
    if (currentUser) {
      await updateUserPoints(currentUser.id, pointsToAdd, `Reported a ${actionText}: ${dogName || 'Unknown'}`);
      await incrementUserReports(currentUser.id, reportType);
      showToast(`Report saved! +${pointsToAdd} pts 🎉`, 'success');
    } else {
      showToast('Report saved! 🎉', 'success');
    }
    
    setTimeout(() => {
      location.reload();
    }, 1500);
    
  } catch (error) {
    console.error('Submit error:', error);
    showToast('Error connecting to server. Report saved locally.', '');
    
    const reports = JSON.parse(localStorage.getItem('dogReports') || '[]');
    reports.push({ ...reportData, id: Date.now(), created_at: new Date().toISOString() });
    localStorage.setItem('dogReports', JSON.stringify(reports));
    
    setTimeout(() => {
      location.reload();
    }, 1500);
  }
}
