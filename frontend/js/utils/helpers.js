// js/utils/helpers.js

// Función para obtener fecha relativa (hace X días, hace X horas)
function getRelativeTime(dateString) {
  if (!dateString) return 'Fecha no disponible';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);
  
  // Validar que la fecha sea real (no año 222, 1295, etc.)
  if (date.getFullYear() < 2000 || date.getFullYear() > new Date().getFullYear() + 1) {
    return 'Fecha no disponible';
  }
  
  if (diffMins < 1) return 'hace un momento';
  if (diffMins < 60) return `hace ${diffMins} minuto${diffMins !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays === 1) return 'hace 1 día';
  if (diffDays < 7) return `hace ${diffDays} días`;
  if (diffWeeks === 1) return 'hace 1 semana';
  if (diffWeeks < 4) return `hace ${diffWeeks} semanas`;
  if (diffMonths === 1) return 'hace 1 mes';
  if (diffMonths < 12) return `hace ${diffMonths} meses`;
  if (diffYears === 1) return 'hace 1 año';
  return `hace ${diffYears} años`;
}

// Formatear fecha para mostrar en español (fallback)
function formatDate(dateValue) {
  if (!dateValue) return 'Fecha no disponible';
  
  // Validar fecha real
  const date = new Date(dateValue);
  if (date.getFullYear() < 2000 || date.getFullYear() > new Date().getFullYear() + 1) {
    return 'Fecha no disponible';
  }
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Función para marcar el enlace activo en el navbar
function setActive(el) {
  document.querySelectorAll('.nav-links a').forEach(link => {
    link.classList.remove('active');
  });
  if (el) {
    el.classList.add('active');
  }
}

// Exportar funciones globales
window.getRelativeTime = getRelativeTime;
window.formatDate = formatDate;
window.setActive = setActive;
