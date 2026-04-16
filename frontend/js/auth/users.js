// Roles y niveles
const ROLES = {
  BEGINNER: { name: '🐣 Beginner', minPoints: 0, color: '#9E978E' },
  RESCUER: { name: '🦮 Rescuer', minPoints: 100, color: '#B7860B' },
  HERO: { name: '🦸 Hero', minPoints: 500, color: '#C0392B' },
  LEGEND: { name: '🏆 Legend', minPoints: 1000, color: '#96281B' },
  GUARDIAN: { name: '👼 Guardian Angel', minPoints: 2000, color: '#2E7D32' }
};

// Usuario actual (sesión)
let CURRENT_USER = JSON.parse(sessionStorage.getItem('pawfinder_current_user') || 'null');

function getUserRole(points) {
  const roles = Object.values(ROLES).sort((a, b) => b.minPoints - a.minPoints);
  const role = roles.find(r => points >= r.minPoints);
  return role || ROLES.BEGINNER;
}

// Registrar usuario en Neon
async function registerUser(email, password, name) {
  try {
    const response = await fetch('http://localhost:3000/api/users/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name })
    });
    
    const data = await response.json();
    
    if (data.success) {
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error en registro:', error);
    return { success: false, error: 'Connection error' };
  }
}

// Iniciar sesión en Neon
async function loginUser(email, password) {
  try {
    const response = await fetch('http://localhost:3000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    console.log('Respuesta login:', data);
    if (data.success) {
      CURRENT_USER = data.user;
      sessionStorage.setItem('pawfinder_current_user', JSON.stringify(CURRENT_USER));
      return { success: true, user: CURRENT_USER };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error en login:', error);
    return { success: false, error: 'Connection error' };
  }
}

// Cerrar sesión
function logoutUser() {
  CURRENT_USER = null;
  sessionStorage.removeItem('pawfinder_current_user');
}

function isLoggedIn() {
  return CURRENT_USER !== null;
}

function getCurrentUser() {
  return CURRENT_USER;
}

// Obtener datos completos del usuario (incluyendo actividades, comentarios, logros)
async function fetchUserData(userId) {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}`);
    const data = await response.json();
    
    if (data.success) {
      return data;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

// Actualizar puntos del usuario
async function updateUserPoints(userId, pointsToAdd, action, reportType = null) {
  try {
    const response = await fetch(`http://localhost:3000/api/users/${userId}/points`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pointsToAdd, action, reportType })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Actualizar usuario local
      if (CURRENT_USER && CURRENT_USER.id === userId) {
        CURRENT_USER.points += pointsToAdd;
        if (reportType === 'lost') {
          CURRENT_USER.lost_reports = (CURRENT_USER.lost_reports || 0) + 1;
        } else if (reportType === 'found') {
          CURRENT_USER.found_reports = (CURRENT_USER.found_reports || 0) + 1;
        }
        sessionStorage.setItem('pawfinder_current_user', JSON.stringify(CURRENT_USER));
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error updating points:', error);
    return false;
  }
}

// Actualizar perfil (nombre o avatar)
async function updateUserProfile(userId, newName, newAvatar) {
  try {
    const body = {};
    if (newName) body.name = newName;
    if (newAvatar) body.avatar = newAvatar;
    
    const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    
    const data = await response.json();
    
    if (data.success) {
      if (CURRENT_USER && CURRENT_USER.id === userId) {
        if (newName) CURRENT_USER.name = newName;
        if (newAvatar) CURRENT_USER.avatar = newAvatar;
        sessionStorage.setItem('pawfinder_current_user', JSON.stringify(CURRENT_USER));
      }
      return { success: true, user: data.user };
    } else {
      return { success: false, error: data.error };
    }
  } catch (error) {
    console.error('Error updating profile:', error);
    return { success: false, error: 'Connection error' };
  }
}

// Agregar comentario a perfil
async function addProfileComment(userId, commenterName, commentText) {
  try {
    const currentUser = getCurrentUser();
    const response = await fetch(`http://localhost:3000/api/users/${userId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commenterId: currentUser?.id || null,
        commenterName: commenterName,
        comment: commentText
      })
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Error adding comment:', error);
    return false;
  }
}

// Obtener ranking
async function getRanking() {
  try {
    const response = await fetch('http://localhost:3000/api/users/ranking');
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching ranking:', error);
    return [];
  }
}

// Exportar funciones globales
window.ROLES = ROLES;
window.getUserRole = getUserRole;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.logoutUser = logoutUser;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.fetchUserData = fetchUserData;
window.updateUserPoints = updateUserPoints;
window.updateUserProfile = updateUserProfile;
window.addProfileComment = addProfileComment;
window.getRanking = getRanking;