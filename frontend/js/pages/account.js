// js/pages/account.js

async function renderAccountPage() {
  console.log('🔄 renderAccountPage iniciada');
  
  const currentUser = getCurrentUser();
  
  if (!currentUser) {
    const notLoggedInHTML = `
      <div class="account-page">
        <div class="account-not-logged">
          <div class="account-icon">🔒</div>
          <h2>Sign in to access all features</h2>
          <p>Create an account to report dogs, earn points, and get notified of matches.</p>
          <button class="btn btn-primary" onclick="openAuthModal()">Sign In / Sign Up</button>
        </div>
      </div>
    `;
    document.getElementById('page-account').innerHTML = notLoggedInHTML;
    return;
  }
  
  const role = getUserRole(currentUser.points);
  const allUsers = JSON.parse(localStorage.getItem('pawfinder_users') || '[]');
  const rankedUsers = [...allUsers].sort((a, b) => b.points - a.points);
  const userRank = rankedUsers.findIndex(u => u.id === currentUser.id) + 1;
  
  // Verificar días restantes para cambio de nombre
  const lastChange = currentUser.lastNameChange ? new Date(currentUser.lastNameChange) : null;
  const today = new Date();
  let daysUntilNameChange = null;
  if (lastChange) {
    const daysPassed = (today - lastChange) / (24 * 60 * 60 * 1000);
    if (daysPassed < 15) {
      daysUntilNameChange = Math.ceil(15 - daysPassed);
    }
  }
  
  const accountHTML = `
    <div class="account-page">
      <div class="account-header">
        <div class="account-avatar-wrapper">
          <div class="account-avatar">
            <img id="profile-avatar-img" src="${currentUser.avatar}" alt="${currentUser.name}">
            <div class="account-role" style="background:${role.color}">${role.name}</div>
          </div>
          <button class="avatar-edit-btn" onclick="openAvatarEditor()">
            <span class="gear-icon">📷</span>
          </button>
        </div>
        <div class="account-info">
          <div class="account-name-wrapper">
            <h1 id="profile-name">${currentUser.name}</h1>
            <button class="edit-name-btn" onclick="openNameEditor()">
              <span class="gear-icon">⚙️</span>
            </button>
          </div>
          <p class="account-email">${currentUser.email}</p>
          <p class="account-member">Member since ${new Date(currentUser.createdAt).toLocaleDateString()}</p>
          ${daysUntilNameChange ? `<p class="name-change-info">⏰ You can change your name again in ${daysUntilNameChange} days</p>` : '<p class="name-change-info">✏️ You can change your name every 15 days</p>'}
        </div>
        <div class="account-actions">
          <button class="btn btn-outline" onclick="handleLogout()">🚪 Cerrar Sesión</button>
        </div>
      </div>
      
      <div class="account-stats">
        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-value">${currentUser.points}</div>
          <div class="stat-label">Total Points</div>
          <div class="stat-rank">Rank #${userRank}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🐕</div>
          <div class="stat-value">${currentUser.lostReports || 0}</div>
          <div class="stat-label">Lost Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🐾</div>
          <div class="stat-value">${currentUser.foundReports || 0}</div>
          <div class="stat-label">Found Reports</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">💬</div>
          <div class="stat-value">${currentUser.comments?.length || 0}</div>
          <div class="stat-label">Comments</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❤️</div>
          <div class="stat-value">${currentUser.dogsHelped || 0}</div>
          <div class="stat-label">Dogs Helped</div>
        </div>
      </div>
      
      <div class="account-grid">
        <div class="account-card">
          <h3>📈 Next Level</h3>
          <div class="level-progress">
            <div class="level-info">
              <span>Current: ${role.name}</span>
              <span>Next: ${getNextRole(currentUser.points)?.name || 'Max Level'}</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${getProgressToNextLevel(currentUser.points)}%"></div>
            </div>
            <div class="points-to-next">${getPointsToNextLevel(currentUser.points)} points to next level</div>
          </div>
        </div>
        
        <div class="account-card">
          <h3>🎖️ Achievements</h3>
          <div class="achievements-list">
            ${renderAchievements(currentUser)}
          </div>
        </div>
      </div>
      
      <div class="account-card">
        <h3>💬 Community Comments About You</h3>
        <div class="comments-about-you">
          ${renderProfileComments(currentUser)}
        </div>
        <div class="add-comment">
          <input type="text" id="profile-comment" placeholder="Leave a nice comment about ${currentUser.name}...">
          <button class="btn btn-primary btn-sm" onclick="postProfileComment(${currentUser.id})">Post</button>
        </div>
      </div>
      
      <div class="account-card">
        <h3>📋 Recent Activity</h3>
        <div class="activity-timeline">
          ${renderActivityTimeline(currentUser.activity || [])}
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('page-account').innerHTML = accountHTML;
}

function getNextRole(currentPoints) {
  const roles = Object.values(window.ROLES || {}).sort((a, b) => a.minPoints - b.minPoints);
  return roles.find(r => r.minPoints > currentPoints);
}

function getPointsToNextLevel(currentPoints) {
  const nextRole = getNextRole(currentPoints);
  if (!nextRole) return 0;
  return nextRole.minPoints - currentPoints;
}

function getProgressToNextLevel(currentPoints) {
  const nextRole = getNextRole(currentPoints);
  if (!nextRole) return 100;
  
  const roles = Object.values(window.ROLES || {}).sort((a, b) => a.minPoints - b.minPoints);
  let currentRole = roles[0];
  for (let i = roles.length - 1; i >= 0; i--) {
    if (currentPoints >= roles[i].minPoints) {
      currentRole = roles[i];
      break;
    }
  }
  
  const nextRolePoints = nextRole.minPoints;
  const currentRolePoints = currentRole.minPoints;
  const pointsNeeded = nextRolePoints - currentRolePoints;
  const pointsEarned = currentPoints - currentRolePoints;
  
  return (pointsEarned / pointsNeeded) * 100;
}

function renderAchievements(user) {
  const achievements = [
    { name: 'First Report', condition: (user.lostReports + user.foundReports) >= 1, icon: '📝', points: 10 },
    { name: 'Helper', condition: (user.comments?.length || 0) >= 5, icon: '💬', points: 25 },
    { name: 'Rescuer', condition: user.points >= 100, icon: '🦮', points: 100 },
    { name: 'Hero', condition: user.points >= 500, icon: '🦸', points: 500 },
    { name: 'Legend', condition: user.points >= 1000, icon: '🏆', points: 1000 },
    { name: 'Guardian Angel', condition: user.points >= 2000, icon: '👼', points: 2000 }
  ];
  
  return achievements.map(ach => `
    <div class="achievement-item ${ach.condition ? 'unlocked' : 'locked'}">
      <span class="achievement-icon">${ach.icon}</span>
      <div class="achievement-info">
        <div class="achievement-name">${ach.name}</div>
        <div class="achievement-desc">${ach.points} points</div>
      </div>
      ${ach.condition ? '<span class="achievement-check">✅</span>' : '<span class="achievement-lock">🔒</span>'}
    </div>
  `).join('');
}

function renderProfileComments(user) {
  if (!user.comments || user.comments.length === 0) {
    return '<div class="empty-state">No comments yet. Be the first to leave a kind message!</div>';
  }
  
  return user.comments.map(comment => `
    <div class="profile-comment">
      <div class="comment-avatar">${comment.commenter.charAt(0)}</div>
      <div class="comment-content">
        <div class="comment-header">
          <span class="comment-author">${comment.commenter}</span>
          <span class="comment-date">${new Date(comment.date).toLocaleDateString()}</span>
        </div>
        <div class="comment-text">${comment.text}</div>
      </div>
    </div>
  `).join('');
}

function renderActivityTimeline(activities) {
  if (!activities || activities.length === 0) {
    return '<div class="empty-state">No recent activity</div>';
  }
  
  return activities.slice(0, 10).map(activity => `
    <div class="activity-item">
      <div class="activity-icon">📌</div>
      <div class="activity-content">
        <div class="activity-text">${activity.action}</div>
        <div class="activity-date">${new Date(activity.date).toLocaleDateString()}</div>
      </div>
      ${activity.points ? `<div class="activity-points">+${activity.points} pts</div>` : ''}
    </div>
  `).join('');
}

async function postProfileComment(userId) {
  const commentInput = document.getElementById('profile-comment');
  const comment = commentInput?.value.trim();
  
  if (!comment) {
    showToast('Please write a comment first', '');
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) {
    showToast('Please sign in to comment', '');
    openAuthModal();
    return;
  }
  
  if (typeof addProfileComment === 'function') {
    addProfileComment(userId, currentUser.name, comment);
  } else {
    const users = JSON.parse(localStorage.getItem('pawfinder_users') || '[]');
    const userIndex = users.findIndex(u => u.id === userId);
    if (userIndex !== -1) {
      if (!users[userIndex].comments) users[userIndex].comments = [];
      users[userIndex].comments.unshift({
        id: Date.now(),
        commenter: currentUser.name,
        text: comment,
        date: new Date().toISOString()
      });
      localStorage.setItem('pawfinder_users', JSON.stringify(users));
    }
  }
  
  showToast('Comment posted! 🎉', 'success');
  commentInput.value = '';
  renderAccountPage();
}

// Editor de nombre
function openNameEditor() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  // Cerrar cualquier modal abierto
  closeEditModalDirect();
  
  const modalHTML = `
    <div class="edit-modal-overlay" id="edit-name-modal" onclick="closeEditModal(event)">
      <div class="edit-modal">
        <button class="edit-modal-close" onclick="closeEditModalDirect()">✕</button>
        <h3>✏️ Edit Profile Name</h3>
        <p>You can change your name every 15 days.</p>
        <div class="form-group">
          <label>New Name</label>
          <input type="text" id="new-name" value="${currentUser.name}" placeholder="Your new name"/>
        </div>
        <div class="edit-modal-buttons">
          <button class="btn btn-outline" onclick="closeEditModalDirect()">Cancel</button>
          <button class="btn btn-primary" onclick="saveNameChange()">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Forzar que el modal se muestre
  setTimeout(() => {
    const modal = document.getElementById('edit-name-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('open');
    }
  }, 10);
}  

