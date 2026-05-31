async function renderRankingPage() {
  const ranking = await getRanking();
  
  const rankingHTML = `
    <div class="ranking-page">
      <div class="ranking-hero">
        <div class="icon">🏆</div>
        <h1>Clasificación</h1>
        <p>Los mejores colaboradores ayudando a reunir perros perdidos con sus familias</p>
      </div>

      <div class="points-guide">
        <div class="points-item"><div class="pts red">+100</div><div class="label">Perro reunido</div></div>
        <div class="points-item"><div class="pts gold">+20</div><div class="label">Reporte de perro encontrado</div></div>
        <div class="points-item"><div class="pts dark">+10</div><div class="label">Reporte de perro perdido</div></div>
        <div class="points-item"><div class="pts gray">+5</div><div class="label">Comentario útil</div></div>
      </div>

      <div class="leaderboard" id="leaderboard-list"></div>
    </div>
    <footer><div class="footer-inner"><div class="footer-logo"><div style="width:28px;height:28px;background:var(--primary);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.85rem">🐾</div><span style="font-family:'DM Serif Display',serif">PawFinder</span></div><div class="footer-copy">🐾 Hecho con amor para nuestros amigos peludos</div></div></footer>
  `;
  
  document.getElementById('page-ranking').innerHTML = rankingHTML;
  renderLeaderboardFromNeon(ranking);
}

function renderLeaderboardFromNeon(ranking) {
  const medals = ['🥇', '🥈', '🥉'];
  
  const html = ranking.map((user, i) => {
    const rank = i + 1;
    const medalIcon = rank <= 3 ? medals[rank - 1] : `${rank}`;
    const medalClass = rank === 1 ? 'gold-medal' : rank === 2 ? 'silver-medal' : rank === 3 ? 'bronze-medal' : '';
    
    return `
      <div class="lb-row ${medalClass}">
        <div class="lb-rank ${rank === 1 ? 'r1' : rank === 2 ? 'r2' : rank === 3 ? 'r3' : 'rn'}">
          ${medalIcon}
        </div>
        <div class="lb-avatar">
          <img src="${user.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" onerror="this.src='https://ui-avatars.com/api/?name=${user.name}&background=E85D04&color=fff'">
        </div>
        <div class="lb-info">
          <div class="lb-name">${user.name}</div>
          <div class="lb-level">${getUserRole(user.points).name}</div>
        </div>
        <div class="lb-dogs">${(user.lost_reports || 0) + (user.found_reports || 0)} perros</div>
        <div class="lb-pts"><div class="num">${user.points.toLocaleString()}</div><div class="lbl">puntos</div></div>
      </div>
    `;
  }).join('');
  
  document.getElementById('leaderboard-list').innerHTML = html;
}

window.renderRankingPage = renderRankingPage;
