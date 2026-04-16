// FUNCIONES DEL FORMULARIO DE REPORTE
function setType(t){
  document.getElementById('type-lost').classList.toggle('active', t==='lost');
  document.getElementById('type-found').classList.toggle('active', t==='found');
}

function submitReport(){
  showToast('Report submitted! +10 pts earned 🎉','success');
  setTimeout(()=>showPage('home'),1200);
}