async function saveNameChange() {
  const newName = document.getElementById('new-name')?.value.trim();
  if (!newName) {
    showToast('Please enter a name', '');
    return;
  }
  
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const result = updateUserProfile(currentUser.id, newName, null);
  
  if (result.success) {
    showToast('Name updated successfully! ✅', 'success');
    closeEditModalDirect();
    updateNavForLoggedInUser();
    renderAccountPage();
  } else {
    showToast(result.error, '');
  }
}

// Editor de avatar
function openAvatarEditor() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  closeEditModalDirect();
  
  const modalHTML = `
    <div class="edit-modal-overlay" id="edit-avatar-modal" onclick="closeEditModal(event)">
      <div class="edit-modal">
        <button class="edit-modal-close" onclick="closeEditModalDirect()">✕</button>
        <h3>🖼️ Change Profile Picture</h3>
        <p>Select a color for your avatar</p>
        <div class="avatar-preview" style="text-align:center; margin-bottom:15px">
          <img id="avatar-preview-img" src="${currentUser.avatar}" style="width:80px; height:80px; border-radius:50%; object-fit:cover">
        </div>
        <div class="avatar-colors">
          <div class="avatar-color" style="background:#C0392B" onclick="selectAvatarColor('#C0392B')"></div>
          <div class="avatar-color" style="background:#2E7D32" onclick="selectAvatarColor('#2E7D32')"></div>
          <div class="avatar-color" style="background:#B7860B" onclick="selectAvatarColor('#B7860B')"></div>
          <div class="avatar-color" style="background:#2980B9" onclick="selectAvatarColor('#2980B9')"></div>
          <div class="avatar-color" style="background:#8E44AD" onclick="selectAvatarColor('#8E44AD')"></div>
          <div class="avatar-color" style="background:#D35400" onclick="selectAvatarColor('#D35400')"></div>
        </div>
        <div class="edit-modal-buttons">
          <button class="btn btn-outline" onclick="closeEditModalDirect()">Cancel</button>
          <button class="btn btn-primary" onclick="saveAvatarChange()">Save Changes</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  setTimeout(() => {
    const modal = document.getElementById('edit-avatar-modal');
    if (modal) {
      modal.style.display = 'flex';
      modal.classList.add('open');
    }
  }, 10);
}

function closeEditModalDirect() {
  const modals = document.querySelectorAll('.edit-modal-overlay');
  modals.forEach(modal => {
    modal.remove();
  });
}

let selectedAvatarColor = '#C0392B';

function selectAvatarColor(color) {
  selectedAvatarColor = color;
  const preview = document.getElementById('avatar-preview-img');
  const currentUser = getCurrentUser();
  if (preview && currentUser) {
    preview.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${color.replace('#', '')}&color=fff`;
  }
}


async function saveAvatarChange() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;
  
  const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name)}&background=${selectedAvatarColor.replace('#', '')}&color=fff`;
  
  const result = await updateUserProfile(currentUser.id, null, newAvatarUrl);
  
  if (result.success) {
    showToast('✅ Avatar updated successfully!', 'success');
    closeEditModalDirect();
    updateNavForLoggedInUser();
    renderAccountPage();
  } else {
    showToast(result.error, '');
  }
}

function closeEditModal(event) {
  if (event.target.classList.contains('edit-modal-overlay')) {
    closeEditModalDirect();
  }
}


// Exportar funciones
window.renderAccountPage = renderAccountPage;
window.postProfileComment = postProfileComment;
window.openNameEditor = openNameEditor;
window.openAvatarEditor = openAvatarEditor;
window.saveNameChange = saveNameChange;
window.saveAvatarChange = saveAvatarChange;
window.selectAvatarColor = selectAvatarColor;
window.closeEditModal = closeEditModal;
window.closeEditModalDirect = closeEditModalDirect;