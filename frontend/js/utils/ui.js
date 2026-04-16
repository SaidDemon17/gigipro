// UI COMPONENTS (TOAST, MODAL)
function showToast(msg, type){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show' + (type==='success' ? ' success' : '');
  setTimeout(()=>t.className='toast', 2800);
}

function openModal(){ document.getElementById('signin-modal').classList.add('open') }
function closeModalDirect(){ document.getElementById('signin-modal').classList.remove('open') }
function closeModal(e){ if(e.target.id==='signin-modal') closeModalDirect() }
function fakeSignIn(){ closeModalDirect(); showToast('Welcome back! 🐾','success') }