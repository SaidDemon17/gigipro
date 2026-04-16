function renderAuthModal() {
  // Verificar si ya existe el modal
  if (document.querySelector('.auth-modal-overlay')) return;
  
  const modalHTML = `
    <div class="auth-modal-overlay" id="auth-modal" onclick="closeAuthModal(event)">
      <div class="auth-modal">
        <button class="auth-modal-close" onclick="closeAuthModalDirect()">✕</button>
        
        <div class="auth-tabs">
          <button class="auth-tab active" onclick="switchAuthTab('login')">Sign In</button>
          <button class="auth-tab" onclick="switchAuthTab('register')">Sign Up</button>
        </div>
        
        <!-- Login Form -->
        <div id="login-form" class="auth-form active">
          <h2>Welcome Back</h2>
          <p>Sign in to report dogs, earn points, and help reunite families.</p>
          
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="login-email" name="login-email" placeholder="you@example.com"/>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="login-password" name="login-password" placeholder="Your password"/>
          </div>
          
          <button class="btn btn-primary" style="width:100%;padding:12px" onclick="handleLogin()">
            Sign In
          </button>
          
          <div class="auth-demo">
            <p>Demo Account:</p>
            <code>demo@pawfinder.com / demo123</code>
          </div>
        </div>
        
        <!-- Register Form -->
        <div id="register-form" class="auth-form">
          <h2>Create Account</h2>
          <p>Join our community of pet lovers helping reunite lost dogs.</p>
          
          <div class="form-group">
            <label>Full Name</label>
            <input type="text" id="register-name" name="register-name" placeholder="Your name"/>
          </div>
          <div class="form-group">
            <label>Email</label>
            <input type="email" id="register-email" name="register-email" placeholder="you@example.com"/>
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" id="register-password" name="register-password" placeholder="At least 6 characters"/>
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input type="password" id="register-confirm" name="register-confirm" placeholder="Confirm password"/>
          </div>
          
          <button class="btn btn-primary" style="width:100%;padding:12px" onclick="handleRegister()">
            Create Account
          </button>
          
          <p class="auth-terms">
            By signing up, you agree to our Terms of Service and Privacy Policy.
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
  // Buscar los campos dentro del modal activo
  const emailInput = document.querySelector('#login-form #login-email, #login-form input[type="email"]');
  const passwordInput = document.querySelector('#login-form #login-password, #login-form input[type="password"]');
  
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  
  console.log('Email encontrado:', email);
  console.log('Password encontrado:', password ? '***' : 'vacío');
  
  if (!email || !password) {
    showToast('Please fill in all fields', '');
    return;
  }
  
  showToast('Iniciando sesión...', '');
  
  const result = await loginUser(email, password);
  
  if (result.success) {
    showToast(`Welcome back, ${result.user.name}! 🐾`, 'success');
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
  // Buscar los campos dentro del modal activo
  const nameInput = document.querySelector('#register-form #register-name');
  const emailInput = document.querySelector('#register-form #register-email');
  const passwordInput = document.querySelector('#register-form #register-password');
  const confirmInput = document.querySelector('#register-form #register-confirm');
  
  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const confirm = confirmInput?.value;
  
  console.log('Registro - Name:', name, 'Email:', email);
  
  if (!name || !email || !password) {
    showToast('Please fill in all fields', '');
    return;
  }
  
  if (password.length < 6) {
    showToast('Password must be at least 6 characters', '');
    return;
  }
  
  if (password !== confirm) {
    showToast('Passwords do not match', '');
    return;
  }
  
  showToast('Creando cuenta...', '');
  
  const result = await registerUser(email, password, name);
  
  if (result.success) {
    showToast(`Account created! Welcome ${name}! 🎉`, 'success');
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
    navActions.innerHTML = `
      <button class="btn btn-primary" onclick="showPage('report')">+ Report Dog</button>
      <div class="user-menu">
        <button class="btn btn-outline logout-btn" onclick="handleLogout()">
          🚪 Cerrar Sesión
        </button>
      </div>
    `;
  } else {
    navActions.innerHTML = `
      <button class="btn btn-primary" onclick="if(isLoggedIn()){showPage('report')}else{showToast('Please sign in first','');openAuthModal()}">+ Report Dog</button>
      <button class="btn btn-outline" onclick="openAuthModal()">Sign In</button>
    `;
  }
}

function handleLogout() {
  logoutUser();
  updateNavForLoggedInUser();
  showToast('You have been logged out. Come back soon! 👋', 'success');
  // Redirigir al home
  showPage('home');
}

// Exportar funciones
window.openAuthModal = openAuthModal;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
window.switchAuthTab = switchAuthTab;
window.closeAuthModal = closeAuthModal;
window.closeAuthModalDirect = closeAuthModalDirect;
window.updateNavForLoggedInUser = updateNavForLoggedInUser;
window.handleLogout = handleLogout;