// FUNCIONES UTILITARIAS
function formatDate(d){
  return new Date(d+'T12:00:00').toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'});
}

function setActive(el){
  document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('active'));
  el.classList.add('active');
}