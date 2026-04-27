// js/auth/auth.js

function renderAuthModal() {
  // Verificar si ya existe el modal
  if (document.querySelector('.auth-modal-overlay')) return;
  
  const modalHTML = `
    <div class="auth-modal-overlay" id="auth-modal" onclick="closeAuthModal(event)">
      <div class="auth-modal">
        <button class="auth-modal-close" onclick="closeAuthModalDirect()">✕</button>
        
        <div class="auth-tabs">
          <button class="auth-tab active" onclick="switchAuthTab('login')">Iniciar Sesión</button>
          <button class="auth-tab" onclick="switchAuthTab('register')">Registrarse</button>
        </div>
        
        <!-- Login Form -->
        <div id="login-form" class="auth-form active">
          <h2>Bienvenido de Vuelta</h2>
          <p>Inicia sesión para reportar perros, ganar puntos y ayudar a reunir familias.</p>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" name="login-email" placeholder="tu@email.com"/>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="login-password" name="login-password" placeholder="Tu contraseña"/>
          </div>
          
          <button class="btn btn-primary" style="width:100%;padding:12px" onclick="handleLogin()">
            Iniciar Sesión
          </button>
          
          <div class="auth-demo">
            <p>Cuenta de Demostración:</p>
            <code>demo@pawfinder.com / demo123</code>
          </div>
        </div>
        
        <!-- Register Form -->
        <div id="register-form" class="auth-form">
          <h2>Crear Cuenta</h2>
          <p>Únete a nuestra comunidad de amantes de mascotas ayudando a reunir perros perdidos.</p>
          
          <div class="form-group">
            <label>Nombre Completo</label>
            <input type="text" id="register-name" name="register-name" placeholder="Tu nombre"/>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="register-email" name="register-email" placeholder="tu@email.com"/>
          </div>
          <div class="form-group">
            <label>Contraseña</label>
            <input type="password" id="register-password" name="register-password" placeholder="Mínimo 6 caracteres"/>
          </div>
          <div class="form-group">
            <label>Confirmar Contraseña</label>
            <input type="password" id="register-confirm" name="register-confirm" placeholder="Confirma tu contraseña"/>
          </div>
          
          <button class="btn btn-primary" style="width:100%;padding:12px" onclick="handleRegister()">
            Crear Cuenta
          </button>
          
          <p class="auth-terms">
            Al registrarte, aceptas nuestros Términos de Servicio y Política de Privacidad.
          </p>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function openAuthModal() {
  renderAuthModal();
  const modal = document.getElementById('auth-modal');
  if (modal) modal.classList.add('open');
}

function closeAuthModal(event) {
  if (event.target.id === 'auth-modal') {
    closeAuthModalDirect();
  }
}

function closeAuthModalDirect() {
  const modal = document.getElementById('auth-modal');
  if (modal) modal.remove();
}

function switchAuthTab(tab) {
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  
  tabs.forEach(t => t.classList.remove('active'));
  forms.forEach(f => f.classList.remove('active'));
  
  if (tab === 'login') {
    tabs[0].classList.add('active');
    document.getElementById('login-form').classList.add('active');
  } else {
    tabs[1].classList.add('active');
    document.getElementById('register-form').classList.add('active');
  }
}

async function handleLogin() {
  const emailInput = document.querySelector('#login-form #login-email');
  const passwordInput = document.querySelector('#login-form #login-password');
  
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  
  if (!email || !password) {
    showToast('Por favor completa todos los campos', '');
    return;
  }
  
  showToast('Iniciando sesión...', '');
  
  const result = await loginUser(email, password);
  
  if (result.success) {
    showToast(`¡Bienvenido de vuelta, ${result.user.name}! 🐾`, 'success');
    closeAuthModalDirect();
    updateNavForLoggedInUser();
    
    setTimeout(() => {
      location.reload();
    }, 500);
    
  } else {
    showToast(result.error, '');
  }
}

async function handleRegister() {
  const nameInput = document.querySelector('#register-form #register-name');
  const emailInput = document.querySelector('#register-form #register-email');
  const passwordInput = document.querySelector('#register-form #register-password');
  const confirmInput = document.querySelector('#register-form #register-confirm');
  
  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const confirm = confirmInput?.value;
  
  if (!name || !email || !password) {
    showToast('Por favor completa todos los campos', '');
    return;
  }
  
  if (password.length < 6) {
    showToast('La contraseña debe tener al menos 6 caracteres', '');
    return;
  }
  
  if (password !== confirm) {
    showToast('Las contraseñas no coinciden', '');
    return;
  }
  
  showToast('Creando cuenta...', '');
  
  const result = await registerUser(email, password, name);
  
  if (result.success) {
    showToast(`¡Cuenta creada! Bienvenido ${name}! 🎉`, 'success');
    const loginResult = await loginUser(email, password);
    if (loginResult.success) {
      closeAuthModalDirect();
      updateNavForLoggedInUser();
      setTimeout(() => {
        location.reload();
      }, 500);
    }
  } else {
    showToast(result.error, '');
  }
}

function updateNavForLoggedInUser() {
  const navActions = document.querySelector('.nav-actions');
  if (!navActions) return;
  
  const currentUser = getCurrentUser();
  
  if (currentUser) {
    const role = getUserRole(currentUser.points);
    const avatarUrl = currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=E85D04&color=fff`;
    
    navActions.innerHTML = `
      <button class="btn btn-primary" onclick="showPage('report')">+ Reportar Perro</button>
      <div class="user-dropdown">
        <button class="user-avatar-btn" onclick="toggleUserMenu()">
          <img src="${avatarUrl}" alt="${currentUser.name}" class="user-avatar-img">
          <span class="user-name">${currentUser.name.split(' ')[0]}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="user-dropdown-menu" id="user-dropdown-menu">
          <div class="dropdown-header">
            <img src="${avatarUrl}" alt="${currentUser.name}" class="dropdown-avatar">
            <div class="dropdown-user-info">
              <div class="dropdown-user-name">${currentUser.name}</div>
              <div class="dropdown-user-role" style="color:${role.color}">${role.name}</div>
              <div class="dropdown-user-points">🏆 ${currentUser.points} puntos</div>
            </div>
          </div>
          <div class="dropdown-divider"></div>
          <a href="#" onclick="showPage('account'); closeUserMenu()">
            <span class="menu-icon">👤</span> Mi Perfil
          </a>
          <a href="#" onclick="showMyReports(); closeUserMenu()">
            <span class="menu-icon">📋</span> Mis Reportes
          </a>
          <a href="#" onclick="showSettings(); closeUserMenu()">
            <span class="menu-icon">⚙️</span> Configuración
          </a>
          <div class="dropdown-divider"></div>
          <a href="#" onclick="handleLogout(); closeUserMenu()" class="logout-item">
            <span class="menu-icon">🚪</span> Cerrar Sesión
          </a>
        </div>
      </div>
    `;
  } else {
    navActions.innerHTML = `
      <button class="btn btn-primary" onclick="if(isLoggedIn()){showPage('report')}else{showToast('Por favor inicia sesión primero','');openAuthModal()}">+ Reportar Perro</button>
      <button class="btn btn-outline" onclick="openAuthModal()">
        <span class="login-icon">👤</span> Iniciar Sesión
      </button>
    `;
  }
}

