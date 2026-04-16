// FUNCIÓN PARA RENDERIZAR LEADERBOARD
function renderLeaderboard(){
  const rankClass=['r1','r2','r3','rn','rn','rn','rn'];
  document.getElementById('leaderboard-list').innerHTML = LEADERS.map((l,i)=>`
    <div class="lb-row">
      <div class="lb-rank ${rankClass[i]}">${l.rank}</div>
      <div class="lb-avatar">${l.initials}</div>
      <div class="lb-info">
        <div class="lb-name">${l.name}</div>
        <div class="lb-level">${l.level}</div>
      </div>
      <div class="lb-dogs">${l.dogs} dogs</div>
      <div class="lb-pts"><div class="num">${l.pts.toLocaleString()}</div><div class="lbl">points</div></div>
    </div>`).join('');
}