// DATOS ESTÁTICOS INICIALES
const STATIC_DOGS = [];

// Variable dinámica para todos los perros
let ALL_DOGS = [...STATIC_DOGS];
let nextId = 100;

// Función para cargar reportes desde el backend
async function loadReportsFromBackend() {
  try {
    const response = await fetch('http://localhost:3000/api/reports');
    if (response.ok) {
      const reports = await response.json();
      console.log('Reports loaded from backend:', reports.length);
      
      // Convertir reportes al formato de DOGS
      const newReports = reports.map(report => ({
        id: report.id || nextId++,
        type: report.type,
        name: report.name || 'Unknown',
        breed: report.breed || 'Unknown',
        color: report.color || 'Unknown',
        size: report.size || 'Medium',
        location: report.location_address || report.location || 'Unknown',
        date: report.report_date || report.date || new Date().toISOString().split('T')[0],
        reward: report.reward || '',
        desc: report.description || 'No description',
        emoji: '🐕',
        status: report.type === 'lost' ? 'Lost' : 'Found',
        contact: report.contact_phone,
        email: report.contact_email,
        location_lat: report.location_lat,
        location_lon: report.location_lon,
        created_at: report.created_at,
        photos: report.photos || []  // 👈 AGREGA ESTA LÍNEA
      }));
      
      // ACTUALIZAR ALL_DOGS: estáticos + reportes de Neon
      ALL_DOGS = [...STATIC_DOGS, ...newReports];
      console.log('Total dogs (static + neon):', ALL_DOGS.length);
      
      // ACTUALIZAR la variable global window.ALL_DOGS
      window.ALL_DOGS = ALL_DOGS;
      
      return ALL_DOGS;
    } else {
      throw new Error('Server error');
    }
  } catch (error) {
    console.error('Error loading from backend:', error);
  }
  
  // Fallback: cargar desde localStorage
  const localReports = JSON.parse(localStorage.getItem('dogReports') || '[]');
  if (localReports.length > 0) {
    const localReportsFormatted = localReports.map(report => ({
      ...report,
      id: report.id || nextId++,
      location: report.location_address || report.location,
      date: report.date || report.report_date,
      desc: report.description
    }));
    ALL_DOGS = [...STATIC_DOGS, ...localReportsFormatted];
    window.ALL_DOGS = ALL_DOGS;
  }
  
  return ALL_DOGS;
}

// Inicializar window.ALL_DOGS
window.ALL_DOGS = ALL_DOGS;
window.loadReportsFromBackend = loadReportsFromBackend;
window.STATIC_DOGS = STATIC_DOGS;

const LEADERS = [
  {rank:1, name:'Sarah M.', pts:1250, level:'Top Rescuer 🌟', dogs:14, initials:'SM'},
  {rank:2, name:'Mike R.', pts:980, level:'Expert Helper 🏅', dogs:9, initials:'MR'},
  {rank:3, name:'Lisa K.', pts:850, level:'Dedicated Finder 🔍', dogs:7, initials:'LK'},
  {rank:4, name:'Tom B.', pts:620, level:'Rescuer 💪', dogs:5, initials:'TB'},
  {rank:5, name:'Ana P.', pts:540, level:'Rescuer 💪', dogs:4, initials:'AP'},
  {rank:6, name:'Kevin L.', pts:310, level:'Helper 🙏', dogs:2, initials:'KL'},
  {rank:7, name:'Sandra G.', pts:180, level:'Beginner ⭐', dogs:1, initials:'SG'},
];

const MAP_PINS = [
  {type:'lost', top:30, left:45, name:'Buddy'},
  {type:'lost', top:55, left:30, name:'Luna'},
  {type:'found', top:40, left:65, name:'Unknown'},
  {type:'reunited', top:65, left:55, name:'Rocky'},
  {type:'lost', top:25, left:70, name:'Max'},
  {type:'found', top:70, left:35, name:'Unknown'},
];