// Función para mostrar/ocultar el menú desplegable
function toggleUserMenu() {
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) {
    menu.classList.toggle('open');
  }
}

function closeUserMenu() {
  const menu = document.getElementById('user-dropdown-menu');
  if (menu) {
    menu.classList.remove('open');
  }
}

// Cerrar menú al hacer clic fuera
document.addEventListener('click', function(event) {
  const menu = document.getElementById('user-dropdown-menu');
  const btn = document.querySelector('.user-avatar-btn');
  if (menu && btn && !btn.contains(event.target) && !menu.contains(event.target)) {
    menu.classList.remove('open');
  }
});

// Funciones temporales para opciones del menú
function showMyReports() {
  showToast('Mis Reportes - En desarrollo', '');
}

function showSettings() {
  showToast('Configuración - En desarrollo', '');
}

function handleLogout() {
  logoutUser();
  updateNavForLoggedInUser();
  showToast('Has cerrado sesión. ¡Vuelve pronto! 👋', 'success');
  showPage('home');
}

// Exportar funciones globales
window.openAuthModal = openAuthModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.switchAuthTab = switchAuthTab;
window.closeAuthModal = closeAuthModal;
window.closeAuthModalDirect = closeAuthModalDirect;
window.updateNavForLoggedInUser = updateNavForLoggedInUser;
window.handleLogout = handleLogout;
window.toggleUserMenu = toggleUserMenu;
window.closeUserMenu = closeUserMenu;
window.showMyReports = showMyReports;
window.showSettings = showSettings;