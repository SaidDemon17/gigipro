// js/utils/helpers.js

function formatDate(dateValue) {
  // Si no hay valor
  if (!dateValue) return 'Fecha no reportada';
  
  // Si es string en formato YYYY-MM-DD (de la base de datos)
  if (typeof dateValue === 'string') {
    // Limpiar la fecha (quitar parte de tiempo si existe)
    const cleanDate = dateValue.split('T')[0];
    const parts = cleanDate.split('-');
    
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1];
      const day = parts[2];
      
      // Validar que sea una fecha real
      if (year && month && day && !isNaN(new Date(year, month-1, day))) {
        // Formato: 25 de febrero de 2026
        const fecha = new Date(year, month-1, day);
        return fecha.toLocaleDateString('es-ES', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    }
  }
  
  // Intentar con Date objeto
  try {
    const date = new Date(dateValue);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (e) {
    console.warn('Error formateando fecha:', dateValue);
  }
  
  return 'Fecha no disponible';
}