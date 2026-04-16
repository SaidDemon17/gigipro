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
  
  // Inicializar IA para sugerir razas (si está disponible)
  setTimeout(() => {
    if (typeof window.initBreedClassifier === 'function') {
      window.initBreedClassifier().then(() => {
        console.log('🧠 IA lista para sugerir razas');
      }).catch(err => {
        console.warn('⚠️ IA no disponible:', err);
      });
    } else {
      console.log('ℹ️ Clasificador de razas no cargado (TensorFlow.js no disponible)');
    }
  }, 2000);
});