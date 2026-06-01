function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const targetPage = document.getElementById('page-'+id);
  if (targetPage) targetPage.classList.add('active');
  window.scrollTo(0,0);
  
  if(id==='home') renderHomeGrids();
  if(id==='lost') renderLostGrid();
  if(id==='found') renderFoundGrid();
  if(id==='ranking') renderRankingPage();
  if(id==='map') renderMapPage();
  if(id==='report') {
    if (isLoggedIn()) {
      renderReportPage();
    } else {
      showToast('Por favor inicia sesión para reportar un perro', '');
      openAuthModal();
    }
  }
  if(id==='account') {
    if (typeof renderAccountPage === 'function') {
      renderAccountPage();
    } else {
      console.error('renderAccountPage no está definida');
      document.getElementById('page-account').innerHTML = '<div class="account-page"><div class="account-not-logged"><h2>Error</h2><p>La página de cuenta no se cargó correctamente. Por favor recarga la página.</p></div></div>';
    }
  }
}

// Al cargar la página, actualizar el nav
document.addEventListener('DOMContentLoaded', function() {
  if (typeof updateNavForLoggedInUser === 'function') {
    updateNavForLoggedInUser();
  }
});
