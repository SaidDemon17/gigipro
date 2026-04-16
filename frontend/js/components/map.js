// FUNCIONES DEL MAPA
function renderMapPins(filter){
  const pins = filter==='all' ? MAP_PINS : MAP_PINS.filter(p=>p.type===filter);
  const area = document.getElementById('map-pins');
  area.innerHTML = pins.map(p=>`
    <div class="map-pin" style="top:${p.top}%;left:${p.left}%" title="${p.name} (${p.type})" onclick="showToast('${p.name} – ${p.type}','')">
      <div class="pin-dot ${p.type}"></div>
    </div>`).join('');
  document.getElementById('map-dog-list').textContent = `${pins.length} dog(s) in this area.`;
}