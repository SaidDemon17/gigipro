// INICIALIZACIÓN DE LA APLICACIÓN
document.addEventListener('DOMContentLoaded', () => {
  // Inicializar la página home
  renderHomeGrids();
  
  // Configurar event listeners para los filtros
  document.querySelectorAll('.filter-tag').forEach(tag => {
    tag.addEventListener('click', function() {
      const siblings = this.parentElement.querySelectorAll('.filter-tag');
      siblings.forEach(s => s.classList.remove('active'));
      this.classList.add('active');
    });
  });
  
  console.log('PawFinder initialized successfully! 🐾');
  
  
});
