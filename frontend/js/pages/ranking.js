async function renderRankingPage() {
  const ranking = await getRanking();
  
  const rankingHTML = `
    <div class="ranking-page">
      <div class="ranking-hero">
        <div class="icon">🏆</div>
        <h1>Leaderboard</h1>
        <p>Top contributors helping reunite lost dogs with their families</p>
      </div>

      <div class="points-guide">
        <div class="points-item"><div class="pts red">+100</div><div class="label">Dog Reunited</div></div>
        <div class="points-item"><div class="pts gold">+20</div><div class="label">Found Dog Report</div></div>
        <div class="points-item"><div class="pts dark">+10</div><div class="label">Lost Dog Report</div></div>
        <div class="points-item"><div class="pts gray">+5</div><div class="label">Helpful Comment</div></div>
      </div>

      <div class="leaderboard" id="leaderboard-list"></div>
    </div>
    <footer><div class="footer-inner"><div class="footer-logo"><div style="width:28px;height:28px;background:var(--red);border-radius:7px;display:flex;align-items:center;justify-content:center;font-size:.85rem">🐾</div><span style="font-family:'DM Serif Display',serif">PawFinder</span></div><div class="footer-copy">Built with love for our furry friends 🐾</div></div></footer>
  `;
  
  document.getElementById('page-ranking').innerHTML = rankingHTML;
  renderLeaderboardFromNeon(ranking);
}

function renderLeaderboardFromNeon(ranking) {
  const rankClass = ['r1', 'r2', 'r3', 'rn', 'rn', 'rn', 'rn'];
  const html = ranking.map((user, i) => `
    <div class="lb-row">
      <div class="lb-rank ${rankClass[i] || 'rn'}">${i + 1}</div>
      <div class="lb-avatar">
        <img src="${user.avatar}" style="width:40px;height:40px;border-radius:50%;object-fit:cover" onerror="this.src='https://ui-avatars.com/api/?name=${user.name}&background=C0392B&color=fff'">
      </div>
      <div class="lb-info">
        <div class="lb-name">${user.name}</div>
        <div class="lb-level">${getUserRole(user.points).name}</div>
      </div>
      <div class="lb-dogs">${(user.lost_reports || 0) + (user.found_reports || 0)} dogs</div>
      <div class="lb-pts"><div class="num">${user.points.toLocaleString()}</div><div class="lbl">points</div></div>
    </div>
  `).join('');
  
  document.getElementById('leaderboard-list').innerHTML = html;
}

window.renderRankingPage = renderRankingPage;